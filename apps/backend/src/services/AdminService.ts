import {
  UserRepository,
  WalletRepository,
  TransactionRepository,
  SupplyEventRepository,
  PriceHistoryRepository,
  AuditLogRepository
} from '../db/repositories';
import { UserStatus, TokenSymbol, TransactionType, TransactionStatus, SupplyEventType, Currency } from '@perper/shared';
import { AppError } from '../middleware/errorHandler';
import { WalletService } from './WalletService';
import { sendApprovalEmail } from '../utils/email';
import { getDb } from '../db/connection';
import { COLLECTIONS } from '../db/collections';
import logger from '../utils/logger';

export class AdminService {
  private userRepo: UserRepository;
  private walletRepo: WalletRepository;
  private txRepo: TransactionRepository;
  private supplyRepo: SupplyEventRepository;
  private priceRepo: PriceHistoryRepository;
  private auditRepo: AuditLogRepository;
  private walletService: WalletService;

  constructor() {
    this.userRepo = new UserRepository();
    this.walletRepo = new WalletRepository();
    this.txRepo = new TransactionRepository();
    this.supplyRepo = new SupplyEventRepository();
    this.priceRepo = new PriceHistoryRepository();
    this.auditRepo = new AuditLogRepository();
    this.walletService = new WalletService();
  }

  /**
   * Approve user
   */
  async approveUser(adminId: string, userId: string): Promise<{ message: string }> {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (user.status !== UserStatus.PENDING) {
      throw new AppError(400, 'User is not pending approval');
    }

    // Update user status
    await this.userRepo.update(userId, {
      status: UserStatus.APPROVED
    });

    // Create wallets for all tokens
    await this.walletService.createWalletsForUser(userId);

    // Log audit
    await this.auditRepo.create({
      actorId: adminId,
      action: 'approve_user',
      targetType: 'user',
      targetId: userId
    });

    // Send approval email
    await sendApprovalEmail(user.email, user.username);

    logger.info(`User approved: ${user.username} (${userId}) by admin ${adminId}`);

    return { message: 'User approved successfully' };
  }

  /**
   * Reject user
   */
  async rejectUser(adminId: string, userId: string): Promise<{ message: string }> {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (user.status !== UserStatus.PENDING) {
      throw new AppError(400, 'User is not pending approval');
    }

    // Delete user
    await this.userRepo.delete(userId);

    // Log audit
    await this.auditRepo.create({
      actorId: adminId,
      action: 'reject_user',
      targetType: 'user',
      targetId: userId
    });

    logger.info(`User rejected: ${user.username} (${userId}) by admin ${adminId}`);

    return { message: 'User rejected and deleted' };
  }

  /**
   * Suspend user
   */
  async suspendUser(adminId: string, userId: string): Promise<{ message: string }> {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    await this.userRepo.update(userId, {
      status: UserStatus.SUSPENDED
    });

    // Log audit
    await this.auditRepo.create({
      actorId: adminId,
      action: 'suspend_user',
      targetType: 'user',
      targetId: userId
    });

    logger.info(`User suspended: ${user.username} (${userId}) by admin ${adminId}`);

    return { message: 'User suspended successfully' };
  }

  /**
   * Activate user
   */
  async activateUser(adminId: string, userId: string): Promise<{ message: string }> {
    const user = await this.userRepo.findById(userId);

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    await this.userRepo.update(userId, {
      status: UserStatus.APPROVED
    });

    // Log audit
    await this.auditRepo.create({
      actorId: adminId,
      action: 'activate_user',
      targetType: 'user',
      targetId: userId
    });

    logger.info(`User activated: ${user.username} (${userId}) by admin ${adminId}`);

    return { message: 'User activated successfully' };
  }

  /**
   * Adjust user balance
   */
  async adjustBalance(
    adminId: string,
    userId: string,
    token: TokenSymbol,
    delta: number,
    reason: string,
    idempotencyKey: string
  ): Promise<{ message: string }> {
    // Check for duplicate
    const existing = await this.txRepo.findByIdempotencyKey(idempotencyKey);
    if (existing) {
      throw new AppError(409, 'Adjustment already processed');
    }

    const wallet = await this.walletRepo.findByUserIdAndToken(userId, token);

    if (!wallet) {
      throw new AppError(404, 'Wallet not found');
    }

    const newBalance = wallet.balance + delta;

    if (newBalance < 0) {
      throw new AppError(400, 'Adjustment would result in negative balance');
    }

    // Perform atomic transaction
    const db = getDb();
    await db.executeTransaction(
      {
        write: [COLLECTIONS.WALLETS, COLLECTIONS.TRANSACTIONS]
      },
      async (step) => {
        // Create adjustment transaction
        await step(() =>
          db.collection(COLLECTIONS.TRANSACTIONS).save({
            type: TransactionType.ADJUSTMENT,
            token,
            amount: Math.abs(delta),
            toUserId: delta > 0 ? userId : undefined,
            fromUserId: delta < 0 ? userId : undefined,
            toAddress: wallet.address,
            status: TransactionStatus.COMPLETED,
            note: reason,
            idempotencyKey,
            createdAt: new Date().toISOString(),
            settledAt: new Date().toISOString()
          })
        );

        // Update wallet balance
        await step(() =>
          db.collection(COLLECTIONS.WALLETS).update(wallet._key, {
            balance: newBalance,
            updatedAt: new Date().toISOString()
          })
        );
      }
    );

    // Log audit
    await this.auditRepo.create({
      actorId: adminId,
      action: 'adjust_balance',
      targetType: 'wallet',
      targetId: wallet._key,
      metadata: { delta, reason, token }
    });

    logger.info(`Balance adjusted: ${delta} ${token} for user ${userId} by admin ${adminId}`);

    return { message: 'Balance adjusted successfully' };
  }

  /**
   * Mint new tokens
   */
  async mintTokens(
    adminId: string,
    token: TokenSymbol,
    amount: number,
    reason: string
  ): Promise<{ message: string }> {
    if (amount <= 0) {
      throw new AppError(400, 'Amount must be positive');
    }

    // Record supply event
    await this.supplyRepo.create({
      token,
      type: SupplyEventType.MINT,
      amount,
      reason,
      adminId
    });

    // Log audit
    await this.auditRepo.create({
      actorId: adminId,
      action: 'mint_tokens',
      targetType: 'supply',
      metadata: { token, amount, reason }
    });

    logger.info(`Tokens minted: ${amount} ${token} by admin ${adminId}`);

    return { message: `Successfully minted ${amount} ${token} tokens` };
  }

  /**
   * Set token price
   */
  async setTokenPrice(
    adminId: string,
    token: TokenSymbol,
    price: number,
    currency: Currency = Currency.EUR,
    effectiveAt?: string
  ): Promise<{ message: string }> {
    if (price <= 0) {
      throw new AppError(400, 'Price must be positive');
    }

    const effectiveDate = effectiveAt || new Date().toISOString();

    await this.priceRepo.create({
      token,
      price,
      currency,
      effectiveAt: effectiveDate
    });

    // Log audit
    await this.auditRepo.create({
      actorId: adminId,
      action: 'set_price',
      targetType: 'price',
      metadata: { token, price, currency, effectiveAt: effectiveDate }
    });

    logger.info(`Price set: ${token} = ${price} ${currency} by admin ${adminId}`);

    return { message: 'Price set successfully' };
  }

  /**
   * Get dashboard statistics
   */
  async getDashboardStats() {
    const [
      pendingUsers,
      approvedUsers,
      suspendedUsers,
      txToday,
      recentActivity
    ] = await Promise.all([
      this.userRepo.countByStatus(UserStatus.PENDING),
      this.userRepo.countByStatus(UserStatus.APPROVED),
      this.userRepo.countByStatus(UserStatus.SUSPENDED),
      this.txRepo.countToday(),
      this.auditRepo.getRecentActivity(10)
    ]);

    // Get token stats
    const tokenStats = await Promise.all(
      [TokenSymbol.PERP, TokenSymbol.PERN, TokenSymbol.ZET, TokenSymbol.ADRI].map(async (token) => {
        const [totalSupply, inCirculation, price] = await Promise.all([
          this.supplyRepo.getTotalSupply(token),
          this.walletRepo.getTotalBalanceByToken(token),
          this.priceRepo.getCurrentPrice(token)
        ]);

        return {
          token,
          totalSupply,
          inCirculation,
          available: totalSupply - inCirculation,
          currentPrice: price
        };
      })
    );

    return {
      users: {
        pending: pendingUsers,
        approved: approvedUsers,
        suspended: suspendedUsers,
        total: pendingUsers + approvedUsers + suspendedUsers
      },
      transactions: {
        today: txToday
      },
      tokens: tokenStats,
      recentActivity
    };
  }
}
