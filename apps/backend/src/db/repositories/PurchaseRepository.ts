import { DocumentCollection } from 'arangojs/collection';
import { Purchase, PurchaseStatus, TokenSymbol } from '@perper/shared';
import { getDb } from '../connection';
import { COLLECTIONS } from '../collections';

export class PurchaseRepository {
  private collection: DocumentCollection<Purchase>;

  constructor() {
    const db = getDb();
    this.collection = db.collection(COLLECTIONS.PURCHASES);
  }

  async create(purchaseData: Omit<Purchase, '_key' | 'createdAt' | 'updatedAt'>): Promise<Purchase> {
    const now = new Date().toISOString();
    const doc = {
      ...purchaseData,
      createdAt: now,
      updatedAt: now
    };
    const result = await this.collection.save(doc);
    return { ...doc, _key: result._key };
  }

  async findById(id: string): Promise<Purchase | null> {
    try {
      const doc = await this.collection.document(id);
      return doc;
    } catch {
      return null;
    }
  }

  async findByProviderIntentId(intentId: string): Promise<Purchase | null> {
    const cursor = await this.collection.byExample({ providerIntentId: intentId });
    const results = await cursor.all();
    return results.length > 0 ? results[0] : null;
  }

  async findByProviderOrderId(orderId: string): Promise<Purchase | null> {
    const cursor = await this.collection.byExample({ providerOrderId: orderId });
    const results = await cursor.all();
    return results.length > 0 ? results[0] : null;
  }

  async update(id: string, updates: Partial<Purchase>): Promise<Purchase | null> {
    try {
      const updatedDoc = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      const result = await this.collection.update(id, updatedDoc, { returnNew: true });
      return result.new as Purchase;
    } catch {
      return null;
    }
  }

  async findByUserId(userId: string, limit: number = 10): Promise<Purchase[]> {
    const db = getDb();
    const query = `
      FOR p IN ${COLLECTIONS.PURCHASES}
      FILTER p.userId == @userId
      SORT p.createdAt DESC
      LIMIT @limit
      RETURN p
    `;
    const cursor = await db.query(query, { userId, limit });
    return cursor.all();
  }

  async getTotalRevenue(dateFrom?: string): Promise<number> {
    const db = getDb();
    const filterClause = dateFrom ? 'FILTER p.status == @status AND p.createdAt >= @dateFrom' : 'FILTER p.status == @status';
    const bindVars: any = { status: PurchaseStatus.SUCCEEDED };
    if (dateFrom) bindVars.dateFrom = dateFrom;

    const query = `
      FOR p IN ${COLLECTIONS.PURCHASES}
      ${filterClause}
      COLLECT AGGREGATE total = SUM(p.amountFiat)
      RETURN total
    `;
    const cursor = await db.query(query, bindVars);
    const results = await cursor.all();
    return results[0] || 0;
  }
}
