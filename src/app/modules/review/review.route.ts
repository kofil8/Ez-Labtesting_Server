import express from 'express';
import auth from '../../middlewares/auth';
import { ReviewController } from './review.controller';

const router = express.Router();

// Protected read route
router.get('/test/:testId/me', auth(), ReviewController.getCurrentUserReviewForTest);

// Public routes
router.get('/summary', ReviewController.getReviewSummary);
router.get('/test/:testId', ReviewController.getReviewsForTest);
router.get('/:reviewId', ReviewController.getReview);

// Protected routes (require authentication)
router.post('/', auth(), ReviewController.createReview);

router.put('/:reviewId', auth(), ReviewController.updateReview);

router.delete('/:reviewId', auth(), ReviewController.deleteReview);

router.post('/:reviewId/helpful', auth(), ReviewController.markReviewHelpful);

export const ReviewRoutes = router;
