import { Router } from 'express';
import { WalletService } from '../services/WalletService';
import { TransactionRepository, PriceHistoryRepository } from '../db/repositories';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { sendTokensSchema } from '@perper/shared';
import { nanoid } from 'nanoid';

const router = Router();
const walletService = new WalletService();
const txRepo = new TransactionRepository();
const priceRepo = new PriceHistoryRepository();

/**
 * GET /api/wallets
 * Get user's wallets with balances
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const wallets = await walletService.getUserWallets(req.user!.userId);

    // Get current prices
    const prices = await priceRepo.getAllCurrentPrices();

    // Calculate fiat values
    const walletsWithFiat = wallets.map(wallet => ({
      ...wallet,
      fiatValue: wallet.balance * (prices[wallet.token] || 0)
    }));

    res.json({ wallets: walletsWithFiat });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/wallets/send
 * Send tokens to another user
 */
router.post('/send', authenticate, validateBody(sendTokensSchema), async (req, res, next) => {
  try {
    const result = await walletService.sendTokens({
      fromUserId: req.user!.userId,
      to: req.body.to,
      token: req.body.token,
      amount: req.body.amount,
      note: req.body.note,
      idempotencyKey: req.body.idempotencyKey
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/transactions
 * Get transaction history
 */
router.get('/transactions', authenticate, async (req, res, next) => {
  try {
    const filters: any = {
      userId: req.user!.userId,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      size: req.query.size ? parseInt(req.query.size as string) : 20
    };

    if (req.query.type) filters.type = req.query.type;
    if (req.query.token) filters.token = req.query.token;
    if (req.query.status) filters.status = req.query.status;
    if (req.query.dateFrom) filters.dateFrom = req.query.dateFrom;
    if (req.query.dateTo) filters.dateTo = req.query.dateTo;

    const result = await txRepo.findAll(filters);

    res.json({
      transactions: result.transactions,
      total: result.total,
      page: filters.page,
      size: filters.size,
      totalPages: Math.ceil(result.total / filters.size)
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/transactions/:id
 * Get transaction by ID
 */
router.get('/transactions/:id', authenticate, async (req, res, next) => {
  try {
    const transaction = await txRepo.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Check if user is involved in this transaction
    if (
      transaction.fromUserId !== req.user!.userId &&
      transaction.toUserId !== req.user!.userId
    ) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ transaction });
  } catch (error) {
    next(error);
  }
});

export default router;
