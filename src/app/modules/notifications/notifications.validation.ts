import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Schemas
 */
export const registerTokenSchema = z.object({
  token: z.string().min(1, 'token is required'),
  platform: z
    .string()
    .optional()
    .refine((v) => !v || ['web', 'ios', 'android'].includes(v), {
      message: "platform must be one of 'web', 'ios', 'android'",
    }),
  // note: userId is optionally set server-side from auth; keep optional here
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
 * Types
 */
export type RegisterTokenInput = z.infer<typeof registerTokenSchema>;
export type UnregisterTokenInput = z.infer<typeof unregisterTokenSchema>;
export type SendToTokenInput = z.infer<typeof sendToTokenSchema>;
export type SendToUserInput = z.infer<typeof sendToUserSchema>;

/**
 * Helper middleware factory — validates req.body with given schema.
 * On success: replaces req.body with parsed result and calls next().
 * On failure: forwards ZodError to next() so your global error handler catches it.
 */
export const validateBody =
  (schema: z.ZodTypeAny) => async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req.body ?? {});
      // replace req.body with typed/parsed data
      req.body = parsed;
      return next();
    } catch (err) {
      // forward ZodError (or any error) to your global error handler
      return next(err);
    }
  };

/**
 * Convenience middleware instances for your routes
 */
export const validateRegisterToken = validateBody(registerTokenSchema);
export const validateUnregisterToken = validateBody(unregisterTokenSchema);
export const validateSendToToken = validateBody(sendToTokenSchema);
export const validateSendToUser = validateBody(sendToUserSchema);
