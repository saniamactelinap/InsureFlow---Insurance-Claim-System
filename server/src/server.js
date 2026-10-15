import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';
import { connectDB, closeDB } from './config/db.js';
import { seedDatabaseIfEmpty } from './seed/seedData.js';

const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Validates critical configuration requirements in production before starting.
 * Never prints secret values.
 */
const validateProductionConfig = () => {
  if (!isProduction) return;

  const missing = [];
  if (!process.env.MONGODB_URI || !process.env.MONGODB_URI.trim()) {
    missing.push('MONGODB_URI (must point to a valid MongoDB Atlas connection)');
  }

  const defaultJwtSecret = 'insureflow_secure_jwt_secret_key_dev_2026';
  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET === defaultJwtSecret ||
    process.env.JWT_SECRET === 'your_jwt_secret_key_here'
  ) {
    missing.push('JWT_SECRET (must be configured with a secure non-default secret)');
  }

  if (missing.length > 0) {
    const errorMsg = `[Configuration Error] Critical production environment variable check failed:\n- ${missing.join('\n- ')}\nServer startup halted.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }
};

const startServer = async () => {
  try {
    validateProductionConfig();
    await connectDB();

    // In production, automatic startup seeding and collection deletion is disabled to protect production data
    if (!isProduction || process.env.SEED_ON_STARTUP === 'true') {
      await seedDatabaseIfEmpty();
    } else {
      console.log('[Seed] Production environment detected: Automatic startup seeding skipped.');
    }

    const app = createApp();

    const server = app.listen(PORT, () => {
      console.log(`[InsureFlow Server] Running on http://localhost:${PORT}`);
      console.log(`[InsureFlow Server] Healthcheck available at http://localhost:${PORT}/api/health`);
    });

    // Graceful shutdown handling for container and process terminations
    const shutdown = async (signal) => {
      console.log(`\n[InsureFlow Server] Received ${signal}. Initiating graceful shutdown...`);
      server.close(async () => {
        console.log('[InsureFlow Server] HTTP server closed.');
        try {
          await closeDB();
          console.log('[InsureFlow Server] Database disconnected cleanly.');
          process.exit(0);
        } catch (err) {
          console.error('[InsureFlow Server] Error during database disconnect:', err.message);
          process.exit(1);
        }
      });

      // Force exit if shutdown hangs beyond 10s
      setTimeout(() => {
        console.error('[InsureFlow Server] Shutdown timed out. Forcing termination.');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    console.error('[InsureFlow Server Failed to Start]', error.message || error);
    process.exit(1);
  }
};

startServer();
