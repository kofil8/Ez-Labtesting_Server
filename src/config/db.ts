import redisClient from '../config/redis';
import prisma from '../shared/prisma';
import { env } from './env';

/**
 * --------------------------------------------
 *  PRISMA (POSTGRESQL)
 * --------------------------------------------
 */

// NOTE: Prisma client is a singleton exported from src/shared/prisma.ts
// Do not instantiate additional PrismaClient instances.
export { prisma } from '../shared/prisma';

const describeRedisTarget = (redisUrl: string) => {
  try {
    const parsedUrl = new URL(redisUrl);
    const dbSegment = parsedUrl.pathname.replace(/^\//, '');
    const parsedDb = dbSegment ? Number.parseInt(dbSegment, 10) : 0;
    const db = Number.isFinite(parsedDb) ? parsedDb : 0;
    const port = parsedUrl.port || '6379';

    return `host=${parsedUrl.hostname} port=${port} db=${db}`;
  } catch {
    return 'invalid REDIS_URL';
  }
};

export const connectPostgres = async () => {
  try {
    await prisma.$connect();
    console.log('✅ PostgreSQL (Prisma) connected');
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
    throw error; // Let the caller handle the error
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
  console.log(`🔵 connecting Redis (${describeRedisTarget(env.REDIS_URL)})...`);

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
  try {
    console.log('🔵 connecting Postgres...');
    await connectPostgres();
    console.log('🟢 Postgres resolved');
  } catch (error) {
    console.error('🔴 Postgres connection failed. Continuing without DB.');
  }
  try {
    console.log('🔵 connecting Redis...');
    await connectRedis();
    console.log('🟢 Redis resolved');
  } catch (error) {
    console.error('🔴 Redis connection failed. Aborting startup.');
    throw error;
  }
  console.log('🔵 connectDatabases(): completed.');
};

export const disconnectDatabases = async () => {
  await disconnectPostgres();
  await disconnectRedis();
};
