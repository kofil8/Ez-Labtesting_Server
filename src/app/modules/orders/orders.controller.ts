import { Role } from '@prisma/client';
import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import ApiError from '../../errors/ApiErrors';
import { enqueueLabSubmission } from '../../queues/labSubmission.queue';
import { paymentService } from '../payment/payment.service';
import { orderService } from './orders.service';

const sendControllerError = (
  res: Response,
  error: unknown,
  fallbackMessage: string,
  fallbackStatus = httpStatus.BAD_REQUEST,
) => {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      code: error.code,
      details: error.details,
    });
  }

  return res.status(fallbackStatus).json({
    success: false,
    message: error instanceof Error ? error.message : fallbackMessage,
  });
};

const asParamString = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

class OrderController {
  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const authUser = (req as any).user;
      if (!authUser?.id) {
        return res
          .status(httpStatus.UNAUTHORIZED)
          .json({ success: false, message: 'Unauthorized' });
      }

      const { labTestId, accessPayloadJson, laboratoryCode, laboratoryId, labCenterId, promoCode } =
        req.body;
      const order = await orderService.createOrder({
        userId: authUser.id,
        req,
        labTestId,
        accessPayloadJson,
        drawCenterId: labCenterId,
        laboratoryId,
        laboratoryCode,
        promoCode,
      });

      const payment = await paymentService.createOrUpdatePaymentIntentForOrder({
        orderId: order.id,
        userId: authUser.id,
      });

      return res.status(httpStatus.CREATED).json({
        success: true,
        data: {
          order,
          clientSecret: payment.clientSecret,
          stripePaymentIntentId: payment.paymentIntentId,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req: Request, res: Response) {
    try {
      const orderId = asParamString(req.params.orderId);
      const authUser = (req as any).user;
      const isAdmin = [Role.ADMIN, Role.SUPER_ADMIN].includes(authUser?.role);
      const order = await orderService.getOrderById(orderId as string);

      if (!isAdmin && order.userId !== authUser?.id) {
        return res.status(httpStatus.FORBIDDEN).json({ success: false, message: 'Forbidden' });
      }

      return res.status(httpStatus.OK).json({ success: true, order });
    } catch (error) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to load order',
      });
    }
  }

  async getOrdersByUserId(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      const userId = asParamString(req.params.userId);
      const isAdmin = [Role.ADMIN, Role.SUPER_ADMIN].includes(authUser?.role);

      if (!isAdmin && userId !== authUser?.id) {
        return res.status(httpStatus.FORBIDDEN).json({ success: false, message: 'Forbidden' });
      }

      const orders = await orderService.getOrdersByUserId((userId as string) || authUser.id);
      return res.status(httpStatus.OK).json({ success: true, orders });
    } catch (error) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to load orders',
      });
    }
  }

  async getMyOrders(req: Request, res: Response) {
    req.params.userId = String((req as any).user?.id || '');
    return this.getOrdersByUserId(req, res);
  }

  async getRequisitionDownload(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      const url = await orderService.getRequisitionDownloadUrl({
        orderId: asParamString(req.params.orderId) as string,
        requesterUserId: authUser?.id,
        isAdmin: [Role.ADMIN, Role.SUPER_ADMIN].includes(authUser?.role),
      });

      return res.status(httpStatus.OK).json({ success: true, url });
    } catch (error) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to load requisition',
      });
    }
  }

  async getResumableOrder(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      const order = await orderService.getLatestResumableOrderForUser(authUser.id);
      return res.status(httpStatus.OK).json({ success: true, order });
    } catch (error) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to load resumable order',
      });
    }
  }

  async getManualReviewOrders(req: Request, res: Response) {
    try {
      const limit = Number.parseInt(String(req.query.limit || '100'), 10);
      const orders = await orderService.getManualReviewOrders(Number.isFinite(limit) ? limit : 100);
      return res.status(httpStatus.OK).json({ success: true, orders });
    } catch (error) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to load manual review queue',
      });
    }
  }

  async adminResendSubmission(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      const order = await orderService.adminResendSubmission(
        asParamString(req.params.orderId) as string,
        authUser?.id,
      );
      const queue = await enqueueLabSubmission(order.id);

      return res.status(httpStatus.OK).json({
        success: true,
        message: 'Lab submission requeued',
        data: { order, queue },
      });
    } catch (error) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to requeue submission',
      });
    }
  }

  async approveManualReviewOrder(req: Request, res: Response) {
    return this.adminResendSubmission(req, res);
  }

  async adminCancelOrder(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      const orderId = asParamString(req.params.orderId) as string;
      const reason =
        typeof req.body?.reason === 'string' && req.body.reason.trim()
          ? req.body.reason.trim()
          : undefined;
      const source =
        typeof req.body?.source === 'string' && req.body.source
          ? (req.body.source as 'ACCESS' | 'ADMIN' | 'SYSTEM')
          : 'ADMIN';

      const order = await orderService.markLabOrderCancelled(orderId, {
        reason,
        source,
        actorId: authUser?.id || null,
        rawResponse: req.body?.rawResponse ?? null,
      });

      return res.status(httpStatus.OK).json({
        success: true,
        message: 'Order cancelled',
        data: { order },
      });
    } catch (error) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to cancel order',
      });
    }
  }

  async retryAccessPlacement(req: Request, res: Response) {
    return this.adminResendSubmission(req, res);
  }

  async adminManualReorder(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      const orderId = asParamString(req.params.orderId) as string;
      const order = await orderService.adminManualReorder(orderId, authUser?.id);
      const queue = await enqueueLabSubmission(order.id);
      return res.status(httpStatus.OK).json({
        success: true,
        message: 'Order manually re-queued for lab submission',
        data: { order, queue },
      });
    } catch (error) {
      return sendControllerError(res, error, 'Failed to manually re-order');
    }
  }

  async adminRequestRefund(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      const orderId = asParamString(req.params.orderId) as string;
      const reason =
        typeof req.body?.reason === 'string' && req.body.reason.trim()
          ? req.body.reason.trim()
          : undefined;
      const order = await orderService.adminRequestRefund(orderId, authUser?.id, reason);
      return res.status(httpStatus.OK).json({
        success: true,
        message: 'Refund request recorded. Awaiting superadmin approval.',
        data: { order },
      });
    } catch (error) {
      return sendControllerError(res, error, 'Failed to request refund');
    }
  }

  async adminApproveRefund(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      const isSuperAdmin = authUser?.role === Role.SUPER_ADMIN;
      if (!isSuperAdmin) {
        return res.status(httpStatus.FORBIDDEN).json({
          success: false,
          message: 'Only superadmins can approve refunds',
        });
      }
      const orderId = asParamString(req.params.orderId) as string;
      const reason =
        typeof req.body?.reason === 'string' && req.body.reason.trim()
          ? req.body.reason.trim()
          : undefined;
      const result = await orderService.adminApproveRefund(orderId, authUser.id, reason);
      return res.status(httpStatus.OK).json({
        success: true,
        message: 'Refund approved and issued successfully',
        data: result,
      });
    } catch (error) {
      return sendControllerError(res, error, 'Failed to approve refund');
    }
  }

  async getOrderTracking(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      const order = await orderService.getOrderById(asParamString(req.params.orderId) as string);
      const isAdmin = [Role.ADMIN, Role.SUPER_ADMIN].includes(authUser?.role);

      if (!isAdmin && order.userId !== authUser?.id) {
        return res.status(httpStatus.FORBIDDEN).json({ success: false, message: 'Forbidden' });
      }

      const tracking = await orderService.getOrderWithTrackingStatus(
        asParamString(req.params.orderId) as string,
      );
      return res.status(httpStatus.OK).json({ success: true, data: tracking });
    } catch (error) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to load tracking',
      });
    }
  }

  async confirmPayment(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      const orderId = asParamString(req.params.orderId) || req.body.orderId;
      const stripePaymentIntentId = req.body.stripePaymentIntentId;

      const order = await orderService.getOrderById(orderId);
      const isAdmin = [Role.ADMIN, Role.SUPER_ADMIN].includes(authUser?.role);
      if (!isAdmin && order.userId !== authUser.id) {
        return res.status(httpStatus.FORBIDDEN).json({ success: false, message: 'Forbidden' });
      }

      if (!isAdmin) {
        await orderService.assertExistingOrderOrderingAllowed({ orderId: order.id, req });
      }

      const paymentResult = await paymentService.confirmPaymentIntent(stripePaymentIntentId);
      if (
        paymentResult.metadata?.orderId !== order.id ||
        paymentResult.metadata?.userId !== order.userId
      ) {
        return res.status(httpStatus.FORBIDDEN).json({
          success: false,
          message: 'Payment intent does not belong to this order',
        });
      }

      if (!['succeeded', 'processing'].includes(paymentResult.status)) {
        return res.status(httpStatus.CONFLICT).json({
          success: false,
          message: `Payment not confirmed. Status: ${paymentResult.status}`,
        });
      }

      const expectedCents = Math.round(Number(order.total) * 100);
      const receivedCents = Math.round(Number(paymentResult.amount) * 100);
      if (receivedCents < expectedCents) {
        return res.status(httpStatus.CONFLICT).json({
          success: false,
          message: 'Payment amount does not cover the order total',
        });
      }

      const paid = await orderService.markOrderPaid({
        orderId: order.id,
        stripePaymentIntentId,
        paymentSnapshotJson: {
          amount: paymentResult.amount,
          currency: paymentResult.currency,
          paymentMethodTypes: paymentResult.paymentMethodTypes,
          metadata: paymentResult.metadata,
        },
      });

      return res.status(httpStatus.OK).json({
        success: true,
        data: { orderId: paid.id, status: paid.orderStatus, paidAt: paid.paidAt },
      });
    } catch (error) {
      return sendControllerError(res, error, 'Failed to confirm payment');
    }
  }

  async confirmOrder(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      const order = await orderService.getOrderById(asParamString(req.params.orderId) as string);
      const isAdmin = [Role.ADMIN, Role.SUPER_ADMIN].includes(authUser?.role);
      if (!isAdmin && order.userId !== authUser.id) {
        return res.status(httpStatus.FORBIDDEN).json({ success: false, message: 'Forbidden' });
      }

      if (!isAdmin) {
        await orderService.assertExistingOrderOrderingAllowed({ orderId: order.id, req });
      }

      const confirmed = await orderService.confirmOrderByUser(order.id, authUser.id);
      const queue = await enqueueLabSubmission(order.id);

      return res.status(httpStatus.OK).json({
        success: true,
        data: { order: confirmed, queue },
      });
    } catch (error) {
      return sendControllerError(res, error, 'Failed to confirm order');
    }
  }

  async getAllOrders(req: Request, res: Response) {
    try {
      const page = Number.parseInt(String(req.query.page || '1'), 10);
      const limit = Number.parseInt(String(req.query.limit || '50'), 10);
      const data = await orderService.getAllOrders({
        page: Number.isFinite(page) ? page : 1,
        limit: Number.isFinite(limit) ? limit : 50,
      });

      return res.status(httpStatus.OK).json({ success: true, data });
    } catch (error) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to load orders',
      });
    }
  }
}

export const orderController = new OrderController();
