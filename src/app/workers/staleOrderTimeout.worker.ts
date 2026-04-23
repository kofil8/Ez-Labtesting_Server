import { Worker } from 'bullmq';
import { env } from '../../config/env';
import { orderService } from '../modules/orders/orders.service';

const redisUrl = new URL(env.REDIS_URL || 'redis://127.0.0.1:6379');
const connection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port, 10),
  password: redisUrl.password || undefined,
};

export const staleOrderTimeoutWorker = new Worker(
  'stale-order-timeout',
  async () => {
    const cutoff = new Date(Date.now() - Number(env.STALE_ORDER_TIMEOUT_MIN) * 60 * 1000);
    return orderService.expireStaleOrders(cutoff);
  },
  { connection },
);
