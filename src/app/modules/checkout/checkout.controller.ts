import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { checkoutService } from './checkout.service';

const asParamString = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] : value;

export class CheckoutController {
  async createSession(req: Request, res: Response) {
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) return res.status(httpStatus.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });

    const { patient, items, promoCode, drawCenterId } = req.body;
    const idempotencyKey = (req.header('Idempotency-Key') || '').trim() || undefined;

    const session = await checkoutService.createSession({
      userId,
      req,
      patient,
      items,
      promoCode,
      drawCenterId,
      idempotencyKey,
    });

    return res.status(httpStatus.CREATED).json({ success: true, data: session });
  }

  async getSession(req: Request, res: Response) {
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) return res.status(httpStatus.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });

    const id = asParamString(req.params.id);
    if (!id) return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'Missing session id' });
    const session = await checkoutService.getSession({ id, userId });

    return res.status(httpStatus.OK).json({ success: true, data: session });
  }

  async submitSession(req: Request, res: Response) {
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) return res.status(httpStatus.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });

    const id = asParamString(req.params.id);
    if (!id) return res.status(httpStatus.BAD_REQUEST).json({ success: false, message: 'Missing session id' });

    const result = await checkoutService.submitSession({
      id,
      userId,
    });

    return res.status(httpStatus.OK).json({ success: true, data: result });
  }
}

export const checkoutController = new CheckoutController();
