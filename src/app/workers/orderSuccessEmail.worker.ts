import { Worker } from 'bullmq';
import { env } from '../../config/env';
import { orderService } from '../modules/orders/orders.service';
import sentEmailUtility from '../utils/sentEmailUtility';

const redisUrl = new URL(env.REDIS_URL || 'redis://127.0.0.1:6379');
const connection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port, 10),
  password: redisUrl.password || undefined,
};

export const orderSuccessEmailWorker = new Worker(
  'order-success-email',
  async (job) => {
    const order = await orderService.getOrderById(job.data.orderId);
    if (!order.customerEmailSnapshot || order.orderStatus !== 'REQUISITION_READY') {
      return { skipped: true };
    }

    const subject = `Your order ${order.orderNumber} is ready`;
    const html = `
      <p>Your laboratory order has been submitted successfully.</p>
      <p>Order: ${order.orderNumber}</p>
      <p>Payment total: ${order.total} ${order.currency}</p>
      <p>Requisition: ${order.requisitionPdfUrl || 'Available in your account shortly'}</p>
    `;

    await sentEmailUtility(order.customerEmailSnapshot, subject, subject, html);
    return { sent: true };
  },
  { connection, concurrency: 3 },
);
