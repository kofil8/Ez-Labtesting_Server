import { Worker } from 'bullmq';
import { Role } from '@prisma/client';
import { env } from '../../config/env';
import prisma from '../../shared/prisma';
import sentEmailUtility from '../utils/sentEmailUtility';

const redisUrl = new URL(env.REDIS_URL || 'redis://127.0.0.1:6379');
const connection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port, 10),
  password: redisUrl.password || undefined,
};

export const manualReviewEmailWorker = new Worker(
  'manual-review-email',
  async (job) => {
    const recipientsFromEnv = (env.ADMIN_REVIEW_EMAILS || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    const recipients =
      recipientsFromEnv.length > 0
        ? recipientsFromEnv
        : (
            await prisma.user.findMany({
              where: { role: { in: [Role.ADMIN, Role.SUPER_ADMIN] } },
              select: { email: true },
            })
          ).map((user) => user.email);

    if (!recipients.length) {
      return { skipped: true };
    }

    const subject = `Manual review requested for order ${job.data.orderNumber}`;
    const html = `
      <p>A customer requested manual review.</p>
      <p>Order: ${job.data.orderNumber}</p>
      <p>Ticket: ${job.data.ticketNumber}</p>
      <p>Reason: ${job.data.reason}</p>
    `;

    await Promise.all(
      recipients.map((email) => sentEmailUtility(email, subject, subject, html)),
    );

    return { sent: recipients.length };
  },
  { connection, concurrency: 3 },
);
