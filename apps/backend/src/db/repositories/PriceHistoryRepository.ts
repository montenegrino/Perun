import { DocumentCollection } from 'arangojs/collection';
import { PriceHistory, TokenSymbol, Currency } from '@perper/shared';
import { getDb } from '../connection';
import { COLLECTIONS } from '../collections';

export class PriceHistoryRepository {
  private collection: DocumentCollection<PriceHistory>;

  constructor() {
    const db = getDb();
    this.collection = db.collection(COLLECTIONS.PRICE_HISTORY);
  }

  async create(priceData: Omit<PriceHistory, '_key' | 'createdAt'>): Promise<PriceHistory> {
    const now = new Date().toISOString();
    const doc = {
      ...priceData,
      createdAt: now
    };
    const result = await this.collection.save(doc);
    return { ...doc, _key: result._key };
  }

  async getCurrentPrice(
    token: TokenSymbol,
    currency: Currency = Currency.EUR
  ): Promise<number | null> {
    const db = getDb();
    const now = new Date().toISOString();
    const query = `
      FOR p IN ${COLLECTIONS.PRICE_HISTORY}
      FILTER p.token == @token
        AND p.currency == @currency
        AND p.effectiveAt <= @now
      SORT p.effectiveAt DESC
      LIMIT 1
      RETURN p.price
    `;
    const cursor = await db.query(query, { token, currency, now });
    const results = await cursor.all();
    return results.length > 0 ? results[0] : null;
  }

  async getAllCurrentPrices(currency: Currency = Currency.EUR): Promise<Record<TokenSymbol, number>> {
    const db = getDb();
    const now = new Date().toISOString();
    const query = `
      FOR token IN ['PERP', 'PERN', 'ZET', 'ADRI']
        LET latestPrice = (
          FOR p IN ${COLLECTIONS.PRICE_HISTORY}
          FILTER p.token == token
            AND p.currency == @currency
            AND p.effectiveAt <= @now
          SORT p.effectiveAt DESC
          LIMIT 1
          RETURN p.price
        )[0]
        RETURN { token, price: latestPrice }
    `;
    const cursor = await db.query(query, { currency, now });
    const results = await cursor.all();

    const prices: any = {};
    for (const item of results) {
      prices[item.token] = item.price || 0;
    }
    return prices;
  }

  async getPriceHistory(
    token: TokenSymbol,
    currency: Currency = Currency.EUR,
    limit: number = 100
  ): Promise<PriceHistory[]> {
    const db = getDb();
    const query = `
      FOR p IN ${COLLECTIONS.PRICE_HISTORY}
      FILTER p.token == @token AND p.currency == @currency
      SORT p.effectiveAt DESC
      LIMIT @limit
      RETURN p
    `;
    const cursor = await db.query(query, { token, currency, limit });
    return cursor.all();
  }
}
