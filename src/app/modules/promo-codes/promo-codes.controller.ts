import { Request, Response } from 'express';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { promoCodesService } from './services/promo-codes.service';

const asParamString = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export const promoCodesController = {
  list: catchAsync(async (_req: Request, res: Response) => {
    const data = await promoCodesService.list();
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Promo codes retrieved',
      data,
    });
  }),

  getById: catchAsync(async (req: Request, res: Response) => {
    const data = await promoCodesService.getById(asParamString(req.params.id) as string);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Promo code retrieved',
      data,
    });
  }),

  create: catchAsync(async (req: Request, res: Response) => {
    const data = await promoCodesService.create(req.body);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'Promo code created',
      data,
    });
  }),

  update: catchAsync(async (req: Request, res: Response) => {
    const data = await promoCodesService.update(asParamString(req.params.id) as string, req.body);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Promo code updated',
      data,
    });
  }),

  delete: catchAsync(async (req: Request, res: Response) => {
    await promoCodesService.archive(asParamString(req.params.id) as string);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Promo code deleted',
      data: null,
    });
  }),
};
