import { PrismaClient } from '@prisma/client';
import redisClient from '../config/redis';

/**
 * --------------------------------------------
 *  PRISMA (POSTGRESQL)
 * --------------------------------------------
 */

export const prisma = new PrismaClient({
  log: ['info', 'warn', 'error'],
});

export const connectPostgres = async () => {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL (Prisma) connected');
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
    process.exit(1);
  }
};

export const disconnectPostgres = async () => {
  try {
    await prisma.$disconnect();
    console.log('🛑 PostgreSQL disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting PostgreSQL:', error);
  }
};

/**
 * --------------------------------------------
 *  REDIS (SAFE CONNECT)
 * --------------------------------------------
 */

export const connectRedis = async () => {
  return new Promise<void>((resolve, reject) => {
    // If already connected or ready, resolve immediately
    if (redisClient.status === 'ready' || redisClient.status === 'connect') {
      console.log('⚡ Redis already connected');
      return resolve();
    }

    // Ready event (best indicator)
    redisClient.once('ready', () => {
      console.log('⚡ Redis ready');
      resolve();
    });

    // Fallback connect event
    redisClient.once('connect', () => {
      console.log('⚡ Redis connected');
      resolve();
    });

    // Error event
    redisClient.once('error', (err) => {
      console.error('❌ Redis connection error:', err);
      reject(err);
    });
  });
};

export const disconnectRedis = async () => {
  try {
    await redisClient.quit();
    console.log('🛑 Redis disconnected');
  } catch (error) {
    console.error('❌ Error disconnecting Redis:', error);
  }
};

/**
 * --------------------------------------------
 *  MAIN EXPORT FOR SERVER
 * --------------------------------------------
 */

export const connectDatabases = async () => {
  console.log('🔵 connectDatabases(): starting...');

  console.log('🔵 connecting Postgres...');
  await connectPostgres();
  console.log('🟢 Postgres resolved');

  console.log('🔵 connecting Redis...');
  await connectRedis();
  console.log('🟢 Redis resolved');

  console.log('🔵 connectDatabases(): completed.');
};

export const disconnectDatabases = async () => {
  await disconnectPostgres();
  await disconnectRedis();
};
