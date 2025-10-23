import { Database } from 'arangojs';
import config from '../config';
import logger from '../utils/logger';

let db: Database | null = null;

/**
 * Initialize and return ArangoDB connection
 */
export const getDb = (): Database => {
  if (!db) {
    db = new Database({
      url: config.arango.url,
      databaseName: config.arango.database,
      auth: {
        username: config.arango.user,
        password: config.arango.password
      }
    });
    logger.info('ArangoDB connection initialized');
  }
  return db;
};

/**
 * Test database connection
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const database = getDb();
    const info = await database.version();
    logger.info(`Connected to ArangoDB ${info.version}`);
    return true;
  } catch (error) {
    logger.error('Failed to connect to ArangoDB:', error);
    return false;
  }
};

/**
 * Close database connection
 */
export const closeConnection = (): void => {
  if (db) {
    db.close();
    db = null;
    logger.info('ArangoDB connection closed');
  }
};

export default { getDb, testConnection, closeConnection };
