import { TokenSymbol } from './tokens';

/**
 * User statuses
 */
export enum UserStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  SUSPENDED = 'suspended'
}

/**
 * User roles
 */
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

/**
 * Transaction types
 */
export enum TransactionType {
  SEND = 'send',
  RECEIVE = 'receive',
  PURCHASE = 'purchase',
  ADJUSTMENT = 'adjustment',
  MINT = 'mint'
}

/**
 * Transaction statuses
 */
export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Purchase statuses (aligned with Stripe)
 */
export enum PurchaseStatus {
  REQUIRES_PAYMENT = 'requires_payment',
  PROCESSING = 'processing',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELED = 'canceled'
}

/**
 * Payment providers
 */
export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  BANK = 'bank'
}

/**
 * Payment methods (Stripe)
 */
export enum PaymentMethod {
  CARD = 'card',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
  SEPA = 'sepa_debit',
  SOFORT = 'sofort',
  IDEAL = 'ideal',
  GIROPAY = 'giropay'
}

/**
 * Fiat currencies
 */
export enum Currency {
  EUR = 'EUR',
  USD = 'USD'
}

/**
 * Supply event types
 */
export enum SupplyEventType {
  MINT = 'mint',
  BURN = 'burn'
}

/**
 * User entity
 */
export interface User {
  _key: string;
  email: string;
  username: string;
  fullName: string;
  passwordHash: string;
  status: UserStatus;
  roles: UserRole[];
  emailVerifiedAt?: string;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: string;
  notificationPrefs?: {
    emailTransactions: boolean;
    emailMarketing: boolean;
  };
  twoFASecret?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Wallet entity
 */
export interface Wallet {
  _key: string;
  userId: string;
  token: TokenSymbol;
  address: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Transaction entity
 */
export interface Transaction {
  _key: string;
  type: TransactionType;
  token: TokenSymbol;
  amount: number;
  fromUserId?: string;
  toUserId?: string;
  fromAddress?: string;
  toAddress?: string;
  status: TransactionStatus;
  note?: string;
  externalRef?: string;
  idempotencyKey?: string;
  createdAt: string;
  settledAt?: string;
}

/**
 * Purchase entity
 */
export interface Purchase {
  _key: string;
  userId: string;
  token: TokenSymbol;
  amountTokens: number;
  amountFiat: number;
  currency: Currency;
  provider: PaymentProvider;
  providerIntentId?: string;
  providerOrderId?: string;
  status: PurchaseStatus;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  settledAt?: string;
}

/**
 * Price history entity
 */
export interface PriceHistory {
  _key: string;
  token: TokenSymbol;
  price: number;
  currency: Currency;
  effectiveAt: string;
  createdAt: string;
}

/**
 * Supply event entity
 */
export interface SupplyEvent {
  _key: string;
  token: TokenSymbol;
  type: SupplyEventType;
  amount: number;
  reason: string;
  adminId: string;
  createdAt: string;
}

/**
 * Audit log entity
 */
export interface AuditLog {
  _key: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, any>;
  ip?: string;
  createdAt: string;
}
