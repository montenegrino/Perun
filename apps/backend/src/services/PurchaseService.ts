import Stripe from 'stripe';
import {
  PurchaseRepository,
  PriceHistoryRepository,
  WalletRepository,
  TransactionRepository,
  UserRepository
} from '../db/repositories';
import {
  TokenSymbol,
  Currency,
  PaymentProvider,
  PurchaseStatus,
  TransactionType,
  TransactionStatus
} from '@perper/shared';
import { getDb } from '../db/connection';
import { COLLECTIONS } from '../db/collections';
import { AppError } from '../middleware/errorHandler';
import config from '../config';
import logger from '../utils/logger';
import { sendPurchaseReceiptEmail } from '../utils/email';
import { nanoid } from 'nanoid';

export class PurchaseService {
  private purchaseRepo: PurchaseRepository;
  private priceRepo: PriceHistoryRepository;
  private walletRepo: WalletRepository;
  private txRepo: TransactionRepository;
  private userRepo: UserRepository;
  private stripe: Stripe;

  constructor() {
    this.purchaseRepo = new PurchaseRepository();
    this.priceRepo = new PriceHistoryRepository();
    this.walletRepo = new WalletRepository();
    this.txRepo = new TransactionRepository();
    this.userRepo = new UserRepository();

    // Initialize Stripe
    this.stripe = new Stripe(config.stripe.secretKey, {
      apiVersion: '2024-11-20.acacia'
    });
  }

  /**
   * Create Stripe Payment Intent
   */
  async createStripeIntent(
    userId: string,
    token: TokenSymbol,
    amount: number,
    paymentMethod: string,
    currency: Currency = Currency.EUR
  ): Promise<{
    clientSecret: string;
    purchaseId: string;
    totalAmount: number;
  }> {
    // Get current price
    const price = await this.priceRepo.getCurrentPrice(token, currency);
    if (!price) {
      throw new AppError(404, `Price not found for ${token} in ${currency}`);
    }

    // Calculate total
    const totalAmount = amount * price;

    // Create purchase record
    const purchase = await this.purchaseRepo.create({
      userId,
      token,
      amountTokens: amount,
      amountFiat: totalAmount,
      currency,
      provider: PaymentProvider.STRIPE,
      status: PurchaseStatus.REQUIRES_PAYMENT,
      metadata: {
        paymentMethod
      }
    });

    // Create Stripe PaymentIntent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      payment_method_types: this.getStripePaymentMethodTypes(paymentMethod),
      metadata: {
        purchaseId: purchase._key,
        userId,
        token,
        tokenAmount: amount.toString()
      }
    });

    // Update purchase with intent ID
    await this.purchaseRepo.update(purchase._key, {
      providerIntentId: paymentIntent.id
    });

    logger.info(`Stripe PaymentIntent created: ${paymentIntent.id} for purchase ${purchase._key}`);

    return {
      clientSecret: paymentIntent.client_secret!,
      purchaseId: purchase._key,
      totalAmount
    };
  }

  /**
   * Get Stripe payment method types based on method
   */
  private getStripePaymentMethodTypes(method: string): string[] {
    const methodMap: Record<string, string[]> = {
      card: ['card'],
      apple_pay: ['card'], // Apple Pay uses card payment method
      google_pay: ['card'], // Google Pay uses card payment method
      sepa_debit: ['sepa_debit'],
      sofort: ['sofort'],
      ideal: ['ideal'],
      giropay: ['giropay']
    };

    return methodMap[method] || ['card'];
  }

  /**
   * Handle Stripe webhook event
   */
  async handleStripeWebhook(event: Stripe.Event): Promise<void> {
    logger.info(`Processing Stripe webhook: ${event.type}`);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await this.completeStripePurchase(paymentIntent);
    } else if (event.type === 'payment_intent.payment_failed') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await this.failPurchase(paymentIntent.metadata.purchaseId, 'Payment failed');
    }
  }

  /**
   * Complete Stripe purchase and credit tokens
   */
  private async completeStripePurchase(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const purchaseId = paymentIntent.metadata.purchaseId;
    if (!purchaseId) {
      logger.error('No purchase ID in Stripe webhook metadata');
      return;
    }

    const purchase = await this.purchaseRepo.findById(purchaseId);
    if (!purchase) {
      logger.error(`Purchase not found: ${purchaseId}`);
      return;
    }

    if (purchase.status === PurchaseStatus.SUCCEEDED) {
      logger.info(`Purchase already completed: ${purchaseId}`);
      return;
    }

    // Update purchase status
    await this.purchaseRepo.update(purchaseId, {
      status: PurchaseStatus.SUCCEEDED,
      settledAt: new Date().toISOString()
    });

    // Credit tokens
    await this.creditTokens(purchase.userId, purchase.token, purchase.amountTokens, purchaseId);

    // Send receipt email
    const user = await this.userRepo.findById(purchase.userId);
    if (user) {
      await sendPurchaseReceiptEmail(user.email, user.username, {
        token: purchase.token,
        amount: purchase.amountTokens,
        fiatAmount: purchase.amountFiat,
        currency: purchase.currency,
        transactionId: purchaseId
      });
    }

    logger.info(`Purchase completed: ${purchaseId}`);
  }

  /**
   * Create PayPal Order
   */
  async createPayPalOrder(
    userId: string,
    token: TokenSymbol,
    amount: number,
    currency: Currency = Currency.EUR
  ): Promise<{
    orderId: string;
    purchaseId: string;
    approvalUrl: string;
  }> {
    // Get current price
    const price = await this.priceRepo.getCurrentPrice(token, currency);
    if (!price) {
      throw new AppError(404, `Price not found for ${token} in ${currency}`);
    }

    // Calculate total
    const totalAmount = amount * price;

    // Create purchase record
    const purchase = await this.purchaseRepo.create({
      userId,
      token,
      amountTokens: amount,
      amountFiat: totalAmount,
      currency,
      provider: PaymentProvider.PAYPAL,
      status: PurchaseStatus.REQUIRES_PAYMENT
    });

    // Create PayPal order
    const paypalApiUrl = config.paypal.mode === 'sandbox'
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';

    const auth = Buffer.from(`${config.paypal.clientId}:${config.paypal.clientSecret}`).toString('base64');

    const response = await fetch(`${paypalApiUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency,
            value: totalAmount.toFixed(2)
          },
          description: `Purchase ${amount} ${token} tokens`,
          custom_id: purchase._key
        }],
        application_context: {
          return_url: `${config.urls.frontend}/buy/success`,
          cancel_url: `${config.urls.frontend}/buy/cancel`
        }
      })
    });

    if (!response.ok) {
      throw new AppError(500, 'Failed to create PayPal order');
    }

    const order = await response.json();

    // Update purchase with order ID
    await this.purchaseRepo.update(purchase._key, {
      providerOrderId: order.id
    });

    // Get approval URL
    const approvalUrl = order.links.find((link: any) => link.rel === 'approve')?.href;

    logger.info(`PayPal order created: ${order.id} for purchase ${purchase._key}`);

    return {
      orderId: order.id,
      purchaseId: purchase._key,
      approvalUrl
    };
  }

  /**
   * Capture PayPal order
   */
  async capturePayPalOrder(orderId: string): Promise<{ message: string }> {
    const paypalApiUrl = config.paypal.mode === 'sandbox'
      ? 'https://api-m.sandbox.paypal.com'
      : 'https://api-m.paypal.com';

    const auth = Buffer.from(`${config.paypal.clientId}:${config.paypal.clientSecret}`).toString('base64');

    const response = await fetch(`${paypalApiUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      }
    });

    if (!response.ok) {
      throw new AppError(500, 'Failed to capture PayPal order');
    }

    const captureData = await response.json();

    // Find purchase by order ID
    const purchase = await this.purchaseRepo.findByProviderOrderId(orderId);
    if (!purchase) {
      throw new AppError(404, 'Purchase not found');
    }

    // Update purchase status
    await this.purchaseRepo.update(purchase._key, {
      status: PurchaseStatus.SUCCEEDED,
      settledAt: new Date().toISOString()
    });

    // Credit tokens
    await this.creditTokens(purchase.userId, purchase.token, purchase.amountTokens, purchase._key);

    // Send receipt email
    const user = await this.userRepo.findById(purchase.userId);
    if (user) {
      await sendPurchaseReceiptEmail(user.email, user.username, {
        token: purchase.token,
        amount: purchase.amountTokens,
        fiatAmount: purchase.amountFiat,
        currency: purchase.currency,
        transactionId: purchase._key
      });
    }

    logger.info(`PayPal order captured: ${orderId} for purchase ${purchase._key}`);

    return { message: 'Purchase completed successfully' };
  }

  /**
   * Create bank transfer purchase (manual confirmation)
   */
  async createBankTransferPurchase(
    userId: string,
    token: TokenSymbol,
    amount: number,
    currency: Currency = Currency.EUR
  ): Promise<{
    purchaseId: string;
    reference: string;
    bankDetails: {
      iban: string;
      bic: string;
      beneficiary: string;
      amount: number;
      currency: string;
      reference: string;
    };
  }> {
    // Get current price
    const price = await this.priceRepo.getCurrentPrice(token, currency);
    if (!price) {
      throw new AppError(404, `Price not found for ${token} in ${currency}`);
    }

    // Calculate total
    const totalAmount = amount * price;

    // Generate unique reference
    const reference = `PERP-${nanoid(12).toUpperCase()}`;

    // Create purchase record
    const purchase = await this.purchaseRepo.create({
      userId,
      token,
      amountTokens: amount,
      amountFiat: totalAmount,
      currency,
      provider: PaymentProvider.BANK,
      status: PurchaseStatus.PROCESSING,
      metadata: {
        reference
      }
    });

    logger.info(`Bank transfer purchase created: ${purchase._key} with reference ${reference}`);

    return {
      purchaseId: purchase._key,
      reference,
      bankDetails: {
        iban: config.bank.iban,
        bic: config.bank.bic,
        beneficiary: config.bank.beneficiary,
        amount: totalAmount,
        currency,
        reference
      }
    };
  }

  /**
   * Confirm bank transfer (admin or webhook)
   */
  async confirmBankTransfer(purchaseId: string, adminId?: string): Promise<{ message: string }> {
    const purchase = await this.purchaseRepo.findById(purchaseId);
    if (!purchase) {
      throw new AppError(404, 'Purchase not found');
    }

    if (purchase.status === PurchaseStatus.SUCCEEDED) {
      throw new AppError(400, 'Purchase already confirmed');
    }

    // Update purchase status
    await this.purchaseRepo.update(purchaseId, {
      status: PurchaseStatus.SUCCEEDED,
      settledAt: new Date().toISOString()
    });

    // Credit tokens
    await this.creditTokens(purchase.userId, purchase.token, purchase.amountTokens, purchaseId);

    // Send receipt email
    const user = await this.userRepo.findById(purchase.userId);
    if (user) {
      await sendPurchaseReceiptEmail(user.email, user.username, {
        token: purchase.token,
        amount: purchase.amountTokens,
        fiatAmount: purchase.amountFiat,
        currency: purchase.currency,
        transactionId: purchaseId
      });
    }

    logger.info(`Bank transfer confirmed: ${purchaseId}${adminId ? ` by admin ${adminId}` : ''}`);

    return { message: 'Bank transfer confirmed and tokens credited' };
  }

  /**
   * Credit tokens to user wallet (atomic operation)
   */
  private async creditTokens(
    userId: string,
    token: TokenSymbol,
    amount: number,
    purchaseId: string
  ): Promise<void> {
    const wallet = await this.walletRepo.findByUserIdAndToken(userId, token);
    if (!wallet) {
      throw new AppError(404, 'Wallet not found');
    }

    // Perform atomic transaction
    const db = getDb();
    await db.executeTransaction(
      {
        write: [COLLECTIONS.WALLETS, COLLECTIONS.TRANSACTIONS]
      },
      async (step) => {
        // Create purchase transaction
        await step(() =>
          db.collection(COLLECTIONS.TRANSACTIONS).save({
            type: TransactionType.PURCHASE,
            token,
            amount,
            toUserId: userId,
            toAddress: wallet.address,
            status: TransactionStatus.COMPLETED,
            externalRef: purchaseId,
            createdAt: new Date().toISOString(),
            settledAt: new Date().toISOString()
          })
        );

        // Update wallet balance
        await step(() =>
          db.collection(COLLECTIONS.WALLETS).update(wallet._key, {
            balance: wallet.balance + amount,
            updatedAt: new Date().toISOString()
          })
        );
      }
    );

    logger.info(`Tokens credited: ${amount} ${token} to user ${userId}`);
  }

  /**
   * Fail purchase
   */
  private async failPurchase(purchaseId: string, reason: string): Promise<void> {
    await this.purchaseRepo.update(purchaseId, {
      status: PurchaseStatus.FAILED,
      metadata: { failureReason: reason }
    });

    logger.warn(`Purchase failed: ${purchaseId} - ${reason}`);
  }

  /**
   * Get purchase by ID
   */
  async getPurchase(purchaseId: string, userId: string): Promise<any> {
    const purchase = await this.purchaseRepo.findById(purchaseId);

    if (!purchase) {
      throw new AppError(404, 'Purchase not found');
    }

    // Ensure user owns this purchase
    if (purchase.userId !== userId) {
      throw new AppError(403, 'Access denied');
    }

    return purchase;
  }
}
