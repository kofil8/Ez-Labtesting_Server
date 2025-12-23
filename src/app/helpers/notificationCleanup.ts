import cron, { ScheduledTask } from 'node-cron';
import { prisma } from '../../shared/prisma';
import logger from '../utils/logger';

let cronJob: ScheduledTask | null = null;

/**
 * Delete expired notifications from database
 */
export const deleteExpiredNotifications = async (): Promise<number> => {
  try {
    const now = new Date();
    const result = await prisma.notification.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    if (result.count > 0) {
      logger.info(`🧹 Deleted ${result.count} expired notifications at ${now.toISOString()}`);
    }

    return result.count;
  } catch (error) {
    logger.error('Error deleting expired notifications:', error);
    return 0;
  }
};

/**
 * Start the notification cleanup cron job
 * Runs daily at 2 AM
 */
export const startNotificationCleanup = (): void => {
  try {
    // Run at 2:00 AM every day
    cronJob = cron.schedule('0 2 * * *', async () => {
      await deleteExpiredNotifications();
    });

    logger.info('✅ Notification cleanup job scheduled (daily at 2 AM)');
  } catch (error) {
    logger.error('Error starting notification cleanup:', error);
  }
};

/**
 * Stop the notification cleanup cron job
 */
export const stopNotificationCleanup = (): void => {
  try {
    if (cronJob) {
      cronJob.stop();
      cronJob.destroy();
      cronJob = null;
      logger.info('🛑 Notification cleanup job stopped');
    }
  } catch (error) {
    logger.error('Error stopping notification cleanup:', error);
  }
};

/**
 * Trigger immediate cleanup (for manual runs)
 */
export const triggerImmediateCleanup = async (): Promise<number> => {
  try {
    const count = await deleteExpiredNotifications();
    return count;
  } catch (error) {
    logger.error('Error in immediate cleanup:', error);
    return 0;
  }
};
