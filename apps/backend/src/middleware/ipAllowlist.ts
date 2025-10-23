import { Request, Response, NextFunction } from 'express';
import config from '../config';
import logger from '../utils/logger';

/**
 * Check if IP is in admin allowlist
 */
export function ipAllowlist(req: Request, res: Response, next: NextFunction): void {
  const clientIp = req.ip || req.socket.remoteAddress || '';

  // Extract IP from potential proxy headers
  const forwardedFor = req.headers['x-forwarded-for'];
  const ip = forwardedFor
    ? (typeof forwardedFor === 'string' ? forwardedFor.split(',')[0] : forwardedFor[0])
    : clientIp;

  const normalizedIp = ip.trim().replace(/^::ffff:/, '');

  // Check against allowlist
  const isAllowed = config.admin.ipAllowlist.some(allowedIp => {
    return normalizedIp === allowedIp || allowedIp === '*';
  });

  if (!isAllowed) {
    logger.warn(`Admin access denied from IP: ${normalizedIp}`);
    res.status(403).json({ error: 'Access denied from your IP address' });
    return;
  }

  next();
}
