import bcrypt from 'bcrypt';
import { getDb } from '../db/connection';
import { COLLECTIONS } from '../db/collections';
import { UserStatus, UserRole, TokenSymbol, Currency } from '@perper/shared';
import logger from '../utils/logger';

/**
 * Seed database with initial data
 */
async function seed() {
  try {
    logger.info('Starting database seeding...');
    const db = getDb();

    // Create admin user
    const usersCollection = db.collection(COLLECTIONS.USERS);
    const existingAdmin = await usersCollection.firstExample({ email: 'admin@perper.digital' });

    if (!existingAdmin) {
      const adminPasswordHash = await bcrypt.hash('Admin123!', 12);
      const adminUser = await usersCollection.save({
        email: 'admin@perper.digital',
        username: 'admin',
        fullName: 'System Administrator',
        passwordHash: adminPasswordHash,
        status: UserStatus.APPROVED,
        roles: [UserRole.USER, UserRole.ADMIN],
        emailVerifiedAt: new Date().toISOString(),
        notificationPrefs: {
          emailTransactions: true,
          emailMarketing: false
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      logger.info(`Admin user created: ${adminUser._key}`);
      logger.info('Admin credentials: admin@perper.digital / Admin123!');
    } else {
      logger.info('Admin user already exists');
    }

    // Create initial token prices
    const priceHistoryCollection = db.collection(COLLECTIONS.PRICE_HISTORY);

    const tokens = [
      { token: TokenSymbol.PERP, price: 1.0 },
      { token: TokenSymbol.PERN, price: 0.5 },
      { token: TokenSymbol.ZET, price: 0.25 },
      { token: TokenSymbol.ADRI, price: 0.1 }
    ];

    for (const { token, price } of tokens) {
      const existing = await priceHistoryCollection.firstExample({
        token,
        currency: Currency.EUR
      });

      if (!existing) {
        await priceHistoryCollection.save({
          token,
          price,
          currency: Currency.EUR,
          effectiveAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });

        await priceHistoryCollection.save({
          token,
          price: price * 1.1, // USD is ~10% more
          currency: Currency.USD,
          effectiveAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });

        logger.info(`Price set for ${token}: ${price} EUR / ${price * 1.1} USD`);
      }
    }

    // Initialize supply events (0 initial supply for all tokens)
    const supplyEventsCollection = db.collection(COLLECTIONS.SUPPLY_EVENTS);

    for (const token of [TokenSymbol.PERP, TokenSymbol.PERN, TokenSymbol.ZET, TokenSymbol.ADRI]) {
      const existing = await supplyEventsCollection.firstExample({ token });

      if (!existing) {
        logger.info(`No initial supply event for ${token} - supply is 0`);
      }
    }

    logger.info('Database seeding completed successfully!');
    logger.info('\n========================================');
    logger.info('Default Admin Credentials:');
    logger.info('Email: admin@perper.digital');
    logger.info('Password: Admin123!');
    logger.info('========================================\n');

    process.exit(0);
  } catch (error) {
    logger.error('Database seeding failed:', error);
    process.exit(1);
  }
}

// Run seeding
seed();
