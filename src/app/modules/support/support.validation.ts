import { NextFunction, Request, Response } from 'express';
import { z } from 'zod';

export const createTicketBodySchema = z.object({
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(1).max(5000),
  category: z.enum(['billing', 'technical', 'results', 'general']).default('general'),
  orderId: z.string().uuid().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

export const addMessageBodySchema = z.object({
  message: z.string().trim().min(1).max(5000),
});

export const updateStatusBodySchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
});

export const ticketParamsSchema = z.object({
  ticketId: z.string().uuid('Invalid ticket id'),
});

export const getTicketsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

export type CreateTicketBody = z.infer<typeof createTicketBodySchema>;
export type AddMessageBody = z.infer<typeof addMessageBodySchema>;
export type UpdateStatusBody = z.infer<typeof updateStatusBodySchema>;
export type TicketParams = z.infer<typeof ticketParamsSchema>;
export type GetTicketsQuery = z.infer<typeof getTicketsQuerySchema>;

const validateBody =
  (schema: z.ZodTypeAny) => async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body ?? {});
      return next();
    } catch (error) {
      return next(error);
    }
  };

const validateQuery =
  (schema: z.ZodTypeAny) => async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.query = (await schema.parseAsync(req.query ?? {})) as any;
      return next();
    } catch (error) {
      return next(error);
    }
  };

const validateParams =
  (schema: z.ZodTypeAny) => async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.params = (await schema.parseAsync(req.params ?? {})) as any;
      return next();
    } catch (error) {
      return next(error);
    }
  };

export const validateCreateTicket = validateBody(createTicketBodySchema);
export const validateAddMessage = validateBody(addMessageBodySchema);
export const validateUpdateStatus = validateBody(updateStatusBodySchema);
export const validateTicketParams = validateParams(ticketParamsSchema);
export const validateGetTicketsQuery = validateQuery(getTicketsQuerySchema);
