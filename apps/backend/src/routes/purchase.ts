import { Router, Request, Response } from 'express';
import { PurchaseService } from '../services/PurchaseService';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { purchaseIntentSchema, bankTransferSchema } from '@perper/shared';
import config from '../config';
import Stripe from 'stripe';
import logger from '../utils/logger';

const router = Router();
const purchaseService = new PurchaseService();
const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2024-11-20.acacia'
});

/**
 * POST /api/purchase/intent
 * Create payment intent (Stripe or PayPal)
 */
router.post('/intent', authenticate, validateBody(purchaseIntentSchema), async (req, res, next) => {
  try {
    const { token, amount, method } = req.body;
    const userId = req.user!.userId;

    if (method === 'paypal') {
      // PayPal flow
      const result = await purchaseService.createPayPalOrder(userId, token, amount);
      res.json({
        provider: 'paypal',
        orderId: result.orderId,
        purchaseId: result.purchaseId,
        approvalUrl: result.approvalUrl
      });
    } else {
      // Stripe flow (card, apple_pay, google_pay, sepa_debit, sofort, ideal, giropay)
      const result = await purchaseService.createStripeIntent(userId, token, amount, method);
      res.json({
        provider: 'stripe',
        clientSecret: result.clientSecret,
        purchaseId: result.purchaseId,
        totalAmount: result.totalAmount,
        publishableKey: config.stripe.publishableKey
      });
    }
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/purchase/paypal/capture
 * Capture PayPal order after user approval
 */
router.post('/paypal/capture', authenticate, async (req, res, next) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'Order ID required' });
    }

    const result = await purchaseService.capturePayPalOrder(orderId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/purchase/bank-transfer
 * Create bank transfer purchase with instructions
 */
router.post('/bank-transfer', authenticate, validateBody(bankTransferSchema), async (req, res, next) => {
  try {
    const { token, amount } = req.body;
    const userId = req.user!.userId;

    const result = await purchaseService.createBankTransferPurchase(userId, token, amount);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/purchase/:id
 * Get purchase details
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const purchase = await purchaseService.getPurchase(req.params.id, req.user!.userId);
    res.json({ purchase });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/webhooks/stripe
 * Stripe webhook handler
 */
router.post('/webhooks/stripe', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  if (!sig) {
    logger.warn('Missing Stripe signature');
    return res.status(400).send('Missing signature');
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      config.stripe.webhookSecret
    );
  } catch (err: any) {
    logger.error(`Stripe webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await purchaseService.handleStripeWebhook(event);
    res.json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * POST /api/webhooks/paypal
 * PayPal webhook handler
 */
router.post('/webhooks/paypal', async (req: Request, res: Response) => {
  // PayPal webhook verification would go here
  // For now, we're using the capture endpoint instead
  logger.info('PayPal webhook received:', req.body);
  res.json({ received: true });
});

export default router;
