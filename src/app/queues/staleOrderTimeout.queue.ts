import { Queue } from 'bullmq';
import { env } from '../../config/env';

const redisUrl = new URL(env.REDIS_URL || 'redis://127.0.0.1:6379');
const connection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port, 10),
  password: redisUrl.password || undefined,
};

export const staleOrderTimeoutQueue = new Queue('stale-order-timeout', {
  connection,
  defaultJobOptions: {
    removeOnComplete: { age: 86400, count: 1000 },
    removeOnFail: { age: 172800 },
  },
});

export async function ensureStaleOrderTimeoutCron() {
  await staleOrderTimeoutQueue.add(
    'expire-stale-orders',
    {},
    {
      jobId: 'expire-stale-orders-cron',
      repeat: { pattern: env.STALE_ORDER_TIMEOUT_CRON },
    },
  );
}
