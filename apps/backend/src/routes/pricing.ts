import { Router } from 'express';
import { PriceHistoryRepository } from '../db/repositories';
import { Currency } from '@perper/shared';

const router = Router();
const priceRepo = new PriceHistoryRepository();

/**
 * GET /api/pricing
 * Get current token prices
 */
router.get('/', async (req, res, next) => {
  try {
    const currency = (req.query.currency as Currency) || Currency.EUR;
    const prices = await priceRepo.getAllCurrentPrices(currency);

    res.json({
      currency,
      prices
    });
  } catch (error) {
    next(error);
  }
});

export default router;
