import { emailQueue, fcmQueue, notificationQueue } from '../../config/queue';
import redisClient from '../../config/redis';
import { getFirebaseAdmin } from '../../lib/firebaseAdmin';
import { prisma } from '../../shared/prisma';
import emailSender from '../utils/emailSender';
import logger from '../utils/logger';
import { socketManager } from './socketManager';

/**
 * Process socket notification delivery
 * Check if user is online and emit real-time notification
 */
const processSocketNotification = async (job: any) => {
  try {
    const { userId, notificationId, title, body, data, priority } = job.data;

    // Check if user is online
    if (socketManager.isUserOnline(userId)) {
      // Emit notification to user
      socketManager.emitToUser(userId, 'notification:new', {
        id: notificationId,
        title,
        body,
        data,
        priority,
        deliveryMethod: 'socket',
      });

      // Update notification delivery method
      const currentDeliveredVia =
        (
          await prisma.notification.findUnique({
            where: { id: notificationId },
            select: { deliveredVia: true },
          })
        )?.deliveredVia || [];

      if (!currentDeliveredVia.includes('socket')) {
        await prisma.notification.update({
          where: { id: notificationId },
          data: {
            deliveredVia: [...currentDeliveredVia, 'socket'],
          },
        });
      }

      logger.info(`✅ Socket notification sent to user ${userId}`);
      return { success: true, method: 'socket' };
    }

    return { success: false, reason: 'user_offline' };
  } catch (error) {
    logger.error('Error processing socket notification:', error);
    throw error;
  }
};

/**
 * Process FCM (Firebase Cloud Messaging) notification delivery
 * Send push notification to user's device
 */
const processFCMNotification = async (job: any) => {
  try {
    const { token, notification, data, notificationId, userId } = job.data;

    const admin = getFirebaseAdmin();

    const message = {
      token,
      notification,
      data: data || {},
      webpush: {
        notification: {
          title: notification.title,
          body: notification.body,
          icon: '/logo.png',
        },
        fcmOptions: {
          link: 'https://app.example.com/', // Update with actual client URL
        },
      },
    };

    const response = await admin.messaging().send(message);

    // Update notification delivery method
    if (notificationId) {
      const currentDeliveredVia =
        (
          await prisma.notification.findUnique({
            where: { id: notificationId },
            select: { deliveredVia: true },
          })
        )?.deliveredVia || [];

      if (!currentDeliveredVia.includes('fcm')) {
        await prisma.notification.update({
          where: { id: notificationId },
          data: {
            deliveredVia: [...currentDeliveredVia, 'fcm'],
          },
        });
      }
    }

    logger.info(`✅ FCM notification sent to ${token}`);
    return { success: true, response, method: 'fcm' };
  } catch (error: any) {
    logger.error('Error processing FCM notification:', error);

    // Handle invalid tokens
    if (
      error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered'
    ) {
      const { token, userId } = job.data;

      // Remove invalid token from database
      await prisma.pushToken.deleteMany({
        where: { token },
      });

      logger.warn(`🗑️ Removed invalid FCM token for user ${userId}`);
      return { success: false, reason: 'invalid_token_removed' };
    }

    throw error;
  }
};

/**
 * Process email notification delivery
 * Send email to user
 */
const processEmailNotification = async (job: any) => {
  try {
    const { to, subject, html, notificationId } = job.data;

    await emailSender(subject, to, html);

    // Update notification delivery method
    if (notificationId) {
      const currentDeliveredVia =
        (
          await prisma.notification.findUnique({
            where: { id: notificationId },
            select: { deliveredVia: true },
          })
        )?.deliveredVia || [];

      if (!currentDeliveredVia.includes('email')) {
        await prisma.notification.update({
          where: { id: notificationId },
          data: {
            deliveredVia: [...currentDeliveredVia, 'email'],
          },
        });
      }
    }

    logger.info(`✅ Email notification sent to ${to}`);
    return { success: true, method: 'email' };
  } catch (error) {
    logger.error('Error processing email notification:', error);
    throw error;
  }
};

/**
 * Check and enforce rate limiting
 * Uses Redis to track rate limits
 */
const checkRateLimit = async (
  key: string,
  limit: number,
  windowMs: number = 60000,
): Promise<boolean> => {
  try {
    const current = await redisClient.incr(key);

    if (current === 1) {
      // Set expiry for the first request
      await redisClient.expire(key, Math.ceil(windowMs / 1000));
    }

    return current <= limit;
  } catch (error) {
    logger.error('Error checking rate limit:', error);
    // Allow request if rate limit check fails
    return true;
  }
};

/**
 * Initialize all queue processors
 */
export const initializeQueueProcessors = () => {
  /**
   * Notification queue processor
   * Routes notifications to appropriate delivery channels
   */
  notificationQueue.process(async (job) => {
    try {
      const { userId, notificationId } = job.data;

      logger.info(`⚙️ Processing notification job ${job.id} for user ${userId}`);

      // Try socket delivery first if user is online
      const socketResult = await processSocketNotification(job);

      if (socketResult.success) {
        return socketResult;
      }

      return { processed: true };
    } catch (error) {
      logger.error('Error processing notification job:', error);
      throw error;
    }
  });

  /**
   * FCM queue processor
   * Sends push notifications to devices
   */
  fcmQueue.process(10, async (job) => {
    try {
      logger.info(`⚙️ Processing FCM job ${job.id}`);

      // Check rate limit
      const isWithinLimit = await checkRateLimit('fcm_rate_limit', 10000, 60000);

      if (!isWithinLimit) {
        logger.warn('FCM rate limit exceeded, will retry automatically');
        throw new Error('Rate limit exceeded'); // Bull will auto-retry
      }

      return await processFCMNotification(job);
    } catch (error) {
      logger.error('Error processing FCM job:', error);
      throw error;
    }
  });

  /**
   * Email queue processor
   * Sends email notifications
   */
  emailQueue.process(5, async (job) => {
    try {
      logger.info(`⚙️ Processing email job ${job.id}`);

      // Check rate limit
      const isWithinLimit = await checkRateLimit('email_rate_limit', 100, 60000);

      if (!isWithinLimit) {
        logger.warn('Email rate limit exceeded, will retry automatically');
        throw new Error('Rate limit exceeded'); // Bull will auto-retry
      }

      return await processEmailNotification(job);
    } catch (error) {
      logger.error('Error processing email job:', error);
      throw error;
    }
  });

  /**
   * Global error handlers
   */
  notificationQueue.on('error', (error) => {
    logger.error('Notification queue error:', error);
  });

  fcmQueue.on('error', (error) => {
    logger.error('FCM queue error:', error);
  });

  emailQueue.on('error', (error) => {
    logger.error('Email queue error:', error);
  });

  logger.info('✅ Queue processors initialized');
};

/**
 * Export processor functions for testing
 */
export { processEmailNotification, processFCMNotification, processSocketNotification };
