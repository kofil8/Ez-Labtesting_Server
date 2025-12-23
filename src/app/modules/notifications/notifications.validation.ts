import { NotificationType, Role } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

/**
 * Notification Type Schema
 */
export const notificationTypeSchema = z.nativeEnum(NotificationType);

/**
 * Priority Schema
 */
export const prioritySchema = z.enum(['HIGH', 'MEDIUM', 'LOW']);

/**
 * Legacy Schemas
 */
export const registerTokenSchema = z.object({
  token: z.string().min(1, 'token is required'),
  platform: z
    .string()
    .optional()
    .refine((v) => !v || ['web', 'ios', 'android'].includes(v), {
      message: "platform must be one of 'web', 'ios', 'android'",
    }),
  userId: z
    .union([z.string().regex(/^\d+$/), z.number()])
    .optional()
    .transform((val) => (typeof val === 'string' ? parseInt(val, 10) : val)),
});

export const unregisterTokenSchema = z.object({
  token: z.string().min(1, 'token is required'),
});

export const sendToTokenSchema = z.object({
  token: z.string().min(1, 'token is required'),
  title: z.string().min(1, 'title is required'),
  body: z.string().optional().default(''),
  data: z.record(z.string()).optional().default({}),
});

export const sendToUserSchema = z.object({
  userId: z.union([z.string().regex(/^\d+$/), z.number()]),
  title: z.string().min(1, 'title is required'),
  body: z.string().optional().default(''),
  data: z.record(z.string()).optional().default({}),
});

/**
 * New Notification Schemas
 */

// Get notifications query schema
export const getNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  type: notificationTypeSchema.optional(),
  isRead: z.coerce.boolean().optional(),
});

// Mark as read params schema
export const markAsReadParamsSchema = z.object({
  id: z.string().uuid('Invalid notification ID'),
});

// Notification data for flexible fields
export const notificationDataSchema = z.record(z.any()).optional();

// Send notification body schema
export const sendNotificationBodySchema = z.object({
  notificationType: notificationTypeSchema,
  data: z.record(z.any()).optional(),
});

// Broadcast notification body schema
export const broadcastNotificationBodySchema = z.object({
  notificationType: notificationTypeSchema,
  data: z.record(z.any()).optional(),
  targetRoles: z.array(z.nativeEnum(Role)).optional(),
  title: z.string().optional(),
  body: z.string().optional(),
});

// Mark notification as read socket event
export const markAsReadSocketEventSchema = z.object({
  id: z.string().uuid(),
});

// Fetch notifications socket event
export const fetchNotificationsSocketEventSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().default(20),
  type: notificationTypeSchema.optional(),
  isRead: z.boolean().optional(),
});

/**
 * Types
 */
export type RegisterTokenInput = z.infer<typeof registerTokenSchema>;
export type UnregisterTokenInput = z.infer<typeof unregisterTokenSchema>;
export type SendToTokenInput = z.infer<typeof sendToTokenSchema>;
export type SendToUserInput = z.infer<typeof sendToUserSchema>;
export type GetNotificationsQuery = z.infer<typeof getNotificationsQuerySchema>;
export type MarkAsReadParams = z.infer<typeof markAsReadParamsSchema>;
export type SendNotificationBody = z.infer<typeof sendNotificationBodySchema>;
export type BroadcastNotificationBody = z.infer<typeof broadcastNotificationBodySchema>;

/**
 * Validation middleware factory
 */
export const validateBody =
  (schema: z.ZodTypeAny) => async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req.body ?? {});
      req.body = parsed;
      return next();
    } catch (err) {
      return next(err);
    }
  };

/**
 * Query validation middleware factory
 */
export const validateQuery =
  (schema: z.ZodTypeAny) => async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req.query ?? {});
      req.query = parsed as any;
      return next();
    } catch (err) {
      return next(err);
    }
  };

/**
 * Params validation middleware factory
 */
export const validateParams =
  (schema: z.ZodTypeAny) => async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req.params ?? {});
      req.params = parsed as any;
      return next();
    } catch (err) {
      return next(err);
    }
  };

/**
 * Convenience middleware instances
 */
export const validateRegisterToken = validateBody(registerTokenSchema);
export const validateUnregisterToken = validateBody(unregisterTokenSchema);
export const validateSendToToken = validateBody(sendToTokenSchema);
export const validateSendToUser = validateBody(sendToUserSchema);
export const validateGetNotifications = validateQuery(getNotificationsQuerySchema);
export const validateMarkAsRead = validateParams(markAsReadParamsSchema);
export const validateSendNotification = validateBody(sendNotificationBodySchema);
export const validateBroadcastNotification = validateBody(broadcastNotificationBodySchema);
