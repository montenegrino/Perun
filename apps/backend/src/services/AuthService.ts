import bcrypt from 'bcrypt';
import { UserRepository } from '../db/repositories';
import { UserStatus, UserRole } from '@perper/shared';
import { generateAccessToken, generateRefreshToken, generateEmailVerificationToken, generatePasswordResetToken } from '../utils/jwt';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';

export class AuthService {
  private userRepo: UserRepository;

  constructor() {
    this.userRepo = new UserRepository();
  }

  /**
   * Register a new user
   */
  async register(data: {
    email: string;
    username: string;
    fullName: string;
    password: string;
  }): Promise<{ message: string }> {
    // Check if email already exists
    const existingEmail = await this.userRepo.findByEmail(data.email);
    if (existingEmail) {
      throw new AppError(400, 'Email already registered');
    }

    // Check if username already exists
    const existingUsername = await this.userRepo.findByUsername(data.username);
    if (existingUsername) {
      throw new AppError(400, 'Username already taken');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Generate verification token
    const verificationToken = generateEmailVerificationToken('temp', data.email);

    // Create user
    const user = await this.userRepo.create({
      email: data.email,
      username: data.username,
      fullName: data.fullName,
      passwordHash,
      status: UserStatus.PENDING,
      roles: [UserRole.USER],
      emailVerificationToken: verificationToken,
      notificationPrefs: {
        emailTransactions: true,
        emailMarketing: false
      }
    });

    // Update verification token with actual user ID
    const actualVerificationToken = generateEmailVerificationToken(user._key, data.email);
    await this.userRepo.update(user._key, {
      emailVerificationToken: actualVerificationToken
    });

    // Send verification email
    await sendVerificationEmail(data.email, data.username, actualVerificationToken);

    logger.info(`User registered: ${user.username} (${user._key})`);

    return {
      message: 'Registration successful! Please check your email to verify your account. Your account also requires admin approval before you can log in.'
    };
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.userRepo.findByEmailVerificationToken(token);

    if (!user) {
      throw new AppError(400, 'Invalid or expired verification token');
    }

    await this.userRepo.update(user._key, {
      emailVerifiedAt: new Date().toISOString(),
      emailVerificationToken: undefined
    });

    logger.info(`Email verified for user: ${user.username} (${user._key})`);

    return { message: 'Email verified successfully! Your account is pending admin approval.' };
  }

  /**
   * Login user
   */
  async login(emailOrUsername: string, password: string): Promise<{
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      username: string;
      fullName: string;
      roles: UserRole[];
    };
  }> {
    // Find user
    const user = await this.userRepo.findByEmailOrUsername(emailOrUsername);

    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Check if email is verified
    if (!user.emailVerifiedAt) {
      throw new AppError(403, 'Please verify your email address first');
    }

    // Check account status
    if (user.status === UserStatus.PENDING) {
      throw new AppError(403, 'Your account is pending admin approval');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new AppError(403, 'Your account has been suspended');
    }

    // Generate tokens
    const payload = {
      userId: user._key,
      email: user.email,
      username: user.username,
      roles: user.roles
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    logger.info(`User logged in: ${user.username} (${user._key})`);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._key,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        roles: user.roles
      }
    };
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepo.findByEmail(email);

    // Always return success to prevent email enumeration
    if (!user) {
      return { message: 'If that email is registered, a password reset link has been sent' };
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken(user._key, user.email);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    await this.userRepo.update(user._key, {
      passwordResetToken: resetToken,
      passwordResetExpires: expiresAt
    });

    // Send reset email
    await sendPasswordResetEmail(user.email, user.username, resetToken);

    logger.info(`Password reset requested for user: ${user.username} (${user._key})`);

    return { message: 'If that email is registered, a password reset link has been sent' };
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepo.findByPasswordResetToken(token);

    if (!user) {
      throw new AppError(400, 'Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await this.userRepo.update(user._key, {
      passwordHash,
      passwordResetToken: undefined,
      passwordResetExpires: undefined
    });

    logger.info(`Password reset for user: ${user.username} (${user._key})`);

    return { message: 'Password reset successfully. You can now log in with your new password.' };
  }
}
