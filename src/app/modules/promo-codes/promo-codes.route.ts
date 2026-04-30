import express from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { promoCodesController } from './promo-codes.controller';
import {
  createPromoCodeSchema,
  promoCodeIdSchema,
  updatePromoCodeSchema,
} from './promo-codes.validation';

const router = express.Router();

const promoAdminRoles = ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin'];

router.get('/', auth(...promoAdminRoles), promoCodesController.list);
router.get('/:id', auth(...promoAdminRoles), validateRequest(promoCodeIdSchema), promoCodesController.getById);
router.post('/', auth(...promoAdminRoles), validateRequest(createPromoCodeSchema), promoCodesController.create);
router.patch('/:id', auth(...promoAdminRoles), validateRequest(updatePromoCodeSchema), promoCodesController.update);
router.delete('/:id', auth(...promoAdminRoles), validateRequest(promoCodeIdSchema), promoCodesController.delete);

export const PromoCodeRoutes = router;
