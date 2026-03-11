import { Role } from '@prisma/client';
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { env } from '../../../config/env';
import { enqueueAccessLabOrder } from '../../queues/accessLab.queue';
import { paymentService } from '../payment/payment.service';
import { orderService } from './orders.service';

const asParamString = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

type AccessPayloadPatient = {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
};

type AccessPayloadConfirmedLabLocation = {
  siteId?: string;
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
};

const buildPatientAddress = (patient?: AccessPayloadPatient): string | null => {
  if (!patient) return null;

  const parts = [patient.address, patient.city, patient.state, patient.zip]
    .map((part) => (part || '').trim())
    .filter(Boolean);

  return parts.length > 0 ? parts.join(', ') : null;
};

const buildConfirmedLabLocation = (
  location?: AccessPayloadConfirmedLabLocation,
): AccessPayloadConfirmedLabLocation | null => {
  if (!location) return null;

  const hasLocationData = Boolean(
    location.siteId ||
    location.name ||
    location.address ||
    location.city ||
    location.state ||
    location.zip ||
    location.formattedAddress ||
    location.latitude !== undefined ||
    location.longitude !== undefined,
  );

  if (!hasLocationData) {
    return null;
  }

  return {
    siteId: location.siteId,
    name: location.name,
    address: location.address,
    city: location.city,
    state: location.state,
    zip: location.zip,
    latitude: location.latitude,
    longitude: location.longitude,
    formattedAddress: location.formattedAddress,
  };
};

class OrderController {
  /**
   * Create a new order (PENDING_PAYMENT) + create/reuse PaymentIntent (tamper-proof totals).
   *
   * Checkout flow:
   * 1) Patient info collected client-side and included inside accessPayloadJson (ACCESS requires it)
   * 2) Server creates Order with server-computed totals
   * 3) Server creates a PaymentIntent bound to the Order (metadata.orderId)
   */
  async createOrder(req: Request, res: Response) {
    try {
      const { labTestId, accessPayloadJson } = req.body;
      const authUser = (req as any).user;

      if (!authUser?.id) {
        return res
          .status(httpStatus.UNAUTHORIZED)
          .json({ success: false, message: 'Unauthorized' });
      }

      if (!labTestId) {
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Missing required field: labTestId',
        });
      }

      if (!accessPayloadJson) {
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Missing accessPayloadJson - ACCESS Lab data required',
        });
      }

      const order = await orderService.createOrder({
        userId: authUser.id,
        labTestId,
        accessPayloadJson,
      });

      const payment = await paymentService.createOrUpdatePaymentIntentForOrder({
        orderId: order.id,
        userId: authUser.id,
      });

      return res.status(httpStatus.CREATED).json({
        success: true,
        data: {
          orderId: order.id,
          orderNumber: `ORD-${order.id.slice(0, 8).toUpperCase()}`,
          status: order.status,
          subtotal: order.subtotal,
          processingFee: order.processingFee,
          total: order.total,
          clientSecret: payment.clientSecret,
          stripePaymentIntentId: payment.paymentIntentId,
          createdAt: order.createdAt,
        },
      });
    } catch (error) {
      console.error('[OrderController] Create order error:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create order',
      });
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const authUser = (req as any).user;

      const order = await orderService.getOrderById(orderId as string);

      const isAdmin = authUser?.role === Role.ADMIN || authUser?.role === Role.SUPER_ADMIN;

      if (!isAdmin && order.userId !== authUser?.id) {
        return res.status(httpStatus.FORBIDDEN).json({
          success: false,
          message: 'Forbidden',
        });
      }

      const accessPayload = (order.accessPayloadJson || {}) as {
        patient?: AccessPayloadPatient;
        confirmedLabLocation?: AccessPayloadConfirmedLabLocation;
      };
      const patientAddress = buildPatientAddress(accessPayload.patient);
      const confirmedLabLocation = buildConfirmedLabLocation(accessPayload.confirmedLabLocation);

      return res.status(httpStatus.OK).json({
        success: true,
        order,
        patientAddress,
        confirmedLabLocation,
      });
    } catch (error) {
      console.error('[OrderController] Get order error:', error);
      return res.status(httpStatus.NOT_FOUND).json({
        success: false,
        message: error instanceof Error ? error.message : 'Order not found',
      });
    }
  }

  /**
   * Get orders by user ID
   */
  async getOrdersByUserId(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const authUser = (req as any).user;

      const isAdmin = authUser?.role === Role.ADMIN || authUser?.role === Role.SUPER_ADMIN;

      if (!isAdmin && userId !== authUser?.id) {
        return res.status(httpStatus.FORBIDDEN).json({
          success: false,
          message: 'Forbidden',
        });
      }

      const orders = await orderService.getOrdersByUserId(isAdmin ? userId : authUser.id);

      return res.status(httpStatus.OK).json({
        success: true,
        orders,
      });
    } catch (error) {
      console.error('[OrderController] Get orders by user error:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get orders',
      });
    }
  }

  /**
   * Get orders for current user
   */
  async getMyOrders(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      if (!authUser?.id) {
        return res
          .status(httpStatus.UNAUTHORIZED)
          .json({ success: false, message: 'Unauthorized' });
      }

      const orders = await orderService.getOrdersByUserId(authUser.id);
      return res.status(httpStatus.OK).json({ success: true, orders });
    } catch (error) {
      console.error('[OrderController] Get my orders error:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get orders',
      });
    }
  }

  /**
   * Secure requisition download URL for RequisitionDownloader component.
   */
  async getRequisitionDownload(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      const orderId = asParamString(req.params.orderId);

      if (!orderId) {
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Missing required param: orderId',
        });
      }

      const isAdmin = authUser?.role === Role.ADMIN || authUser?.role === Role.SUPER_ADMIN;

      const url = await orderService.getRequisitionDownloadUrl({
        orderId,
        requesterUserId: authUser?.id,
        isAdmin,
      });

      return res.status(httpStatus.OK).json({ success: true, url });
    } catch (error) {
      console.error('[OrderController] Requisition download error:', error);
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get requisition',
      });
    }
  }

  /**
   * Get latest resumable checkout order for authenticated user
   */
  async getResumableOrder(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;

      if (!authUser?.id) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const order = await orderService.getLatestResumableOrderForUser(authUser.id);

      if (!order) {
        return res.status(httpStatus.OK).json({
          success: true,
          order: null,
        });
      }

      const accessPayload = (order.accessPayloadJson || {}) as {
        patient?: AccessPayloadPatient;
        confirmedLabLocation?: AccessPayloadConfirmedLabLocation;
      };
      const patientAddress = buildPatientAddress(accessPayload.patient);
      const confirmedLabLocation = buildConfirmedLabLocation(accessPayload.confirmedLabLocation);

      return res.status(httpStatus.OK).json({
        success: true,
        order,
        patientAddress,
        confirmedLabLocation,
      });
    } catch (error) {
      console.error('[OrderController] Get resumable order error:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get resumable order',
      });
    }
  }

  /**
   * Get manual-review-required orders for admin operations
   */
  async getManualReviewOrders(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      const isAdmin = authUser?.role === Role.ADMIN || authUser?.role === Role.SUPER_ADMIN;

      if (!isAdmin) {
        return res.status(httpStatus.FORBIDDEN).json({
          success: false,
          message: 'Forbidden',
        });
      }

      const parsedLimit = Number.parseInt(String(req.query.limit ?? '100'), 10);
      const limit = Number.isFinite(parsedLimit) ? parsedLimit : 100;

      const orders = await orderService.getManualReviewOrders(limit);

      return res.status(httpStatus.OK).json({
        success: true,
        count: orders.length,
        orders,
      });
    } catch (error) {
      console.error('[OrderController] Get manual review orders error:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get manual review orders',
      });
    }
  }

  /**
   * Retry ACCESS Lab placement for an order
   */
  async retryAccessPlacement(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const authUser = (req as any).user;

      if (!authUser?.id) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const order = await orderService.getOrderById(orderId as string);
      const isAdmin = authUser?.role === Role.ADMIN || authUser?.role === Role.SUPER_ADMIN;

      if (!isAdmin && order.userId !== authUser?.id) {
        return res.status(httpStatus.FORBIDDEN).json({
          success: false,
          message: 'Forbidden',
        });
      }

      const preparedOrder = await orderService.prepareOrderForAccessRetry(order.id);
      const jobInfo = await enqueueAccessLabOrder(preparedOrder.id);

      return res.status(httpStatus.OK).json({
        success: true,
        message: 'ACCESS lab placement retry queued',
        orderId: preparedOrder.id,
        queue: jobInfo,
      });
    } catch (error) {
      console.error('[OrderController] Retry ACCESS placement error:', error);

      if ((error as any)?.statusCode) {
        return res.status((error as any).statusCode).json({
          success: false,
          message: (error as any).message,
        });
      }

      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to retry ACCESS placement',
      });
    }
  }

  /**
   * Approve a manual-review-required order (admin/super admin) and retry ACCESS placement.
   */
  async approveManualReviewOrder(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const authUser = (req as any).user;
      const isAdmin = authUser?.role === Role.ADMIN || authUser?.role === Role.SUPER_ADMIN;

      if (!isAdmin) {
        return res.status(httpStatus.FORBIDDEN).json({
          success: false,
          message: 'Forbidden',
        });
      }

      const approved = await orderService.resolveManualReview(orderId as string, {
        approvedByUserId: authUser?.id,
        approvedByRole: authUser?.role,
      });
      const queue = await enqueueAccessLabOrder(approved.id);

      return res.status(httpStatus.OK).json({
        success: true,
        message: 'Manual review approved and ACCESS placement retry queued',
        data: {
          orderId: approved.id,
          status: approved.status,
          queue,
        },
      });
    } catch (error) {
      console.error('[OrderController] Manual review approval error:', error);

      if ((error as any)?.statusCode) {
        return res.status((error as any).statusCode).json({
          success: false,
          message: (error as any).message,
        });
      }

      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to approve manual review',
      });
    }
  }

  /**
   * Get order tracking status
   */
  async getOrderTracking(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      const authUser = (req as any).user;

      if (!authUser?.id) {
        return res.status(httpStatus.UNAUTHORIZED).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const order = await orderService.getOrderById(orderId as string);
      const isAdmin = authUser?.role === Role.ADMIN || authUser?.role === Role.SUPER_ADMIN;

      if (!isAdmin && order.userId !== authUser?.id) {
        return res.status(httpStatus.FORBIDDEN).json({
          success: false,
          message: 'Forbidden',
        });
      }

      const trackingStatus = await orderService.getOrderWithTrackingStatus(orderId as string);

      return res.status(httpStatus.OK).json({
        success: true,
        data: trackingStatus,
      });
    } catch (error) {
      console.error('[OrderController] Get tracking error:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get tracking status',
      });
    }
  }

  /**
   * Confirm payment and mark order as paid
   */
  async confirmPayment(req: Request, res: Response) {
    try {
      const routeOrderId = asParamString(req.params.orderId);
      const { orderId: bodyOrderId, stripePaymentIntentId } = req.body;
      const orderId = routeOrderId || bodyOrderId;
      const authUser = (req as any).user;

      if (!authUser?.id) {
        return res
          .status(httpStatus.UNAUTHORIZED)
          .json({ success: false, message: 'Unauthorized' });
      }

      if (!orderId || !stripePaymentIntentId) {
        return res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: 'Missing required fields: orderId, stripePaymentIntentId',
        });
      }

      const order = await orderService.getOrderById(orderId);

      const isAdmin = authUser?.role === Role.ADMIN || authUser?.role === Role.SUPER_ADMIN;
      if (!isAdmin && order.userId !== authUser.id) {
        return res.status(httpStatus.FORBIDDEN).json({ success: false, message: 'Forbidden' });
      }

      // Verify payment intent (status + tamper-proof checks)
      const paymentResult = await paymentService.confirmPaymentIntent(stripePaymentIntentId);

      // Must belong to the same user + order
      if (paymentResult?.metadata?.userId && paymentResult.metadata.userId !== authUser.id) {
        return res.status(httpStatus.FORBIDDEN).json({ success: false, message: 'Forbidden' });
      }
      if (paymentResult?.metadata?.orderId && paymentResult.metadata.orderId !== order.id) {
        return res.status(httpStatus.CONFLICT).json({
          success: false,
          message: 'PaymentIntent does not match this order',
        });
      }

      // Status gate
      if (!['succeeded', 'processing'].includes(paymentResult.status)) {
        return res.status(httpStatus.CONFLICT).json({
          success: false,
          message: `Payment not confirmed. Status: ${paymentResult.status}`,
        });
      }

      // Amount/currency check (must match order.total)
      const expected = Math.round(Number(order.total) * 100) / 100;
      const received = Math.round(Number(paymentResult.amount) * 100) / 100;
      const expectedCurrency = env.PAYMENT_CURRENCY.toLowerCase();
      if (paymentResult.currency?.toLowerCase?.() !== expectedCurrency) {
        return res.status(httpStatus.CONFLICT).json({
          success: false,
          message: 'Unexpected payment currency',
        });
      }
      if (received < expected) {
        return res.status(httpStatus.CONFLICT).json({
          success: false,
          message: 'Payment amount is less than order total',
        });
      }

      const paid = await orderService.markOrderPaid({
        orderId: order.id,
        stripePaymentIntentId,
      });

      // Fulfillment is normally triggered by webhook; keep as a fallback only.
      if (paid.status === 'PAID') {
        await enqueueAccessLabOrder(paid.id);
      }

      return res.status(httpStatus.OK).json({
        success: true,
        data: { orderId: paid.id, status: paid.status, paidAt: paid.paidAt },
      });
    } catch (error) {
      console.error('[OrderController] Confirm payment error:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to confirm payment',
      });
    }
  }

  /**
   * Get all orders (admin only)
   */
  async getAllOrders(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;

      if (!authUser?.id) {
        return res
          .status(httpStatus.UNAUTHORIZED)
          .json({ success: false, message: 'Unauthorized' });
      }

      const isAdmin = authUser?.role === Role.ADMIN || authUser?.role === Role.SUPER_ADMIN;
      if (!isAdmin) {
        return res.status(httpStatus.FORBIDDEN).json({ success: false, message: 'Forbidden' });
      }

      const parsedPage = Number.parseInt(String(req.query.page ?? '1'), 10);
      const parsedLimit = Number.parseInt(String(req.query.limit ?? '50'), 10);
      const page = Number.isFinite(parsedPage) ? Math.max(1, parsedPage) : 1;
      const limit = Number.isFinite(parsedLimit) ? Math.max(1, Math.min(500, parsedLimit)) : 50;

      const orders = await orderService.getAllOrders({ page, limit });

      return res.status(httpStatus.OK).json({
        success: true,
        page,
        limit,
        count: orders.length,
        data: orders,
      });
    } catch (error) {
      console.error('[OrderController] Get all orders error:', error);
      return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to get all orders',
      });
    }
  }
}

export const orderController = new OrderController();
