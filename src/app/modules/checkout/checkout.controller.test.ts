jest.mock('./checkout.service', () => ({
  checkoutService: {
    submitSession: jest.fn(),
  },
}));

import { checkoutController } from './checkout.controller';
import { checkoutService } from './checkout.service';

const createResponse = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('CheckoutController submitSession', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns payment intent payload for the created internal order', async () => {
    (checkoutService.submitSession as jest.Mock).mockResolvedValue({
      order: { id: 'order-1', orderStatus: 'PENDING_PAYMENT' },
      clientSecret: 'pi_secret',
      stripePaymentIntentId: 'pi_123',
    });

    const req: any = {
      params: { id: 'order-1' },
      body: {},
      user: { id: 'user-1' },
    };
    const res = createResponse();

    await checkoutController.submitSession(req, res);

    expect(checkoutService.submitSession).toHaveBeenCalledWith({
      id: 'order-1',
      userId: 'user-1',
    });
    expect(res.status).toHaveBeenCalledWith(200);
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
