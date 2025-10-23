import { DocumentCollection } from 'arangojs/collection';
import { Wallet, TokenSymbol } from '@perper/shared';
import { getDb } from '../connection';
import { COLLECTIONS } from '../collections';

export class WalletRepository {
  private collection: DocumentCollection<Wallet>;

  constructor() {
    const db = getDb();
    this.collection = db.collection(COLLECTIONS.WALLETS);
  }

  async create(walletData: Omit<Wallet, '_key' | 'createdAt' | 'updatedAt'>): Promise<Wallet> {
    const now = new Date().toISOString();
    const doc = {
      ...walletData,
      createdAt: now,
      updatedAt: now
    };
    const result = await this.collection.save(doc);
    return { ...doc, _key: result._key };
  }

  async findById(id: string): Promise<Wallet | null> {
    try {
      const doc = await this.collection.document(id);
      return doc;
    } catch {
      return null;
    }
  }

  async findByUserId(userId: string): Promise<Wallet[]> {
    const cursor = await this.collection.byExample({ userId });
    return cursor.all();
  }

  async findByUserIdAndToken(userId: string, token: TokenSymbol): Promise<Wallet | null> {
    const cursor = await this.collection.byExample({ userId, token });
    const results = await cursor.all();
    return results.length > 0 ? results[0] : null;
  }

  async findByAddress(address: string): Promise<Wallet | null> {
    const cursor = await this.collection.byExample({ address });
    const results = await cursor.all();
    return results.length > 0 ? results[0] : null;
  }

  async update(id: string, updates: Partial<Wallet>): Promise<Wallet | null> {
    try {
      const updatedDoc = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      const result = await this.collection.update(id, updatedDoc, { returnNew: true });
      return result.new as Wallet;
    } catch {
      return null;
    }
  }

  async updateBalance(id: string, newBalance: number): Promise<Wallet | null> {
    return this.update(id, { balance: newBalance });
  }

  async getTotalBalanceByToken(token: TokenSymbol): Promise<number> {
    const db = getDb();
    const query = `
      FOR w IN ${COLLECTIONS.WALLETS}
      FILTER w.token == @token
      COLLECT AGGREGATE total = SUM(w.balance)
      RETURN total
    `;
    const cursor = await db.query(query, { token });
    const results = await cursor.all();
    return results[0] || 0;
  }

  async getUsersWithBalance(token: TokenSymbol, minBalance: number = 0): Promise<number> {
    const db = getDb();
    const query = `
      FOR w IN ${COLLECTIONS.WALLETS}
      FILTER w.token == @token AND w.balance >= @minBalance
      COLLECT WITH COUNT INTO total
      RETURN total
    `;
    const cursor = await db.query(query, { token, minBalance });
    const results = await cursor.all();
    return results[0] || 0;
  }
}
