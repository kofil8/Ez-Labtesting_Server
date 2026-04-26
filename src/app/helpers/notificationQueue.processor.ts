import { emailQueue, fcmQueue, notificationQueue } from '../../config/queue';
import redisClient from '../../config/redis';
import { getFirebaseAdmin } from '../../lib/firebaseAdmin';
import { prisma } from '../../shared/prisma';
import emailSender from '../utils/emailSender';
import logger from '../utils/logger';
import { socketManager } from './socketManager';

const frontendUrl = () => (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/+$/, '');

const appendDeliveredVia = async (notificationId: string, channel: string) => {
  const currentDeliveredVia =
    (
      await prisma.notification.findUnique({
        where: { id: notificationId },
        select: { deliveredVia: true },
      })
    )?.deliveredVia || [];

  if (!currentDeliveredVia.includes(channel)) {
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        deliveredVia: [...currentDeliveredVia, channel],
      },
    });
  }
};

const processSocketNotification = async (job: any) => {
  try {
    const { userId, notificationId, title, body, data, priority, type } = job.data;

    if (!socketManager.isUserOnline(userId)) {
      return { success: false, reason: 'user_offline' };
    }

    socketManager.emitToUser(userId, 'notification:new', {
      id: notificationId,
      userId,
      type,
      title,
      body,
      data,
      priority,
      deliveryMethod: 'socket',
    });

    if (notificationId) {
      await appendDeliveredVia(notificationId, 'socket');
    }

    logger.info(`Socket notification sent to user ${userId}`);
    return { success: true, method: 'socket' };
  } catch (error) {
    logger.error('Error processing socket notification:', error);
    throw error;
  }
};

const processFCMNotification = async (job: any) => {
  try {
    const { token, notification, data, notificationId } = job.data;
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
          link: `${frontendUrl()}${data?.clickAction || '/dashboard'}`,
        },
      },
    };

    const response = await admin.messaging().send(message);

    if (notificationId) {
      await appendDeliveredVia(notificationId, 'fcm');
    }

    logger.info(`FCM notification sent to ${token}`);
    return { success: true, response, method: 'fcm' };
  } catch (error: any) {
    logger.error('Error processing FCM notification:', error);

    if (
      error.code === 'messaging/invalid-registration-token' ||
      error.code === 'messaging/registration-token-not-registered' ||
      error.code === 'messaging/invalid-argument'
    ) {
      const { token, userId } = job.data;

      await prisma.pushToken.updateMany({
        where: { token },
        data: { revoked: true },
      });

      logger.warn(`Revoked invalid FCM token for user ${userId}`);
      return { success: false, reason: 'invalid_token_revoked' };
    }

    throw error;
  }
};

const processEmailNotification = async (job: any) => {
  try {
    const { to, subject, html, notificationId } = job.data;

    await emailSender(subject, to, html);

    if (notificationId) {
      await appendDeliveredVia(notificationId, 'email');
    }

    logger.info(`Email notification sent to ${to}`);
    return { success: true, method: 'email' };
  } catch (error) {
    logger.error('Error processing email notification:', error);
    throw error;
  }
};

const checkRateLimit = async (
  key: string,
  limit: number,
  windowMs: number = 60000,
): Promise<boolean> => {
  try {
    const current = await redisClient.incr(key);

    if (current === 1) {
      await redisClient.expire(key, Math.ceil(windowMs / 1000));
    }

    return current <= limit;
  } catch (error) {
    logger.error('Error checking rate limit:', error);
    return true;
  }
};

export const initializeQueueProcessors = () => {
  notificationQueue.process(async (job) => {
    try {
      const { userId } = job.data;
      logger.info(`Processing notification job ${job.id} for user ${userId}`);
      const socketResult = await processSocketNotification(job);
      return socketResult.success ? socketResult : { processed: true };
    } catch (error) {
      logger.error('Error processing notification job:', error);
      throw error;
    }
  });

  fcmQueue.process(10, async (job) => {
    try {
      logger.info(`Processing FCM job ${job.id}`);
      const isWithinLimit = await checkRateLimit(
        'fcm_rate_limit',
        Number(process.env.FCM_RATE_LIMIT) || 10000,
        60000,
      );

      if (!isWithinLimit) {
        throw new Error('Rate limit exceeded');
      }

      return await processFCMNotification(job);
    } catch (error) {
      logger.error('Error processing FCM job:', error);
      throw error;
    }
  });

  emailQueue.process(5, async (job) => {
    try {
      logger.info(`Processing email job ${job.id}`);
      const isWithinLimit = await checkRateLimit(
        'email_rate_limit',
        Number(process.env.EMAIL_RATE_LIMIT) || 100,
        60000,
      );

      if (!isWithinLimit) {
        throw new Error('Rate limit exceeded');
      }

      return await processEmailNotification(job);
    } catch (error) {
      logger.error('Error processing email job:', error);
      throw error;
    }
  });

  notificationQueue.on('error', (error) => {
    logger.error('Notification queue error:', error);
  });

  fcmQueue.on('error', (error) => {
    logger.error('FCM queue error:', error);
  });

  emailQueue.on('error', (error) => {
    logger.error('Email queue error:', error);
  });

  logger.info('Queue processors initialized');
};

export { processEmailNotification, processFCMNotification, processSocketNotification };
