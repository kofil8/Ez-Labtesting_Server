import Stripe from 'stripe';
import { env } from '../../../../config/env';

class StripePaymentGateway {
  readonly client = new Stripe(env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-02-25.clover',
  });

  createPaymentIntent(payload: Stripe.PaymentIntentCreateParams, options?: Stripe.RequestOptions) {
    return this.client.paymentIntents.create(payload, options);
  }

  retrievePaymentIntent(paymentIntentId: string) {
    return this.client.paymentIntents.retrieve(paymentIntentId);
  }

  updatePaymentIntent(paymentIntentId: string, payload: Stripe.PaymentIntentUpdateParams) {
    return this.client.paymentIntents.update(paymentIntentId, payload);
  }

  verifyWebhookSignature(payload: Buffer, signature: string) {
    return this.client.webhooks.constructEvent(payload, signature, env.STRIPE_WEBHOOK_SECRET);
  }

  createRefund(params: Stripe.RefundCreateParams, options?: Stripe.RequestOptions) {
    return this.client.refunds.create(params, options);
  }

  retrieveCharge(chargeId: string) {
    return this.client.charges.retrieve(chargeId);
  }

  mapIntentStatus(status: Stripe.PaymentIntent.Status) {
    switch (status) {
      case 'succeeded':
        return 'SUCCEEDED';
      case 'processing':
        return 'PROCESSING';
      case 'requires_action':
      case 'requires_confirmation':
      case 'requires_capture':
      case 'requires_payment_method':
        return 'REQUIRES_ACTION';
      case 'canceled':
        return 'CANCELLED';
      default:
        return 'PENDING';
    }
  }
}

export const stripePaymentGateway = new StripePaymentGateway();
