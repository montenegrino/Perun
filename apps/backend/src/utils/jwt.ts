import jwt from 'jsonwebtoken';
import config from '../config';
import { UserRole } from '@perper/shared';

export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
  roles: UserRole[];
}

/**
 * Generate access token
 */
export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn
  });
}

/**
 * Verify access token
 */
export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.secret) as JwtPayload;
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
}

/**
 * Generate email verification token
 */
export function generateEmailVerificationToken(userId: string, email: string): string {
  return jwt.sign({ userId, email, purpose: 'email_verification' }, config.jwt.secret, {
    expiresIn: '24h'
  });
}

/**
 * Verify email verification token
 */
export function verifyEmailVerificationToken(token: string): { userId: string; email: string } {
  const payload = jwt.verify(token, config.jwt.secret) as any;
  if (payload.purpose !== 'email_verification') {
    throw new Error('Invalid token purpose');
  }
  return { userId: payload.userId, email: payload.email };
}

/**
 * Generate password reset token
 */
export function generatePasswordResetToken(userId: string, email: string): string {
  return jwt.sign({ userId, email, purpose: 'password_reset' }, config.jwt.secret, {
    expiresIn: '1h'
  });
}

/**
 * Verify password reset token
 */
export function verifyPasswordResetToken(token: string): { userId: string; email: string } {
  const payload = jwt.verify(token, config.jwt.secret) as any;
  if (payload.purpose !== 'password_reset') {
    throw new Error('Invalid token purpose');
  }
  return { userId: payload.userId, email: payload.email };
}
