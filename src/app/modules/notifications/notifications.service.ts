import {
  Notification,
  NotificationPriority,
  NotificationType,
  Prisma,
  Role,
} from '@prisma/client';
import { emailQueue, fcmQueue } from '../../../config/queue';
import { getFirebaseMessaging } from '../../../lib/firebaseAdmin';
import prisma from '../../../shared/prisma';
import { socketManager } from '../../helpers/socketManager';
import logger from '../../utils/logger';
import { renderNotificationTemplate, validateTemplateData } from '../../utils/templateRenderer';

const appUrl = (process.env.FRONTEND_URL || 'https://ezlabtesting.com').replace(/\/+$/, '');

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
  PAYMENT_SUCCEEDED: 'HIGH',
  PAYMENT_FAILED: 'HIGH',
  REQUISITION_READY: 'HIGH',
  LAB_SUBMISSION_FAILED: 'HIGH',
  MANUAL_REVIEW_REQUIRED: 'HIGH',
};

const emailCriticalTypes = new Set<NotificationType>([
  'ORDER_CONFIRMED',
  'ORDER_COMPLETED',
  'RESULTS_READY',
  'RESULTS_ABNORMAL',
  'APPOINTMENT_SCHEDULED',
  'APPOINTMENT_REMINDER',
  'SYSTEM_ALERT',
  'ACCOUNT_VERIFIED',
  'PASSWORD_RESET',
  'PAYMENT_FAILED',
  'LAB_SUBMISSION_FAILED',
  'MANUAL_REVIEW_REQUIRED',
]);

const invalidFcmTokenCodes = new Set([
  'messaging/registration-token-not-registered',
  'messaging/invalid-registration-token',
  'messaging/invalid-argument',
]);

type NotificationData = Record<string, any>;

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

type RenderedEmail = {
  subject: string;
  html: string;
};

const isRecord = (value: unknown): value is Record<string, any> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const toRecord = (value: Prisma.JsonValue | null | undefined): NotificationData =>
  isRecord(value) ? { ...value } : {};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const normalizeFcmValue = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const stringifyFcmData = (data: NotificationData): Record<string, string> => {
  const serialized: Record<string, string> = {};

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      serialized[key] = normalizeFcmValue(value);
    }
  });

  return serialized;
};

const buildDefaultClickAction = (type: NotificationType, data: NotificationData) => {
  const existing = data.clickAction;
  if (typeof existing === 'string' && existing.trim()) {
    return existing;
  }

  const orderId =
    typeof data.orderUuid === 'string'
      ? data.orderUuid
      : typeof data.orderId === 'string'
        ? data.orderId
        : null;
  if (
    orderId &&
    [
      'ORDER_CREATED',
      'ORDER_CONFIRMED',
      'ORDER_CANCELLED',
      'ORDER_COMPLETED',
      'ORDER_IN_PROGRESS',
      'RESULTS_READY',
      'RESULTS_ABNORMAL',
      'PAYMENT_SUCCEEDED',
      'PAYMENT_FAILED',
      'REQUISITION_READY',
      'LAB_SUBMISSION_FAILED',
      'MANUAL_REVIEW_REQUIRED',
    ].includes(type)
  ) {
    return `/dashboard/customer/results/${orderId}`;
  }

  return '/dashboard';
};

const formatNotificationPayload = (notification: Notification) => ({
  id: notification.id,
  userId: notification.userId,
  type: notification.type,
  title: notification.title,
  body: notification.body,
  data: toRecord(notification.data),
  priority: notification.priority,
  isRead: notification.isRead,
  readAt: notification.readAt,
  createdAt: notification.createdAt,
  sentAt: notification.sentAt,
});

const buildFcmData = (notification: Notification): Record<string, string> => {
  const data = toRecord(notification.data);
  const clickAction = buildDefaultClickAction(notification.type, data);

  return stringifyFcmData({
    ...data,
    notificationId: notification.id,
    userId: notification.userId,
    type: notification.type,
    priority: notification.priority,
    clickAction,
    createdAt: notification.createdAt.toISOString(),
    sentAt: notification.sentAt.toISOString(),
  });
};

const buildCustomEmail = (title: string, body: string): RenderedEmail => ({
  subject: title,
  html: `<p>${escapeHtml(body || title)}</p>`,
});

const getJobPriority = (priority: NotificationPriority) =>
  priority === 'HIGH' ? 1 : priority === 'LOW' ? 3 : 2;

const addDeliveredVia = async (notificationId: string, channel: string) => {
  const existing = await prisma.notification.findUnique({
    where: { id: notificationId },
    select: { deliveredVia: true },
  });

  if (!existing || existing.deliveredVia.includes(channel)) {
    return;
  }

  await prisma.notification.update({
    where: { id: notificationId },
    data: {
      deliveredVia: [...existing.deliveredVia, channel],
    },
  });
};

const getTemplateVariables = (variables: Prisma.JsonValue): any[] => {
  if (Array.isArray(variables)) {
    return variables;
  }

  if (typeof variables === 'string') {
    try {
      const parsed = JSON.parse(variables);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

export const NotificationService = {
  formatNotificationPayload,
  buildFcmData,

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

  async unregisterToken(userId: string, token: string) {
    return prisma.pushToken.updateMany({
      where: { userId, token },
      data: { revoked: true },
    });
  },

  async sendToToken(token: string, title: string, body: string, data: Record<string, string> = {}) {
    const message = {
      token,
      notification: { title, body },
      data: stringifyFcmData({
        ...data,
        clickAction: data.clickAction || '/dashboard',
      }),
      webpush: {
        notification: {
          title,
          body,
          icon: '/logo.png',
        },
        fcmOptions: {
          link: `${appUrl}${data.clickAction || '/dashboard'}`,
        },
      },
    };

    try {
      const response = await getFirebaseMessaging().send(message);
      return { success: true, response };
    } catch (error: any) {
      if (invalidFcmTokenCodes.has(error?.code)) {
        await prisma.pushToken.updateMany({
          where: { token },
          data: { revoked: true },
        });
      }

      logger.error('sendToToken FCM Error:', error);
      return { success: false, error: error?.message || 'Failed to send notification' };
    }
  },

  async sendToUser(userId: string, title: string, body: string, data: Record<string, any> = {}) {
    const notification = await this.sendCustomNotification(
      userId,
      'ADMIN_ANNOUNCEMENT',
      title,
      body,
      data,
    );

    return {
      success: true,
      notification: formatNotificationPayload(notification),
    };
  },

  async createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data?: NotificationData,
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (user.role === Role.CUSTOMER ? 90 : 365));

    return prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        data: data === undefined ? undefined : (data as Prisma.InputJsonValue),
        priority: priorityMapping[type] || 'MEDIUM',
        expiresAt,
      },
    });
  },

  async dispatchNotification(notification: Notification, email?: RenderedEmail | null) {
    const payload = formatNotificationPayload(notification);
    const socketDelivered = socketManager.emitToUser(notification.userId, 'notification:new', payload);

    if (socketDelivered) {
      await addDeliveredVia(notification.id, 'socket');

      const unreadCount = await this.getUnreadCount(notification.userId);
      socketManager.emitToUser(notification.userId, 'notification:count-update', {
        unreadCount,
      });
    }

    const tokens = await prisma.pushToken.findMany({
      where: { userId: notification.userId, revoked: false },
      select: { token: true },
    });

    const fcmData = buildFcmData(notification);
    await Promise.all(
      tokens.map(({ token }) =>
        fcmQueue.add(
          {
            token,
            notificationId: notification.id,
            userId: notification.userId,
            type: notification.type,
            notification: {
              title: notification.title,
              body: notification.body,
            },
            data: fcmData,
          },
          {
            priority: getJobPriority(notification.priority),
            attempts: 3,
          },
        ),
      ),
    );

    if (emailCriticalTypes.has(notification.type) && email) {
      const user = await prisma.user.findUnique({
        where: { id: notification.userId },
        select: { email: true },
      });

      if (user?.email) {
        await emailQueue.add(
          {
            to: user.email,
            subject: email.subject,
            html: email.html,
            notificationId: notification.id,
          },
          {
            priority: 1,
            attempts: 3,
          },
        );
      }
    }

    return notification;
  },

  async sendTemplateNotification(
    userId: string,
    type: NotificationType,
    templateData: NotificationData = {},
  ) {
    const template = await prisma.notificationTemplate.findUnique({
      where: { type },
    });

    if (!template || !template.isActive) {
      throw new Error(`Notification template not found or inactive: ${type}`);
    }

    const templateVars = getTemplateVariables(template.variables);
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

    await this.dispatchNotification(notification, {
      subject: rendered.emailSubject,
      html: rendered.emailBody,
    });

    logger.info(`Notification dispatched: ${type} to user ${userId}`);
    return notification;
  },

  async sendCustomNotification(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data: NotificationData = {},
    email?: RenderedEmail | null,
  ) {
    const notification = await this.createNotification(userId, type, title, body, data);
    await this.dispatchNotification(notification, email || buildCustomEmail(title, body));
    logger.info(`Custom notification dispatched: ${type} to user ${userId}`);
    return notification;
  },

  async sendNotification(
    userId: string,
    type: NotificationType,
    templateData: NotificationData = {},
  ) {
    return this.sendTemplateNotification(userId, type, templateData);
  },

  async sendBulkNotification(
    type: NotificationType,
    templateData: NotificationData = {},
    targetRoles?: string[],
  ) {
    const users = await prisma.user.findMany({
      where: targetRoles?.length ? { role: { in: targetRoles as Role[] } } : undefined,
      select: { id: true },
    });

    logger.info(`Sending bulk notification ${type} to ${users.length} users`);

    const batchSize = 50;
    let sentCount = 0;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map((user) => this.sendTemplateNotification(user.id, type, templateData)),
      );

      sentCount += results.filter((result) => result.status === 'fulfilled').length;
      results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .forEach((result) => logger.error('Bulk notification failed:', result.reason));
    }

    return {
      success: true,
      totalQueued: sentCount,
      totalUsers: users.length,
      type,
    };
  },

  async getNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    filters?: {
      type?: NotificationType;
      isRead?: boolean;
    },
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.NotificationWhereInput = {
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
      data: notifications.map(formatNotificationPayload),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  async markAsRead(userId: string, notificationId: string) {
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

    return formatNotificationPayload(notification);
  },

  async markAllAsRead(userId: string) {
    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    socketManager.emitToUser(userId, 'notification:count-update', {
      unreadCount: 0,
    });

    return { success: true };
  },

  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
        expiresAt: { gt: new Date() },
      },
    });
  },

  async deleteNotification(userId: string, notificationId: string) {
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
  },

  async sendOrderNotification(userId: string, data: OrderNotification) {
    return this.sendTemplateNotification(userId, 'ORDER_CREATED', data);
  },

  async sendDiscountNotification(userId: string, data: DiscountNotification) {
    return this.sendTemplateNotification(userId, 'NEW_DISCOUNT', data);
  },

  async sendLabCenterNotification(
    userId: string,
    type: 'LAB_CENTER_UPDATED' | 'LAB_CENTER_CLOSED',
    data: NotificationData,
  ) {
    return this.sendTemplateNotification(userId, type, data);
  },

  async sendSystemAlert(userId: string, data: NotificationData) {
    return this.sendTemplateNotification(userId, 'SYSTEM_ALERT', data);
  },

  async sendResultsReady(userId: string, data: NotificationData) {
    return this.sendTemplateNotification(userId, 'RESULTS_READY', data);
  },
};
