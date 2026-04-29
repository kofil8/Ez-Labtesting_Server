import redisClient from '../../config/redis';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

/**
 * Helper to create a Redis-powered store for express-rate-limit
 */
const redisRateLimitStore = (prefix: string) =>
  new RedisStore({
    prefix,
    // Fix for TypeScript: use redisClient.call(...) instead of sendCommand
    sendCommand: (...args: string[]) =>
      (redisClient.call as (...args: any[]) => Promise<any>)(...args) as unknown as Promise<string>,
  });

/**
 * Default rate limiter for general API usage
 */
export const defaultLimiter = rateLimit({
  store: redisRateLimitStore('rl:global:'),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 10000 : 100,
  skip: (req) => req.method === 'POST' && req.path === '/api/v1/cart/sync',
  message: {
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Stricter limiter for login attempts
 */
export const loginLimiter = rateLimit({
  store: redisRateLimitStore('rl:login:'),
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: process.env.NODE_ENV === 'test' ? 1000 : 5,
  message: {
    message: 'Too many login attempts. Please try again after 10 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Custom dynamic limiter
 */
export const createRateLimiter = (
  max: number,
  minutes: number,
  prefix = `custom:${max}:${minutes}`,
  keyGenerator?: (req: any) => string,
) =>
  rateLimit({
    store: redisRateLimitStore(`rl:${prefix}:`),
    windowMs: minutes * 60 * 1000,
    max,
    keyGenerator,
    message: {
      message: `Too many requests. Try again after ${minutes} minutes.`,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

export const cartSyncLimiter = createRateLimiter(120, 5, 'cart-sync', (req) => {
  const userId = req.user?.id;
  if (userId) return `user:${userId}`;

  return 'anonymous';
});
