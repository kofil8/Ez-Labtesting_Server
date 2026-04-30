jest.mock('../../../config/db', () => ({
  prisma: {
    orderItem: {
      findFirst: jest.fn(),
    },
    reviewHelpful: {
      create: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
    },
    test: {
      findUnique: jest.fn(),
    },
    testReview: {
      aggregate: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      groupBy: jest.fn(),
      update: jest.fn(),
    },
  },
}));

import { prisma } from '../../../config/db';
import { ReviewService } from './review.service';

const mockedPrisma = prisma as unknown as {
  orderItem: {
    findFirst: jest.Mock;
  };
  reviewHelpful: {
    create: jest.Mock;
    delete: jest.Mock;
    findUnique: jest.Mock;
  };
  test: {
    findUnique: jest.Mock;
  };
  testReview: {
    aggregate: jest.Mock;
    count: jest.Mock;
    create: jest.Mock;
    findFirst: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    groupBy: jest.Mock;
    update: jest.Mock;
  };
};

function buildReview(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'review-1',
    testId: 'test-1',
    userId: 'user-1',
    rating: 4,
    title: 'Helpful review',
    comment: 'The experience was smooth and easy to follow.',
    isVerifiedPurchase: false,
    helpfulCount: 2,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    user: {
      id: 'user-1',
      firstName: 'Taylor',
      profileImage: 'https://example.com/avatar.png',
    },
    ...overrides,
  };
}

describe('ReviewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns public reviews with DTO user ids and rating stats', async () => {
    mockedPrisma.testReview.findMany.mockResolvedValue([buildReview()]);
    mockedPrisma.testReview.count.mockResolvedValue(1);
    mockedPrisma.testReview.aggregate.mockResolvedValue({
      _avg: { rating: 4 },
      _count: 1,
    });
    mockedPrisma.testReview.groupBy.mockResolvedValue([{ rating: 4, _count: 1 }]);

    const result = await ReviewService.getReviewsForTest('test-1', {
      page: 1,
      limit: 10,
      sortBy: 'newest',
    });

    expect(result.reviews).toEqual([
      expect.objectContaining({
        id: 'review-1',
        userId: 'user-1',
        user: {
          id: 'user-1',
          name: 'Taylor',
          profileImage: 'https://example.com/avatar.png',
        },
      }),
    ]);
    expect(result.meta).toMatchObject({
      averageRating: 4,
      total: 1,
      totalReviews: 1,
      totalPages: 1,
    });
  });

  it('returns the current user review for a test and null when missing', async () => {
    mockedPrisma.testReview.findFirst.mockResolvedValueOnce(buildReview());

    await expect(
      ReviewService.getCurrentUserReviewForTest('test-1', 'user-1'),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'review-1',
        userId: 'user-1',
        user: expect.objectContaining({ id: 'user-1', name: 'Taylor' }),
      }),
    );

    mockedPrisma.testReview.findFirst.mockResolvedValueOnce(null);

    await expect(
      ReviewService.getCurrentUserReviewForTest('test-1', 'user-1'),
    ).resolves.toBeNull();
  });

  it('creates a verified review when the user has a paid non-cancelled order item', async () => {
    mockedPrisma.testReview.findFirst.mockResolvedValue(null);
    mockedPrisma.test.findUnique.mockResolvedValue({ id: 'test-1' });
    mockedPrisma.orderItem.findFirst.mockResolvedValue({ id: 'order-item-1' });
    mockedPrisma.testReview.create.mockResolvedValue(
      buildReview({
        isVerifiedPurchase: true,
      }),
    );

    const result = await ReviewService.createReview('user-1', {
      testId: 'test-1',
      rating: 5,
      title: 'Excellent',
      comment: 'Clear instructions and fast turnaround.',
    });

    expect(mockedPrisma.orderItem.findFirst).toHaveBeenCalledWith({
      where: {
        testId: 'test-1',
        order: {
          userId: 'user-1',
          paymentStatus: 'SUCCEEDED',
          orderStatus: {
            not: 'CANCELLED',
          },
        },
      },
      select: {
        id: true,
      },
    });
    expect(mockedPrisma.testReview.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isVerifiedPurchase: true,
        }),
      }),
    );
    expect(result.isVerifiedPurchase).toBe(true);
  });

  it('rejects duplicate reviews for the same user and test', async () => {
    mockedPrisma.testReview.findFirst.mockResolvedValue({ id: 'review-existing' });

    await expect(
      ReviewService.createReview('user-1', {
        testId: 'test-1',
        rating: 5,
        title: 'Duplicate',
        comment: 'Trying to submit another review.',
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      message:
        'You have already reviewed this test. Please edit your existing review instead.',
    });
  });

  it('returns helpful toggle payload with the updated review', async () => {
    mockedPrisma.testReview.findUnique.mockResolvedValue(buildReview({ userId: 'user-2' }));
    mockedPrisma.reviewHelpful.findUnique.mockResolvedValue(null);
    mockedPrisma.reviewHelpful.create.mockResolvedValue({ id: 'mark-1' });
    mockedPrisma.testReview.update.mockResolvedValue(
      buildReview({
        userId: 'user-2',
        helpfulCount: 3,
      }),
    );

    const result = await ReviewService.markReviewHelpful('review-1', 'user-1');

    expect(result).toEqual({
      helpful: true,
      review: expect.objectContaining({
        id: 'review-1',
        helpfulCount: 3,
        userId: 'user-2',
      }),
    });
  });

  it('rejects helpful votes on the user’s own review', async () => {
    mockedPrisma.testReview.findUnique.mockResolvedValue(buildReview({ userId: 'user-1' }));

    await expect(
      ReviewService.markReviewHelpful('review-1', 'user-1'),
    ).rejects.toMatchObject({
      statusCode: 403,
      message: 'You cannot mark your own review as helpful',
    });
  });
});
