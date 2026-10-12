import mongoose from 'mongoose';
import { config } from './index.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger({ level: config.logLevel, service: 'database' });

let isConnected = false;

/**
 * Connect to MongoDB. Safe to call multiple times.
 * @param {string} [uri]
 */
export async function connectDatabase(uri = config.mongodbUri) {
  if (isConnected || mongoose.connection.readyState === 1) {
    isConnected = true;
    return mongoose.connection;
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: config.isTest ? 10_000 : 5_000,
  });

  isConnected = true;
  logger.info('MongoDB connected', {
    readyState: mongoose.connection.readyState,
    // Never log full URI with credentials in production
    host: mongoose.connection.host,
    name: mongoose.connection.name,
  });

  return mongoose.connection;
}

/**
 * Disconnect from MongoDB.
 */
export async function disconnectDatabase() {
  if (mongoose.connection.readyState === 0) {
    isConnected = false;
    return;
  }

  await mongoose.disconnect();
  isConnected = false;
  logger.info('MongoDB disconnected');
}

/**
 * @returns {'disconnected' | 'connected' | 'connecting' | 'disconnecting' | 'unknown'}
 */
export function getDatabaseStatus() {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  return states[mongoose.connection.readyState] ?? 'unknown';
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}
