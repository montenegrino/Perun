import { z } from 'zod';
import { TokenSymbol, Currency, PaymentProvider, PaymentMethod } from './types';

/**
 * Auth validation schemas
 */
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must not exceed 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens'),
  fullName: z.string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must not exceed 100 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character'),
  acceptTos: z.boolean().refine(val => val === true, 'You must accept the Terms of Service')
});

export const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required')
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required')
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address')
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character')
});

/**
 * Wallet validation schemas
 */
export const sendTokensSchema = z.object({
  token: z.nativeEnum(TokenSymbol),
  to: z.string().min(1, 'Recipient is required'),
  amount: z.number()
    .positive('Amount must be positive')
    .finite('Amount must be finite'),
  note: z.string().max(500, 'Note must not exceed 500 characters').optional(),
  idempotencyKey: z.string().min(1, 'Idempotency key is required')
});

/**
 * Purchase validation schemas
 */
export const purchaseIntentSchema = z.object({
  token: z.nativeEnum(TokenSymbol),
  amount: z.number()
    .positive('Amount must be positive')
    .finite('Amount must be finite'),
  method: z.enum([
    PaymentMethod.CARD,
    PaymentMethod.APPLE_PAY,
    PaymentMethod.GOOGLE_PAY,
    PaymentMethod.SEPA,
    PaymentMethod.SOFORT,
    PaymentMethod.IDEAL,
    PaymentMethod.GIROPAY,
    'paypal',
    'bank'
  ])
});

export const bankTransferSchema = z.object({
  token: z.nativeEnum(TokenSymbol),
  amount: z.number()
    .positive('Amount must be positive')
    .finite('Amount must be finite')
});

/**
 * Admin validation schemas
 */
export const adjustBalanceSchema = z.object({
  token: z.nativeEnum(TokenSymbol),
  delta: z.number().finite('Delta must be finite'),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason must not exceed 500 characters'),
  idempotencyKey: z.string().min(1, 'Idempotency key is required')
});

export const mintTokensSchema = z.object({
  token: z.nativeEnum(TokenSymbol),
  amount: z.number()
    .positive('Amount must be positive')
    .finite('Amount must be finite'),
  reason: z.string().min(1, 'Reason is required').max(500, 'Reason must not exceed 500 characters')
});

export const setPriceSchema = z.object({
  token: z.nativeEnum(TokenSymbol),
  price: z.number()
    .positive('Price must be positive')
    .finite('Price must be finite'),
  effectiveAt: z.string().datetime().optional()
});

export const userFiltersSchema = z.object({
  status: z.enum(['pending', 'approved', 'suspended']).optional(),
  regDateFrom: z.string().datetime().optional(),
  regDateTo: z.string().datetime().optional(),
  balanceMin: z.number().optional(),
  balanceMax: z.number().optional(),
  q: z.string().optional(),
  page: z.number().int().positive().optional(),
  size: z.number().int().positive().max(100).optional()
});

export const transactionFiltersSchema = z.object({
  type: z.enum(['send', 'receive', 'purchase', 'adjustment', 'mint']).optional(),
  token: z.nativeEnum(TokenSymbol).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  amountMin: z.number().optional(),
  amountMax: z.number().optional(),
  userId: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(['pending', 'completed', 'failed']).optional(),
  page: z.number().int().positive().optional(),
  size: z.number().int().positive().max(100).optional()
});

/**
 * Type exports from schemas
 */
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type SendTokensInput = z.infer<typeof sendTokensSchema>;
export type PurchaseIntentInput = z.infer<typeof purchaseIntentSchema>;
export type BankTransferInput = z.infer<typeof bankTransferSchema>;
export type AdjustBalanceInput = z.infer<typeof adjustBalanceSchema>;
export type MintTokensInput = z.infer<typeof mintTokensSchema>;
export type SetPriceInput = z.infer<typeof setPriceSchema>;
export type UserFiltersInput = z.infer<typeof userFiltersSchema>;
export type TransactionFiltersInput = z.infer<typeof transactionFiltersSchema>;
