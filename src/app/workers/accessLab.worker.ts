import { Job, Worker } from 'bullmq';
import { env } from '../../config/env';
import { orderService } from '../modules/orders/orders.service';
import { accessCsvService } from '../services/accessCsv.service';
import { accessUploadService } from '../services/accessUpload.service';
import { auditLogService } from '../services/auditLog.service';
import { serializeError } from '../utils/redactSensitive';

// Parse Redis URL for BullMQ connection
const redisUrl = new URL(env.REDIS_URL);

const redisConnection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port, 10),
  password: redisUrl.password || undefined,
};

interface PlaceLabOrderJob {
  orderId: string;
}

/**
 * Worker for ACCESS Lab order placement
 * Processes jobs from 'access-lab-order' queue
 */
export const accessLabWorker = new Worker<PlaceLabOrderJob>(
  'access-lab-order',
  async (job: Job<PlaceLabOrderJob>) => {
    const { orderId } = job.data;

    console.log(`[Worker] Processing lab order placement for order: ${orderId}`);

    try {
      // 1. Load order from database
      const order = await orderService.getOrderById(orderId);

      console.log(`[Worker] Order loaded: ${order.id}, Status: ${order.status}`);

      // Validate order is in PAID status
      if (order.status !== 'PAID') {
        throw new Error(`Order is not in PAID status. Current status: ${order.status}`);
      }

      await orderService.recordTrackingEvent(
        order.id,
        3,
        'processing',
        'Submitting lab order to partner system',
      );
      await orderService.publishTrackingUpdate(order.id);

      // Extract ACCESS payload from order
      const accessPayload = order.accessPayloadJson as any;

      if (!accessPayload) {
        throw new Error('Order missing accessPayloadJson');
      }

      // 2. Generate CSV file
      console.log(`[Worker] Generating CSV for order: ${orderId}`);

      const { csvContent, s3Url } = await accessCsvService.generateCsv(orderId, accessPayload);

      // 3. Upload CSV to ACCESS Lab API
      console.log(`[Worker] Uploading CSV to ACCESS Lab API`);

      const uploadResult = await accessUploadService.uploadCsv(s3Url);

      console.log(`[Worker] Upload successful, ACCESS Order ID: ${uploadResult.accessOrderId}`);

      // 4. Update order status to LAB_ORDER_PLACED
      const updatedOrder = await orderService.markLabOrderPlaced({
        orderId: order.id,
        accessOrderId: uploadResult.accessOrderId,
        requisitionPdfUrl: uploadResult.requisitionPdfUrl,
        labVisitInstructions: 'Please visit your nearest PSC lab with a photo ID.',
        accessCsv: csvContent,
        confirmedLabLocation: uploadResult.confirmedLabLocation,
      });

      if (!updatedOrder) {
        throw new Error('Failed to update order to LAB_ORDER_PLACED status');
      }

      console.log(`[Worker] Order updated to LAB_ORDER_PLACED: ${updatedOrder.id}`);

      await auditLogService.record({
        action: 'ACCESS_WORKER_ORDER_PLACED',
        resource: 'order',
        resourceId: updatedOrder.id,
        details: {
          accessOrderId: uploadResult.accessOrderId,
        },
      });

      // TODO: Send notification to user about order placement
      // TODO: Send email with requisition PDF URL

      return {
        success: true,
        orderId: updatedOrder.id,
        accessOrderId: uploadResult.accessOrderId,
      };
    } catch (error) {
      console.error(
        `[Worker] Failed to place lab order for order ${orderId}:`,
        serializeError(error),
      );

      // attemptsMade is zero-based for the current failure attempt.
      // Treat this as final failure when current attempt reaches configured attempts.
      const attempts = job.opts.attempts || 3;
      const currentAttempt = job.attemptsMade + 1;
      if (currentAttempt >= attempts) {
        console.error(`[Worker] All retries exhausted, moving paid order to manual review`);
        await orderService.markAccessPlacementNeedsReview(orderId);
        await auditLogService.record({
          action: 'ACCESS_WORKER_RETRIES_EXHAUSTED',
          resource: 'order',
          resourceId: orderId,
          status: 'failure',
          details: {
            attempts,
            currentAttempt,
          },
          errorMessage: error instanceof Error ? error.message : 'Unknown worker error',
        });
      }

      throw error; // Re-throw to trigger retry
    }
  },
  {
    connection: redisConnection,
    concurrency: 5, // Process up to 5 jobs concurrently
  },
);

// Event listeners
accessLabWorker.on('completed', (job) => {
  console.log(`[Worker] Job ${job.id} completed successfully`);
});

accessLabWorker.on('failed', (job, err) => {
  console.error(`[Worker] Job ${job?.id} failed:`, err);
});

accessLabWorker.on('error', (err) => {
  console.error('[Worker] Worker error:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[Worker] Shutting down gracefully...');
  await accessLabWorker.close();
});

console.log('[Worker] ACCESS Lab worker initialized');
