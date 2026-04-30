import { Queue } from 'bullmq';
import { env } from '../../config/env';

const redisUrl = new URL(env.REDIS_URL || 'redis://127.0.0.1:6379');
const connection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port, 10),
  password: redisUrl.password || undefined,
};

export type LabSubmissionJob = {
  orderId: string;
};

export const labSubmissionQueue = new Queue<LabSubmissionJob>('lab-submission', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { age: 86400, count: 1000 },
    removeOnFail: { age: 172800 },
  },
});

export async function enqueueLabSubmission(orderId: string) {
  const jobId = `lab-submission:${orderId}`;
  const existingJob = await labSubmissionQueue.getJob(jobId);
  if (existingJob) {
    const state = await existingJob.getState();
    if (['waiting', 'active', 'delayed'].includes(state)) {
      return { enqueued: false, jobId, state };
    }
  }

  const job = await labSubmissionQueue.add('submit-order', { orderId }, { jobId });
  return { enqueued: true, jobId: job.id, state: 'waiting' };
}

process.on('SIGTERM', async () => {
  await labSubmissionQueue.close();
});
