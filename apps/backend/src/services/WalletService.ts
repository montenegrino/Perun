import { WalletRepository, UserRepository, TransactionRepository } from '../db/repositories';
import { TokenSymbol, ALL_TOKENS, TransactionType, TransactionStatus } from '@perper/shared';
import { generateWalletAddress } from '../utils/addressGenerator';
import { getDb } from '../db/connection';
import { COLLECTIONS } from '../db/collections';
import { AppError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import { sendTransactionEmail } from '../utils/email';

export class WalletService {
  private walletRepo: WalletRepository;
  private userRepo: UserRepository;
  private txRepo: TransactionRepository;

  constructor() {
    this.walletRepo = new WalletRepository();
    this.userRepo = new UserRepository();
    this.txRepo = new TransactionRepository();
  }

  /**
   * Create wallets for all tokens when user is approved
   */
  async createWalletsForUser(userId: string): Promise<void> {
    logger.info(`Creating wallets for user: ${userId}`);

    for (const token of ALL_TOKENS) {
      // Check if wallet already exists
      const existing = await this.walletRepo.findByUserIdAndToken(userId, token);
      if (existing) {
        continue;
      }

      // Generate unique address
      const address = generateWalletAddress(userId, token);

      // Create wallet
      await this.walletRepo.create({
        userId,
        token,
        address,
        balance: 0
      });

      logger.info(`Wallet created: ${token} - ${address} for user ${userId}`);
    }
  }

  /**
   * Get user's wallets with balances
   */
  async getUserWallets(userId: string): Promise<Array<{
    token: TokenSymbol;
    address: string;
    balance: number;
  }>> {
    const wallets = await this.walletRepo.findByUserId(userId);

    return wallets.map(wallet => ({
      token: wallet.token,
      address: wallet.address,
      balance: wallet.balance
    }));
  }

  /**
   * Send tokens from one user to another (atomic operation)
   */
  async sendTokens(params: {
    fromUserId: string;
    to: string; // username, email, or address
    token: TokenSymbol;
    amount: number;
    note?: string;
    idempotencyKey: string;
  }): Promise<{ transactionId: string; message: string }> {
    // Check for existing transaction with same idempotency key
    const existing = await this.txRepo.findByIdempotencyKey(params.idempotencyKey);
    if (existing) {
      if (existing.status === TransactionStatus.COMPLETED) {
        return {
          transactionId: existing._key,
          message: 'Transaction already completed'
        };
      }
      throw new AppError(409, 'Transaction is being processed');
    }

    // Validate amount
    if (params.amount <= 0) {
      throw new AppError(400, 'Amount must be positive');
    }

    // Find sender wallet
    const senderWallet = await this.walletRepo.findByUserIdAndToken(params.fromUserId, params.token);
    if (!senderWallet) {
      throw new AppError(404, 'Sender wallet not found');
    }

    // Check sufficient balance
    if (senderWallet.balance < params.amount) {
      throw new AppError(400, 'Insufficient balance');
    }

    // Find recipient (by username, email, or address)
    let recipientWallet;
    let recipientUser;

    // Try to find by address first
    recipientWallet = await this.walletRepo.findByAddress(params.to);

    if (!recipientWallet) {
      // Try to find user by username or email
      recipientUser = await this.userRepo.findByEmailOrUsername(params.to);

      if (!recipientUser) {
        throw new AppError(404, 'Recipient not found');
      }

      // Get recipient wallet
      recipientWallet = await this.walletRepo.findByUserIdAndToken(recipientUser._key, params.token);

      if (!recipientWallet) {
        throw new AppError(404, `Recipient doesn't have a ${params.token} wallet`);
      }
    } else {
      // Get recipient user from wallet
      recipientUser = await this.userRepo.findById(recipientWallet.userId);
    }

    // Can't send to self
    if (senderWallet.userId === recipientWallet.userId) {
      throw new AppError(400, 'Cannot send tokens to yourself');
    }

    // Perform atomic transaction using ArangoDB transaction
    const db = getDb();
    const result = await db.executeTransaction(
      {
        write: [COLLECTIONS.WALLETS, COLLECTIONS.TRANSACTIONS]
      },
      async (step) => {
        // Create pending transactions
        const sendTx = await step(() =>
          db.collection(COLLECTIONS.TRANSACTIONS).save({
            type: TransactionType.SEND,
            token: params.token,
            amount: params.amount,
            fromUserId: params.fromUserId,
            toUserId: recipientWallet!.userId,
            fromAddress: senderWallet!.address,
            toAddress: recipientWallet!.address,
            status: TransactionStatus.PENDING,
            note: params.note,
            idempotencyKey: params.idempotencyKey,
            createdAt: new Date().toISOString()
          })
        );

        // Update sender balance
        await step(() =>
          db.collection(COLLECTIONS.WALLETS).update(senderWallet!._key, {
            balance: senderWallet!.balance - params.amount,
            updatedAt: new Date().toISOString()
          })
        );

        // Update recipient balance
        await step(() =>
          db.collection(COLLECTIONS.WALLETS).update(recipientWallet!._key, {
            balance: recipientWallet!.balance + params.amount,
            updatedAt: new Date().toISOString()
          })
        );

        // Mark transaction as completed
        await step(() =>
          db.collection(COLLECTIONS.TRANSACTIONS).update(sendTx._key, {
            status: TransactionStatus.COMPLETED,
            settledAt: new Date().toISOString()
          })
        );

        return sendTx._key;
      }
    );

    logger.info(`Token transfer completed: ${result} - ${params.amount} ${params.token} from ${senderWallet.address} to ${recipientWallet.address}`);

    // Send notification emails (async, don't wait)
    const senderUser = await this.userRepo.findById(params.fromUserId);
    if (senderUser && recipientUser && senderUser.notificationPrefs?.emailTransactions) {
      sendTransactionEmail(senderUser.email, senderUser.username, {
        type: 'sent',
        token: params.token,
        amount: params.amount,
        toRecipient: recipientWallet.address,
        transactionId: result
      }).catch(err => logger.error('Failed to send email:', err));
    }

    if (recipientUser?.notificationPrefs?.emailTransactions) {
      sendTransactionEmail(recipientUser.email, recipientUser.username, {
        type: 'received',
        token: params.token,
        amount: params.amount,
        from: senderWallet.address,
        transactionId: result
      }).catch(err => logger.error('Failed to send email:', err));
    }

    return {
      transactionId: result,
      message: 'Transfer successful'
    };
  }

  /**
   * Get transaction history for user
   */
  async getTransactionHistory(userId: string, limit: number = 10) {
    return this.txRepo.findByUserId(userId, limit);
  }
}
