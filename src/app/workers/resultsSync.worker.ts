import { Worker } from 'bullmq';
import { env } from '../../config/env';

const redisUrl = new URL(env.REDIS_URL || 'redis://127.0.0.1:6379');
const connection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port, 10),
  password: redisUrl.password || undefined,
};

export const resultsSyncWorker = new Worker(
  'results-sync',
  async () => {
    // TODO: Implement ACCESS result polling once final API contract is confirmed.
    return { acknowledged: true };
  },
  { connection },
);
