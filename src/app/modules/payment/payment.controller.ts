import { Request, Response } from 'express';
import httpStatus from 'http-status';
import ApiError from '../../errors/ApiErrors';
import { orderService } from '../orders/orders.service';
import { paymentService } from './payment.service';
import { confirmPaymentIntentSchema, createPaymentIntentForOrderSchema } from './payment.validation';

const sendPaymentError = (res: Response, error: unknown, fallbackMessage: string) => {
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
      details: error.details,
    });
    return;
  }

  res.status(httpStatus.BAD_REQUEST).json({
    success: false,
    message: error instanceof Error ? error.message : fallbackMessage,
  });
};

export class PaymentController {
  /**
   * Create (or reuse) a PaymentIntent for an existing Order.
   * Amount is derived from Order.total in DB (tamper-proof).
   */
  async createPaymentIntentForOrder(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = createPaymentIntentForOrderSchema.parse(req.body);
      const userId = (req as any).user?.id as string | undefined;

      if (!userId) {
        res.status(httpStatus.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        return;
      }

      await orderService.assertExistingOrderOrderingAllowed({
        orderId: validatedData.orderId,
        req,
      });

      const result = await paymentService.createOrUpdatePaymentIntentForOrder({
        orderId: validatedData.orderId,
        userId,
      });

      res.status(httpStatus.OK).json({ success: true, data: result });
    } catch (error) {
      console.error('[PaymentController] createPaymentIntentForOrder error:', error);
      sendPaymentError(res, error, 'Failed to create payment intent');
    }
  }

  /**
   * Confirm payment intent (status-only).
   * Prefer webhooks for fulfillment; this is a client-side fallback / polling helper.
   */
  async confirmPaymentIntent(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = confirmPaymentIntentSchema.parse(req.body);
      const userId = (req as any).user?.id as string | undefined;

      if (!userId) {
        res.status(httpStatus.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });
        return;
      }

      const result = await paymentService.confirmPaymentIntent(validatedData.paymentIntentId);

      if (result?.metadata?.userId !== userId) {
        res.status(httpStatus.FORBIDDEN).json({ success: false, message: 'Forbidden' });
        return;
      }

      if (result?.metadata?.orderId) {
        await orderService.assertExistingOrderOrderingAllowed({
          orderId: result.metadata.orderId,
          req,
        });
      }

      res.status(httpStatus.OK).json({ success: true, data: result });
    } catch (error) {
      console.error('[PaymentController] confirmPaymentIntent error:', error);
      sendPaymentError(res, error, 'Failed to confirm payment');
    }
  }
}

export const paymentController = new PaymentController();
