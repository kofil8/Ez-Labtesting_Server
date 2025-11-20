import { Request, Response } from "express";
import { env } from "../../config/env";
import { stripe } from "../../config/stripe";
import PaymentService from "./payment.service";

class PaymentController {
  async createCheckout(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const result = await PaymentService.createCheckoutSession(
        user.userId,
        req.body
      );
      res.status(200).json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  async history(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const payments = await PaymentService.getPaymentHistory(user.userId);
      res.status(200).json(payments);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  }

  async webhook(req: Request, res: Response) {
    try {
      const sig = req.headers["stripe-signature"];
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig!,
        env.STRIPE_WEBHOOK_SECRET
      );

      await PaymentService.handleWebhook(event.type, event.data.object);
      res.status(200).json({ received: true });
    } catch (err: any) {
      console.error("Webhook Error:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
}

export default new PaymentController();
