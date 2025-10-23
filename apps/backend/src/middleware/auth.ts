import { Request, Response, NextFunction } from 'express';
import { UserRole } from '@perper/shared';
import { verifyAccessToken, JwtPayload } from '../utils/jwt';
import logger from '../utils/logger';

/**
 * Extend Express Request to include user info
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Authenticate user from JWT token in cookie
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    logger.warn('Authentication failed:', error);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Require specific roles
 */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const hasRole = roles.some(role => req.user!.roles.includes(role));

    if (!hasRole) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }

    next();
  };
}

/**
 * Require admin role
 */
export const requireAdmin = requireRole(UserRole.ADMIN);

/**
 * Optional authentication (sets req.user if token is present)
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = req.cookies?.accessToken;

    if (token) {
      const payload = verifyAccessToken(token);
      req.user = payload;
    }

    next();
  } catch (error) {
    // Continue without user if token is invalid
    next();
  }
}
