import Bull from 'bull';
import logger from '../app/utils/logger';
import { env } from './env';

/**
 * Interface for notification job data
 */
export interface NotificationJob {
  userId: string;
  notificationId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

/**
 * Interface for FCM job data
 */
export interface FCMJob {
  token: string;
  notification: {
    title: string;
    body: string;
  };
  data?: Record<string, any>;
}

/**
 * Interface for Email job data
 */
export interface EmailJob {
  to: string;
  subject: string;
  html: string;
  data?: Record<string, any>;
}

// Get Redis connection options
const redisUrl = new URL(env.REDIS_URL);

const queueOptions = {
  redis: {
    host: redisUrl.hostname,
    port: parseInt(redisUrl.port) || 6379,
    password: redisUrl.password || undefined,
  },
  settings: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // Remove completed jobs after 1 hour
      strategy: 'FIFO',
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
    },
  },
};

/**
 * Notification coordination queue
 */
export const notificationQueue = new Bull<NotificationJob>('notification', queueOptions as any);

/**
 * FCM (Firebase Cloud Messaging) queue
 * Rate limited to prevent FCM quota issues
 */
export const fcmQueue = new Bull<FCMJob>('fcm', {
  ...queueOptions,
  settings: {
    ...queueOptions.settings,
    rateLimit: {
      max: Number(env.FCM_RATE_LIMIT) || 10000, // per minute
      duration: 60000,
    },
  },
} as any);

/**
 * Email queue
 * Rate limited to prevent mail server overload
 */
export const emailQueue = new Bull<EmailJob>('email', {
  ...queueOptions,
  settings: {
    ...queueOptions.settings,
    rateLimit: {
      max: Number(env.EMAIL_RATE_LIMIT) || 100, // per minute
      duration: 60000,
    },
  },
} as any);

/**
 * Initialize queue event handlers
 */
export const initializeQueues = (): void => {
  // Notification queue events
  notificationQueue.on('completed', (job) => {
    logger.info(`✅ Notification job completed: ${job.id}`);
  });

  notificationQueue.on('failed', (job, error) => {
    logger.error(`❌ Notification job failed: ${job?.id}`, error);
  });

  // FCM queue events
  fcmQueue.on('completed', (job) => {
    logger.info(`✅ FCM job completed: ${job.id}`);
  });

  fcmQueue.on('failed', (job, error) => {
    logger.error(`❌ FCM job failed: ${job?.id}`, error);
  });

  // Email queue events
  emailQueue.on('completed', (job) => {
    logger.info(`✅ Email job completed: ${job.id}`);
  });

  emailQueue.on('failed', (job, error) => {
    logger.error(`❌ Email job failed: ${job?.id}`, error);
  });

  logger.info('✅ Bull queues initialized');
};

/**
 * Close all queues
 */
export const closeQueues = async (): Promise<void> => {
  try {
    await notificationQueue.close();
    await fcmQueue.close();
    await emailQueue.close();
    logger.info('✅ All Bull queues closed');
  } catch (error) {
    logger.error('Error closing queues:', error);
  }
};

/**
 * Get queue statistics
 */
export const getQueueStats = async () => {
  try {
    const notificationStats = {
      waiting: await notificationQueue.getWaitingCount(),
      active: await notificationQueue.getActiveCount(),
      completed: await notificationQueue.getCompletedCount(),
      failed: await notificationQueue.getFailedCount(),
    };

    const fcmStats = {
      waiting: await fcmQueue.getWaitingCount(),
      active: await fcmQueue.getActiveCount(),
      completed: await fcmQueue.getCompletedCount(),
      failed: await fcmQueue.getFailedCount(),
    };

    const emailStats = {
      waiting: await emailQueue.getWaitingCount(),
      active: await emailQueue.getActiveCount(),
      completed: await emailQueue.getCompletedCount(),
      failed: await emailQueue.getFailedCount(),
    };

    return {
      notification: notificationStats,
      fcm: fcmStats,
      email: emailStats,
    };
  } catch (error) {
    logger.error('Error getting queue stats:', error);
    return null;
  }
};
