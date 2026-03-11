import { Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import { prisma } from '../../../config/db';
import ApiError from '../../errors/ApiErrors';
import { CreateReviewInput, UpdateReviewInput } from './review.validation';

export class ReviewService {
  // Get all reviews for a test with pagination and sorting
  static async getReviewsForTest(
    testId: string,
    options: {
      page?: number;
      limit?: number;
      sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest' | 'helpful';
    } = {},
  ) {
    const page = options.page || 1;
    const limit = options.limit || 10;
    const skip = (page - 1) * limit;

    // Determine sorting
    let orderBy: Prisma.TestReviewOrderByWithRelationInput = { createdAt: 'desc' };
    switch (options.sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'highest':
        orderBy = { rating: 'desc' };
        break;
      case 'lowest':
        orderBy = { rating: 'asc' };
        break;
      case 'helpful':
        orderBy = { helpfulCount: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [reviews, total] = await Promise.all([
      prisma.testReview.findMany({
        where: { testId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              profileImage: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.testReview.count({ where: { testId } }),
    ]);

    // Calculate review statistics
    const stats = await prisma.testReview.aggregate({
      where: { testId },
      _avg: { rating: true },
      _count: true,
    });

    // Get rating distribution
    const distribution = await prisma.testReview.groupBy({
      by: ['rating'],
      where: { testId },
      _count: true,
    });

    const ratingDistribution = Array.from({ length: 5 }, (_, i) => {
      const rating = i + 1;
      const count = distribution.find((d) => d.rating === rating)?._count || 0;
      return {
        rating,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      };
    });

    return {
      reviews: reviews.map((review) => ({
        ...review,
        user: {
          name: review.user?.firstName || 'Anonymous',
          profileImage: review.user?.profileImage,
        },
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        averageRating: stats._avg.rating || 0,
        totalReviews: stats._count,
        distribution: ratingDistribution,
      },
    };
  }

  // Get a single review
  static async getReviewById(reviewId: string) {
    const review = await prisma.testReview.findUnique({
      where: { id: reviewId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            profileImage: true,
          },
        },
      },
    });

    if (!review) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Review not found');
    }

    return {
      ...review,
      user: {
        name: review.user?.firstName || 'Anonymous',
        profileImage: review.user?.profileImage,
      },
    };
  }

  // Create a review
  static async createReview(userId: string, data: CreateReviewInput) {
    // Check if user already reviewed this test
    const existingReview = await prisma.testReview.findFirst({
      where: {
        testId: data.testId,
        userId,
      },
    });

    if (existingReview) {
      throw new ApiError(
        httpStatus.CONFLICT,
        'You have already reviewed this test. Please edit your existing review instead.',
      );
    }

    // Verify test exists
    const test = await prisma.test.findUnique({
      where: { id: data.testId },
    });

    if (!test) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Test not found');
    }

    const review = await prisma.testReview.create({
      data: {
        testId: data.testId,
        userId,
        rating: data.rating,
        title: data.title,
        comment: data.comment,
        isVerifiedPurchase: true, // TODO: Check against actual purchase history
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            profileImage: true,
          },
        },
      },
    });

    return {
      ...review,
      user: {
        name: review.user?.firstName || 'Anonymous',
        profileImage: review.user?.profileImage,
      },
    };
  }

  // Update a review
  static async updateReview(reviewId: string, userId: string, data: UpdateReviewInput) {
    // Verify review exists and belongs to user
    const review = await prisma.testReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Review not found');
    }

    if (review.userId !== userId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to update this review');
    }

    const updatedReview = await prisma.testReview.update({
      where: { id: reviewId },
      data: {
        ...(data.rating && { rating: data.rating }),
        ...(data.title && { title: data.title }),
        ...(data.comment && { comment: data.comment }),
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            profileImage: true,
          },
        },
      },
    });

    return {
      ...updatedReview,
      user: {
        name: updatedReview.user?.firstName || 'Anonymous',
        profileImage: updatedReview.user?.profileImage,
      },
    };
  }

  // Delete a review
  static async deleteReview(reviewId: string, userId: string) {
    // Verify review exists and belongs to user
    const review = await prisma.testReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Review not found');
    }

    if (review.userId !== userId) {
      throw new ApiError(httpStatus.FORBIDDEN, 'You are not authorized to delete this review');
    }

    await prisma.testReview.delete({
      where: { id: reviewId },
    });

    return { message: 'Review deleted successfully' };
  }

  // Mark review as helpful
  static async markReviewHelpful(reviewId: string, userId: string) {
    // Verify review exists
    const review = await prisma.testReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Review not found');
    }

    // Check if user already marked this review as helpful
    const existingMark = await prisma.reviewHelpful.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId,
        },
      },
    });

    if (existingMark) {
      // Remove the helpful mark
      await prisma.reviewHelpful.delete({
        where: {
          reviewId_userId: {
            reviewId,
            userId,
          },
        },
      });

      // Decrement helpful count
      const updatedReview = await prisma.testReview.update({
        where: { id: reviewId },
        data: {
          helpfulCount: {
            decrement: 1,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              profileImage: true,
            },
          },
        },
      });

      return {
        helpful: false,
        review: {
          ...updatedReview,
          user: {
            name: updatedReview.user?.firstName || 'Anonymous',
            profileImage: updatedReview.user?.profileImage,
          },
        },
      };
    } else {
      // Add helpful mark
      await prisma.reviewHelpful.create({
        data: {
          reviewId,
          userId,
        },
      });

      // Increment helpful count
      const updatedReview = await prisma.testReview.update({
        where: { id: reviewId },
        data: {
          helpfulCount: {
            increment: 1,
          },
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              profileImage: true,
            },
          },
        },
      });

      return {
        helpful: true,
        review: {
          ...updatedReview,
          user: {
            name: updatedReview.user?.firstName || 'Anonymous',
            profileImage: updatedReview.user?.profileImage,
          },
        },
      };
    }
  }
}
