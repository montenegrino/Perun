import { Router } from 'express';
import { AuthService } from '../services/AuthService';
import { validateBody } from '../middleware/validation';
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '@perper/shared';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { authenticate } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();
const authService = new AuthService();

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later'
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  authLimiter,
  validateBody(registerSchema),
  async (req, res, next) => {
    try {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/verify-email
 * Verify email address
 */
router.post(
  '/verify-email',
  generalLimiter,
  validateBody(verifyEmailSchema),
  async (req, res, next) => {
    try {
      const result = await authService.verifyEmail(req.body.token);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  authLimiter,
  validateBody(loginSchema),
  async (req, res, next) => {
    try {
      const { accessToken, refreshToken, user } = await authService.login(
        req.body.emailOrUsername,
        req.body.password
      );

      // Set httpOnly cookies
      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      res.json({ user, message: 'Login successful' });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/refresh
 * Refresh access token
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    const payload = verifyRefreshToken(refreshToken);

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    // Set new cookies
    res.cookie('accessToken', newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({ message: 'Token refreshed successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/logout
 * Logout user
 */
router.post('/logout', authenticate, (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
});

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post(
  '/forgot-password',
  authLimiter,
  validateBody(forgotPasswordSchema),
  async (req, res, next) => {
    try {
      const result = await authService.forgotPassword(req.body.email);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/reset-password
 * Reset password
 */
router.post(
  '/reset-password',
  authLimiter,
  validateBody(resetPasswordSchema),
  async (req, res, next) => {
    try {
      const result = await authService.resetPassword(req.body.token, req.body.password);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

export default router;
