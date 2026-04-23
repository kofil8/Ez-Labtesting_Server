import { NotificationPriority, NotificationType } from '@prisma/client';
import { emailQueue, fcmQueue, notificationQueue } from '../../../config/queue';
import { getFirebaseAdmin } from '../../../lib/firebaseAdmin';
import prisma from '../../../shared/prisma';
import { socketManager } from '../../helpers/socketManager';
import logger from '../../utils/logger';
import { renderNotificationTemplate, validateTemplateData } from '../../utils/templateRenderer';

const admin = getFirebaseAdmin();
const appUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

// Priority mapping for notification types
const priorityMapping: Record<NotificationType, NotificationPriority> = {
  ORDER_CREATED: 'MEDIUM',
  ORDER_CONFIRMED: 'HIGH',
  ORDER_CANCELLED: 'MEDIUM',
  ORDER_IN_PROGRESS: 'MEDIUM',
  ORDER_COMPLETED: 'HIGH',
  RESULTS_READY: 'HIGH',
  RESULTS_ABNORMAL: 'HIGH',
  APPOINTMENT_SCHEDULED: 'HIGH',
  APPOINTMENT_REMINDER: 'HIGH',
  NEW_DISCOUNT: 'LOW',
  DISCOUNT_EXPIRING: 'MEDIUM',
  LAB_CENTER_UPDATED: 'LOW',
  LAB_CENTER_CLOSED: 'HIGH',
  SYSTEM_ALERT: 'HIGH',
  ADMIN_ANNOUNCEMENT: 'MEDIUM',
  WELCOME: 'MEDIUM',
  ACCOUNT_VERIFIED: 'HIGH',
  PASSWORD_RESET: 'HIGH',
};

// Email critical types - always send email
const emailCriticalTypes: NotificationType[] = [
  'ORDER_CONFIRMED',
  'ORDER_COMPLETED',
  'RESULTS_READY',
  'RESULTS_ABNORMAL',
  'APPOINTMENT_SCHEDULED',
  'APPOINTMENT_REMINDER',
  'SYSTEM_ALERT',
  'ACCOUNT_VERIFIED',
  'PASSWORD_RESET',
];

export interface OrderNotification {
  orderId: string;
  userName: string;
  amount?: string;
  testCount?: string;
  appointmentDate?: string;
  [key: string]: any;
}

export interface DiscountNotification {
  userName: string;
  discountPercentage: string;
  discountName: string;
  expiryDate: string;
  couponCode: string;
  offerLink: string;
  [key: string]: any;
}

export const NotificationService = {
  /* -------------------------------------------------------
     REGISTER TOKEN
  ------------------------------------------------------- */
  async registerToken(userId: string, token: string, platform = 'web') {
    return prisma.pushToken.upsert({
      where: { token },
      update: {
        userId,
        platform,
        revoked: false,
      },
      create: {
        userId,
        token,
        platform,
        revoked: false,
      },
    });
  },

  /* -------------------------------------------------------
     UNREGISTER TOKEN
  ------------------------------------------------------- */
  async unregisterToken(userId: string, token: string) {
    return prisma.pushToken.updateMany({
      where: { userId, token },
      data: { revoked: true },
    });
  },

  /* -------------------------------------------------------
     SEND TO A SINGLE TOKEN (Legacy)
  ------------------------------------------------------- */
  async sendToToken(token: string, title: string, body: string, data: Record<string, string> = {}) {
    const message = {
      token,
      notification: { title, body },
      data,
      webpush: {
        notification: {
          title,
          body,
          icon: '/logo.png',
        },
        fcmOptions: {
          link: `${appUrl}/account/notifications`,
        },
      },
    };

    try {
      const response = await admin.messaging().send(message);
      return { success: true, response };
    } catch (error: any) {
      const code = error?.code;

      if (
        code === 'messaging/registration-token-not-registered' ||
        code === 'messaging/invalid-registration-token'
      ) {
        await prisma.pushToken.updateMany({
          where: { token },
          data: { revoked: true },
        });
      }

      logger.error('sendToToken FCM Error:', error);
      return { success: false, error: error?.message || 'Failed to send notification' };
    }
  },

  /* -------------------------------------------------------
     SEND TO ALL DEVICES OF A USER (Legacy)
  ------------------------------------------------------- */
  async sendToUser(userId: string, title: string, body: string, data: Record<string, string> = {}) {
    const tokens = await prisma.pushToken.findMany({
      where: { userId, revoked: false },
    });

    if (!tokens.length) {
      return { success: false, message: 'No tokens found' };
    }

    const tokenList = tokens.map((t) => t.token);

    const multicastMessage = {
      tokens: tokenList,
      notification: { title, body },
      data,
      webpush: {
        notification: {
          title,
          body,
          icon: '/logo.png',
        },
        fcmOptions: {
          link: `${appUrl}/account/notifications`,
        },
      },
    };

    const response = await admin.messaging().sendEachForMulticast(multicastMessage);

    const invalidTokens: string[] = [];

    response.responses.forEach((resp, index) => {
      if (!resp.success) {
        const errCode = (resp.error as any)?.code;

        if (
          errCode === 'messaging/registration-token-not-registered' ||
          errCode === 'messaging/invalid-registration-token' ||
          errCode === 'messaging/invalid-argument'
        ) {
          invalidTokens.push(tokenList[index]);
        }
      }
    });

    if (invalidTokens.length) {
      await prisma.pushToken.updateMany({
        where: { token: { in: invalidTokens } },
        data: { revoked: true },
      });
    }

    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  },

  /* -------------------------------------------------------
     CREATE NOTIFICATION
  ------------------------------------------------------- */
  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: Record<string, any>,
  ) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const expiryDate = new Date();
      if (user.role === 'CUSTOMER') {
        expiryDate.setDate(expiryDate.getDate() + 90);
      } else {
        expiryDate.setDate(expiryDate.getDate() + 365);
      }

      const priority = priorityMapping[type] || 'MEDIUM';

      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          body,
          data: data ?? undefined,
          priority,
          expiresAt: expiryDate,
        },
      });

      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  },

  /* -------------------------------------------------------
     SEND NOTIFICATION (Full workflow)
  ------------------------------------------------------- */
  async sendNotification(
    userId: string,
    type: NotificationType,
    templateData: Record<string, any> = {},
  ) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, role: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const template = await prisma.notificationTemplate.findUnique({
        where: { type },
      });

      if (!template || !template.isActive) {
        throw new Error(`Notification template not found or inactive: ${type}`);
      }

      let templateVars: any[] = [];
      if (Array.isArray(template.variables)) {
        templateVars = template.variables;
      } else if (typeof template.variables === 'string') {
        try {
          templateVars = JSON.parse(template.variables);
        } catch {
          templateVars = [];
        }
      }

      const validation = validateTemplateData(templateData, templateVars);
      if (!validation.valid) {
        logger.warn(
          `Missing template variables for ${type}: ${validation.missingVariables.join(', ')}`,
        );
      }

      const rendered = renderNotificationTemplate(template, templateData);

      const notification = await this.createNotification(
        userId,
        type,
        rendered.pushTitle,
        rendered.pushBody,
        templateData,
      );

      const priority = priorityMapping[type] || 'MEDIUM';
      const isCritical = emailCriticalTypes.includes(type);
      const isOnline = socketManager.isUserOnline(userId);

      if (isOnline) {
        socketManager.emitToUser(userId, 'notification:new', {
          id: notification.id,
          type,
          title: rendered.pushTitle,
          body: rendered.pushBody,
          data: templateData,
          priority,
        });

        const unreadCount = await this.getUnreadCount(userId);
        socketManager.emitToUser(userId, 'notification:count-update', {
          unreadCount,
        });

        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            deliveredVia: ['socket'],
          },
        });
      }

      if (!isOnline) {
        const tokens = await prisma.pushToken.findMany({
          where: { userId, revoked: false },
        });

        if (tokens.length > 0) {
          for (const token of tokens) {
            const jobData = {
              token: token.token,
              notification: {
                title: rendered.pushTitle,
                body: rendered.pushBody,
              },
              data: templateData,
            };
            const jobOptions = {
              priority: priority === 'HIGH' ? 1 : priority === 'LOW' ? 3 : 2,
              attempts: 3,
            };
            await fcmQueue.add(jobData, jobOptions);
          }
        }
      }

      if (isCritical || priority === 'HIGH') {
        const emailJobData = {
          to: user.email,
          subject: rendered.emailSubject,
          html: rendered.emailBody,
        };
        const emailJobOptions = {
          priority: 1,
          attempts: 3,
        };
        await emailQueue.add(emailJobData, emailJobOptions);
      }

      logger.info(`✅ Notification sent: ${type} to user ${userId}`);

      return notification;
    } catch (error) {
      logger.error('Error sending notification:', error);
      throw error;
    }
  },

  /* -------------------------------------------------------
     SEND BULK NOTIFICATION (Admin broadcast)
  ------------------------------------------------------- */
  async sendBulkNotification(
    type: NotificationType,
    templateData: Record<string, any> = {},
    targetRoles?: string[],
  ) {
    try {
      const template = await prisma.notificationTemplate.findUnique({
        where: { type },
      });

      if (!template || !template.isActive) {
        throw new Error(`Template not found or inactive: ${type}`);
      }

      const rendered = renderNotificationTemplate(template, templateData);

      const users = await prisma.user.findMany({
        where: targetRoles ? { role: { in: targetRoles as any } } : undefined,
        select: { id: true, email: true },
      });

      logger.info(`📢 Sending bulk notification ${type} to ${users.length} users`);

      const batchSize = 100;
      let sentCount = 0;

      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);

        const jobs = batch.map((user) => {
          const notifJobData = {
            userId: user.id,
            notificationId: '',
            type,
            title: rendered.pushTitle,
            body: rendered.pushBody,
            data: templateData,
            priority: 'LOW' as const,
          };
          const notifJobOptions = {
            priority: 3,
            attempts: 3,
            delay: i * 100,
          };
          return notificationQueue.add(notifJobData, notifJobOptions);
        });

        await Promise.all(jobs);
        sentCount += batch.length;

        logger.info(`📢 Queued ${sentCount}/${users.length} notifications`);
      }

      return {
        success: true,
        totalQueued: sentCount,
        type,
      };
    } catch (error) {
      logger.error('Error sending bulk notification:', error);
      throw error;
    }
  },

  /* -------------------------------------------------------
     GET NOTIFICATIONS (with pagination)
  ------------------------------------------------------- */
  async getNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      type?: NotificationType;
      isRead?: boolean;
    },
  ) {
    try {
      const skip = (page - 1) * limit;

      const where: any = {
        userId,
        expiresAt: { gt: new Date() },
      };

      if (filters?.type) where.type = filters.type;
      if (filters?.isRead !== undefined) where.isRead = filters.isRead;

      const [notifications, total] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.notification.count({ where }),
      ]);

      return {
        data: notifications,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting notifications:', error);
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }
  },

  /* -------------------------------------------------------
     MARK AS READ
  ------------------------------------------------------- */
  async markAsRead(userId: string, notificationId: string) {
    try {
      const existing = await prisma.notification.findFirst({
        where: { id: notificationId, userId },
      });

      if (!existing) {
        throw new Error('Notification not found or unauthorized');
      }

      const notification = await prisma.notification.update({
        where: { id: notificationId },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });

      socketManager.emitToUser(userId, 'notification:read', {
        id: notificationId,
      });

      const unreadCount = await this.getUnreadCount(userId);
      socketManager.emitToUser(userId, 'notification:count-update', {
        unreadCount,
      });

      return notification;
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  },

  /* -------------------------------------------------------
     MARK ALL AS READ
  ------------------------------------------------------- */
  async markAllAsRead(userId: string) {
    try {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true, readAt: new Date() },
      });

      socketManager.emitToUser(userId, 'notification:count-update', {
        unreadCount: 0,
      });

      logger.info(`✅ All notifications marked as read for user ${userId}`);
      return { success: true };
    } catch (error) {
      logger.error('Error marking all as read:', error);
      throw error;
    }
  },

  /* -------------------------------------------------------
     GET UNREAD COUNT
  ------------------------------------------------------- */
  async getUnreadCount(userId: string) {
    try {
      const count = await prisma.notification.count({
        where: {
          userId,
          isRead: false,
          expiresAt: { gt: new Date() },
        },
      });

      return count;
    } catch (error) {
      logger.error('Error getting unread count:', error);
      return 0;
    }
  },

  /* -------------------------------------------------------
     DELETE NOTIFICATION
  ------------------------------------------------------- */
  async deleteNotification(userId: string, notificationId: string) {
    try {
      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification || notification.userId !== userId) {
        throw new Error('Unauthorized');
      }

      await prisma.notification.delete({
        where: { id: notificationId },
      });

      const unreadCount = await this.getUnreadCount(userId);
      socketManager.emitToUser(userId, 'notification:count-update', {
        unreadCount,
      });

      return { success: true };
    } catch (error) {
      logger.error('Error deleting notification:', error);
      throw error;
    }
  },

  /* -------------------------------------------------------
     HELPER METHODS
  ------------------------------------------------------- */
  async sendOrderNotification(userId: string, data: OrderNotification) {
    return this.sendNotification(userId, 'ORDER_CREATED', data);
  },

  async sendDiscountNotification(userId: string, data: DiscountNotification) {
    return this.sendNotification(userId, 'NEW_DISCOUNT', data);
  },

  async sendLabCenterNotification(
    userId: string,
    type: 'LAB_CENTER_UPDATED' | 'LAB_CENTER_CLOSED',
    data: Record<string, any>,
  ) {
    return this.sendNotification(userId, type, data);
  },

  async sendSystemAlert(userId: string, data: Record<string, any>) {
    return this.sendNotification(userId, 'SYSTEM_ALERT', data);
  },
};
