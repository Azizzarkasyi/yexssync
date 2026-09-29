import {Prisma} from "@prisma/client";
import {Request, Response} from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {getPublicPrisma} from "../prisma/tenant-prisma";

const SALT_ROUNDS = 10;
if (!process.env.JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is not set!");
}
const JWT_SECRET: string = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ||
  "7d") as jwt.SignOptions["expiresIn"];

type WorkLocation = {
  latitude: number;
  longitude: number;
  radius: number;
  name?: string;
};

const normalizeEmail = (value: string) => value.trim().toLowerCase();

function parseWorkLocationEntry(
  value: unknown,
  defaultRadius: number,
): WorkLocation | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const location = value as {
    latitude?: unknown;
    longitude?: unknown;
    radius?: unknown;
    name?: unknown;
  };

  const latitude = Number(location.latitude);
  const longitude = Number(location.longitude);
  const radiusValue =
    location.radius === undefined || location.radius === null
      ? defaultRadius
      : Number(location.radius);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const radius =
    Number.isFinite(radiusValue) && radiusValue > 0
      ? radiusValue
      : defaultRadius;

  return {
    latitude,
    longitude,
    radius,
    ...(typeof location.name === "string" ? {name: location.name} : {}),
  };
}

function parseWorkLocations(
  value: unknown,
  defaultRadius: number,
): WorkLocation[] | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  let rawValue = value;

  if (typeof value === "string") {
    try {
      rawValue = JSON.parse(value);
    } catch {
      return null;
    }
  }

  if (!Array.isArray(rawValue)) {
    return null;
  }

  const locations = rawValue
    .map(item => parseWorkLocationEntry(item, defaultRadius))
    .filter((item): item is WorkLocation => item !== null);

  return locations.length > 0 ? locations : null;
}

function resolvePrimaryWorkLocation(locations: WorkLocation[] | null) {
  return locations && locations.length > 0 ? locations[0] : null;
}

/**
 * Login - Tenant user login
 * Requires X-Tenant-ID header to be set
 */
export const login = async (req: Request, res: Response) => {
  try {
    const {email, password} = req.body;
    const prisma = req.prisma!;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: {email},
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated",
      });
    }

    // Generate JWT with tenant ID
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: req.tenantId,
      },
      JWT_SECRET,
      {expiresIn: JWT_EXPIRES_IN},
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          photo: user.photo,
          faceRegistered: user.faceRegistered,
          salaryType: user.salaryType,
          salary: user.salary,
          startWorkTime: user.startWorkTime,
          endWorkTime: user.endWorkTime,
        },
        tenantId: req.tenantId,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    // Handle Super Admin profile
    if (req.user?.role === "SUPER_ADMIN" || req.isSuperAdmin) {
      const publicPrisma = getPublicPrisma();
      const superAdmin = await publicPrisma.superAdmin.findUnique({
        where: {id: userId},
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });

      if (!superAdmin) {
        return res.status(404).json({
          success: false,
          message: "Super Admin not found",
        });
      }

      return res.json({
        success: true,
        data: {
          ...superAdmin,
          role: "SUPER_ADMIN",
          isActive: true,
        },
      });
    }

    const prisma = req.prisma!;

    const user = await prisma.user.findUnique({
      where: {id: userId},
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        photo: true,
        faceRegistered: true,
        salaryType: true,
        salary: true,
        startWorkTime: true,
        endWorkTime: true,
        workLatitude: true,
        workLongitude: true,
        workRadius: true,
        workLocations: true,
        maxBreakMinutes: true,
        isActive: true,
        employeeId: true,
        department: true,
        position: true,
        phone: true,
        joinDate: true,
        bankName: true,
        bankAccountNumber: true,
        bankAccountHolder: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Update current user profile
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const userId = req.user!.id;
    const {name, startWorkTime, phone, bankName, bankAccountNumber, bankAccountHolder} = req.body;
    const photo = req.file ? req.file.filename : undefined;

    const user = await prisma.user.update({
      where: {id: userId},
      data: {
        ...(name && {name}),
        ...(photo && {photo}),
        ...(startWorkTime && {startWorkTime}),
        ...(phone !== undefined && {phone}),
        ...(bankName !== undefined && {bankName}),
        ...(bankAccountNumber !== undefined && {bankAccountNumber}),
        ...(bankAccountHolder !== undefined && {bankAccountHolder}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        photo: true,
        faceRegistered: true,
        startWorkTime: true,
        endWorkTime: true,
        workLatitude: true,
        workLongitude: true,
        workRadius: true,
        maxBreakMinutes: true,
        employeeId: true,
        department: true,
        position: true,
        phone: true,
        joinDate: true,
        bankName: true,
        bankAccountNumber: true,
        bankAccountHolder: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Get all users (Admin only)
 */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;

    const users = await prisma.user.findMany({
      orderBy: {createdAt: "desc"},
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        photo: true,
        faceRegistered: true,
        isActive: true,
        salaryType: true,
        salary: true,
        startWorkTime: true,
        endWorkTime: true,
        workLatitude: true,
        workLongitude: true,
        workRadius: true,
        workLocations: true,
        maxBreakMinutes: true,
        latePenalty: true,
        employeeId: true,
        department: true,
        position: true,
        phone: true,
        joinDate: true,
        bankName: true,
        bankAccountNumber: true,
        bankAccountHolder: true,
        nik: true,
        address: true,
        jobType: true,
        overrideLocation: true,
        locationName: true,
        createdAt: true,
      },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Get user by ID (Admin only)
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const id = parseInt(req.params.id as string, 10);

    const user = await prisma.user.findUnique({
      where: {id},
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        photo: true,
        faceRegistered: true,
        isActive: true,
        salaryType: true,
        salary: true,
        startWorkTime: true,
        endWorkTime: true,
        workLatitude: true,
        workLongitude: true,
        workRadius: true,
        workLocations: true,
        maxBreakMinutes: true,
        latePenalty: true,
        employeeId: true,
        department: true,
        position: true,
        phone: true,
        joinDate: true,
        bankName: true,
        bankAccountNumber: true,
        bankAccountHolder: true,
        nik: true,
        address: true,
        jobType: true,
        overrideLocation: true,
        locationName: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Create a new user (Admin only)
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const {
      email,
      password,
      name,
      role,
      salaryType,
      salary,
      startWorkTime,
      endWorkTime,
      latePenalty,
      workLatitude,
      workLongitude,
      workRadius,
      workLocations,
      maxBreakMinutes,
      employeeId,
      department,
      position,
      phone,
      joinDate,
      bankName,
      bankAccountNumber,
      bankAccountHolder,
      nik,
      address,
      jobType,
      overrideLocation,
      locationName,
      avatar,
      photo,
      latitude,
      longitude,
      radius,
    } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and name are required",
      });
    }

    const normalizedEmail = normalizeEmail(email);

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: {email: normalizedEmail},
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const parsedWorkLocations = parseWorkLocations(workLocations, 50);
    const primaryLocation = resolvePrimaryWorkLocation(parsedWorkLocations);
    const inputLat = workLatitude !== undefined ? workLatitude : latitude;
    const inputLng = workLongitude !== undefined ? workLongitude : longitude;
    const inputRad = workRadius !== undefined ? workRadius : radius;

    const resolvedWorkLatitude =
      inputLat !== undefined
        ? parseFloat(inputLat)
        : (primaryLocation?.latitude ?? null);
    const resolvedWorkLongitude =
      inputLng !== undefined
        ? parseFloat(inputLng)
        : (primaryLocation?.longitude ?? null);
    const resolvedWorkRadius =
      inputRad !== undefined
        ? parseInt(inputRad, 10)
        : (primaryLocation?.radius ?? null);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name,
        role: role || "USER",
        salaryType: salaryType || "MONTHLY",
        salary: salary ? parseFloat(salary) : 0,
        startWorkTime: startWorkTime || "09:00",
        endWorkTime: endWorkTime || "17:00",
        workLatitude: Number.isFinite(resolvedWorkLatitude as number)
          ? resolvedWorkLatitude
          : null,
        workLongitude: Number.isFinite(resolvedWorkLongitude as number)
          ? resolvedWorkLongitude
          : null,
        workRadius: Number.isFinite(resolvedWorkRadius as number)
          ? resolvedWorkRadius
          : null,
        overrideLocation: overrideLocation === true || overrideLocation === "true",
        locationName: locationName || null,
        ...(parsedWorkLocations ? {workLocations: parsedWorkLocations} : {}),
        latePenalty: latePenalty ? parseFloat(latePenalty) : 0,
        maxBreakMinutes: maxBreakMinutes !== undefined && maxBreakMinutes !== "" ? parseInt(maxBreakMinutes, 10) : null,
        employeeId: employeeId || null,
        department: department || null,
        position: position || null,
        jobType: jobType || "Full Time (Tetap)",
        phone: phone || null,
        joinDate: joinDate ? new Date(joinDate) : null,
        bankName: bankName || null,
        bankAccountNumber: bankAccountNumber || null,
        bankAccountHolder: bankAccountHolder || null,
        nik: nik || null,
        address: address || null,
        photo: photo || avatar || null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        photo: true,
        faceRegistered: true,
        salaryType: true,
        salary: true,
        startWorkTime: true,
        endWorkTime: true,
        workLatitude: true,
        workLongitude: true,
        workRadius: true,
        workLocations: true,
        overrideLocation: true,
        locationName: true,
        maxBreakMinutes: true,
        latePenalty: true,
        employeeId: true,
        department: true,
        position: true,
        jobType: true,
        phone: true,
        joinDate: true,
        bankName: true,
        bankAccountNumber: true,
        bankAccountHolder: true,
        nik: true,
        address: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Update user (Admin only)
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const id = parseInt(req.params.id as string, 10);
    const {
      name,
      email,
      role,
      salaryType,
      salary,
      startWorkTime,
      endWorkTime,
      latePenalty,
      isActive,
      workLatitude,
      workLongitude,
      workRadius,
      workLocations,
      maxBreakMinutes,
      employeeId,
      department,
      position,
      phone,
      joinDate,
      bankName,
      bankAccountNumber,
      bankAccountHolder,
      nik,
      address,
      jobType,
      overrideLocation,
      locationName,
      avatar,
      photo,
      latitude,
      longitude,
      radius,
    } = req.body;
    const parsedWorkLocations = parseWorkLocations(workLocations, 50);
    const primaryLocation = resolvePrimaryWorkLocation(parsedWorkLocations);
    const inputLat = workLatitude !== undefined ? workLatitude : latitude;
    const inputLng = workLongitude !== undefined ? workLongitude : longitude;
    const inputRad = workRadius !== undefined ? workRadius : radius;

    const resolvedWorkLatitude =
      inputLat !== undefined
        ? inputLat === null
          ? null
          : parseFloat(inputLat)
        : primaryLocation?.latitude;
    const resolvedWorkLongitude =
      inputLng !== undefined
        ? inputLng === null
          ? null
          : parseFloat(inputLng)
        : primaryLocation?.longitude;
    const resolvedWorkRadius =
      inputRad !== undefined
        ? inputRad === null
          ? null
          : parseInt(inputRad, 10)
        : primaryLocation?.radius;
    const shouldUpdateLocationFields =
      workLocations !== undefined ||
      inputLat !== undefined ||
      inputLng !== undefined ||
      inputRad !== undefined;
    const normalizedEmail = email ? normalizeEmail(email) : undefined;

    const user = await prisma.user.update({
      where: {id},
      data: {
        ...(name && {name}),
        ...(normalizedEmail && {email: normalizedEmail}),
        ...(role && {role}),
        ...(salaryType && {salaryType}),
        ...(salary !== undefined && {salary: parseFloat(salary)}),
        ...(startWorkTime && {startWorkTime}),
        ...(endWorkTime && {endWorkTime}),
        ...(latePenalty !== undefined && {
          latePenalty: parseFloat(latePenalty),
        }),
        ...(isActive !== undefined && {isActive}),
        ...(overrideLocation !== undefined && {overrideLocation: overrideLocation === true || overrideLocation === "true"}),
        ...(locationName !== undefined && {locationName: locationName || null}),
        ...(shouldUpdateLocationFields
          ? {
              workLatitude:
                resolvedWorkLatitude !== undefined &&
                resolvedWorkLatitude !== null &&
                Number.isFinite(Number(resolvedWorkLatitude))
                  ? Number(resolvedWorkLatitude)
                  : null,
              workLongitude:
                resolvedWorkLongitude !== undefined &&
                resolvedWorkLongitude !== null &&
                Number.isFinite(Number(resolvedWorkLongitude))
                  ? Number(resolvedWorkLongitude)
                  : null,
              workRadius:
                resolvedWorkRadius !== undefined &&
                resolvedWorkRadius !== null &&
                Number.isFinite(Number(resolvedWorkRadius))
                  ? Number(resolvedWorkRadius)
                  : null,
            }
          : {}),
        ...(workLocations !== undefined && {
          workLocations: parsedWorkLocations ?? Prisma.DbNull,
        }),
        ...(maxBreakMinutes !== undefined && {
          maxBreakMinutes: maxBreakMinutes === null || maxBreakMinutes === "" ? null : parseInt(maxBreakMinutes, 10)
        }),
        ...(employeeId !== undefined && {employeeId: employeeId || null}),
        ...(department !== undefined && {department: department || null}),
        ...(position !== undefined && {position: position || null}),
        ...(jobType !== undefined && {jobType: jobType || null}),
        ...(phone !== undefined && {phone: phone || null}),
        ...(joinDate !== undefined && {joinDate: joinDate ? new Date(joinDate) : null}),
        ...(bankName !== undefined && {bankName: bankName || null}),
        ...(bankAccountNumber !== undefined && {bankAccountNumber: bankAccountNumber || null}),
        ...(bankAccountHolder !== undefined && {bankAccountHolder: bankAccountHolder || null}),
        ...(nik !== undefined && {nik: nik || null}),
        ...(address !== undefined && {address: address || null}),
        ...((photo || avatar) ? {photo: photo || avatar} : {}),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        photo: true,
        faceRegistered: true,
        isActive: true,
        salaryType: true,
        salary: true,
        startWorkTime: true,
        endWorkTime: true,
        workLatitude: true,
        workLongitude: true,
        workRadius: true,
        workLocations: true,
        overrideLocation: true,
        locationName: true,
        maxBreakMinutes: true,
        latePenalty: true,
        employeeId: true,
        department: true,
        position: true,
        jobType: true,
        phone: true,
        joinDate: true,
        bankName: true,
        bankAccountNumber: true,
        bankAccountHolder: true,
        nik: true,
        address: true,
      },
    });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Delete user (Admin only)
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const id = parseInt(req.params.id as string, 10);

    // Don't allow deleting yourself
    if (req.user!.id === id) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete your own account",
      });
    }

    await prisma.user.delete({
      where: {id},
    });

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Change password
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const userId = req.user!.id;
    const {currentPassword, newPassword} = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    const user = await prisma.user.findUnique({
      where: {id: userId},
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: {id: userId},
      data: {password: hashedPassword},
    });

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
