import { Request, Response } from 'express';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { supportService } from './support.service';
import {
  AddMessageBody,
  CreateManualReviewTicketBody,
  CreateTicketBody,
  GetTicketsQuery,
  TicketParams,
  UpdateStatusBody,
} from './support.validation';

export const supportController = {
  createTicket: catchAsync(async (req: Request, res: Response) => {
    const authUser = (req as any).user;
    const body = req.body as CreateTicketBody;

    const ticket = await supportService.createTicket(authUser.id, authUser.role, body);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'Support ticket created successfully',
      data: ticket,
    });
  }),

  createManualReviewTicket: catchAsync(async (req: Request, res: Response) => {
    const authUser = (req as any).user;
    const body = req.body as CreateManualReviewTicketBody;

    const ticket = await supportService.createManualReviewTicket(authUser.id, authUser.role, body);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'Manual review ticket created successfully',
      data: ticket,
    });
  }),

  listTickets: catchAsync(async (req: Request, res: Response) => {
    const authUser = (req as any).user;
    const query =
      ((res.locals.validatedQuery as GetTicketsQuery | undefined) ||
        (req.query as unknown as GetTicketsQuery));

    const result = await supportService.listTickets(authUser.id, authUser.role, query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Support tickets retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  }),

  getTicketById: catchAsync(async (req: Request, res: Response) => {
    const authUser = (req as any).user;
    const { ticketId } =
      ((res.locals.validatedParams as TicketParams | undefined) ||
        (req.params as TicketParams));

    const ticket = await supportService.getTicketById(ticketId, authUser.id, authUser.role);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Support ticket retrieved successfully',
      data: ticket,
    });
  }),

  addMessage: catchAsync(async (req: Request, res: Response) => {
    const authUser = (req as any).user;
    const { ticketId } =
      ((res.locals.validatedParams as TicketParams | undefined) ||
        (req.params as TicketParams));
    const body = req.body as AddMessageBody;

    const message = await supportService.addMessage(ticketId, authUser.id, authUser.role, body);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'Support message added successfully',
      data: message,
    });
  }),

  updateStatus: catchAsync(async (req: Request, res: Response) => {
    const authUser = (req as any).user;
    const { ticketId } =
      ((res.locals.validatedParams as TicketParams | undefined) ||
        (req.params as TicketParams));
    const body = req.body as UpdateStatusBody;

    const ticket = await supportService.updateStatus(ticketId, authUser.id, authUser.role, body);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Support ticket status updated successfully',
      data: ticket,
    });
  }),
};
