import { DocumentCollection } from 'arangojs/collection';
import { SupplyEvent, TokenSymbol, SupplyEventType } from '@perper/shared';
import { getDb } from '../connection';
import { COLLECTIONS } from '../collections';

export class SupplyEventRepository {
  private collection: DocumentCollection<SupplyEvent>;

  constructor() {
    const db = getDb();
    this.collection = db.collection(COLLECTIONS.SUPPLY_EVENTS);
  }

  async create(eventData: Omit<SupplyEvent, '_key' | 'createdAt'>): Promise<SupplyEvent> {
    const now = new Date().toISOString();
    const doc = {
      ...eventData,
      createdAt: now
    };
    const result = await this.collection.save(doc);
    return { ...doc, _key: result._key };
  }

  async getTotalSupply(token: TokenSymbol): Promise<number> {
    const db = getDb();
    const query = `
      FOR e IN ${COLLECTIONS.SUPPLY_EVENTS}
      FILTER e.token == @token
      COLLECT AGGREGATE
        minted = SUM(e.type == 'mint' ? e.amount : 0),
        burned = SUM(e.type == 'burn' ? e.amount : 0)
      RETURN minted - burned
    `;
    const cursor = await db.query(query, { token });
    const results = await cursor.all();
    return results[0] || 0;
  }

  async getSupplyHistory(
    token: TokenSymbol,
    limit: number = 50
  ): Promise<SupplyEvent[]> {
    const db = getDb();
    const query = `
      FOR e IN ${COLLECTIONS.SUPPLY_EVENTS}
      FILTER e.token == @token
      SORT e.createdAt DESC
      LIMIT @limit
      RETURN e
    `;
    const cursor = await db.query(query, { token, limit });
    return cursor.all();
  }
}
