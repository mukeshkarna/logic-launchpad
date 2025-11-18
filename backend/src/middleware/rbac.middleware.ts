import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

// Check if user has required role
export const requireRole = (...allowedRoles: UserRole[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // Fetch fresh user data with role
      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { id: true, role: true, status: true }
      });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      // Check if user is suspended or banned
      if (user.status !== 'ACTIVE') {
        return res.status(403).json({ error: 'Account is suspended or banned' });
      }

      // Check if user has required role
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: allowedRoles,
          current: user.role
        });
      }

      // Attach role to request for further use
      req.user.role = user.role;
      next();
    } catch (error) {
      console.error('RBAC error:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

// Specific role checkers
export const requireAdmin = requireRole(UserRole.SUPER_ADMIN, UserRole.MODERATOR);
export const requireSuperAdmin = requireRole(UserRole.SUPER_ADMIN);

// Log admin actions
export const logAdminAction = async (
  adminId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  details?: string,
  ipAddress?: string
) => {
  try {
    await prisma.adminAction.create({
      data: {
        adminId,
        action,
        targetType,
        targetId,
        details,
        ipAddress,
      }
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
};

// Middleware to log all admin actions
export const auditLog = (action: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = function (data: any) {
      // Only log if the request was successful
      if (res.statusCode < 400 && req.user) {
        const targetType = req.params.type || req.body.targetType;
        const targetId = req.params.id || req.body.id || req.body.targetId;
        const ipAddress = req.ip || req.socket.remoteAddress;

        logAdminAction(
          req.user.id,
          action,
          targetType,
          targetId,
          JSON.stringify({ params: req.params, body: req.body }),
          ipAddress
        );
      }

      return originalJson(data);
    };

    next();
  };
};
