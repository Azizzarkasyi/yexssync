import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { getPublicPrisma, getTenantPrisma } from '../prisma/tenant-prisma';

// Extend Express Request to include tenant info
declare global {
  namespace Express {
    interface Request {
      tenantId?: number;
      tenantSchema?: string;
      prisma?: PrismaClient;
      isSuperAdmin?: boolean;
    }
  }
}

/**
 * Middleware to extract and validate tenant from request
 * Expects X-Tenant-ID header or tenantId in JWT payload
 */
export async function tenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Skip for super admin routes (they don't need tenant context)
    if (req.path.startsWith('/api/super-admin') || req.path.startsWith('/super-admin')) {
      return next();
    }

    // 1. Get tenant ID from header
    let tenantId: number | undefined;
    const tenantIdHeader = req.headers['x-tenant-id'];
    
    if (tenantIdHeader) {
      const parsed = parseInt(tenantIdHeader as string, 10);
      if (!isNaN(parsed)) {
        tenantId = parsed;
      }
    }

    // 2. Fallback: Extract from JWT token in Authorization header
    if (!tenantId && req.headers.authorization?.startsWith('Bearer ')) {
      try {
        const token = req.headers.authorization.substring(7);
        const decoded = jwt.decode(token) as any;
        if (decoded) {
          if (decoded.role === 'SUPER_ADMIN' || decoded.isSuperAdmin) {
            req.isSuperAdmin = true;
            req.prisma = getPublicPrisma();
            return next();
          }
          if (decoded.tenantId) {
            tenantId = Number(decoded.tenantId);
          }
        }
      } catch (err) {
        // Continue to check if tenantId is found
      }
    }
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'X-Tenant-ID header is required',
      });
    }

    // Validate tenant exists and is active
    const publicPrisma = getPublicPrisma();
    const tenant = await publicPrisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: 'Tenant not found',
      });
    }

    if (!tenant.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Tenant is deactivated',
      });
    }

    // Attach tenant info and prisma client to request
    req.tenantId = tenant.id;
    req.tenantSchema = tenant.schemaName;
    req.prisma = getTenantPrisma(tenant.schemaName);

    next();
  } catch (error) {
    console.error('Tenant middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
}

/**
 * Middleware for routes that optionally accept tenant context
 * (e.g., public routes that can work with or without tenant)
 */
export async function optionalTenantMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const tenantIdHeader = req.headers['x-tenant-id'];
    
    if (tenantIdHeader) {
      const tenantId = parseInt(tenantIdHeader as string, 10);
      
      if (!isNaN(tenantId)) {
        const publicPrisma = getPublicPrisma();
        const tenant = await publicPrisma.tenant.findUnique({
          where: { id: tenantId, isActive: true },
        });

        if (tenant) {
          req.tenantId = tenant.id;
          req.tenantSchema = tenant.schemaName;
          req.prisma = getTenantPrisma(tenant.schemaName);
        }
      }
    }

    next();
  } catch (error) {
    next();
  }
}
