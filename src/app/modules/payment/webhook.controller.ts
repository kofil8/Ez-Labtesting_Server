import { Request, Response } from 'express';
import Stripe from 'stripe';
import { auditLogService } from '../../services/auditLog.service';
import { webhookEventLedgerService } from '../../services/webhookEventLedger.service';
import { serializeError } from '../../utils/redactSensitive';
import { orderService } from '../orders/orders.service';
import { stripePaymentGateway } from './services/stripe-payment-gateway.service';

export class WebhookController {
  private async resolveOrderFromPaymentIntent(paymentIntent: Stripe.PaymentIntent) {
    const metadataOrderId = paymentIntent.metadata?.orderId;

    if (metadataOrderId) {
      try {
        return await orderService.getOrderById(metadataOrderId);
      } catch {
        return orderService.getOrderByPaymentIntentId(paymentIntent.id);
      }
    }

    return orderService.getOrderByPaymentIntentId(paymentIntent.id);
  }

  async handleStripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];
    if (!sig || Array.isArray(sig)) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    let event: Stripe.Event;
    try {
      event = stripePaymentGateway.verifyWebhookSignature(req.body as Buffer, sig);
    } catch (error) {
      return res.status(400).json({
        error: `Webhook signature verification failed: ${(error as Error).message}`,
      });
    }

    const dedupState = await webhookEventLedgerService.beginProcessing(event.id, event.type);
    if (dedupState.state !== 'process') {
      return res.status(200).json({ received: true, dedup: dedupState.state });
    }

    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event);
          break;
        case 'payment_intent.processing':
          await this.handlePaymentIntentProcessing(event);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event);
          break;
        case 'payment_intent.canceled':
          await this.handlePaymentIntentCanceled(event);
          break;
        case 'charge.dispute.created':
          await this.handleChargeDisputeCreated(event);
          break;
        case 'charge.dispute.closed':
          await this.handleChargeDisputeClosed(event);
          break;
        case 'charge.refunded':
          await this.handleChargeRefunded(event);
          break;
        default:
          break;
      }

      await webhookEventLedgerService.markProcessed(event.id);
      return res.status(200).json({ received: true });
    } catch (error) {
      const serialized = serializeError(error);
      await webhookEventLedgerService.markFailed(
        event.id,
        String(serialized.message || 'Webhook handler failed'),
      );
      return res.status(500).json({ error: 'Webhook handler failed' });
    }
  }

  private async handlePaymentIntentSucceeded(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const order = await this.resolveOrderFromPaymentIntent(paymentIntent);

    if (!order) {
      throw new Error(`Order not found for payment intent ${paymentIntent.id}`);
    }

    const expectedCents = Math.round(Number(order.total) * 100);
    const receivedCents = paymentIntent.amount_received ?? paymentIntent.amount;

    if (receivedCents < expectedCents) {
      await orderService.markManualReviewRequired(order.id, {
        reason: 'UNDERPAYMENT',
        expectedCents,
        receivedCents,
        paymentIntentId: paymentIntent.id,
      });
      return;
    }

    await orderService.markOrderPaid({
      orderId: order.id,
      stripePaymentIntentId: paymentIntent.id,
      lastPaymentEventId: event.id,
      paymentSnapshotJson: {
        amount: paymentIntent.amount,
        amountReceived: paymentIntent.amount_received,
        currency: paymentIntent.currency,
        paymentMethodTypes: paymentIntent.payment_method_types,
        metadata: paymentIntent.metadata,
      },
    });

    await auditLogService.record({
      action: 'WEBHOOK_PAYMENT_SUCCEEDED',
      resource: 'order',
      resourceId: order.id,
      details: {
        paymentIntentId: paymentIntent.id,
        eventId: event.id,
      },
    });
  }

  private async handlePaymentIntentProcessing(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const order = await this.resolveOrderFromPaymentIntent(paymentIntent);
    if (!order) {
      return;
    }

    await orderService.markOrderPaymentProcessing({
      orderId: order.id,
      stripePaymentIntentId: paymentIntent.id,
      lastPaymentEventId: event.id,
    });
  }

  private async handlePaymentIntentFailed(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const order = await this.resolveOrderFromPaymentIntent(paymentIntent);
    if (!order) {
      return;
    }

    await orderService.markOrderFailed(order.id, 'Payment failed');
  }

  private async handlePaymentIntentCanceled(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const order = await this.resolveOrderFromPaymentIntent(paymentIntent);
    if (!order) {
      return;
    }

    await orderService.markOrderFailed(order.id, 'Payment canceled');
  }

  private async handleChargeDisputeCreated(event: Stripe.Event) {
    const dispute = event.data.object as Stripe.Dispute;
    const paymentIntentId =
      typeof dispute.payment_intent === 'string'
        ? dispute.payment_intent
        : dispute.payment_intent?.id;

    if (!paymentIntentId) {
      return;
    }

    const order = await orderService.getOrderByPaymentIntentId(paymentIntentId);
    if (!order) {
      return;
    }

    await orderService.markOrderDisputed(order.id, {
      disputeId: dispute.id,
      paymentIntentId,
      status: dispute.status,
      reason: dispute.reason,
    });
  }

  private async handleChargeDisputeClosed(event: Stripe.Event) {
    const dispute = event.data.object as Stripe.Dispute;
    const paymentIntentId =
      typeof dispute.payment_intent === 'string'
        ? dispute.payment_intent
        : dispute.payment_intent?.id;

    if (!paymentIntentId) {
      return;
    }

    const order = await orderService.getOrderByPaymentIntentId(paymentIntentId);
    if (!order) {
      return;
    }

    if (dispute.status === 'lost') {
      await orderService.markOrderFailed(order.id, 'Charge dispute lost');
    }
  }

  private async handleChargeRefunded(event: Stripe.Event) {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId =
      typeof charge.payment_intent === 'string'
        ? charge.payment_intent
        : charge.payment_intent?.id;

    if (!paymentIntentId) {
      return;
    }

    const order = await orderService.getOrderByPaymentIntentId(paymentIntentId);
    if (!order) {
      return;
    }

    await orderService.markManualReviewRequired(order.id, {
      reason: 'CHARGE_REFUNDED',
      paymentIntentId,
      amountRefunded: charge.amount_refunded,
      chargeId: charge.id,
    });
  }
}

export const webhookController = new WebhookController();
