import { Queue } from 'bullmq';
import { env } from '../../config/env';

const redisUrl = new URL(env.REDIS_URL || 'redis://127.0.0.1:6379');
const connection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port, 10),
  password: redisUrl.password || undefined,
};

export type OrderSuccessEmailJob = {
  orderId: string;
};

export const orderSuccessEmailQueue = new Queue<OrderSuccessEmailJob>('order-success-email', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 86400, count: 1000 },
    removeOnFail: { age: 172800 },
  },
});

export const enqueueOrderSuccessEmail = (orderId: string) =>
  orderSuccessEmailQueue.add('send-order-success-email', { orderId }, {
    jobId: `order-success-email:${orderId}`,
  });
