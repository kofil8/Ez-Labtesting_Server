import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { ReviewService } from './review.service';
import { createReviewSchema, getReviewsQuery, updateReviewSchema } from './review.validation';

const asParamString = (value: string | string[]) => (Array.isArray(value) ? value[0] : value);

export class ReviewController {
  // Get reviews for a test
  static getReviewsForTest = catchAsync(async (req: Request, res: Response) => {
    const rawTestId = req.params.testId as string | string[];
    const testId = Array.isArray(rawTestId) ? rawTestId[0] : rawTestId;
    const validated = getReviewsQuery.parse({ query: req.query });
    const options = validated.query;

    const result = await ReviewService.getReviewsForTest(testId, options);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: 'Reviews retrieved successfully',
      data: {
        reviews: result.reviews,
        meta: result.meta,
      },
    });
  });

  // Get a single review
  static getReview = catchAsync(async (req: Request, res: Response) => {
    const reviewId = asParamString(req.params.reviewId);

    const review = await ReviewService.getReviewById(reviewId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: 'Review retrieved successfully',
      data: review,
    });
  });

  // Create a review
  static createReview = catchAsync(async (req: Request, res: Response) => {
    const validated = createReviewSchema.parse({ body: req.body });
    const userId = (req as any).user?.id;

    if (!userId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        message: 'User not authenticated',
        data: null,
      });
    }

    const review = await ReviewService.createReview(userId, validated.body);

    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      message: 'Review created successfully',
      data: review,
    });
  });

  // Update a review
  static updateReview = catchAsync(async (req: Request, res: Response) => {
    const reviewId = asParamString(req.params.reviewId);
    const validated = updateReviewSchema.parse({ body: req.body });
    const userId = (req as any).user?.id;

    if (!userId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        message: 'User not authenticated',
        data: null,
      });
    }

    const review = await ReviewService.updateReview(reviewId, userId, validated.body);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: 'Review updated successfully',
      data: review,
    });
  });

  // Delete a review
  static deleteReview = catchAsync(async (req: Request, res: Response) => {
    const reviewId = asParamString(req.params.reviewId);
    const userId = (req as any).user?.id;

    if (!userId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        message: 'User not authenticated',
        data: null,
      });
    }

    await ReviewService.deleteReview(reviewId, userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: 'Review deleted successfully',
      data: null,
    });
  });

  // Mark review as helpful
  static markReviewHelpful = catchAsync(async (req: Request, res: Response) => {
    const reviewId = asParamString(req.params.reviewId);
    const userId = (req as any).user?.id;

    if (!userId) {
      return sendResponse(res, {
        statusCode: httpStatus.UNAUTHORIZED,
        message: 'User not authenticated',
        data: null,
      });
    }

    const result = await ReviewService.markReviewHelpful(reviewId, userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      message: result.helpful ? 'Marked as helpful' : 'Removed helpful mark',
      data: result.review,
    });
  });
}
