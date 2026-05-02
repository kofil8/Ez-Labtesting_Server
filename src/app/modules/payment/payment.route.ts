import { Role } from '@prisma/client';
import express, { Router } from 'express';
import auth from '../../middlewares/auth';
import { enforceCustomerOrderingAvailability } from '../../middlewares/enforceCustomerOrderingAvailability';
import { paymentController } from './payment.controller';
import { webhookController } from './webhook.controller';

const router: Router = express.Router();

/**
 * @route POST /payment/webhook
 * @description Stripe webhook endpoint (raw body required)
 */
router.post('/webhook', (req, res) => webhookController.handleStripeWebhook(req, res));

/**
 * @route POST /payment/order-intent
 * @description Create (or reuse) a PaymentIntent for an existing Order.
 * Amount is derived from DB (tamper-proof).
 */
router.post(
  '/order-intent',
  auth(Role.CUSTOMER),
  enforceCustomerOrderingAvailability,
  (req, res) => paymentController.createPaymentIntentForOrder(req, res),
);

/**
 * @route POST /payment/confirm-payment-intent
 * @description Confirm payment intent status (client polling helper)
 */
router.post(
  '/confirm-payment-intent',
  auth(Role.CUSTOMER),
  enforceCustomerOrderingAvailability,
  (req, res) => paymentController.confirmPaymentIntent(req, res),
);

export const PaymentRoutes = router;
