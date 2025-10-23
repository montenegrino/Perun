import { DocumentCollection } from 'arangojs/collection';
import { User, UserStatus, UserRole } from '@perper/shared';
import { getDb } from '../connection';
import { COLLECTIONS } from '../collections';

export class UserRepository {
  private collection: DocumentCollection<User>;

  constructor() {
    const db = getDb();
    this.collection = db.collection(COLLECTIONS.USERS);
  }

  async create(userData: Omit<User, '_key' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const now = new Date().toISOString();
    const doc = {
      ...userData,
      createdAt: now,
      updatedAt: now
    };
    const result = await this.collection.save(doc);
    return { ...doc, _key: result._key };
  }

  async findById(id: string): Promise<User | null> {
    try {
      const doc = await this.collection.document(id);
      return doc;
    } catch {
      return null;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    const cursor = await this.collection.byExample({ email });
    const results = await cursor.all();
    return results.length > 0 ? results[0] : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const cursor = await this.collection.byExample({ username });
    const results = await cursor.all();
    return results.length > 0 ? results[0] : null;
  }

  async findByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
    const db = getDb();
    const query = `
      FOR u IN ${COLLECTIONS.USERS}
      FILTER u.email == @value OR u.username == @value
      LIMIT 1
      RETURN u
    `;
    const cursor = await db.query(query, { value: emailOrUsername });
    const results = await cursor.all();
    return results.length > 0 ? results[0] : null;
  }

  async findByEmailVerificationToken(token: string): Promise<User | null> {
    const cursor = await this.collection.byExample({ emailVerificationToken: token });
    const results = await cursor.all();
    return results.length > 0 ? results[0] : null;
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    const db = getDb();
    const now = new Date().toISOString();
    const query = `
      FOR u IN ${COLLECTIONS.USERS}
      FILTER u.passwordResetToken == @token
        AND u.passwordResetExpires > @now
      LIMIT 1
      RETURN u
    `;
    const cursor = await db.query(query, { token, now });
    const results = await cursor.all();
    return results.length > 0 ? results[0] : null;
  }

  async update(id: string, updates: Partial<User>): Promise<User | null> {
    try {
      const updatedDoc = {
        ...updates,
        updatedAt: new Date().toISOString()
      };
      const result = await this.collection.update(id, updatedDoc, { returnNew: true });
      return result.new as User;
    } catch {
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.collection.remove(id);
      return true;
    } catch {
      return false;
    }
  }

  async findAll(filters?: {
    status?: UserStatus;
    regDateFrom?: string;
    regDateTo?: string;
    q?: string;
    page?: number;
    size?: number;
  }): Promise<{ users: User[]; total: number }> {
    const db = getDb();
    const page = filters?.page || 1;
    const size = filters?.size || 20;
    const offset = (page - 1) * size;

    let filterConditions: string[] = [];
    const bindVars: Record<string, any> = { offset, size };

    if (filters?.status) {
      filterConditions.push('u.status == @status');
      bindVars.status = filters.status;
    }

    if (filters?.regDateFrom) {
      filterConditions.push('u.createdAt >= @regDateFrom');
      bindVars.regDateFrom = filters.regDateFrom;
    }

    if (filters?.regDateTo) {
      filterConditions.push('u.createdAt <= @regDateTo');
      bindVars.regDateTo = filters.regDateTo;
    }

    if (filters?.q) {
      filterConditions.push(
        '(CONTAINS(LOWER(u.email), LOWER(@q)) OR CONTAINS(LOWER(u.username), LOWER(@q)) OR CONTAINS(LOWER(u.fullName), LOWER(@q)))'
      );
      bindVars.q = filters.q;
    }

    const filterClause = filterConditions.length > 0 ? `FILTER ${filterConditions.join(' AND ')}` : '';

    const countQuery = `
      FOR u IN ${COLLECTIONS.USERS}
      ${filterClause}
      COLLECT WITH COUNT INTO total
      RETURN total
    `;

    const dataQuery = `
      FOR u IN ${COLLECTIONS.USERS}
      ${filterClause}
      SORT u.createdAt DESC
      LIMIT @offset, @size
      RETURN u
    `;

    const [countCursor, dataCursor] = await Promise.all([
      db.query(countQuery, bindVars),
      db.query(dataQuery, bindVars)
    ]);

    const countResult = await countCursor.all();
    const users = await dataCursor.all();

    return {
      users,
      total: countResult[0] || 0
    };
  }

  async countByStatus(status: UserStatus): Promise<number> {
    const db = getDb();
    const query = `
      FOR u IN ${COLLECTIONS.USERS}
      FILTER u.status == @status
      COLLECT WITH COUNT INTO total
      RETURN total
    `;
    const cursor = await db.query(query, { status });
    const results = await cursor.all();
    return results[0] || 0;
  }
}
