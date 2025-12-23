import { Server } from 'socket.io';
import { AuthenticatedSocket } from '../../../config/socket';
import { handleReconnection } from '../../helpers/reconnectionHandler';
import { socketManager } from '../../helpers/socketManager';
import { socketAuth } from '../../middlewares/socketAuth';
import logger from '../../utils/logger';
import { NotificationService } from './notifications.service';
import {
  fetchNotificationsSocketEventSchema,
  markAsReadSocketEventSchema,
} from './notifications.validation';

/**
 * Initialize Socket.IO notification events
 */
export const initNotificationSocket = (io: Server): void => {
  // Apply authentication middleware
  io.use(socketAuth);

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const userId = socket.data.user.id;
    const userEmail = socket.data.user.email;

    try {
      // Add connection to socket manager
      await socketManager.addConnection(userId, socket.id);

      // Get last disconnected time for reconnection handling
      const lastDisconnectedAt = await socketManager.getLastDisconnectedAt(userId);

      // Handle reconnection - send missed notifications
      if (lastDisconnectedAt) {
        const missedCount = await handleReconnection(userId, lastDisconnectedAt);
        if (missedCount > 0) {
          logger.info(`📬 Delivered ${missedCount} missed notifications to ${userEmail}`);
        }
      }

      // Get unread count and emit
      const unreadCount = await NotificationService.getUnreadCount(userId);
      socket.emit('notification:count-update', {
        unreadCount,
      });

      // Join personal room for targeted notifications
      socket.join(`user:${userId}`);

      logger.info(`🔌 User connected: ${userEmail} (${socket.id}) - Unread: ${unreadCount}`);

      /**
       * Mark single notification as read
       */
      socket.on('notification:mark-read', async (payload: any) => {
        try {
          const validated = markAsReadSocketEventSchema.parse(payload);
          const { id } = validated;

          await NotificationService.markAsRead(userId, id);

          const updatedCount = await NotificationService.getUnreadCount(userId);
          socket.emit('notification:count-update', {
            unreadCount: updatedCount,
          });

          logger.info(`✅ Notification marked as read: ${id}`);
        } catch (error) {
          logger.error('Error marking notification as read:', error);
          socket.emit('error', {
            type: 'mark-read-error',
            message: 'Failed to mark notification as read',
          });
        }
      });

      /**
       * Mark all notifications as read
       */
      socket.on('notification:mark-all-read', async () => {
        try {
          await NotificationService.markAllAsRead(userId);

          socket.emit('notification:count-update', {
            unreadCount: 0,
          });

          logger.info(`✅ All notifications marked as read for user ${userId}`);
        } catch (error) {
          logger.error('Error marking all as read:', error);
          socket.emit('error', {
            type: 'mark-all-read-error',
            message: 'Failed to mark all as read',
          });
        }
      });

      /**
       * Fetch notifications with pagination and filters
       */
      socket.on('notification:fetch', async (payload: any) => {
        try {
          const validated = fetchNotificationsSocketEventSchema.parse(payload);
          const { page = 1, limit = 20, type, isRead } = validated;

          const result = await NotificationService.getNotifications(userId, page, limit, {
            type,
            isRead,
          });

          socket.emit('notification:data', result);

          logger.info(`📨 Fetched notifications for user ${userId}: page ${page}`);
        } catch (error) {
          logger.error('Error fetching notifications:', error);
          socket.emit('error', {
            type: 'fetch-error',
            message: 'Failed to fetch notifications',
          });
        }
      });

      /**
       * Socket disconnect handler
       */
      socket.on('disconnect', async () => {
        try {
          await socketManager.removeConnection(socket.id);

          logger.info(`🔌 User disconnected: ${userEmail} (${socket.id})`);
        } catch (error) {
          logger.error('Error handling disconnect:', error);
        }
      });

      /**
       * Socket error handler
       */
      socket.on('error', (error) => {
        logger.error(`❌ Socket error for user ${userId}:`, error);
      });
    } catch (error) {
      logger.error(`❌ Error in socket connection handler:`, error);
      socket.disconnect();
    }
  });

  logger.info('✅ Notification socket events initialized');
};

/**
 * Get socket manager stats
 */
export const getSocketStats = () => {
  return socketManager.getStats();
};
