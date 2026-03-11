import { OrderStatus } from '@prisma/client';
import httpStatus from 'http-status';
import Stripe from 'stripe';
import ApiError from '../../../app/errors/ApiErrors';
import { env } from '../../../config/env';
import prisma from '../../../shared/prisma';

const stripe = new Stripe(env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-02-25.clover',
});

/**
 * PaymentService
 *
 * Security principles:
 * - Amount is ALWAYS derived from the Order stored in DB, never from the client.
 * - A PaymentIntent is always bound to an Order via metadata.orderId.
 * - When reusing an existing PaymentIntent, we validate it belongs to the same user/order.
 */
export class PaymentService {
  /**
   * Create (or reuse/update) a Stripe PaymentIntent for a given Order.
   *
   * Supports Card + ACH (us_bank_account) + Link (and any other methods enabled in Stripe Dashboard)
   * via automatic_payment_methods.
   */
  async createOrUpdatePaymentIntentForOrder(params: { orderId: string; userId: string }) {
    const { orderId, userId } = params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        status: true,
        total: true,
        stripePaymentIntentId: true,
        createdAt: true,
      },
    });

    if (!order) throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
    if (order.userId !== userId) throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden');

    // Don't create a new PaymentIntent for already-paid or ACH-processing orders
    if (
      (
        [
          OrderStatus.PAID,
          OrderStatus.PAYMENT_PROCESSING,
          OrderStatus.LAB_ORDER_PLACED,
          OrderStatus.COMPLETED,
        ] as OrderStatus[]
      ).includes(order.status)
    ) {
      throw new ApiError(
        httpStatus.CONFLICT,
        `Order payment is already in progress or completed (status: ${order.status})`,
      );
    }

    const amountCents = this.toCents(order.total);

    // If we already have a PI, reuse it when possible
    if (order.stripePaymentIntentId) {
      const pi = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId);

      // Validate the PaymentIntent is actually tied to this order
      if (pi.metadata?.orderId && pi.metadata.orderId !== order.id) {
        throw new ApiError(httpStatus.CONFLICT, 'PaymentIntent is linked to a different order');
      }
      if (pi.metadata?.userId && pi.metadata.userId !== userId) {
        throw new ApiError(httpStatus.FORBIDDEN, 'PaymentIntent does not belong to this user');
      }

      // If PI is already succeeded/processing, just return its state
      if (['succeeded', 'processing'].includes(pi.status)) {
        return {
          success: true,
          clientSecret: pi.client_secret,
          paymentIntentId: pi.id,
          status: pi.status,
          amount: pi.amount / 100,
          currency: pi.currency,
        };
      }

      // Ensure correct amount/currency + metadata (safe to update in most states)
      const needsUpdate =
        pi.amount !== amountCents || pi.currency !== env.PAYMENT_CURRENCY.toLowerCase();
      if (needsUpdate) {
        await stripe.paymentIntents.update(pi.id, {
          amount: amountCents,
          currency: env.PAYMENT_CURRENCY.toLowerCase(),
          metadata: {
            ...pi.metadata,
            orderId: order.id,
            userId,
          },
        });
      }

      const refreshed = await stripe.paymentIntents.retrieve(pi.id);
      return {
        success: true,
        clientSecret: refreshed.client_secret,
        paymentIntentId: refreshed.id,
        status: refreshed.status,
        amount: refreshed.amount / 100,
        currency: refreshed.currency,
      };
    }

    // Create a fresh PaymentIntent (idempotent per orderId)
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency: env.PAYMENT_CURRENCY.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'always',
        },
        payment_method_options: {
          // ACH Direct Debit: require customer verification for mandate acceptance
          us_bank_account: {
            financial_connections: {
              permissions: ['payment_method'],
            },
          },
        },
        metadata: {
          orderId: order.id,
          userId,
        },
        description: `EzLabTesting order ${order.id}`,
      },
      { idempotencyKey: `order_pi_${order.id}` },
    );

    await prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: paymentIntent.id },
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
    };
  }

  /**
   * Retrieve payment intent details (server-side)
   */
  async getPaymentIntent(paymentIntentId: string) {
    return await stripe.paymentIntents.retrieve(paymentIntentId);
  }

  /**
   * Confirm payment intent status (server-side)
   */
  async confirmPaymentIntent(paymentIntentId: string) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    return {
      success: true,
      status: paymentIntent.status,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      paymentMethodTypes: paymentIntent.payment_method_types || [],
      metadata: paymentIntent.metadata || {},
    };
  }

  private toCents(amountDollars: number) {
    // Keep deterministic rounding
    return Math.round(Number(amountDollars) * 100);
  }
}

export const paymentService = new PaymentService();
