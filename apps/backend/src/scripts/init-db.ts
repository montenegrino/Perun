import { getDb } from '../db/connection';
import { COLLECTIONS, INDEXES } from '../db/collections';
import logger from '../utils/logger';

/**
 * Initialize database collections and indexes
 */
async function initDatabase() {
  try {
    logger.info('Starting database initialization...');
    const db = getDb();

    // Check if database exists, create if not
    const databases = await db.listDatabases();
    const dbName = db.name;

    if (!databases.includes(dbName)) {
      logger.info(`Creating database: ${dbName}`);
      await db.createDatabase(dbName);
    }

    // Create collections
    const existingCollections = await db.listCollections();
    const existingNames = existingCollections.map((c) => c.name);

    for (const [key, collectionName] of Object.entries(COLLECTIONS)) {
      if (!existingNames.includes(collectionName)) {
        logger.info(`Creating collection: ${collectionName}`);
        await db.createCollection(collectionName);
      } else {
        logger.info(`Collection already exists: ${collectionName}`);
      }
    }

    // Create indexes
    for (const [collectionKey, indexes] of Object.entries(INDEXES)) {
      const collectionName = COLLECTIONS[collectionKey.toUpperCase() as keyof typeof COLLECTIONS];
      if (!collectionName) continue;

      const collection = db.collection(collectionName);
      logger.info(`Creating indexes for: ${collectionName}`);

      for (const index of indexes) {
        try {
          await collection.ensureIndex({
            type: index.type,
            fields: index.fields,
            unique: index.unique || false,
            sparse: index.sparse || false
          });
          logger.info(`  - Index created on fields: ${index.fields.join(', ')}`);
        } catch (error) {
          // Index might already exist
          logger.warn(`  - Index on ${index.fields.join(', ')} already exists or failed to create`);
        }
      }
    }

    logger.info('Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Database initialization failed:', error);
    process.exit(1);
  }
}

// Run initialization
initDatabase();
