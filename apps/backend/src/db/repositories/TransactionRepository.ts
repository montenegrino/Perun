import { DocumentCollection } from 'arangojs/collection';
import { Transaction, TransactionType, TransactionStatus, TokenSymbol } from '@perper/shared';
import { getDb } from '../connection';
import { COLLECTIONS } from '../collections';

export class TransactionRepository {
  private collection: DocumentCollection<Transaction>;

  constructor() {
    const db = getDb();
    this.collection = db.collection(COLLECTIONS.TRANSACTIONS);
  }

  async create(
    transactionData: Omit<Transaction, '_key' | 'createdAt'>
  ): Promise<Transaction> {
    const now = new Date().toISOString();
    const doc = {
      ...transactionData,
      createdAt: now
    };
    const result = await this.collection.save(doc);
    return { ...doc, _key: result._key };
  }

  async findById(id: string): Promise<Transaction | null> {
    try {
      const doc = await this.collection.document(id);
      return doc;
    } catch {
      return null;
    }
  }

  async findByIdempotencyKey(key: string): Promise<Transaction | null> {
    const cursor = await this.collection.byExample({ idempotencyKey: key });
    const results = await cursor.all();
    return results.length > 0 ? results[0] : null;
  }

  async update(id: string, updates: Partial<Transaction>): Promise<Transaction | null> {
    try {
      const result = await this.collection.update(id, updates, { returnNew: true });
      return result.new as Transaction;
    } catch {
      return null;
    }
  }

  async findAll(filters?: {
    type?: TransactionType;
    token?: TokenSymbol;
    dateFrom?: string;
    dateTo?: string;
    amountMin?: number;
    amountMax?: number;
    userId?: string;
    address?: string;
    status?: TransactionStatus;
    page?: number;
    size?: number;
  }): Promise<{ transactions: Transaction[]; total: number }> {
    const db = getDb();
    const page = filters?.page || 1;
    const size = filters?.size || 20;
    const offset = (page - 1) * size;

    let filterConditions: string[] = [];
    const bindVars: Record<string, any> = { offset, size };

    if (filters?.type) {
      filterConditions.push('t.type == @type');
      bindVars.type = filters.type;
    }

    if (filters?.token) {
      filterConditions.push('t.token == @token');
      bindVars.token = filters.token;
    }

    if (filters?.status) {
      filterConditions.push('t.status == @status');
      bindVars.status = filters.status;
    }

    if (filters?.dateFrom) {
      filterConditions.push('t.createdAt >= @dateFrom');
      bindVars.dateFrom = filters.dateFrom;
    }

    if (filters?.dateTo) {
      filterConditions.push('t.createdAt <= @dateTo');
      bindVars.dateTo = filters.dateTo;
    }

    if (filters?.amountMin !== undefined) {
      filterConditions.push('t.amount >= @amountMin');
      bindVars.amountMin = filters.amountMin;
    }

    if (filters?.amountMax !== undefined) {
      filterConditions.push('t.amount <= @amountMax');
      bindVars.amountMax = filters.amountMax;
    }

    if (filters?.userId) {
      filterConditions.push('(t.fromUserId == @userId OR t.toUserId == @userId)');
      bindVars.userId = filters.userId;
    }

    if (filters?.address) {
      filterConditions.push('(t.fromAddress == @address OR t.toAddress == @address)');
      bindVars.address = filters.address;
    }

    const filterClause = filterConditions.length > 0 ? `FILTER ${filterConditions.join(' AND ')}` : '';

    const countQuery = `
      FOR t IN ${COLLECTIONS.TRANSACTIONS}
      ${filterClause}
      COLLECT WITH COUNT INTO total
      RETURN total
    `;

    const dataQuery = `
      FOR t IN ${COLLECTIONS.TRANSACTIONS}
      ${filterClause}
      SORT t.createdAt DESC
      LIMIT @offset, @size
      RETURN t
    `;

    const [countCursor, dataCursor] = await Promise.all([
      db.query(countQuery, bindVars),
      db.query(dataQuery, bindVars)
    ]);

    const countResult = await countCursor.all();
    const transactions = await dataCursor.all();

    return {
      transactions,
      total: countResult[0] || 0
    };
  }

  async findByUserId(
    userId: string,
    limit: number = 10
  ): Promise<Transaction[]> {
    const db = getDb();
    const query = `
      FOR t IN ${COLLECTIONS.TRANSACTIONS}
      FILTER t.fromUserId == @userId OR t.toUserId == @userId
      SORT t.createdAt DESC
      LIMIT @limit
      RETURN t
    `;
    const cursor = await db.query(query, { userId, limit });
    return cursor.all();
  }

  async countToday(): Promise<number> {
    const db = getDb();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const query = `
      FOR t IN ${COLLECTIONS.TRANSACTIONS}
      FILTER t.createdAt >= @today
      COLLECT WITH COUNT INTO total
      RETURN total
    `;
    const cursor = await db.query(query, { today: todayStr });
    const results = await cursor.all();
    return results[0] || 0;
  }

  async getTotalVolumeByToken(token: TokenSymbol, dateFrom?: string): Promise<number> {
    const db = getDb();
    const filterClause = dateFrom ? 'FILTER t.token == @token AND t.createdAt >= @dateFrom' : 'FILTER t.token == @token';
    const bindVars: any = { token };
    if (dateFrom) bindVars.dateFrom = dateFrom;

    const query = `
      FOR t IN ${COLLECTIONS.TRANSACTIONS}
      ${filterClause}
      COLLECT AGGREGATE total = SUM(t.amount)
      RETURN total
    `;
    const cursor = await db.query(query, bindVars);
    const results = await cursor.all();
    return results[0] || 0;
  }
}
