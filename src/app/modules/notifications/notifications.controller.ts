import { Request, Response } from 'express';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { socketManager } from '../../helpers/socketManager';

import {
  BroadcastNotificationBody,
  GetNotificationsQuery,
  MarkAsReadParams,
  RegisterTokenInput,
  SendToTokenInput,
  SendToUserInput,
  UnregisterTokenInput,
} from './notifications.validation';

import { NotificationService } from './notifications.service';

export const NotificationController = {
  /**
   * Legacy: Register FCM token
   */
  registerToken: catchAsync(async (req: Request, res: Response) => {
    const { token, platform, userId }: RegisterTokenInput = req.body;

    const finalUserId =
      (req as any)?.user?.id !== undefined ? (req as any).user.id : userId ?? null;

    const result = await NotificationService.registerToken(finalUserId, token, platform ?? 'web');

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Token registered successfully',
      data: result,
    });
  }),

  /**
   * Legacy: Unregister FCM token
   */
  unregisterToken: catchAsync(async (req: Request, res: Response) => {
    const { token }: UnregisterTokenInput = req.body;

    await NotificationService.unregisterToken(token);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Token unregistered successfully',
    });
  }),

  /**
   * Legacy: Send to single token
   */
  sendNotification: catchAsync(async (req: Request, res: Response) => {
    const { token, title, body, data }: SendToTokenInput = req.body;

    const result = await NotificationService.sendToToken(token, title, body, data);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Notification sent',
      data: result,
    });
  }),

  /**
   * Legacy: Send to user all devices
   */
  sendToUser: catchAsync(async (req: Request, res: Response) => {
    const { userId, title, body, data }: SendToUserInput = req.body;

    const result = await NotificationService.sendToUser(String(userId), title, body, data);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Notification sent to user',
      data: result,
    });
  }),

  /**
   * Get user notifications with pagination
   */
  getNotifications: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const query: GetNotificationsQuery = req.query as any;

    const { page = 1, limit = 20, type, isRead } = query;

    const result = await NotificationService.getNotifications(userId, page, limit, {
      type,
      isRead,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Notifications retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  }),

  /**
   * Mark single notification as read
   */
  markAsRead: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const params: MarkAsReadParams = req.params as any;
    const { id } = params;

    const notification = await NotificationService.markAsRead(userId, id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  }),

  /**
   * Mark all notifications as read
   */
  markAllAsRead: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;

    await NotificationService.markAllAsRead(userId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'All notifications marked as read',
    });
  }),

  /**
   * Get unread notification count
   */
  getUnreadCount: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;

    const count = await NotificationService.getUnreadCount(userId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Unread count retrieved',
      data: { unreadCount: count },
    });
  }),

  /**
   * Delete notification
   */
  deleteNotification: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { id } = req.params;

    await NotificationService.deleteNotification(userId, id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Notification deleted successfully',
    });
  }),

  /**
   * Admin: Send broadcast notification
   */
  sendBroadcast: catchAsync(async (req: Request, res: Response) => {
    const body: BroadcastNotificationBody = req.body;
    const { notificationType, data, targetRoles } = body;

    const result = await NotificationService.sendBulkNotification(
      notificationType,
      data || {},
      targetRoles,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Broadcast notification queued successfully',
      data: result,
    });
  }),

  /**
   * Get socket/connection statistics (admin)
   */
  getConnectionStats: catchAsync(async (req: Request, res: Response) => {
    const stats = socketManager.getStats();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Connection statistics retrieved',
      data: stats,
    });
  }),
};
