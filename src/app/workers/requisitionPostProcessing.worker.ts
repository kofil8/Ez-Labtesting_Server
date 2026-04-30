import { Worker } from 'bullmq';
import { env } from '../../config/env';

const redisUrl = new URL(env.REDIS_URL || 'redis://127.0.0.1:6379');
const connection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port, 10),
  password: redisUrl.password || undefined,
};

export const requisitionPostProcessingWorker = new Worker(
  'requisition-post-processing',
  async (job) => {
    // TODO: Add requisition PDF conversion/storage enrichment pipeline when requirements are finalized.
    return { acknowledged: true, orderId: job.data.orderId };
  },
  { connection, concurrency: 2 },
);
