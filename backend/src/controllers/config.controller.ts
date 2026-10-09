import { Request, Response } from 'express';
import { getPublicPrisma } from '../prisma/tenant-prisma';

/**
 * Get company config
 */
export const getConfig = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;

    let config = await prisma.companyConfig.findFirst();

    if (!config) {
      // Create default config if not exists
      config = await prisma.companyConfig.create({
        data: {},
      });
    }

    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Update company config (Admin only)
 */
export const updateConfig = async (req: Request, res: Response) => {
  try {
    const prisma = req.prisma!;
    const {
      companyName,
      companyEmail,
      companyPhone,
      companyAddress,
      companyWebsite,
      workStartTime,
      workEndTime,
      workDays,
      requireGps,
      requireSelfie,
      rejectOutsideShift,
      maxBreakMinutesPerDay,
      lateThresholdMinutes,
      lateTolerance,
      overtimeRateMultiplier,
      officeLatitude,
      latitude,
      officeLongitude,
      longitude,
      allowedRadiusMeters,
      radius,
      shifts,
      departments,
    } = req.body;

    const resolvedOfficeLatitude = officeLatitude !== undefined ? parseFloat(officeLatitude) : (latitude !== undefined ? parseFloat(latitude) : undefined);
    const resolvedOfficeLongitude = officeLongitude !== undefined ? parseFloat(officeLongitude) : (longitude !== undefined ? parseFloat(longitude) : undefined);
    const resolvedRadius = allowedRadiusMeters !== undefined ? parseInt(allowedRadiusMeters, 10) : (radius !== undefined ? parseInt(radius, 10) : undefined);
    const resolvedLateTolerance = lateThresholdMinutes !== undefined ? parseInt(lateThresholdMinutes, 10) : (lateTolerance !== undefined ? parseInt(lateTolerance, 10) : undefined);

    let config = await prisma.companyConfig.findFirst();

    if (!config) {
      config = await prisma.companyConfig.create({
        data: {
          companyName,
          companyEmail,
          companyPhone,
          companyAddress,
          companyWebsite,
          workStartTime: workStartTime || '08:00',
          workEndTime: workEndTime || '17:00',
          workDays: workDays ? String(workDays) : '6',
          requireGps: requireGps !== undefined ? Boolean(requireGps) : true,
          requireSelfie: requireSelfie !== undefined ? Boolean(requireSelfie) : true,
          rejectOutsideShift: rejectOutsideShift !== undefined ? Boolean(rejectOutsideShift) : false,
          maxBreakMinutesPerDay: maxBreakMinutesPerDay ? parseInt(maxBreakMinutesPerDay, 10) : 60,
          lateThresholdMinutes: resolvedLateTolerance ?? 15,
          overtimeRateMultiplier: overtimeRateMultiplier ? parseFloat(overtimeRateMultiplier) : 1.5,
          officeLatitude: resolvedOfficeLatitude,
          officeLongitude: resolvedOfficeLongitude,
          allowedRadiusMeters: resolvedRadius ?? 50,
          shifts: shifts !== undefined ? shifts : undefined,
          departments: departments !== undefined ? departments : undefined,
        },
      });
    } else {
      config = await prisma.companyConfig.update({
        where: { id: config.id },
        data: {
          ...(companyName && { companyName }),
          ...(companyEmail !== undefined && { companyEmail }),
          ...(companyPhone !== undefined && { companyPhone }),
          ...(companyAddress !== undefined && { companyAddress }),
          ...(companyWebsite !== undefined && { companyWebsite }),
          ...(workStartTime !== undefined && { workStartTime }),
          ...(workEndTime !== undefined && { workEndTime }),
          ...(workDays !== undefined && { workDays: String(workDays) }),
          ...(requireGps !== undefined && { requireGps: Boolean(requireGps) }),
          ...(requireSelfie !== undefined && { requireSelfie: Boolean(requireSelfie) }),
          ...(rejectOutsideShift !== undefined && { rejectOutsideShift: Boolean(rejectOutsideShift) }),
          ...(maxBreakMinutesPerDay !== undefined && { maxBreakMinutesPerDay: parseInt(maxBreakMinutesPerDay, 10) }),
          ...(resolvedLateTolerance !== undefined && { lateThresholdMinutes: resolvedLateTolerance }),
          ...(overtimeRateMultiplier !== undefined && { overtimeRateMultiplier: parseFloat(overtimeRateMultiplier) }),
          ...(resolvedOfficeLatitude !== undefined && { officeLatitude: resolvedOfficeLatitude }),
          ...(resolvedOfficeLongitude !== undefined && { officeLongitude: resolvedOfficeLongitude }),
          ...(resolvedRadius !== undefined && { allowedRadiusMeters: resolvedRadius }),
          ...(shifts !== undefined && { shifts }),
          ...(departments !== undefined && { departments }),
        },
      });
    }

    res.json({
      success: true,
      message: 'Config updated successfully',
      data: config,
    });
  } catch (error) {
    console.error('Update config error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Get tenant active billing status (Admin only)
 */
export const getBillingStatus = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const publicPrisma = getPublicPrisma();
    
    const unpaidBilling = await publicPrisma.subscriptionBilling.findFirst({
      where: {
        tenantId,
        status: 'PENDING',
      },
      orderBy: [
        { year: 'asc' },
        { month: 'asc' }
      ]
    });
    
    // Get superadmin bank details
    const superAdmin = await publicPrisma.superAdmin.findFirst();

    res.json({
      success: true,
      data: {
        hasUnpaidBilling: !!unpaidBilling,
        billing: unpaidBilling,
        bankDetails: superAdmin ? {
          bankName: superAdmin.bankName,
          bankAccount: superAdmin.bankAccount,
          bankAccountName: superAdmin.bankAccountName,
        } : null
      },
    });
  } catch (error) {
    console.error('Get billing status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Upload payment proof for tenant billing
 */
export const uploadPaymentProof = async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const billingId = parseInt(req.params.id as string);
    const publicPrisma = getPublicPrisma();
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Payment proof image is required' });
    }

    const billing = await publicPrisma.subscriptionBilling.findFirst({
      where: { id: billingId, tenantId },
    });

    if (!billing) {
      return res.status(404).json({ success: false, message: 'Billing not found' });
    }

    const updatedBilling = await publicPrisma.subscriptionBilling.update({
      where: { id: billingId },
      data: {
        paymentProof: `/api/uploads/${req.file.filename}`,
      }
    });

    res.json({
      success: true,
      message: 'Payment proof uploaded successfully',
      data: updatedBilling,
    });
  } catch (error) {
    console.error('Upload proof error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
