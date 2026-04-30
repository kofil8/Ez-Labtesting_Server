jest.mock('../payment/payment.service', () => ({
  paymentService: {
    createOrUpdatePaymentIntentForOrder: jest.fn(),
    confirmPaymentIntent: jest.fn(),
  },
}));

jest.mock('../../queues/labSubmission.queue', () => ({
  enqueueLabSubmission: jest.fn(),
}));

jest.mock('./orders.service', () => ({
  orderService: {
    createOrder: jest.fn(),
    getOrderById: jest.fn(),
    getOrdersByUserId: jest.fn(),
    getLatestResumableOrderForUser: jest.fn(),
    getManualReviewOrders: jest.fn(),
    adminResendSubmission: jest.fn(),
    getOrderWithTrackingStatus: jest.fn(),
    markOrderPaid: jest.fn(),
    getAllOrders: jest.fn(),
    confirmOrderByUser: jest.fn(),
  },
}));

import { paymentService } from '../payment/payment.service';
import { orderController } from './orders.controller';
import { orderService } from './orders.service';

const createResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('OrderController createOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates an internal order and returns a payment intent payload', async () => {
    (orderService.createOrder as jest.Mock).mockResolvedValue({
      id: 'order-1',
      orderNumber: 'ORD-1001',
    });
    (paymentService.createOrUpdatePaymentIntentForOrder as jest.Mock).mockResolvedValue({
      clientSecret: 'pi_secret',
      paymentIntentId: 'pi_123',
    });

    const req: any = {
      body: {
        labTestId: 'test-1',
        accessPayloadJson: { patient: { state: 'NY' } },
      },
      user: { id: 'user-1' },
    };
    const res = createResponse();
    const next = jest.fn();

    await orderController.createOrder(req, res, next);

    expect(orderService.createOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        labTestId: 'test-1',
      }),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          stripePaymentIntentId: 'pi_123',
        }),
      }),
    );
  });
});

describe('OrderController getOrdersByUserId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 403 when a customer requests another customer user id', async () => {
    const req: any = {
      params: { userId: 'user-2' },
      user: {
        id: 'user-1',
        role: 'CUSTOMER',
      },
    };
    const res = createResponse();

    await orderController.getOrdersByUserId(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(orderService.getOrdersByUserId).not.toHaveBeenCalled();
  });

  it('returns normalized customer orders for the authenticated user', async () => {
    (orderService.getOrdersByUserId as jest.Mock).mockResolvedValue([
      {
        id: 'order-1',
        orderNumber: 'ORD-1001',
        status: 'REQUISITION_READY',
        subtotal: 89,
        processingFee: 5,
        total: 94,
      },
    ]);

    const req: any = {
      params: { userId: 'user-1' },
      user: {
        id: 'user-1',
        role: 'CUSTOMER',
      },
    };
    const res = createResponse();

    await orderController.getOrdersByUserId(req, res);

    expect(orderService.getOrdersByUserId).toHaveBeenCalledWith('user-1');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        orders: [
          expect.objectContaining({
            orderNumber: 'ORD-1001',
            status: 'REQUISITION_READY',
          }),
        ],
      }),
    );
  });
});

describe('OrderController confirmPayment', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects a payment intent that is not bound to the order', async () => {
    (orderService.getOrderById as jest.Mock).mockResolvedValue({
      id: 'order-1',
      userId: 'user-1',
      total: 94,
    });
    (paymentService.confirmPaymentIntent as jest.Mock).mockResolvedValue({
      status: 'succeeded',
      amount: 94,
      currency: 'usd',
      paymentMethodTypes: ['card'],
      metadata: {
        orderId: 'order-2',
        userId: 'user-1',
      },
    });

    const req: any = {
      params: { orderId: 'order-1' },
      body: { stripePaymentIntentId: 'pi_wrong' },
      user: { id: 'user-1', role: 'CUSTOMER' },
    };
    const res = createResponse();

    await orderController.confirmPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(orderService.markOrderPaid).not.toHaveBeenCalled();
  });

  it('rejects an underpaid payment intent before marking the order paid', async () => {
    (orderService.getOrderById as jest.Mock).mockResolvedValue({
      id: 'order-1',
      userId: 'user-1',
      total: 94,
    });
    (paymentService.confirmPaymentIntent as jest.Mock).mockResolvedValue({
      status: 'succeeded',
      amount: 90,
      currency: 'usd',
      paymentMethodTypes: ['card'],
      metadata: {
        orderId: 'order-1',
        userId: 'user-1',
      },
    });

    const req: any = {
      params: { orderId: 'order-1' },
      body: { stripePaymentIntentId: 'pi_underpaid' },
      user: { id: 'user-1', role: 'CUSTOMER' },
    };
    const res = createResponse();

    await orderController.confirmPayment(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(orderService.markOrderPaid).not.toHaveBeenCalled();
  });
});
