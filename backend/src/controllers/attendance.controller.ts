import {Request, Response} from "express";

function getDistanceFromLatLonInM(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d * 1000; // Distance in meters
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

function parseTimeOnDate(date: Date, timeText: string) {
  const [hourText, minuteText] = timeText.replace(/\./g, ":").split(":").map(value => value.trim());
  const hour = Number(hourText);
  const minute = Number(minuteText);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    return null;
  }

  const result = new Date(date);
  result.setHours(hour, minute, 0, 0);
  return result;
}

type WorkLocation = {
  latitude: number;
  longitude: number;
  radius: number;
  name?: string;
};

function normalizeWorkLocation(
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

function getAllowedWorkLocations(user: any, config: any): WorkLocation[] {
  const defaultRadius = config?.allowedRadiusMeters ?? 50;

  // If user explicitly has overrideLocation === false, ignore user custom locations and use company office
  const canUseUserLocations = user?.overrideLocation !== false;

  if (canUseUserLocations) {
    // 1. Check per-user custom work locations array (multi-location support)
    let rawLocations = user?.workLocations;
    if (typeof rawLocations === "string") {
      try {
        rawLocations = JSON.parse(rawLocations);
      } catch {
        rawLocations = null;
      }
    }

    if (rawLocations && Array.isArray(rawLocations) && rawLocations.length > 0) {
      const userLocations = rawLocations
        .map((loc: any) => normalizeWorkLocation(loc, defaultRadius))
        .filter((loc: WorkLocation | null): loc is WorkLocation => loc !== null);
      if (userLocations.length > 0) {
        return userLocations;
      }
    }

    // 2. Check per-user single custom work location
    if (
      user?.workLatitude !== null &&
      user?.workLatitude !== undefined &&
      user?.workLongitude !== null &&
      user?.workLongitude !== undefined
    ) {
      const singleLoc = normalizeWorkLocation(
        {
          latitude: user.workLatitude,
          longitude: user.workLongitude,
          radius: user.workRadius,
          name: user.locationName || "Lokasi Kustom",
        },
        defaultRadius,
      );
      if (singleLoc) {
        return [singleLoc];
      }
    }
  }

  // 3. Fallback: use company-wide office location
  const hasCompanyLocation =
    config?.officeLatitude !== null &&
    config?.officeLatitude !== undefined &&
    config?.officeLongitude !== null &&
    config?.officeLongitude !== undefined;

  if (!hasCompanyLocation) {
    return [];
  }

  const companyLocation = normalizeWorkLocation(
    {
      latitude: config.officeLatitude,
      longitude: config.officeLongitude,
      radius: config.allowedRadiusMeters,
      name: config?.companyName || "Kantor Perusahaan",
    },
    defaultRadius,
  );

  return companyLocation ? [companyLocation] : [];
}

// Toleransi deviasi akurasi GPS HP (minimal 30 meter untuk mengakomodasi ponsel dengan GPS yang kurang akurat)
const GPS_INACCURACY_TOLERANCE_METERS = 30;

function isWithinAnyAllowedLocation(
  latitude: number,
  longitude: number,
  locations: WorkLocation[],
  accuracyMargin: number = 0,
) {
  let nearest: {distance: number; radius: number; effectiveRadius: number} | null = null;
  const tolerance = Math.max(
    GPS_INACCURACY_TOLERANCE_METERS,
    Number(accuracyMargin) > 0 ? Math.min(Number(accuracyMargin), 80) : 0,
  );

  for (const location of locations) {
    const distance = getDistanceFromLatLonInM(
      latitude,
      longitude,
      location.latitude,
      location.longitude,
    );

    const effectiveRadius = location.radius + tolerance;

    if (distance <= effectiveRadius) {
      return {
        allowed: true,
        nearest: {distance, radius: location.radius, effectiveRadius},
      };
    }

    if (!nearest || distance < nearest.distance) {
      nearest = {distance, radius: location.radius, effectiveRadius};
    }
  }

  return {allowed: false, nearest};
}

/**
 * Clock In
 */
export const clockIn = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const userId = req.user!.id;
    const {status, latitude, longitude, faceVerified, lateReason, accuracy} = req.body;
    const photo = req.file ? `/uploads/${req.file.filename}` : null;

    // Check if user has face registered
    const user = await prisma.user.findUnique({
      where: {id: userId},
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (
      user.faceRegistered &&
      faceVerified !== "true" &&
      faceVerified !== true
    ) {
      return res.status(400).json({
        success: false,
        message: "Face verification required for clock in",
      });
    }

    // Get today's date correctly mapped to UTC to avoid timezone shift in DB
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    // Check if already exists for today
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId,
        date: today,
      },
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: "Attendance already recorded for today",
      });
    }

    // Get company config for late threshold and location rules
    const config = await prisma.companyConfig.findFirst();

    const allowedLocations = getAllowedWorkLocations(user, config);

    // Validasi radius lokasi jika referensi lokasi ditemukan
    if (allowedLocations.length > 0) {
      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message:
            "Akses ditolak: Sistem memerlukan lokasi (GPS) untuk memvalidasi absensi Anda.",
        });
      }

      const currentLatitude = parseFloat(latitude);
      const currentLongitude = parseFloat(longitude);

      if (Number.isNaN(currentLatitude) || Number.isNaN(currentLongitude)) {
        return res.status(400).json({
          success: false,
          message: "Akses ditolak: Koordinat lokasi tidak valid.",
        });
      }

      const validation = isWithinAnyAllowedLocation(
        currentLatitude,
        currentLongitude,
        allowedLocations,
        accuracy ? parseFloat(accuracy) : 0,
      );

      if (!validation.allowed) {
        const nearestDistance = validation.nearest?.distance ?? 0;
        const nearestRadius =
          validation.nearest?.radius ?? allowedLocations[0].radius;
        return res.status(400).json({
          success: false,
          message: `Absen ditolak: Anda berada di luar radius lokasi kerja terdekat. Jarak Anda ${Math.round(nearestDistance)} meter, batas maksimal ${nearestRadius} meter (toleransi akurasi GPS ${GPS_INACCURACY_TOLERANCE_METERS}m).`,
        });
      }
    }

    const workStartTime = user.startWorkTime || "09:00";
    const isFLEX = workStartTime.toUpperCase() === "FLEX";
    const lateThreshold = config?.lateThresholdMinutes ?? 15;

    // Determine status - check if late
    // const now = new Date(); // Removed duplicate declaration

    let attendanceStatus = status || "PRESENT";
    if (attendanceStatus === "PRESENT" && !isFLEX) {
      try {
        const shiftTimes = workStartTime
          .replace(/\./g, ":") // handle 09.00
          .split(",")
          .map(s => s.trim())
          .filter(s => s);
        if (shiftTimes.length === 0) shiftTimes.push("09:00");

        // Cek apakah absen masuk pada window salah satu shift
        let foundOnTimeShift = false;
        for (const st of shiftTimes) {
          const parts = st.split(":");
          if (parts.length >= 2) {
            const sh = parseInt(parts[0], 10);
            const sm = parseInt(parts[1], 10);
            if (!isNaN(sh) && !isNaN(sm)) {
              const shiftDate = new Date(today);
              shiftDate.setHours(sh, sm, 0, 0);
              const shiftStart = new Date(shiftDate);
              const shiftEnd = new Date(shiftDate);
              shiftEnd.setMinutes(shiftEnd.getMinutes() + lateThreshold);
              if (now >= shiftStart && now <= shiftEnd) {
                foundOnTimeShift = true;
                break;
              }
            }
          }
        }
        if (!foundOnTimeShift) {
          // Jika tidak ada shift yang cocok, cek apakah sudah lewat semua shift + lateThreshold
          let allShiftEnd = shiftTimes
            .map(st => {
              const parts = st.split(":");
              if (parts.length >= 2) {
                const sh = parseInt(parts[0], 10);
                const sm = parseInt(parts[1], 10);
                if (!isNaN(sh) && !isNaN(sm)) {
                  const shiftDate = new Date(today);
                  shiftDate.setHours(sh, sm, 0, 0);
                  shiftDate.setMinutes(shiftDate.getMinutes() + lateThreshold);
                  return shiftDate;
                }
              }
              return null;
            })
            .filter(Boolean);
          const lastShiftEnd =
            allShiftEnd.length > 0 ? allShiftEnd[allShiftEnd.length - 1] : null;
          if (lastShiftEnd && now > lastShiftEnd) {
            attendanceStatus = "LATE";
          }
        }
      } catch (err) {
        console.error("Shift logic error:", err);
        attendanceStatus = "LATE";
      }
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        date: today,
        clockIn: now,
        clockInPhoto: photo,
        status: attendanceStatus,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        lateReason: attendanceStatus === "LATE" ? (lateReason || null) : null,
        lateDeductionStatus: attendanceStatus === "LATE" ? "PENDING" : null,
      },
    });

    res.status(201).json({
      success: true,
      message: "Clock in successful",
      data: attendance,
      isLate: attendanceStatus === "LATE",
    });
  } catch (error) {
    console.error("Clock in error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Request Leave/Sick (Izin/Sakit)
 */
export const requestLeave = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const userId = req.user!.id;
    const {status, date, description, leaveType, leaveDuration} = req.body;
    const photo = req.file ? req.file.filename : null;

    if (!["SICK", "LEAVE"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status harus SICK atau LEAVE",
      });
    }

    if (!photo && !req.body.leaveDocument) {
      return res.status(400).json({
        success: false,
        message: "Dokumen / Foto Surat wajib dilampirkan",
      });
    }

    const now = new Date();
    let targetDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    if (date) {
      // Set target date ensuring correct DB UTC mapping
      const d = new Date(date);
      targetDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    }

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        userId,
        date: targetDate,
      },
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: "Kehadiran/Izin sudah tercatat untuk tanggal tersebut",
      });
    }

    // Trim to 255 chars to prevent database text-overflow
    const safeDesc = description ? description.substring(0, 250) : null;
    const duration = leaveDuration ? parseInt(leaveDuration, 10) : 1;
    const docPath = photo || req.body.leaveDocument || null;

    const attendance = await prisma.attendance.create({
      data: {
        userId,
        date: targetDate,
        status: status,
        leaveApprovalStatus: "PENDING",
        leaveType: leaveType || (status === "SICK" ? "Izin Sakit" : "Cuti Tahunan"),
        leaveDuration: duration,
        leaveDocument: docPath,
        clockInPhoto: docPath, // Document URL compatibility
        leaveDescription: safeDesc, // Keterangan
      },
    });

    res.status(201).json({
      success: true,
      message: "Pengajuan Izin berhasil dicatat",
      data: attendance,
    });
  } catch (error) {
    console.error("Request leave error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Admin: Get leave requests
 */
export const getLeaveRequests = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const {status = "PENDING"} = req.query;

    const where: any = {
      status: {
        in: ["SICK", "LEAVE"],
      },
    };

    const requests = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            photo: true,
            department: true,
            position: true,
          },
        },
      },
      orderBy: [{date: "desc"}, {createdAt: "desc"}],
    });

    const filteredRequests =
      status && status !== "ALL"
        ? requests.filter(
            request => String(request.leaveApprovalStatus) === String(status),
          )
        : requests;

    res.json({
      success: true,
      data: filteredRequests,
    });
  } catch (error) {
    console.error("Get leave requests error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Admin: Approve or reject leave request
 */
export const reviewLeaveRequest = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const id = Number(req.params.id);
    const rawAction = String(req.body.action || "").toUpperCase().trim();
    const action = rawAction === "APPROVE" ? "APPROVED" : rawAction === "REJECT" ? "REJECTED" : rawAction;
    const {note} = req.body;

    if (!["APPROVED", "REJECTED"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action harus APPROVED atau REJECTED",
      });
    }

    const request = await prisma.attendance.findUnique({
      where: {id},
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    if (!["SICK", "LEAVE"].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: "Record ini bukan pengajuan izin/sakit",
      });
    }

    const updated = await prisma.attendance.update({
      where: {id},
      data: {
        leaveApprovalStatus: action as any,
        leaveReviewNote: note ? String(note).substring(0, 250) : null,
        leaveReviewedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: `Leave request ${action.toLowerCase()} successfully`,
      data: updated,
    });
  } catch (error) {
    console.error("Review leave request error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Admin: Approve or reject late deduction (Approve means WAIVED, Reject means DEDUCT)
 */
export const reviewLateDeduction = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const id = Number(req.params.id);
    const rawAction = String(req.body.action || "").toUpperCase().trim();
    const action = rawAction === "APPROVE" ? "APPROVED" : rawAction === "REJECT" ? "REJECTED" : rawAction;

    if (!["APPROVED", "REJECTED"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action harus APPROVED atau REJECTED",
      });
    }

    const attendance = await prisma.attendance.findUnique({
      where: {id},
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Absensi tidak ditemukan",
      });
    }

    if (attendance.status !== "LATE") {
      return res.status(400).json({
        success: false,
        message: "Absensi ini tidak berstatus terlambat (LATE)",
      });
    }

    const updated = await prisma.attendance.update({
      where: {id},
      data: {
        lateDeductionStatus: action,
      },
    });

    res.json({
      success: true,
      message: `Status potongan keterlambatan berhasil diubah ke ${action}`,
      data: updated,
    });
  } catch (error) {
    console.error("Review late deduction error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * User: Request attendance correction
 */
export const requestAttendanceCorrection = async (
  req: Request,
  res: Response,
) => {
  try {
    const prisma = req.prisma!;
    const userId = req.user!.id;
    const id = Number(req.params.id);
    const {correctionReason, requestedClockIn, requestedClockOut} = req.body;

    if (!correctionReason || (!requestedClockIn && !requestedClockOut)) {
      return res.status(400).json({
        success: false,
        message: "Alasan koreksi dan minimal satu jam koreksi wajib diisi",
      });
    }

    const attendance = await prisma.attendance.findUnique({
      where: {id},
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance not found",
      });
    }

    if (attendance.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: "Anda tidak bisa mengajukan koreksi untuk data orang lain",
      });
    }

    if (attendance.correctionStatus === "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Koreksi sebelumnya masih menunggu persetujuan admin",
      });
    }

    const requestedClockInDate = requestedClockIn
      ? parseTimeOnDate(attendance.date, String(requestedClockIn))
      : null;
    const requestedClockOutDate = requestedClockOut
      ? parseTimeOnDate(attendance.date, String(requestedClockOut))
      : null;

    if (
      (requestedClockIn && !requestedClockInDate) ||
      (requestedClockOut && !requestedClockOutDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "Format jam harus HH:MM",
      });
    }

    const updated = await prisma.attendance.update({
      where: {id},
      data: {
        correctionStatus: "PENDING",
        correctionReason: String(correctionReason).substring(0, 250),
        correctionRequestedClockIn: requestedClockInDate,
        correctionRequestedClockOut: requestedClockOutDate,
        correctionRequestedAt: new Date(),
        correctionReviewedAt: null,
        correctionReviewNote: null,
      },
    });

    res.status(201).json({
      success: true,
      message: "Pengajuan koreksi absensi berhasil dikirim",
      data: updated,
    });
  } catch (error) {
    console.error("Request attendance correction error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Admin: Get attendance corrections
 */
export const getAttendanceCorrections = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const {status = "PENDING"} = req.query;

    const where: any = {
      correctionStatus: status === "ALL" ? {not: "NONE"} : status,
    };

    const corrections = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: [{correctionRequestedAt: "desc"}, {updatedAt: "desc"}],
    });

    res.json({
      success: true,
      data: corrections,
    });
  } catch (error) {
    console.error("Get attendance corrections error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Admin: Review attendance correction
 */
export const reviewAttendanceCorrection = async (
  req: Request,
  res: Response,
) => {
  try {
    const prisma = req.prisma!;
    const id = Number(req.params.id);
    const rawAction = String(req.body.action || "").toUpperCase().trim();
    const action = rawAction === "APPROVE" ? "APPROVED" : rawAction === "REJECT" ? "REJECTED" : rawAction;
    const {note} = req.body;

    if (!["APPROVED", "REJECTED"].includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Action harus APPROVED atau REJECTED",
      });
    }

    const attendance = await prisma.attendance.findUnique({
      where: {id},
    });

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: "Attendance not found",
      });
    }

    if (attendance.correctionStatus !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: "Tidak ada pengajuan koreksi yang menunggu",
      });
    }

    const updated = await prisma.attendance.update({
      where: {id},
      data: {
        correctionStatus: action as any,
        correctionReviewNote: note ? String(note).substring(0, 250) : null,
        correctionReviewedAt: new Date(),
        ...(action === "APPROVED" && attendance.correctionRequestedClockIn
          ? {clockIn: attendance.correctionRequestedClockIn}
          : {}),
        ...(action === "APPROVED" && attendance.correctionRequestedClockOut
          ? {clockOut: attendance.correctionRequestedClockOut}
          : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: `Attendance correction ${action.toLowerCase()} successfully`,
      data: updated,
    });
  } catch (error) {
    console.error("Review attendance correction error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Clock Out
 */
export const clockOut = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const userId = req.user!.id;
    const {faceVerified, latitude, longitude, accuracy} = req.body;
    const photo = req.file ? req.file.filename : null;

    // Check if user has face registered
    const user = await prisma.user.findUnique({
      where: {id: userId},
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (
      user.faceRegistered &&
      faceVerified !== "true" &&
      faceVerified !== true
    ) {
      return res.status(400).json({
        success: false,
        message: "Face verification required for clock out",
      });
    }

    // Get config to validate distance for clock out too
    const config = await prisma.companyConfig.findFirst();

    const allowedLocations = getAllowedWorkLocations(user, config);

    if (allowedLocations.length > 0) {
      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message:
            "Akses ditolak: Sistem memerlukan lokasi (GPS) untuk memvalidasi absensi pulang Anda.",
        });
      }

      const currentLatitude = parseFloat(latitude);
      const currentLongitude = parseFloat(longitude);

      if (Number.isNaN(currentLatitude) || Number.isNaN(currentLongitude)) {
        return res.status(400).json({
          success: false,
          message: "Akses ditolak: Koordinat lokasi tidak valid.",
        });
      }

      const validation = isWithinAnyAllowedLocation(
        currentLatitude,
        currentLongitude,
        allowedLocations,
        accuracy ? parseFloat(accuracy) : 0,
      );

      if (!validation.allowed) {
        const nearestDistance = validation.nearest?.distance ?? 0;
        const nearestRadius =
          validation.nearest?.radius ?? allowedLocations[0].radius;
        return res.status(400).json({
          success: false,
          message: `Pulang ditolak: Anda berada di luar radius lokasi kerja terdekat. Jarak Anda ${Math.round(nearestDistance)} meter, batas maksimal ${nearestRadius} meter (toleransi akurasi GPS ${GPS_INACCURACY_TOLERANCE_METERS}m).`,
        });
      }
    }

    // Find today's attendance
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    const attendance = await prisma.attendance.findFirst({
      where: {
        userId,
        date: today,
        clockOut: null,
      },
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: "No active check-in found or already clocked out",
      });
    }

    // Check if there's an active break
    const activeBreak = await prisma.break.findFirst({
      where: {
        userId,
        attendanceId: attendance.id,
        endTime: null,
      },
    });

    if (activeBreak) {
      return res.status(400).json({
        success: false,
        message: "Please end your break before clocking out",
      });
    }

    const updatedAttendance = await prisma.attendance.update({
      where: {id: attendance.id},
      data: {
        clockOut: new Date(),
        clockOutPhoto: photo,
      },
    });

    res.json({
      success: true,
      message: "Clock out successful",
      data: updatedAttendance,
    });
  } catch (error) {
    console.error("Clock out error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Get attendance history for current user
 */
export const getHistory = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const userId = req.user!.id;
    const {page = 1, limit = 50, month, year, startDate, endDate} = req.query;

    const where: any = {userId};

    if (startDate && endDate) {
      where.date = {
        gte: new Date(String(startDate)),
        lte: new Date(String(endDate)),
      };
    } else if (month && year) {
      const m = Number(month) - 1;
      const y = Number(year);
      const start = new Date(Date.UTC(y, m, 1));
      const end = new Date(Date.UTC(m === 11 ? y + 1 : y, m === 11 ? 0 : m + 1, 1));
      where.date = {
        gte: start,
        lt: end,
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [history, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        orderBy: {date: "desc"},
        include: {breaks: true},
        skip,
        take: Number(limit),
      }),
      prisma.attendance.count({where}),
    ]);

    res.json({
      success: true,
      data: history,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get history error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Get today's attendance for current user
 */
export const getTodayAttendance = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const userId = req.user!.id;

    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    const [attendance, user, config] = await Promise.all([
      prisma.attendance.findFirst({
        where: {
          userId,
          date: today,
        },
        include: {breaks: true},
      }),
      prisma.user.findUnique({
        where: {id: userId},
      }),
      prisma.companyConfig.findFirst(),
    ]);

    const allowedLocations = getAllowedWorkLocations(user, config);

    res.json({
      success: true,
      data: attendance,
      workLocations: {
        allowedLocations,
        companyName: config?.companyName || "Perusahaan",
        requireGps: Boolean(config?.requireGps ?? true),
        hasLocationRestriction: allowedLocations.length > 0,
        defaultRadius: config?.allowedRadiusMeters ?? 50,
      },
    });
  } catch (error) {
    console.error("Get today attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Get work locations allowed for current user
 */
export const getWorkLocations = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const userId = req.user!.id;

    const [user, config] = await Promise.all([
      prisma.user.findUnique({
        where: {id: userId},
      }),
      prisma.companyConfig.findFirst(),
    ]);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const allowedLocations = getAllowedWorkLocations(user, config);

    res.json({
      success: true,
      data: {
        allowedLocations,
        companyName: config?.companyName || "Perusahaan",
        requireGps: Boolean(config?.requireGps ?? true),
        hasLocationRestriction: allowedLocations.length > 0,
        defaultRadius: config?.allowedRadiusMeters ?? 50,
      },
    });
  } catch (error) {
    console.error("Get work locations error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Get attendance statistics for current user
 */
export const getStatistics = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const userId = req.user!.id;
    const {month, year} = req.query;

    // Offset the server time by +7 hours to ensure it aligns with WIB (Indonesia Time)
    const nowWIB = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    const targetMonth = month ? Number(month) - 1 : nowWIB.getUTCMonth();
    const targetYear = year ? Number(year) : nowWIB.getUTCFullYear();

    // Create startDate and endDate in UTC to exactly match how clockIn saves the date
    // (clockIn uses Date.UTC(..., month, date))
    const startDate = new Date(Date.UTC(targetYear, targetMonth, 1, 0, 0, 0, 0));
    
    // For endDate, we go to the first day of the NEXT month at 00:00:00 UTC, and use 'lt' instead of 'lte'
    const nextMonth = targetMonth === 11 ? 0 : targetMonth + 1;
    const nextMonthYear = targetMonth === 11 ? targetYear + 1 : targetYear;
    const endDate = new Date(Date.UTC(nextMonthYear, nextMonth, 1, 0, 0, 0, 0));

    const attendances = await prisma.attendance.findMany({
      where: {
        userId,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {breaks: true},
    });

    const stats = {
      totalDays: attendances.length,
      present: attendances.filter(a => a.status === "PRESENT").length,
      late: attendances.filter(a => a.status === "LATE").length,
      absent: attendances.filter(a => a.status === "ABSENT").length,
      sick: attendances.filter(a => a.status === "SICK").length,
      leave: attendances.filter(a => a.status === "LEAVE").length,
      totalBreakMinutes: attendances.reduce(
        (sum, a) => sum + a.totalBreakMinutes,
        0,
      ),
    };

    res.json({
      success: true,
      data: stats,
      period: {
        month: targetMonth + 1,
        year: targetYear,
      },
    });
  } catch (error) {
    console.error("Get statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Admin: Get all attendance for today
 */
export const getAllTodayAttendance = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const {date} = req.query;

    let targetDate: Date;
    if (date && typeof date === "string") {
      const parts = date.split("-").map(Number);
      if (parts.length === 3) {
        targetDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
      } else {
        const d = new Date(date);
        targetDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      }
    } else {
      const now = new Date();
      targetDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    }

    const attendances = await prisma.attendance.findMany({
      where: {date: targetDate},
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            department: true,
            position: true,
            employeeId: true,
            photo: true,
          },
        },
        breaks: true,
      },
      orderBy: {clockIn: "asc"},
    });

    res.json({
      success: true,
      data: attendances,
      date: targetDate.toISOString().split("T")[0],
    });
  } catch (error) {
    console.error("Get all today attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Admin: Get attendance report
 */
export const getAttendanceReport = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const {startDate, endDate, userId} = req.query;

    const where: any = {};

    if (startDate && endDate) {
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      end.setHours(23, 59, 59, 999);
      
      where.date = {
        gte: start,
        lte: end,
      };
    }

    if (userId) {
      where.userId = Number(userId);
    }

    const attendances = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        breaks: true,
      },
      orderBy: [{date: "desc"}, {clockIn: "asc"}],
    });

    res.json({
      success: true,
      data: attendances,
    });
  } catch (error) {
    console.error("Get attendance report error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Admin: Get late deduction requests (attendances with lateReason)
 */
export const getLateDeductions = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const { status = "PENDING" } = req.query;

    const where: any = {
      status: "LATE",
      lateReason: { not: null },
    };

    if (status !== "ALL") {
      where.lateDeductionStatus = status;
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            latePenalty: true,
            startWorkTime: true,
          },
        },
      },
      orderBy: [{ date: "desc" }, { clockIn: "asc" }],
    });

    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    console.error("Get late deductions error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Admin: Get dashboard attendance statistics for today
 */
export const getTodayAttendanceStats = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;

    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    const [totalEmployees, todayAttendances, recentLeaves] = await Promise.all([
      prisma.user.count(),
      prisma.attendance.findMany({
        where: { date: today },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              photo: true,
              department: true,
              position: true,
            },
          },
        },
        orderBy: { clockIn: "desc" },
      }),
      prisma.attendance.findMany({
        where: {
          status: { in: ["LEAVE", "SICK"] },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
            },
          },
        },
        orderBy: { date: "desc" },
        take: 5,
      }),
    ]);

    const present = todayAttendances.filter(a => a.status === "PRESENT" || !!a.clockIn).length;
    const late = todayAttendances.filter(a => a.status === "LATE").length;
    const leave = todayAttendances.filter(a => a.status === "LEAVE" || a.status === "SICK").length;

    res.json({
      success: true,
      data: {
        totalEmployees,
        present,
        late,
        leave,
        recentAttendances: todayAttendances.slice(0, 10),
        recentLeaves,
      },
    });
  } catch (error) {
    console.error("Get today stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


