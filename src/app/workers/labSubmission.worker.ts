import { Job, Worker } from 'bullmq';
import { Prisma } from '@prisma/client';
import { env } from '../../config/env';
import { labProviderRegistryService } from '../modules/lab-integration/services/lab-provider-registry.service';
import { orderService } from '../modules/orders/orders.service';
import { enqueueOrderSuccessEmail } from '../queues/orderSuccessEmail.queue';
import { enqueueRequisitionPostProcessing } from '../queues/requisitionPostProcessing.queue';

const redisUrl = new URL(env.REDIS_URL || 'redis://127.0.0.1:6379');
const connection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port, 10),
  password: redisUrl.password || undefined,
};

type LabSubmissionJob = {
  orderId: string;
};

export const labSubmissionWorker = new Worker<LabSubmissionJob>(
  'lab-submission',
  async (job: Job<LabSubmissionJob>) => {
    const { orderId } = job.data;

    await orderService.beginLabSubmission(orderId);
    const order = await orderService.getOrderById(orderId);
    const provider = labProviderRegistryService.getByCode(order.laboratory?.code);

    const aggregate = {
      order,
      patient: order.patient || null,
      items: order.orderItems || [],
      drawCenter: order.drawCenter || null,
      requisitions: order.requisitions || [],
    };

    await provider.validateSubmission(aggregate);
    const result = await provider.submitOrder(aggregate);

    if (!result.success) {
      if (job.attemptsMade + 1 >= (job.opts.attempts || 1)) {
        await orderService.markLabSubmissionFailed(orderId, {
          errorCode: result.errorCode || null,
          errorMessage: result.errorMessage || 'Lab submission failed',
          rawPayload: (result.rawPayload || null) as Prisma.InputJsonValue | null,
          rawResponse: (result.rawResponse || null) as Prisma.InputJsonValue | null,
        });
      }

      throw new Error(result.errorMessage || 'Lab submission failed');
    }

    const updated = await orderService.markLabOrderPlaced({
      orderId,
      accessOrderId: result.externalOrderId || undefined,
      requisitionPdfUrl: result.requisition?.requisitionPdfUrl || undefined,
      requisitionPdfPath: result.requisition?.requisitionPdfPath || undefined,
      confirmedLabLocation: result.requisition?.drawCenterSnapshot || undefined,
      rawPayload: (result.rawPayload || null) as Prisma.InputJsonValue | null,
      rawResponse: (result.rawResponse || null) as Prisma.InputJsonValue | null,
    });

    await enqueueOrderSuccessEmail(updated.id);
    await enqueueRequisitionPostProcessing({ orderId: updated.id });
    await provider.scheduleResultSync(updated.id);

    return { orderId: updated.id };
  },
  { connection, concurrency: 5 },
);
