import { DocumentCollection } from 'arangojs/collection';
import { AuditLog } from '@perper/shared';
import { getDb } from '../connection';
import { COLLECTIONS } from '../collections';

export class AuditLogRepository {
  private collection: DocumentCollection<AuditLog>;

  constructor() {
    const db = getDb();
    this.collection = db.collection(COLLECTIONS.AUDIT_LOGS);
  }

  async create(logData: Omit<AuditLog, '_key' | 'createdAt'>): Promise<AuditLog> {
    const now = new Date().toISOString();
    const doc = {
      ...logData,
      createdAt: now
    };
    const result = await this.collection.save(doc);
    return { ...doc, _key: result._key };
  }

  async findAll(filters?: {
    actorId?: string;
    action?: string;
    targetType?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    size?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const db = getDb();
    const page = filters?.page || 1;
    const size = filters?.size || 50;
    const offset = (page - 1) * size;

    let filterConditions: string[] = [];
    const bindVars: Record<string, any> = { offset, size };

    if (filters?.actorId) {
      filterConditions.push('l.actorId == @actorId');
      bindVars.actorId = filters.actorId;
    }

    if (filters?.action) {
      filterConditions.push('l.action == @action');
      bindVars.action = filters.action;
    }

    if (filters?.targetType) {
      filterConditions.push('l.targetType == @targetType');
      bindVars.targetType = filters.targetType;
    }

    if (filters?.dateFrom) {
      filterConditions.push('l.createdAt >= @dateFrom');
      bindVars.dateFrom = filters.dateFrom;
    }

    if (filters?.dateTo) {
      filterConditions.push('l.createdAt <= @dateTo');
      bindVars.dateTo = filters.dateTo;
    }

    const filterClause = filterConditions.length > 0 ? `FILTER ${filterConditions.join(' AND ')}` : '';

    const countQuery = `
      FOR l IN ${COLLECTIONS.AUDIT_LOGS}
      ${filterClause}
      COLLECT WITH COUNT INTO total
      RETURN total
    `;

    const dataQuery = `
      FOR l IN ${COLLECTIONS.AUDIT_LOGS}
      ${filterClause}
      SORT l.createdAt DESC
      LIMIT @offset, @size
      RETURN l
    `;

    const [countCursor, dataCursor] = await Promise.all([
      db.query(countQuery, bindVars),
      db.query(dataQuery, bindVars)
    ]);

    const countResult = await countCursor.all();
    const logs = await dataCursor.all();

    return {
      logs,
      total: countResult[0] || 0
    };
  }

  async getRecentActivity(limit: number = 20): Promise<AuditLog[]> {
    const db = getDb();
    const query = `
      FOR l IN ${COLLECTIONS.AUDIT_LOGS}
      SORT l.createdAt DESC
      LIMIT @limit
      RETURN l
    `;
    const cursor = await db.query(query, { limit });
    return cursor.all();
  }
}
