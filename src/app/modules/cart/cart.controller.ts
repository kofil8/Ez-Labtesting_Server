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

  syncCart: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const deviceId = req.header('x-cart-device-id') || req.body.deviceId;
    const { items, clientTimestamp } = req.body;

    const cart = await cartService.syncCart({
      userId,
      localItems: items || [],
      clientTimestamp: new Date(clientTimestamp || Date.now()),
      sourceDeviceId: typeof deviceId === 'string' ? deviceId : undefined,
      req,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Cart synchronized across devices',
      data: cart,
    });
  }),

  getLockStatus: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const lock = await cartService.getCartLock(userId);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Cart lock status retrieved',
      data: lock,
    });
  }),

  lockCart: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const lock = await cartService.lockCart({
      userId,
      ttlSeconds: req.body?.ttlSeconds,
      reason: req.body?.reason,
    });
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Cart locked for checkout',
      data: lock,
    });
  }),

  unlockCart: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    await cartService.unlockCart(userId);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Cart unlocked',
      data: null,
    });
  }),

  addItem: catchAsync(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const cart = await cartService.addItem({ userId, ...req.body, req });
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
    const cart = await cartService.validateCart({
      userId,
      req,
      promoCode: req.body.code,
    });
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
