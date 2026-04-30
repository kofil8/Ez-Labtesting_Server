import { Queue } from 'bullmq';
import { env } from '../../config/env';

const redisUrl = new URL(env.REDIS_URL || 'redis://127.0.0.1:6379');
const connection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port, 10),
  password: redisUrl.password || undefined,
};

export type RequisitionPostProcessingJob = {
  orderId: string;
  requisitionId?: string;
};

export const requisitionPostProcessingQueue = new Queue<RequisitionPostProcessingJob>(
  'requisition-post-processing',
  {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { age: 86400, count: 1000 },
      removeOnFail: { age: 172800 },
    },
  },
);

export const enqueueRequisitionPostProcessing = (payload: RequisitionPostProcessingJob) =>
  requisitionPostProcessingQueue.add('post-process-requisition', payload, {
    jobId: `requisition-post-processing:${payload.orderId}`,
  });
