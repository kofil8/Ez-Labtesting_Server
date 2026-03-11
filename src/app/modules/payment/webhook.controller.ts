import { Request, Response } from 'express';
import Stripe from 'stripe';
import { env } from '../../../config/env';
import { enqueueAccessLabOrder } from '../../queues/accessLab.queue';
import { auditLogService } from '../../services/auditLog.service';
import { webhookEventLedgerService } from '../../services/webhookEventLedger.service';
import { serializeError } from '../../utils/redactSensitive';
import { orderService } from '../orders/orders.service';

const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: '2026-02-25.clover',
});

export class WebhookController {
  private async resolveOrderFromPaymentIntent(paymentIntent: Stripe.PaymentIntent) {
    const paymentIntentId = paymentIntent.id;
    const metadataOrderId = paymentIntent.metadata?.orderId;

    if (metadataOrderId) {
      try {
        const orderByMetadata = await orderService.getOrderById(metadataOrderId);
        if (orderByMetadata) {
          return orderByMetadata;
        }
      } catch {
        console.warn('[Webhook] Order not found by metadata orderId:', metadataOrderId);
      }
    }

    return await orderService.getOrderByPaymentIntentId(paymentIntentId);
  }

  /**
   * Handle Stripe webhook events
   * CRITICAL: This endpoint requires raw body for signature verification
   */
  async handleStripeWebhook(req: Request, res: Response) {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      console.error('[Webhook] Missing stripe-signature header');
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('[Webhook] Signature verification failed:', err);
      return res.status(400).json({ error: `Webhook signature verification failed: ${err}` });
    }

    console.log('[Webhook] Received event:', event.type, event.id);

    const dedupState = await webhookEventLedgerService.beginProcessing(event.id, event.type);
    if (dedupState.state === 'already_processed') {
      console.log('[Webhook] Duplicate event ignored (already processed):', event.id);
      return res.status(200).json({ received: true, dedup: 'already_processed' });
    }

    if (dedupState.state === 'in_progress') {
      console.log('[Webhook] Duplicate event ignored (in progress):', event.id);
      return res.status(200).json({ received: true, dedup: 'in_progress' });
    }

    // Handle different event types
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
          console.log(`[Webhook] Unhandled event type: ${event.type}`);
      }

      await webhookEventLedgerService.markProcessed(event.id);

      // Acknowledge receipt
      return res.status(200).json({ received: true });
    } catch (error) {
      const serialized = serializeError(error);
      await webhookEventLedgerService.markFailed(
        event.id,
        String(serialized.message || 'Webhook handler failed'),
      );
      console.error('[Webhook] Error processing event:', serializeError(error));
      return res.status(500).json({ error: 'Webhook handler failed' });
    }
  }

  /**
   * Handle payment_intent.succeeded event
   */
  /**
   * Handle payment_intent.succeeded event
   */
  private async handlePaymentIntentSucceeded(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const paymentIntentId = paymentIntent.id;

    console.log('[Webhook] Payment succeeded:', paymentIntentId);

    const order = await this.resolveOrderFromPaymentIntent(paymentIntent);

    if (!order) {
      console.error('[Webhook] Order not found for payment intent:', paymentIntentId);
      await auditLogService.record({
        action: 'WEBHOOK_PAYMENT_ORDER_NOT_FOUND',
        resource: 'payment_intent',
        resourceId: paymentIntentId,
        status: 'failure',
        details: {
          eventType: event.type,
        },
        errorMessage: 'Order not found for payment intent',
      });
      // Return non-2xx so Stripe retries (prevents silent loss)
      throw new Error(`Order not found for paymentIntent ${paymentIntentId}`);
    }

    // Ownership check (best-effort)
    if (
      paymentIntent.metadata?.userId &&
      order.userId &&
      paymentIntent.metadata.userId !== order.userId
    ) {
      console.error('[Webhook] PaymentIntent userId mismatch', {
        paymentUserId: paymentIntent.metadata.userId,
        orderUserId: order.userId,
      });
      throw new Error('PaymentIntent userId mismatch');
    }

    // Amount & currency integrity checks
    const expectedCents = Math.round(Number(order.total) * 100);
    const receivedCents = paymentIntent.amount_received ?? paymentIntent.amount;
    const currency = (paymentIntent.currency || '').toLowerCase();

    const expectedCurrency = env.PAYMENT_CURRENCY.toLowerCase();

    if (currency !== expectedCurrency) {
      console.error('[Webhook] Unexpected currency:', currency);
      throw new Error('Unexpected currency');
    }

    if (receivedCents < expectedCents) {
      console.error('[Webhook] Underpayment detected:', {
        expectedCents,
        receivedCents,
        orderId: order.id,
        paymentIntentId,
      });
      // Mark manual review required; do NOT fulfill
      await orderService.markManualReviewRequired(order.id, {
        reason: 'UNDERPAYMENT',
        expectedCents,
        receivedCents,
        paymentIntentId,
      });

      await auditLogService.record({
        action: 'WEBHOOK_UNDERPAYMENT_DETECTED',
        resource: 'order',
        resourceId: order.id,
        details: {
          paymentIntentId,
          expectedCents,
          receivedCents,
        },
      });
      return;
    }

    console.log('[Webhook] Found order:', order.id, 'Status:', order.status);

    const updatedOrder = await orderService.markOrderPaid({
      orderId: order.id,
      stripePaymentIntentId: paymentIntentId,
    });

    console.log('[Webhook] Order marked as PAID:', updatedOrder.id);

    await enqueueAccessLabOrder(updatedOrder.id);

    console.log('[Webhook] Queued ACCESS Lab order placement job for order:', updatedOrder.id);

    await auditLogService.record({
      action: 'WEBHOOK_PAYMENT_SUCCEEDED',
      resource: 'order',
      resourceId: updatedOrder.id,
      details: {
        paymentIntentId,
      },
    });
  }

  /**
   * Handle payment_intent.payment_failed event
   */
  private async handlePaymentIntentFailed(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const paymentIntentId = paymentIntent.id;

    console.log('[Webhook] Payment failed:', paymentIntentId);

    // Find order by metadata.orderId first, fallback by payment intent ID
    const order = await this.resolveOrderFromPaymentIntent(paymentIntent);

    if (!order) {
      console.error('[Webhook] Order not found for failed payment:', paymentIntentId);
      return;
    }

    // Mark order as FAILED
    await orderService.markOrderFailed(order.id);

    console.log('[Webhook] Order marked as FAILED:', order.id);

    await auditLogService.record({
      action: 'WEBHOOK_PAYMENT_FAILED',
      resource: 'order',
      resourceId: order.id,
      details: {
        paymentIntentId,
      },
    });

    // TODO: Send notification to user about payment failure
  }

  /**
   * Handle payment_intent.canceled event
   */
  private async handlePaymentIntentCanceled(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const paymentIntentId = paymentIntent.id;

    console.log('[Webhook] Payment canceled:', paymentIntentId);

    // Find order by metadata.orderId first, fallback by payment intent ID
    const order = await this.resolveOrderFromPaymentIntent(paymentIntent);

    if (!order) {
      console.error('[Webhook] Order not found for canceled payment:', paymentIntentId);
      return;
    }

    // Mark order as FAILED
    await orderService.markOrderFailed(order.id);

    console.log('[Webhook] Order marked as FAILED (canceled):', order.id);

    await auditLogService.record({
      action: 'WEBHOOK_PAYMENT_CANCELED',
      resource: 'order',
      resourceId: order.id,
      details: {
        paymentIntentId,
      },
    });
  }

  /**
   * Handle payment_intent.processing event (ACH Direct Debit)
   *
   * ACH is a delayed-notification payment method. When a customer authorises
   * an ACH debit, the PaymentIntent moves to `processing` while the bank
   * transfer is in transit. Funds are NOT yet available.
   *
   * We mark the order as PAYMENT_PROCESSING so the UI can show the customer
   * that their payment is being verified. We do NOT fulfil the order yet.
   */
  private async handlePaymentIntentProcessing(event: Stripe.Event) {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const paymentIntentId = paymentIntent.id;

    console.log('[Webhook] Payment processing (ACH in transit):', paymentIntentId);

    const order = await this.resolveOrderFromPaymentIntent(paymentIntent);

    if (!order) {
      console.warn('[Webhook] Order not found for processing payment:', paymentIntentId);
      await auditLogService.record({
        action: 'WEBHOOK_PAYMENT_PROCESSING_ORDER_NOT_FOUND',
        resource: 'payment_intent',
        resourceId: paymentIntentId,
        status: 'failure',
        details: { eventType: event.type },
        errorMessage: 'Order not found for processing payment intent',
      });
      return;
    }

    // Ownership check
    if (
      paymentIntent.metadata?.userId &&
      order.userId &&
      paymentIntent.metadata.userId !== order.userId
    ) {
      console.error('[Webhook] PaymentIntent userId mismatch (processing)', {
        paymentUserId: paymentIntent.metadata.userId,
        orderUserId: order.userId,
      });
      throw new Error('PaymentIntent userId mismatch');
    }

    await orderService.markOrderPaymentProcessing({
      orderId: order.id,
      stripePaymentIntentId: paymentIntentId,
    });

    console.log('[Webhook] Order marked as PAYMENT_PROCESSING:', order.id);

    await auditLogService.record({
      action: 'WEBHOOK_PAYMENT_PROCESSING',
      resource: 'order',
      resourceId: order.id,
      details: {
        paymentIntentId,
        paymentMethodType: paymentIntent.payment_method_types?.join(', ') || 'unknown',
      },
    });
  }

  /**
   * Handle charge.dispute.created event (ACH return / dispute)
   *
   * ACH disputes happen when a customer's bank reverses the debit.
   * This can occur up to 60 days after the original charge.
   * We flag the order for manual review immediately.
   */
  private async handleChargeDisputeCreated(event: Stripe.Event) {
    const dispute = event.data.object as Stripe.Dispute;
    const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id;
    const paymentIntentId =
      typeof dispute.payment_intent === 'string'
        ? dispute.payment_intent
        : dispute.payment_intent?.id;

    console.log('[Webhook] Charge dispute created:', dispute.id, 'PI:', paymentIntentId);

    if (!paymentIntentId) {
      console.error('[Webhook] Dispute has no payment_intent:', dispute.id);
      await auditLogService.record({
        action: 'WEBHOOK_DISPUTE_NO_PAYMENT_INTENT',
        resource: 'dispute',
        resourceId: dispute.id,
        status: 'failure',
        details: { chargeId, reason: dispute.reason },
        errorMessage: 'Dispute has no associated payment intent',
      });
      return;
    }

    const order = await orderService.getOrderByPaymentIntentId(paymentIntentId);

    if (!order) {
      console.error('[Webhook] Order not found for disputed charge:', paymentIntentId);
      await auditLogService.record({
        action: 'WEBHOOK_DISPUTE_ORDER_NOT_FOUND',
        resource: 'dispute',
        resourceId: dispute.id,
        status: 'failure',
        details: { paymentIntentId, chargeId },
        errorMessage: 'Order not found for disputed payment',
      });
      return;
    }

    await orderService.markOrderDisputed(order.id, {
      disputeId: dispute.id,
      chargeId,
      paymentIntentId,
      reason: dispute.reason,
      amount: dispute.amount,
      currency: dispute.currency,
      status: dispute.status,
    });

    console.log('[Webhook] Order flagged for manual review (dispute):', order.id);

    await auditLogService.record({
      action: 'WEBHOOK_DISPUTE_CREATED',
      resource: 'order',
      resourceId: order.id,
      details: {
        disputeId: dispute.id,
        reason: dispute.reason,
        amount: dispute.amount,
        currency: dispute.currency,
        status: dispute.status,
      },
    });
  }

  /**
   * Handle charge.dispute.closed event
   *
   * Fires when a dispute is resolved (won, lost, or withdrawn).
   * If lost, the funds have been permanently reversed.
   */
  private async handleChargeDisputeClosed(event: Stripe.Event) {
    const dispute = event.data.object as Stripe.Dispute;
    const paymentIntentId =
      typeof dispute.payment_intent === 'string'
        ? dispute.payment_intent
        : dispute.payment_intent?.id;

    console.log('[Webhook] Dispute closed:', dispute.id, 'Status:', dispute.status);

    if (!paymentIntentId) {
      console.warn('[Webhook] Closed dispute has no payment_intent:', dispute.id);
      return;
    }

    const order = await orderService.getOrderByPaymentIntentId(paymentIntentId);

    if (!order) {
      console.warn('[Webhook] Order not found for closed dispute:', paymentIntentId);
      return;
    }

    if (dispute.status === 'lost') {
      // Funds permanently reversed — mark order FAILED
      await orderService.markOrderFailed(order.id);
      console.log('[Webhook] Dispute lost — order marked FAILED:', order.id);
    }

    await auditLogService.record({
      action: 'WEBHOOK_DISPUTE_CLOSED',
      resource: 'order',
      resourceId: order.id,
      details: {
        disputeId: dispute.id,
        outcome: dispute.status,
        paymentIntentId,
      },
    });
  }

  /**
   * Handle charge.refunded event
   *
   * Fires when a charge is refunded (full or partial).
   * We flag the order for manual review.
   */
  private async handleChargeRefunded(event: Stripe.Event) {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId =
      typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;

    console.log('[Webhook] Charge refunded:', charge.id, 'PI:', paymentIntentId);

    if (!paymentIntentId) {
      console.warn('[Webhook] Refunded charge has no payment_intent:', charge.id);
      return;
    }

    const order = await orderService.getOrderByPaymentIntentId(paymentIntentId);

    if (!order) {
      console.warn('[Webhook] Order not found for refunded charge:', paymentIntentId);
      return;
    }

    await orderService.markManualReviewRequired(order.id, {
      reason: 'CHARGE_REFUNDED',
      chargeId: charge.id,
      paymentIntentId,
      amountRefunded: charge.amount_refunded,
      currency: charge.currency,
    });

    console.log('[Webhook] Order flagged for review (refund):', order.id);

    await auditLogService.record({
      action: 'WEBHOOK_CHARGE_REFUNDED',
      resource: 'order',
      resourceId: order.id,
      details: {
        chargeId: charge.id,
        paymentIntentId,
        amountRefunded: charge.amount_refunded,
        currency: charge.currency,
        refunded: charge.refunded,
      },
    });
  }
}

export const webhookController = new WebhookController();
