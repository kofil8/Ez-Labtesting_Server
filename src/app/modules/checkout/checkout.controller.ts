import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { checkoutService } from './checkout.service';

export class CheckoutController {
  async createSession(req: Request, res: Response) {
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) return res.status(httpStatus.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });

    const { patient, items, accessPayloadJson } = req.body;

    const session = await checkoutService.createSession({
      userId,
      patient,
      items,
      accessPayloadJson,
    });

    return res.status(httpStatus.CREATED).json({ success: true, data: session });
  }

  async getSession(req: Request, res: Response) {
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) return res.status(httpStatus.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });

    const id = req.params.id;
    const session = await checkoutService.getSession({ id, userId });

    return res.status(httpStatus.OK).json({ success: true, data: session });
  }

  async submitSession(req: Request, res: Response) {
    const userId = (req as any).user?.id as string | undefined;
    if (!userId) return res.status(httpStatus.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' });

    const id = req.params.id;
    const { accessPayloadJson } = req.body;
    const idempotencyKey = (req.header('Idempotency-Key') || '').trim() || undefined;

    const result = await checkoutService.submitSession({
      id,
      userId,
      accessPayloadJson,
      idempotencyKey,
    });

    return res.status(httpStatus.OK).json({ success: true, data: result });
  }
}

export const checkoutController = new CheckoutController();
