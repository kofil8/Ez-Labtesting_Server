import { Role } from '@prisma/client';
import express from 'express';
import auth from '../../middlewares/auth';
import { ReviewController } from './review.controller';

const router = express.Router();

// Public routes
router.get('/test/:testId', ReviewController.getReviewsForTest);
router.get('/:reviewId', ReviewController.getReview);

// Protected routes (require authentication)
router.post('/', auth(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN), ReviewController.createReview);

router.put(
  '/:reviewId',
  auth(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN),
  ReviewController.updateReview,
);

router.delete(
  '/:reviewId',
  auth(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN),
  ReviewController.deleteReview,
);

router.post(
  '/:reviewId/helpful',
  auth(Role.CUSTOMER, Role.ADMIN, Role.SUPER_ADMIN),
  ReviewController.markReviewHelpful,
);

export const ReviewRoutes = router;
