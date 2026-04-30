import { Queue } from 'bullmq';
import { env } from '../../config/env';

const redisUrl = new URL(env.REDIS_URL || 'redis://127.0.0.1:6379');
const connection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port, 10),
  password: redisUrl.password || undefined,
};

export type ManualReviewEmailJob = {
  orderId: string;
  orderNumber: string;
  ticketId: string;
  ticketNumber: string;
  reason: string;
  requestedByUserId: string;
};

export const manualReviewEmailQueue = new Queue<ManualReviewEmailJob>('manual-review-email', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 86400, count: 1000 },
    removeOnFail: { age: 172800 },
  },
});

export const enqueueManualReviewEmail = (payload: ManualReviewEmailJob) =>
  manualReviewEmailQueue.add('send-manual-review-email', payload, {
    jobId: `manual-review-email:${payload.ticketId}`,
  });
