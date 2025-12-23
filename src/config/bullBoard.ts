import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { emailQueue, fcmQueue, notificationQueue } from './queue';

/**
 * Initialize Bull Board monitoring dashboard
 * Access at /admin/queues
 */
export const initializeBullBoard = () => {
  const serverAdapter = new ExpressAdapter();

  createBullBoard({
    queues: [
      new BullAdapter(notificationQueue),
      new BullAdapter(fcmQueue),
      new BullAdapter(emailQueue),
    ],
    serverAdapter,
  });

  serverAdapter.setBasePath('/admin/queues');

  return serverAdapter.getRouter();
};
