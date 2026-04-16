import { Prisma } from '@prisma/client';
import httpStatus from 'http-status';
import { prisma } from '../../../config/db';
import ApiError from '../../errors/ApiErrors';

class CategoryService {
  private parsePositiveInt(value: number | string | undefined, fallback: number) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) {
      return fallback;
    }

    return Math.trunc(parsed);
  }

  private parseBoolean(value: boolean | string | undefined) {
    if (value === true || value === 'true') return true;
    if (value === false || value === 'false') return false;
    return undefined;
  }

  private normalizeName(name: string) {
    return name.trim().replace(/\s+/g, ' ');
  }

  private toSlug(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }

  private async generateUniqueSlug(baseSlug: string) {
    let candidate = baseSlug;
    let suffix = 2;

    while (true) {
      const existing = await prisma.testCategory.findUnique({
        where: { slug: candidate },
        select: { id: true },
      });

      if (!existing) {
        return candidate;
      }

      candidate = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
  }

  /**
   * Get all categories ordered by name
   */
  async getAllCategories(query: {
    page?: number | string;
    limit?: number | string;
    search?: string;
    isActive?: boolean | string;
    sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'sortOrder';
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = this.parsePositiveInt(query.page, 1);
    const rawLimit = this.parsePositiveInt(query.limit, 10);
    const limit = Math.min(rawLimit, 100);
    const skip = (page - 1) * limit;

    const search = query.search?.trim();
    const isActive = this.parseBoolean(query.isActive);
    const sortBy = query.sortBy || 'name';
    const sortOrder: Prisma.SortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';

    const where: Prisma.TestCategoryWhereInput = {
      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                slug: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }
        : {}),
      ...(isActive !== undefined ? { isActive } : {}),
    };

    const [categories, total] = await prisma.$transaction([
      prisma.testCategory.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          name: true,
          slug: true,
          isActive: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { tests: true },
          },
        },
      }),
      prisma.testCategory.count({ where }),
    ]);

    return {
      meta: {
        page,
        limit,
        total,
        totalPage: Math.ceil(total / limit),
      },
      data: categories,
    };
  }

  /**
   * Get category by ID
   */
  async getCategoryById(categoryId: string) {
    const category = await prisma.testCategory.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            tests: true,
          },
        },
      },
    });

    return category;
  }

  /**
   * Create a new category
   */
  async createCategory(data: { name: string; slug: string }) {
    const normalizedName = this.normalizeName(data.name);

    if (!normalizedName) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Category name is required');
    }

    const existingCategory = await prisma.testCategory.findFirst({
      where: {
        name: {
          equals: normalizedName,
          mode: 'insensitive',
        },
      },
      select: { id: true },
    });

    if (existingCategory) {
      throw new ApiError(httpStatus.CONFLICT, 'Category with this name already exists');
    }

    const requestedSlug = this.normalizeName(data.slug);
    if (!requestedSlug) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Category slug is required');
    }

    const baseSlug = this.toSlug(requestedSlug);
    if (!baseSlug) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Category slug is invalid');
    }

    const uniqueSlug = await this.generateUniqueSlug(baseSlug);

    let category;
    try {
      category = await prisma.testCategory.create({
        data: { name: normalizedName, slug: uniqueSlug },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ApiError(httpStatus.CONFLICT, 'Category already exists');
      }

      throw error;
    }

    return category;
  }

  /**
   * Update a category
   */
  async updateCategory(categoryId: string, data: { name?: string }) {
    const category = await prisma.testCategory.update({
      where: { id: categoryId },
      data,
    });

    return category;
  }

  /**
   * Delete a category
   */
  async deleteCategory(categoryId: string) {
    // Check if category has tests
    const testsCount = await prisma.test.count({
      where: { categoryId },
    });

    if (testsCount > 0) {
      throw new Error(
        `Cannot delete category. It has ${testsCount} associated test(s). Please reassign or delete the tests first.`,
      );
    }

    const category = await prisma.testCategory.delete({
      where: { id: categoryId },
    });

    return category;
  }
}

export default new CategoryService();
