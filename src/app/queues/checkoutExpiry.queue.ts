import { Queue } from 'bullmq';
import { env } from '../../config/env';

const redisUrl = new URL(env.REDIS_URL || 'redis://127.0.0.1:6379');

const redisConnection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port, 10),
  password: redisUrl.password || undefined,
};

/**
 * Queue for expiring old CheckoutSessions.
 */
export const checkoutExpiryQueue = new Queue('checkout-session-expiry', {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: { age: 86400, count: 1000 },
    removeOnFail: { age: 172800 },
  },
});

export async function ensureCheckoutExpiryCron() {
  // Repeatable job; safe to call on every boot.
  await checkoutExpiryQueue.add(
    'expire',
    {},
    {
      jobId: 'expire-checkout-sessions-cron',
      repeat: { pattern: env.CHECKOUT_SESSION_CLEANUP_CRON },
    },
  );
}

process.on('SIGTERM', async () => {
  await checkoutExpiryQueue.close();
});

console.log('[Queue] Checkout expiry queue initialized');
