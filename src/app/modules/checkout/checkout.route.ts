import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { createCheckoutSessionSchema, submitCheckoutSessionSchema } from './checkout.validation';
import { checkoutController } from './checkout.controller';

const router = express.Router();

router.post(
  '/sessions',
  auth(),
  validateRequest(createCheckoutSessionSchema),
  (req, res, next) => checkoutController.createSession(req, res).catch(next),
);

router.get('/sessions/:id', auth(), (req, res, next) => checkoutController.getSession(req, res).catch(next));

router.post(
  '/sessions/:id/submit',
  auth(),
  validateRequest(submitCheckoutSessionSchema),
  (req, res, next) => checkoutController.submitSession(req, res).catch(next),
);

export const CheckoutRoutes = router;
