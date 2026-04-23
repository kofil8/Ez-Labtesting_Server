import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { cartController } from './cart.controller';
import {
  addCartItemSchema,
  applyPromoCodeSchema,
  removeCartItemSchema,
  updateCartItemSchema,
  validateCartSchema,
} from './cart.validation';

const router = express.Router();

router.get('/', auth(), cartController.getCart);
router.post('/items', auth(), validateRequest(addCartItemSchema), cartController.addItem);
router.patch(
  '/items/:itemId',
  auth(),
  validateRequest(updateCartItemSchema),
  cartController.updateItem,
);
router.delete(
  '/items/:itemId',
  auth(),
  validateRequest(removeCartItemSchema),
  cartController.removeItem,
);
router.post('/apply-promo', auth(), validateRequest(applyPromoCodeSchema), cartController.applyPromoCode);
router.delete('/promo', auth(), cartController.removePromoCode);
router.post('/validate', auth(), validateRequest(validateCartSchema), cartController.validateCart);

export const CartRoutes = router;
