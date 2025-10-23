import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import logger from './utils/logger';
import { testConnection } from './db/connection';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth';
import walletRoutes from './routes/wallet';
import adminRoutes from './routes/admin';
import pricingRoutes from './routes/pricing';
import purchaseRoutes from './routes/purchase';

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: config.urls.frontend,
    credentials: true
  })
);

// Stripe webhook needs raw body - must be before body parsing
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res, next) => {
  // This will be handled by purchase routes
  next();
});

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parsing
app.use(cookieParser());

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'perper-wallet-backend'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/webhooks', purchaseRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();

    if (!dbConnected) {
      logger.error('Failed to connect to database');
      process.exit(1);
    }

    // Start listening
    app.listen(config.port, () => {
      logger.info(`
========================================
🚀 Perper Wallet Backend Started
========================================
Environment: ${config.nodeEnv}
Port: ${config.port}
Database: ${config.arango.database}
Frontend URL: ${config.urls.frontend}
========================================
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start the server
startServer();

export default app;
