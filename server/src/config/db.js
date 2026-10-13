import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 1. Ensure .env is explicitly loaded from the server directory before inspecting environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Utility function to sanitize MongoDB URIs for logging without exposing credentials.
 * Replaces credentials with '***:***@'.
 */
export const sanitizeMongoUri = (rawUri) => {
  if (!rawUri || typeof rawUri !== 'string') return '';
  return rawUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
};

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  // 2. Validate environment variable existence
  if (!uri || !uri.trim()) {
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
      serverSelectionTimeoutMS: 10000,
    });
    console.log('[DB] Successfully connected to MongoDB Atlas!');
    console.log(`[DB] Host: ${conn.connection.host}`);
    console.log(`[DB] Database: ${conn.connection.name}`);
    return conn;
  } catch (err) {
    // Clear diagnostic error reporting without exposing credentials
    console.error('\n======================================================');
    console.error('[DB Connection Failure] Failed to connect to MongoDB Atlas');
    console.error(`Target: ${sanitizedUri}`);
    console.error(`Error: ${err.message}`);

    if (
      err.message.includes("IP that isn't whitelisted") ||
      err.message.includes('ECONNREFUSED') ||
      err.message.includes('ETIMEDOUT') ||
      err.message.includes('querySrv') ||
      err.name === 'MongooseServerSelectionError'
    ) {
      console.error('\n[Diagnostic Assistance]');
      console.error('1. Atlas Network Access (IP Whitelist):');
      console.error('   Ensure your current public IP address is authorized in MongoDB Atlas.');
      console.error('   Atlas Dashboard -> Security -> Network Access -> Add IP Address.');
      console.error('   (For development/testing, you can add your current IP or allow access from anywhere: 0.0.0.0/0).');
      console.error('2. Firewall / VPN / DNS:');
      console.error('   Ensure port 27017 and DNS SRV lookup are not blocked by your local network or firewall.');
    } else if (err.message.includes('bad auth') || err.message.includes('AuthenticationFailed')) {
      console.error('\n[Diagnostic Assistance]');
      console.error('Authentication failed: Please check the database username and password in server/.env.');
    }

    console.error('Embedded MongoDB fallback is disabled. Halting startup.');
    console.error('======================================================\n');

    // Rethrow error so server.js catches it and terminates startup cleanly
    throw err;
  }
};

export const closeDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[DB] Disconnected from MongoDB');
  }
};
