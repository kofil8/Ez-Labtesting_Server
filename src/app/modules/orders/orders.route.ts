import { Role } from '@prisma/client';
import express, { Router } from 'express';
import auth from '../../middlewares/auth';
import { orderController } from './orders.controller';

const router: Router = express.Router();

/**
 * @route POST /orders
 * @description Create a new order with ACCESS Lab data
 */
router.post('/', auth(Role.CUSTOMER), (req, res) => orderController.createOrder(req, res));

/**
 * @route GET /orders/resume
 * @description Get latest resumable checkout order for current user
 */
router.get('/resume', auth(Role.CUSTOMER), (req, res) =>
  orderController.getResumableOrder(req, res),
);

/**
 * @route GET /orders/mine
 * @description Get orders for current user
 */
router.get('/mine', auth(Role.CUSTOMER), (req, res) => orderController.getMyOrders(req, res));

/**
 * @route GET /orders/manual-review
 * @description Get manual-review-required orders (admin/super admin)
 */
router.get('/manual-review', auth(Role.ADMIN, Role.SUPER_ADMIN), (req, res) =>
  orderController.getManualReviewOrders(req, res),
);

/**
 * @route GET /orders/user/:userId
 * @description Get all orders for a specific user
 */
router.get('/user/:userId', auth(Role.CUSTOMER), (req, res) =>
  orderController.getOrdersByUserId(req, res),
);

/**
 * @route POST /orders/:orderId/retry-access
 * @description Retry ACCESS Lab placement for a paid/failed order
 */
router.post('/:orderId/retry-access', auth(Role.CUSTOMER), (req, res) =>
  orderController.retryAccessPlacement(req, res),
);

/**
 * @route POST /orders/:orderId/manual-review/approve
 * @description Approve and retry manual-review-required order (admin/super admin)
 */
router.post('/:orderId/manual-review/approve', auth(Role.ADMIN, Role.SUPER_ADMIN), (req, res) =>
  orderController.approveManualReviewOrder(req, res),
);

/**
 * @route GET /orders/:orderId/tracking
 * @description Get order tracking status with real-time progress
 */
router.get('/:orderId/tracking', auth(Role.CUSTOMER), (req, res) =>
  orderController.getOrderTracking(req, res),
);

/**
 * @route GET /orders/:orderId/requisition
 * @description Get a signed/secure download URL for the requisition PDF
 */
router.get('/:orderId/requisition', auth(Role.CUSTOMER), (req, res) =>
  orderController.getRequisitionDownload(req, res),
);

/**
 * @route POST /orders/:orderId/confirm-payment
 * @description Confirm payment and mark order as paid
 */
router.post('/:orderId/confirm-payment', auth(Role.CUSTOMER), (req, res) =>
  orderController.confirmPayment(req, res),
);

/**
 * @route GET /orders/:orderId
 * @description Get order details by ID
 */
router.get('/:orderId', auth(Role.CUSTOMER), (req, res) => orderController.getOrderById(req, res));

/**
 * @route GET /orders/
 * @description Get all orders
 */
router.get('/', auth(Role.ADMIN, Role.SUPER_ADMIN), (req, res) =>
  orderController.getAllOrders(req, res),
);

export const OrderRoutes = router;
