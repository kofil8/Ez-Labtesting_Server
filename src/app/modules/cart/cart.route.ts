import express from 'express';
import auth from '../../middlewares/auth';
import { enforceCustomerOrderingAvailability } from '../../middlewares/enforceCustomerOrderingAvailability';
import { cartSyncLimiter } from '../../middlewares/redisLimit';
import validateRequest from '../../middlewares/validateRequest';
import { cartController } from './cart.controller';
import {
  addCartItemSchema,
  applyPromoCodeSchema,
  cartLockSchema,
  removeCartItemSchema,
  syncCartSchema,
  updateCartItemSchema,
  validateCartSchema,
} from './cart.validation';

const router = express.Router();

router.get('/', auth(), cartController.getCart);
router.get('/lock', auth(), cartController.getLockStatus);
router.post(
  '/lock',
  auth(),
  enforceCustomerOrderingAvailability,
  validateRequest(cartLockSchema),
  cartController.lockCart,
);
router.delete('/lock', auth(), cartController.unlockCart);
router.post(
  '/sync',
  auth(),
  enforceCustomerOrderingAvailability,
  cartSyncLimiter,
  validateRequest(syncCartSchema),
  cartController.syncCart,
);
router.post(
  '/items',
  auth(),
  enforceCustomerOrderingAvailability,
  validateRequest(addCartItemSchema),
  cartController.addItem,
);
router.patch(
  '/items/:itemId',
  auth(),
  enforceCustomerOrderingAvailability,
  validateRequest(updateCartItemSchema),
  cartController.updateItem,
);
router.delete(
  '/items/:itemId',
  auth(),
  enforceCustomerOrderingAvailability,
  validateRequest(removeCartItemSchema),
  cartController.removeItem,
);
router.post(
  '/apply-promo',
  auth(),
  enforceCustomerOrderingAvailability,
  validateRequest(applyPromoCodeSchema),
  cartController.applyPromoCode,
);
router.delete('/promo', auth(), enforceCustomerOrderingAvailability, cartController.removePromoCode);
router.post(
  '/validate',
  auth(),
  enforceCustomerOrderingAvailability,
  validateRequest(validateCartSchema),
  cartController.validateCart,
);

export const CartRoutes = router;
