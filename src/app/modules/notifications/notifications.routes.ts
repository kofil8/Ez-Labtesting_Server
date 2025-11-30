import express from 'express';
import { NotificationController } from './notifications.controller';
import auth from '../../middlewares/auth';
import {
  validateRegisterToken,
  validateUnregisterToken,
  validateSendToToken,
  validateSendToUser,
} from './notifications.validation';
import catchAsync from '../../helpers/catchAsync';
import { NotificationService } from './notifications.service';
import sendResponse from '../../helpers/sendResponse';

const router = express.Router();

router.post('/register', auth(), validateRegisterToken, NotificationController.registerToken);
router.post('/unregister', auth(), validateUnregisterToken, NotificationController.unregisterToken);
router.post('/send', auth(), validateSendToToken, NotificationController.sendNotification);
router.post('/send-user', auth(), validateSendToUser, NotificationController.sendToUser);

router.post(
  '/test-user',
  auth(), // require logged-in user
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

export const NotificationRoutes = router;
