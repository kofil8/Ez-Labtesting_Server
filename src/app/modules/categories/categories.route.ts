import { Router } from 'express';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import categoryController from './categories.controller';
import {
  createCategorySchema,
  getCategoryByIdSchema,
  updateCategorySchema,
} from './categories.validation';

const router = Router();

// Public routes
router.get('/all', categoryController.getAllCategories);
router.get(
  '/:categoryId',
  validateRequest(getCategoryByIdSchema),
  categoryController.getCategoryById,
);

// Admin routes
router.post(
  '/',
  auth('ADMIN', 'SUPER_ADMIN'),
  validateRequest(createCategorySchema),
  categoryController.createCategory,
);

router.patch(
  '/:categoryId',
  auth('ADMIN', 'SUPER_ADMIN'),
  validateRequest(updateCategorySchema),
  categoryController.updateCategory,
);

router.delete(
  '/:categoryId',
  auth('ADMIN', 'SUPER_ADMIN'),
  validateRequest(getCategoryByIdSchema),
  categoryController.deleteCategory,
);

export default router;
