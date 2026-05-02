import { Role } from '@prisma/client';
import express, { Router } from 'express';
import auth from '../../middlewares/auth';
import { enforceCustomerOrderingAvailability } from '../../middlewares/enforceCustomerOrderingAvailability';
import { orderController } from './orders.controller';

const router: Router = express.Router();

router.post(
  '/',
  auth(Role.CUSTOMER),
  enforceCustomerOrderingAvailability,
  (req, res, next) => orderController.createOrder(req, res, next),
);
router.get('/resume', auth(Role.CUSTOMER), (req, res) => orderController.getResumableOrder(req, res));
router.get('/mine', auth(Role.CUSTOMER), (req, res) => orderController.getMyOrders(req, res));
router.get('/manual-review', auth(Role.ADMIN, Role.SUPER_ADMIN), (req, res) =>
  orderController.getManualReviewOrders(req, res),
);
router.get('/user/:userId', auth(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN), (req, res) =>
  orderController.getOrdersByUserId(req, res),
);
router.post('/:orderId/admin-resend', auth(Role.ADMIN, Role.SUPER_ADMIN), (req, res) =>
  orderController.adminResendSubmission(req, res),
);
router.post('/:orderId/retry-access', auth(Role.ADMIN, Role.SUPER_ADMIN), (req, res) =>
  orderController.retryAccessPlacement(req, res),
);
router.post('/:orderId/manual-review/approve', auth(Role.ADMIN, Role.SUPER_ADMIN), (req, res) =>
  orderController.approveManualReviewOrder(req, res),
);
router.get('/:orderId/tracking', auth(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN), (req, res) =>
  orderController.getOrderTracking(req, res),
);
router.get('/:orderId/requisition', auth(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN), (req, res) =>
  orderController.getRequisitionDownload(req, res),
);
router.post(
  '/:orderId/confirm-payment',
  auth(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN),
  enforceCustomerOrderingAvailability,
  (req, res) => orderController.confirmPayment(req, res),
);
router.post(
  '/:orderId/confirm-order',
  auth(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN),
  enforceCustomerOrderingAvailability,
  (req, res) => orderController.confirmOrder(req, res),
);
router.get('/:orderId', auth(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN), (req, res) =>
  orderController.getOrderById(req, res),
);
router.get('/', auth(Role.ADMIN, Role.SUPER_ADMIN), (req, res) => orderController.getAllOrders(req, res));

export const OrderRoutes = router;
