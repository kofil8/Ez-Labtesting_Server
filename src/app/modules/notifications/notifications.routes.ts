import express from 'express';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import auth from '../../middlewares/auth';
import { NotificationController } from './notifications.controller';
import { NotificationService } from './notifications.service';
import {
  validateBroadcastNotification,
  validateGetNotifications,
  validateMarkAsRead,
  validateRegisterToken,
  validateSendToToken,
  validateSendToUser,
  validateUnregisterToken,
} from './notifications.validation';

const router = express.Router();

/**
 * Legacy endpoints
 */
router.post('/register', auth(), validateRegisterToken, NotificationController.registerToken);
router.post('/unregister', auth(), validateUnregisterToken, NotificationController.unregisterToken);
router.post('/send', auth(), validateSendToToken, NotificationController.sendNotification);
router.post('/send-user', auth(), validateSendToUser, NotificationController.sendToUser);

router.post(
  '/test-user',
  auth(),
  catchAsync(async (req, res) => {
    const { title, body } = req.body;

    const result = await NotificationService.sendToUser(req.user.id, title, body);

    sendResponse(res, {
      statusCode: 200,
      message: 'Test notification sent!',
      data: result,
    });
  }),
);

/**
 * New notification history and management endpoints
 */

// Get notifications with pagination and filters
router.get('/', auth(), validateGetNotifications, NotificationController.getNotifications);

// Get unread notification count
router.get('/unread/count', auth(), NotificationController.getUnreadCount);

// Mark single notification as read
router.patch('/:id/read', auth(), validateMarkAsRead, NotificationController.markAsRead);

// Mark all notifications as read
router.patch('/read/all', auth(), NotificationController.markAllAsRead);

// Delete notification
router.delete('/:id', auth(), NotificationController.deleteNotification);

/**
 * Admin endpoints
 */

// Send broadcast notification
router.post(
  '/admin/broadcast',
  auth('SUPER_ADMIN', 'ADMIN'),
  validateBroadcastNotification,
  NotificationController.sendBroadcast,
);

// Get connection statistics
router.get('/admin/stats', auth('SUPER_ADMIN', 'ADMIN'), NotificationController.getConnectionStats);

export const NotificationRoutes = router;
