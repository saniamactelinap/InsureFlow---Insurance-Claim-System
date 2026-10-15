import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Ensure .env is explicitly loaded from the server directory before inspecting environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

let memoryServerInstance = null;

/**
 * Utility function to sanitize MongoDB URIs for logging without exposing credentials.
 * Replaces credentials with '***:***@'.
 */
export const sanitizeMongoUri = (rawUri) => {
  if (!rawUri || typeof rawUri !== 'string') return '';
  return rawUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
};

/**
 * Starts an embedded in-memory MongoDB instance for local development and testing.
 */
export const startMemoryDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (!memoryServerInstance) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServerInstance = await MongoMemoryServer.create();
  }
  const uri = memoryServerInstance.getUri();
  console.log(`[DB] Embedded In-Memory MongoDB instance started at: ${uri}`);
  const conn = await mongoose.connect(uri, {
    dbName: 'insureflow',
  });
  console.log('[DB] Connected to In-Memory MongoDB database: insureflow');
  return conn;
};

export const connectDB = async () => {
  const isTestEnv = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
  const isProduction = process.env.NODE_ENV === 'production';

  // In production, embedded memory DB is strictly forbidden
  if (isProduction && process.env.USE_MEMORY_DB === 'true') {
    const memDbError = new Error(
      '[DB Configuration Error] USE_MEMORY_DB=true cannot be used in production mode.'
    );
    console.error(memDbError.message);
    throw memDbError;
  }

  // If running in automated tests or explicitly configured to use in-memory database in non-production
  if ((process.env.USE_MEMORY_DB === 'true' && !isProduction) || isTestEnv) {
    return await startMemoryDB();
  }

  const uri = process.env.MONGODB_URI;

  // 2. Validate environment variable existence
  if (!uri || !uri.trim()) {
    if (!isProduction) {
      console.warn('[DB] MONGODB_URI is not set. Falling back to In-Memory MongoDB for development.');
      return await startMemoryDB();
    }
    const configError = new Error(
      '[DB Configuration Error] MONGODB_URI is not defined or is empty in server/.env.\n' +
      'Please configure your MongoDB Atlas connection string in server/.env (e.g., MONGODB_URI=mongodb+srv://...)'
    );
    console.error(configError.message);
    throw configError;
  }

  const sanitizedUri = sanitizeMongoUri(uri);
  console.log(`[DB] Attempting connection to MongoDB: ${sanitizedUri}`);

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('[DB] Successfully connected to MongoDB Atlas!');
    console.log(`[DB] Host: ${conn.connection.host}`);
    console.log(`[DB] Database: ${conn.connection.name}`);
    return conn;
  } catch (err) {
    // Diagnostic error reporting
    console.error('\n======================================================');
    console.error('[DB Connection Failure] Failed to connect to MongoDB Atlas');
    console.error(`Target: ${sanitizedUri}`);
    console.error(`Error: ${err.message}`);

    const isSslAlert80 =
      err.message.includes('SSL alert number 80') ||
      err.message.includes('ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR') ||
      (err.cause && (err.cause.code === 'ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR' || (err.cause.message && err.cause.message.includes('SSL alert number 80'))));

    if (
      isSslAlert80 ||
      err.message.includes("IP that isn't whitelisted") ||
      err.message.includes('ECONNREFUSED') ||
      err.message.includes('ETIMEDOUT') ||
      err.message.includes('querySrv') ||
      err.name === 'MongooseServerSelectionError'
    ) {
      console.error('\n[Diagnostic Assistance]');
      if (isSslAlert80) {
        console.error('--> ROOT CAUSE: MongoDB Atlas SSL Alert 80 (TLS Internal Error)');
        console.error('    MongoDB Atlas rejects the TLS connection when your current IP is not in the whitelist.');
      }
      console.error('1. Atlas Network Access (IP Whitelist):');
      console.error('   Ensure your current public IP address is authorized in MongoDB Atlas:');
      console.error('   Atlas Dashboard -> Security -> Network Access -> Add IP Address.');
      console.error('   (For development, click "Allow Access From Anywhere" [0.0.0.0/0] or "Add Current IP Address").');
      console.error('2. Firewall / VPN / DNS:');
      console.error('   Ensure port 27017 and DNS SRV lookup are not blocked by your local network or firewall.');
    } else if (err.message.includes('bad auth') || err.message.includes('AuthenticationFailed')) {
      console.error('\n[Diagnostic Assistance]');
      console.error('Authentication failed: Please check the database username and password in server/.env.');
    }

    // In development or test environments, fallback to embedded MongoMemoryServer
    const allowFallback = !isProduction && (process.env.NODE_ENV !== 'production' || process.env.ALLOW_MEMORY_FALLBACK === 'true');

    if (allowFallback) {
      console.warn('\n------------------------------------------------------');
      console.warn('[DB Fallback Activated] Starting embedded In-Memory MongoDB...');
      console.warn('Your server will run normally with sample seeded data.');
      console.warn('------------------------------------------------------\n');
      try {
        await mongoose.disconnect();
        return await startMemoryDB();
      } catch (memErr) {
        console.error('[DB Fallback Error] Failed to start In-Memory MongoDB:', memErr.message);
        throw err;
      }
    }

    console.error('[DB] Production Atlas connection failed or embedded fallback is disabled. Halting startup.');
    console.error('======================================================\n');

    throw err;
  }
};

export const closeDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[DB] Disconnected from MongoDB');
  }
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
    memoryServerInstance = null;
    console.log('[DB] Stopped In-Memory MongoDB instance');
  }
};
