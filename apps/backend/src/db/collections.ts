/**
 * Collection names used throughout the application
 */
export const COLLECTIONS = {
  USERS: 'users',
  WALLETS: 'wallets',
  TRANSACTIONS: 'transactions',
  PURCHASES: 'purchases',
  PRICE_HISTORY: 'priceHistory',
  SUPPLY_EVENTS: 'supplyEvents',
  AUDIT_LOGS: 'auditLogs'
} as const;

/**
 * Index definitions for collections
 */
export const INDEXES = {
  users: [
    { type: 'persistent' as const, fields: ['email'], unique: true },
    { type: 'persistent' as const, fields: ['username'], unique: true },
    { type: 'persistent' as const, fields: ['status'] },
    { type: 'persistent' as const, fields: ['emailVerificationToken'], sparse: true },
    { type: 'persistent' as const, fields: ['passwordResetToken'], sparse: true },
    { type: 'persistent' as const, fields: ['createdAt'] }
  ],
  wallets: [
    { type: 'persistent' as const, fields: ['userId', 'token'], unique: true },
    { type: 'persistent' as const, fields: ['token', 'address'], unique: true },
    { type: 'persistent' as const, fields: ['address'], unique: true },
    { type: 'persistent' as const, fields: ['userId'] }
  ],
  transactions: [
    { type: 'persistent' as const, fields: ['idempotencyKey'], unique: true, sparse: true },
    { type: 'persistent' as const, fields: ['createdAt'] },
    { type: 'persistent' as const, fields: ['type'] },
    { type: 'persistent' as const, fields: ['token'] },
    { type: 'persistent' as const, fields: ['fromUserId'] },
    { type: 'persistent' as const, fields: ['toUserId'] },
    { type: 'persistent' as const, fields: ['status'] },
    { type: 'persistent' as const, fields: ['fromAddress'] },
    { type: 'persistent' as const, fields: ['toAddress'] }
  ],
  purchases: [
    { type: 'persistent' as const, fields: ['userId'] },
    { type: 'persistent' as const, fields: ['providerIntentId'], unique: true, sparse: true },
    { type: 'persistent' as const, fields: ['providerOrderId'], unique: true, sparse: true },
    { type: 'persistent' as const, fields: ['status'] },
    { type: 'persistent' as const, fields: ['createdAt'] }
  ],
  priceHistory: [
    { type: 'persistent' as const, fields: ['token', 'effectiveAt'] },
    { type: 'persistent' as const, fields: ['token', 'currency', 'effectiveAt'] },
    { type: 'persistent' as const, fields: ['effectiveAt'] }
  ],
  supplyEvents: [
    { type: 'persistent' as const, fields: ['token'] },
    { type: 'persistent' as const, fields: ['type'] },
    { type: 'persistent' as const, fields: ['adminId'] },
    { type: 'persistent' as const, fields: ['createdAt'] }
  ],
  auditLogs: [
    { type: 'persistent' as const, fields: ['actorId'] },
    { type: 'persistent' as const, fields: ['action'] },
    { type: 'persistent' as const, fields: ['targetType'] },
    { type: 'persistent' as const, fields: ['createdAt'] }
  ]
};
