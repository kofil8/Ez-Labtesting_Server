import { Request, Response } from 'express';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';

import {
  RegisterTokenInput,
  UnregisterTokenInput,
  SendToTokenInput,
  SendToUserInput,
} from './notifications.validation';

import { NotificationService } from './notifications.service';

export const NotificationController = {
  registerToken: catchAsync(async (req: Request, res: Response) => {
    const { token, platform, userId }: RegisterTokenInput = req.body;

    // If auth middleware sets req.user, override client-sent userId
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

  unregisterToken: catchAsync(async (req: Request, res: Response) => {
    const { token }: UnregisterTokenInput = req.body;

    await NotificationService.unregisterToken(token);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Token unregistered successfully',
    });
  }),

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
};
