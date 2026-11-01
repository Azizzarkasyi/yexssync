import { Request, Response } from 'express';
import ExcelJS from 'exceljs';
import path from 'path';

/**
 * Generate payroll for a user or all users in tenant
 */
export const generatePayroll = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const { userId, periodStart, periodEnd } = req.body;

    if (!periodStart || !periodEnd) {
      return res.status(400).json({
        success: false,
        message: 'periodStart dan periodEnd wajib diisi',
      });
    }

    const startDate = new Date(periodStart);
    const endDate = new Date(periodEnd);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Format tanggal periodStart atau periodEnd tidak valid',
      });
    }

    // Set to start of day (00:00:00.000) and end of day (23:59:59.999)
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    // Get company config for overtime rate
    const config = await prisma.companyConfig.findFirst();
    const overtimeRate = config?.overtimeRateMultiplier || 1.5;

    // Get users (single or all active non-admin employees)
    const isAll = !userId || userId === 'ALL' || userId === '';
    const users = isAll
      ? await prisma.user.findMany({
          where: {
            role: { not: 'ADMIN' },
            isActive: true,
          },
        })
      : await prisma.user.findMany({
          where: {
            id: Number(userId),
          },
        });

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tidak ada karyawan yang ditemukan untuk digenerate payroll',
      });
    }

    const generatedPayrolls = [];

    for (const user of users) {
      // Get attendance records for the period
      const attendances = await prisma.attendance.findMany({
        where: {
          userId: user.id,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: { breaks: true },
      });

      // Calculate working stats
      let workingDays = 0;
      let workingHours = 0;
      let lateCount = 0;
      let totalBreakMinutes = 0;

      for (const attendance of attendances) {
        if (attendance.clockIn && attendance.clockOut) {
          workingDays++;
          let hoursWorked =
            (attendance.clockOut.getTime() - attendance.clockIn.getTime()) / 3600000;
          const breakHours = (attendance.totalBreakMinutes || 0) / 60;
          hoursWorked = Math.max(0, hoursWorked - breakHours);
          workingHours += hoursWorked;

          if (attendance.status === 'LATE' && attendance.lateDeductionStatus !== 'APPROVED') {
            lateCount++;
          }
          totalBreakMinutes += attendance.totalBreakMinutes;
        }
      }

      // Calculate salary based on type
      let baseSalary = user.salary || 0;
      switch (user.salaryType) {
        case 'HOURLY':
          baseSalary = (user.salary || 0) * workingHours;
          break;
        case 'DAILY':
          baseSalary = (user.salary || 0) * workingDays;
          break;
        case 'WEEKLY':
          baseSalary = (user.salary || 0) * Math.ceil(workingDays / 7);
          break;
        case 'MONTHLY':
        default:
          baseSalary = user.salary || 0;
          break;
      }

      const lateDeductions = lateCount * (user.latePenalty || 0);
      const expectedHours = workingDays * 8;
      const overtimeHours = Math.max(0, workingHours - expectedHours);

      let hourlyRate = user.salary || 0;
      if (user.salaryType === 'MONTHLY') {
        hourlyRate = (user.salary || 0) / 160;
      } else if (user.salaryType === 'DAILY') {
        hourlyRate = (user.salary || 0) / 8;
      } else if (user.salaryType === 'WEEKLY') {
        hourlyRate = (user.salary || 0) / 40;
      }

      const totalDeductions = lateDeductions;
      let overtimeBonus = 0;
      if (user.salaryType === 'HOURLY') {
        overtimeBonus = overtimeHours * hourlyRate * (overtimeRate - 1.0);
      } else {
        overtimeBonus = overtimeHours * hourlyRate * overtimeRate;
      }

      const netSalary = Math.max(0, baseSalary + overtimeBonus - totalDeductions);

      // Check if payroll record already exists for this user in this period
      const existing = await prisma.payroll.findFirst({
        where: {
          userId: user.id,
          periodStart: { gte: startDate },
          periodEnd: { lte: endDate },
        },
      });

      let payroll;
      if (existing) {
        // If already paid, do not overwrite paid record
        if (existing.paymentStatus === 'PAID') {
          generatedPayrolls.push(existing);
          continue;
        }
        payroll = await prisma.payroll.update({
          where: { id: existing.id },
          data: {
            baseSalary,
            workingDays,
            workingHours,
            overtimeHours,
            lateDeductions,
            breakDeductions: 0,
            overtimeBonus,
            deductions: totalDeductions,
            netSalary,
          },
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        });
      } else {
        payroll = await prisma.payroll.create({
          data: {
            userId: user.id,
            periodStart: startDate,
            periodEnd: endDate,
            baseSalary,
            workingDays,
            workingHours,
            overtimeHours,
            lateDeductions,
            breakDeductions: 0,
            overtimeBonus,
            deductions: totalDeductions,
            netSalary,
          },
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        });
      }

      generatedPayrolls.push(payroll);
    }

    res.status(201).json({
      success: true,
      message: `Payroll berhasil digenerate untuk ${generatedPayrolls.length} karyawan`,
      data: generatedPayrolls.length === 1 ? generatedPayrolls[0] : generatedPayrolls,
    });
  } catch (error) {
    console.error('Generate payroll error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

/**
 * Get payroll history for a user
 */
export const getUserPayrolls = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const userId = parseInt(req.params.userId as string, 10);

    const payrolls = await prisma.payroll.findMany({
      where: { userId },
      orderBy: { periodEnd: 'desc' },
    });

    res.json({
      success: true,
      data: payrolls,
    });
  } catch (error) {
    console.error('Get user payrolls error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get my payroll history
 */
export const getMyPayrolls = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const userId = req.user!.id;

    const payrolls = await prisma.payroll.findMany({
      where: { userId },
      orderBy: { periodEnd: 'desc' },
    });

    res.json({
      success: true,
      data: payrolls,
    });
  } catch (error) {
    console.error('Get my payrolls error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get all payrolls (Admin)
 */
export const getAllPayrolls = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const { periodStart, periodEnd, userId, month, year } = req.query;

    const where: any = {};

    if (userId && userId !== 'ALL' && userId !== '') {
      where.userId = Number(userId);
    }

    if (periodStart && periodEnd) {
      const pStart = new Date(periodStart as string);
      const pEnd = new Date(periodEnd as string);
      if (!isNaN(pStart.getTime()) && !isNaN(pEnd.getTime())) {
        pStart.setHours(0, 0, 0, 0);
        pEnd.setHours(23, 59, 59, 999);
        where.periodStart = { gte: pStart };
        where.periodEnd = { lte: pEnd };
      }
    } else if (month && year) {
      const m = Number(month) - 1;
      const y = Number(year);
      if (!isNaN(m) && !isNaN(y)) {
        const start = new Date(Date.UTC(y, m, 1));
        const end = new Date(Date.UTC(m === 11 ? y + 1 : y, m === 11 ? 0 : m + 1, 1));
        where.periodStart = { gte: start };
        where.periodEnd = { lt: end };
      }
    }

    const payrolls = await prisma.payroll.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            position: true,
            photo: true,
            bankName: true,
            bankAccountNumber: true,
            bankAccountHolder: true,
          },
        },
      },
      orderBy: { periodEnd: 'desc' },
    });

    res.json({
      success: true,
      data: payrolls,
    });
  } catch (error) {
    console.error('Get all payrolls error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get payroll by ID
 */
export const getPayrollById = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const id = parseInt(req.params.id as string, 10);

    const payroll = await prisma.payroll.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!payroll) {
      return res.status(404).json({
        success: false,
        message: 'Payroll not found',
      });
    }

    res.json({
      success: true,
      data: payroll,
    });
  } catch (error) {
    console.error('Get payroll by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Delete payroll (Single)
 */
export const deletePayroll = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const id = parseInt(req.params.id as string, 10);

    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID payroll tidak valid',
      });
    }

    const existing = await prisma.payroll.findUnique({
      where: { id },
      include: { user: { select: { name: true } } },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Data payroll tidak ditemukan',
      });
    }

    await prisma.payroll.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: `Data payroll untuk ${existing.user?.name || 'karyawan'} berhasil dihapus`,
    });
  } catch (error) {
    console.error('Delete payroll error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

/**
 * Bulk delete payrolls (by IDs array or period)
 */
export const deleteBulkPayrolls = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const { ids, periodStart, periodEnd, userId } = req.body || {};

    const where: any = {};

    if (Array.isArray(ids) && ids.length > 0) {
      const validIds = ids.map((id: any) => Number(id)).filter((id: number) => !isNaN(id) && id > 0);
      if (validIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Daftar ID payroll tidak valid',
        });
      }
      where.id = { in: validIds };
    } else if (periodStart && periodEnd) {
      const pStart = new Date(periodStart);
      const pEnd = new Date(periodEnd);
      if (!isNaN(pStart.getTime()) && !isNaN(pEnd.getTime())) {
        pStart.setHours(0, 0, 0, 0);
        pEnd.setHours(23, 59, 59, 999);
        where.periodStart = { gte: pStart };
        where.periodEnd = { lte: pEnd };
      } else {
        return res.status(400).json({
          success: false,
          message: 'Format tanggal periode tidak valid',
        });
      }
      if (userId && userId !== 'ALL') {
        where.userId = Number(userId);
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Tentukan daftar ID payroll atau rentang periode yang ingin dihapus',
      });
    }

    const result = await prisma.payroll.deleteMany({
      where,
    });

    res.json({
      success: true,
      message: `${result.count} data payroll berhasil dihapus`,
      count: result.count,
    });
  } catch (error) {
    console.error('Delete bulk payrolls error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Internal server error',
    });
  }
};

/**
 * Mark as Paid
 */
export const markAsPaid = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const id = parseInt(req.params.id as string, 10);

    let paymentProof = null;
    if (req.file) {
      paymentProof = `/uploads/${req.file.filename}`;
    }

    const payload: any = {
      paymentStatus: 'PAID',
    };
    if (paymentProof) {
      payload.paymentProof = paymentProof;
    }

    const payroll = await prisma.payroll.update({
      where: { id },
      data: payload,
      include: {
        user: { select: { name: true, email: true } }
      }
    });

    res.json({
      success: true,
      message: 'Payroll marked as paid successfully',
      data: payroll
    });
  } catch (error) {
    console.error('Mark as paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Export Payroll to Excel
 */
export const exportExcel = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const { periodStart, periodEnd } = req.query;

    const where: any = {};
    if (periodStart && periodEnd) {
      const pStart = new Date(periodStart as string);
      const pEnd = new Date(periodEnd as string);
      if (!isNaN(pStart.getTime()) && !isNaN(pEnd.getTime())) {
        pStart.setHours(0, 0, 0, 0);
        pEnd.setHours(23, 59, 59, 999);
        where.periodStart = { gte: pStart };
        where.periodEnd = { lte: pEnd };
      }
    }

    const payrolls = await prisma.payroll.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { periodEnd: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Penggajian');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Nama Karyawan', key: 'name', width: 25 },
      { header: 'Periode Mulai', key: 'periodStart', width: 15 },
      { header: 'Periode Selesai', key: 'periodEnd', width: 15 },
      { header: 'Hari Kerja', key: 'workingDays', width: 15 },
      { header: 'Jam Kerja', key: 'workingHours', width: 15 },
      { header: 'Gaji Pokok', key: 'baseSalary', width: 15 },
      { header: 'Bonus Lembur', key: 'overtimeBonus', width: 15 },
      { header: 'Total Potongan', key: 'deductions', width: 15 },
      { header: 'Gaji Bersih', key: 'netSalary', width: 15 },
      { header: 'Status Pembayaran', key: 'paymentStatus', width: 20 },
    ];

    payrolls.forEach(p => {
      worksheet.addRow({
        id: p.id,
        name: p.user.name,
        periodStart: p.periodStart.toISOString().split('T')[0],
        periodEnd: p.periodEnd.toISOString().split('T')[0],
        workingDays: p.workingDays,
        workingHours: p.workingHours.toFixed(2),
        baseSalary: p.baseSalary,
        overtimeBonus: p.overtimeBonus,
        deductions: p.deductions,
        netSalary: p.netSalary,
        paymentStatus: p.paymentStatus,
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + 'laporan_gaji.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Export My Payroll to Excel
 */
export const exportMyExcel = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const userId = req.user!.id;
    const { periodStart, periodEnd } = req.query;

    const where: any = { userId };
    if (periodStart && periodEnd) {
      const pStart = new Date(periodStart as string);
      const pEnd = new Date(periodEnd as string);
      if (!isNaN(pStart.getTime()) && !isNaN(pEnd.getTime())) {
        pStart.setHours(0, 0, 0, 0);
        pEnd.setHours(23, 59, 59, 999);
        where.periodStart = { gte: pStart };
        where.periodEnd = { lte: pEnd };
      }
    }

    const payrolls = await prisma.payroll.findMany({
      where,
      include: {
        user: { select: { name: true } },
      },
      orderBy: { periodEnd: 'desc' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Gaji Saya');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Periode Mulai', key: 'periodStart', width: 15 },
      { header: 'Periode Selesai', key: 'periodEnd', width: 15 },
      { header: 'Hari Kerja', key: 'workingDays', width: 15 },
      { header: 'Jam Kerja', key: 'workingHours', width: 15 },
      { header: 'Gaji Pokok', key: 'baseSalary', width: 15 },
      { header: 'Bonus Lembur', key: 'overtimeBonus', width: 15 },
      { header: 'Total Potongan', key: 'deductions', width: 15 },
      { header: 'Gaji Bersih', key: 'netSalary', width: 15 },
      { header: 'Status Pembayaran', key: 'paymentStatus', width: 20 },
    ];

    payrolls.forEach(p => {
      worksheet.addRow({
        id: p.id,
        periodStart: p.periodStart.toISOString().split('T')[0],
        periodEnd: p.periodEnd.toISOString().split('T')[0],
        workingDays: p.workingDays,
        workingHours: p.workingHours.toFixed(2),
        baseSalary: p.baseSalary,
        overtimeBonus: p.overtimeBonus,
        deductions: p.deductions,
        netSalary: p.netSalary,
        paymentStatus: p.paymentStatus,
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=gaji_saya.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
