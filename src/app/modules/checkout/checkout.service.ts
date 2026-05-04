import httpStatus from 'http-status';
import ApiError from '../../errors/ApiErrors';
import { cartService } from '../cart/cart.service';
import { orderService } from '../orders/orders.service';
import { paymentService } from '../payment/payment.service';

type CheckoutItemInput = {
  labTestId: string;
  quantity?: number;
  drawCenterId?: string;
};

type CheckoutPatientInput = {
  relationToUser?: 'SELF' | 'SPOUSE' | 'CHILD' | 'PARENT' | 'OTHER';
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY' | 'OTHER';
  phoneNumber?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
};

export class CheckoutService {
  private parseDate(value?: string) {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid patient date of birth');
    }

    return date;
  }

  async createSession(params: {
    userId: string;
    req: any;
    patient: CheckoutPatientInput;
    promoCode?: string;
    drawCenterId?: string;
    items?: CheckoutItemInput[];
    idempotencyKey?: string;
  }) {
    if (params.items?.length) {
      for (const item of params.items) {
        await cartService.addItem({
          userId: params.userId,
          labTestId: item.labTestId,
          quantity: item.quantity || 1,
          drawCenterId: item.drawCenterId || params.drawCenterId,
          req: params.req,
          checkoutState: params.patient.state,
        });
      }
    }

    await cartService.lockCart({
      userId: params.userId,
      ttlSeconds: 15 * 60,
      reason: 'checkout-session',
    });

    let order;
    try {
      order = await orderService.createOrderFromCart({
        userId: params.userId,
        req: params.req,
        patient: {
          relationToUser: params.patient.relationToUser || 'SELF',
          firstName: params.patient.firstName,
          lastName: params.patient.lastName,
          dateOfBirth: this.parseDate(params.patient.dateOfBirth),
          gender: params.patient.gender || null,
          phoneNumber: params.patient.phoneNumber || null,
          email: params.patient.email || null,
          addressLine1: params.patient.addressLine1 || null,
          addressLine2: params.patient.addressLine2 || null,
          city: params.patient.city || null,
          state: params.patient.state || null,
          zipCode: params.patient.zipCode || null,
        },
        promoCode: params.promoCode,
        drawCenterId: params.drawCenterId,
        idempotencyKey: params.idempotencyKey,
        state: params.patient.state,
      });
    } finally {
      await cartService.unlockCart(params.userId);
    }

    return {
      id: order.id,
      order,
    };
  }

  async getSession(params: { id: string; userId: string }) {
    const order = await orderService.getOrderById(params.id);
    if (order.userId !== params.userId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');
    }

    return {
      id: order.id,
      status: order.orderStatus,
      order,
    };
  }

  async submitSession(params: { id: string; userId: string }) {
    const session = await this.getSession({ id: params.id, userId: params.userId });

    const payment = await paymentService.createOrUpdatePaymentIntentForOrder({
      orderId: session.order.id,
      userId: params.userId,
    });

    return {
      order: await orderService.getOrderById(session.order.id),
      clientSecret: payment.clientSecret,
      stripePaymentIntentId: payment.paymentIntentId,
    };
  }

  async expireOldSessions(now: Date = new Date()) {
    return orderService.expireStaleOrders(now);
  }
}

export const checkoutService = new CheckoutService();
