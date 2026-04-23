import { Request, Response } from 'express';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { cartService } from './cart.service';

const asParamString = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export const cartController = {
  getCart: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const promoCode = typeof req.query.promoCode === 'string' ? req.query.promoCode : undefined;
    const cart = await cartService.getCart(userId, promoCode);
    sendResponse(res, { statusCode: 200, success: true, message: 'Cart retrieved', data: cart });
  }),

  addItem: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const cart = await cartService.addItem({ userId, ...req.body });
    sendResponse(res, { statusCode: 201, success: true, message: 'Cart item added', data: cart });
  }),

  updateItem: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const cart = await cartService.updateItem({
      userId,
      itemId: asParamString(req.params.itemId) as string,
      ...req.body,
    });
    sendResponse(res, { statusCode: 200, success: true, message: 'Cart item updated', data: cart });
  }),

  removeItem: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const cart = await cartService.removeItem(userId, asParamString(req.params.itemId) as string);
    sendResponse(res, { statusCode: 200, success: true, message: 'Cart item removed', data: cart });
  }),

  applyPromoCode: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const cart = await cartService.getCart(userId, req.body.code);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Promo code validated',
      data: cart,
    });
  }),

  removePromoCode: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const cart = await cartService.getCart(userId);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Promo code removed',
      data: cart,
    });
  }),

  validateCart: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const cart = await cartService.validateCart({
      userId,
      req,
      state: req.body.state,
      promoCode: req.body.promoCode,
    });
    sendResponse(res, { statusCode: 200, success: true, message: 'Cart validated', data: cart });
  }),
};
