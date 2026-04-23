import { Queue } from 'bullmq';
import { env } from '../../config/env';

const redisUrl = new URL(env.REDIS_URL || 'redis://127.0.0.1:6379');
const connection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port, 10),
  password: redisUrl.password || undefined,
};

export const resultsSyncQueue = new Queue('results-sync', {
  connection,
  defaultJobOptions: {
    removeOnComplete: { age: 86400, count: 1000 },
    removeOnFail: { age: 172800 },
  },
});

export async function ensureResultsSyncCron() {
  await resultsSyncQueue.add(
    'poll-access-results',
    {},
    {
      jobId: 'poll-access-results-cron',
      repeat: { pattern: env.ACCESS_RESULTS_SYNC_CRON },
    },
  );
}
