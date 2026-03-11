import { Queue } from 'bullmq';
import { env } from '../../config/env';

// Parse Redis URL for BullMQ connection
const redisUrl = new URL(env.REDIS_URL);

const redisConnection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port, 10),
  password: redisUrl.password || undefined,
};

/**
 * Queue for ACCESS Lab order placement
 * Jobs: { orderId: string }
 */
export const accessLabQueue = new Queue('access-lab-order', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000, // 5s, 10s, 20s
    },
    removeOnComplete: {
      age: 86400, // Keep completed jobs for 24 hours
      count: 1000,
    },
    removeOnFail: {
      age: 172800, // Keep failed jobs for 48 hours
    },
  },
});

export async function enqueueAccessLabOrder(orderId: string) {
  const jobId = `place-lab-order:${orderId}`;
  const existingJob = await accessLabQueue.getJob(jobId);

  if (existingJob) {
    const state = await existingJob.getState();
    if (state === 'waiting' || state === 'active' || state === 'delayed') {
      return { enqueued: false, jobId, state };
    }
  }

  const job = await accessLabQueue.add(
    'place-lab-order',
    { orderId },
    {
      jobId,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: {
        age: 86400,
        count: 1000,
      },
      removeOnFail: {
        age: 172800,
      },
    },
  );

  return { enqueued: true, jobId: job.id, state: 'waiting' };
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await accessLabQueue.close();
});

console.log('[Queue] ACCESS Lab queue initialized');
