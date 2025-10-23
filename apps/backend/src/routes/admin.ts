import { Router } from 'express';
import { AdminService } from '../services/AdminService';
import { PurchaseService } from '../services/PurchaseService';
import { UserRepository, TransactionRepository, AuditLogRepository, PurchaseRepository } from '../db/repositories';
import { authenticate, requireAdmin } from '../middleware/auth';
import { ipAllowlist } from '../middleware/ipAllowlist';
import { validateBody } from '../middleware/validation';
import { adjustBalanceSchema, mintTokensSchema, setPriceSchema } from '@perper/shared';

const router = Router();
const adminService = new AdminService();
const purchaseService = new PurchaseService();
const userRepo = new UserRepository();
const txRepo = new TransactionRepository();
const auditRepo = new AuditLogRepository();
const purchaseRepo = new PurchaseRepository();

// Apply authentication and admin role to all routes
router.use(authenticate);
router.use(requireAdmin);
router.use(ipAllowlist);

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics
 */
router.get('/dashboard', async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/users
 * Get users list with filters
 */
router.get('/users', async (req, res, next) => {
  try {
    const filters: any = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      size: req.query.size ? parseInt(req.query.size as string) : 20
    };

    if (req.query.status) filters.status = req.query.status;
    if (req.query.regDateFrom) filters.regDateFrom = req.query.regDateFrom;
    if (req.query.regDateTo) filters.regDateTo = req.query.regDateTo;
    if (req.query.q) filters.q = req.query.q;

    const result = await userRepo.findAll(filters);

    res.json({
      users: result.users.map(u => ({
        id: u._key,
        email: u.email,
        username: u.username,
        fullName: u.fullName,
        status: u.status,
        emailVerified: !!u.emailVerifiedAt,
        createdAt: u.createdAt
      })),
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
 * POST /api/admin/users/:id/approve
 * Approve user
 */
router.post('/users/:id/approve', async (req, res, next) => {
  try {
    const result = await adminService.approveUser(req.user!.userId, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/users/:id/reject
 * Reject user
 */
router.post('/users/:id/reject', async (req, res, next) => {
  try {
    const result = await adminService.rejectUser(req.user!.userId, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/users/:id/suspend
 * Suspend user
 */
router.post('/users/:id/suspend', async (req, res, next) => {
  try {
    const result = await adminService.suspendUser(req.user!.userId, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/users/:id/activate
 * Activate user
 */
router.post('/users/:id/activate', async (req, res, next) => {
  try {
    const result = await adminService.activateUser(req.user!.userId, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/users/:id/adjust-balance
 * Adjust user balance
 */
router.post('/users/:id/adjust-balance', validateBody(adjustBalanceSchema), async (req, res, next) => {
  try {
    const result = await adminService.adjustBalance(
      req.user!.userId,
      req.params.id,
      req.body.token,
      req.body.delta,
      req.body.reason,
      req.body.idempotencyKey
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/transactions
 * Get all transactions
 */
router.get('/transactions', async (req, res, next) => {
  try {
    const filters: any = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      size: req.query.size ? parseInt(req.query.size as string) : 50
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
 * POST /api/admin/tokens/mint
 * Mint new tokens
 */
router.post('/tokens/mint', validateBody(mintTokensSchema), async (req, res, next) => {
  try {
    const result = await adminService.mintTokens(
      req.user!.userId,
      req.body.token,
      req.body.amount,
      req.body.reason
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/tokens/price
 * Set token price
 */
router.post('/tokens/price', validateBody(setPriceSchema), async (req, res, next) => {
  try {
    const result = await adminService.setTokenPrice(
      req.user!.userId,
      req.body.token,
      req.body.price,
      req.body.currency,
      req.body.effectiveAt
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/admin/audit
 * Get audit logs
 */
router.get('/audit', async (req, res, next) => {
  try {
    const filters: any = {
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      size: req.query.size ? parseInt(req.query.size as string) : 50
    };

    if (req.query.actorId) filters.actorId = req.query.actorId;
    if (req.query.action) filters.action = req.query.action;
    if (req.query.targetType) filters.targetType = req.query.targetType;
    if (req.query.dateFrom) filters.dateFrom = req.query.dateFrom;
    if (req.query.dateTo) filters.dateTo = req.query.dateTo;

    const result = await auditRepo.findAll(filters);

    res.json({
      logs: result.logs,
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
 * GET /api/admin/purchases
 * Get pending purchases (bank transfers awaiting confirmation)
 */
router.get('/purchases', async (req, res, next) => {
  try {
    // This would require adding a method to PurchaseRepository
    // For now, return a placeholder
    res.json({ purchases: [] });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/admin/purchases/:id/confirm
 * Confirm bank transfer
 */
router.post('/purchases/:id/confirm', async (req, res, next) => {
  try {
    const result = await purchaseService.confirmBankTransfer(
      req.params.id,
      req.user!.userId
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
