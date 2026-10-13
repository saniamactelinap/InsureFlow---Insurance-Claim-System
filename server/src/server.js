import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';
import { connectDB } from './config/db.js';
import { seedDatabaseIfEmpty } from './seed/seedData.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await seedDatabaseIfEmpty();

    const app = createApp();

    app.listen(PORT, () => {
      console.log(`[InsureFlow Server] Running on http://localhost:${PORT}`);
      console.log(`[InsureFlow Server] Healthcheck available at http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('[InsureFlow Server Failed to Start]', error);
    process.exit(1);
  }
};

startServer();
