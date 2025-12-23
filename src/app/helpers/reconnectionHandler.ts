import { env } from '../../config/env';
import { getIO } from '../../config/socket';
import { prisma } from '../../shared/prisma';
import logger from '../utils/logger';
import { socketManager } from './socketManager';

/**
 * Get missed notifications for a user within the reconnection window
 * @param userId - User ID
 * @param lastDisconnectedAt - Last disconnection time
 * @returns Array of missed notifications
 */
export const getMissedNotifications = async (userId: string, lastDisconnectedAt: Date | null) => {
  try {
    if (!lastDisconnectedAt) {
      return [];
    }

    // Calculate timeframe using reconnection window from env
    const reconnectionWindowMinutes = Number(env.SOCKET_RECONNECTION_WINDOW) || 5;
    const windowStartTime = new Date(
      lastDisconnectedAt.getTime() - reconnectionWindowMinutes * 60 * 1000,
    );
    const now = new Date();

    // Query missed notifications
    const missedNotifications = await prisma.notification.findMany({
      where: {
        userId,
        sentAt: {
          gt: windowStartTime,
          lt: now,
        },
        isRead: false,
      },
      orderBy: {
        sentAt: 'asc',
      },
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        data: true,
        priority: true,
        sentAt: true,
      },
    });

    return missedNotifications;
  } catch (error) {
    logger.error('Error fetching missed notifications:', error);
    return [];
  }
};

/**
 * Send missed notifications to user
 * @param userId - User ID
 * @param missedNotifications - Array of missed notifications
 */
export const sendMissedNotifications = async (userId: string, missedNotifications: any[]) => {
  try {
    if (missedNotifications.length === 0) {
      return;
    }

    const io = getIO();

    for (const notification of missedNotifications) {
      // Emit each missed notification
      socketManager.emitToUser(userId, 'notification:missed', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
        priority: notification.priority,
        sentAt: notification.sentAt,
      });

      // Update notification delivery method
      const currentDeliveredVia = notification.deliveredVia || [];
      if (!currentDeliveredVia.includes('socket_reconnect')) {
        await prisma.notification.update({
          where: { id: notification.id },
          data: {
            deliveredVia: [...currentDeliveredVia, 'socket_reconnect'],
          },
        });
      }
    }

    logger.info(`✅ Sent ${missedNotifications.length} missed notifications to user ${userId}`);
  } catch (error) {
    logger.error('Error sending missed notifications:', error);
  }
};

/**
 * Handle user reconnection - fetch and send missed notifications
 * @param userId - User ID
 * @param lastDisconnectedAt - Last disconnection time
 */
export const handleReconnection = async (userId: string, lastDisconnectedAt: Date | null) => {
  try {
    logger.info(`🔄 User ${userId} reconnected - checking for missed notifications`);

    // Get missed notifications
    const missedNotifications = await getMissedNotifications(userId, lastDisconnectedAt);

    if (missedNotifications.length > 0) {
      // Send missed notifications
      await sendMissedNotifications(userId, missedNotifications);

      // Get unread count
      const unreadCount = await prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });

      // Emit unread count update
      socketManager.emitToUser(userId, 'notification:count-update', {
        unreadCount,
      });
    }

    return missedNotifications.length;
  } catch (error) {
    logger.error('Error handling reconnection:', error);
    return 0;
  }
};
