import { prisma } from '../../../config/db';

class CategoryService {
  /**
   * Get all categories ordered by name
   */
  async getAllCategories() {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: { tests: true },
        },
      },
    });

    return categories;
  }

  /**
   * Get category by ID
   */
  async getCategoryById(categoryId: string) {
    const category = await prisma.category.findUnique({
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
  async createCategory(data: { name: string }) {
    const category = await prisma.category.create({
      data: { name: data.name },
    });

    return category;
  }

  /**
   * Update a category
   */
  async updateCategory(categoryId: string, data: { name?: string }) {
    const category = await prisma.category.update({
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

    const category = await prisma.category.delete({
      where: { id: categoryId },
    });

    return category;
  }
}

export default new CategoryService();
