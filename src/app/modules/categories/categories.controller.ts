import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import ApiError from '../../errors/ApiErrors';
import categoryService from './categories.service';

const asParamString = (value: string | string[]) => (Array.isArray(value) ? value[0] : value);

class CategoryController {
  /**
   * Get all categories
   */
  async getAllCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await categoryService.getAllCategories({
        page: req.query.page as string | undefined,
        limit: req.query.limit as string | undefined,
        search: req.query.search as string | undefined,
        isActive: req.query.isActive as string | undefined,
        sortBy: req.query.sortBy as 'name' | 'createdAt' | 'updatedAt' | 'sortOrder' | undefined,
        sortOrder: req.query.sortOrder as 'asc' | 'desc' | undefined,
      });

      res.status(httpStatus.OK).json({
        success: true,
        message: 'Categories retrieved successfully',
        meta: categories.meta,
        data: categories.data,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(req: Request, res: Response, next: NextFunction) {
    try {
      const categoryId = asParamString(req.params.categoryId);

      const category = await categoryService.getCategoryById(categoryId);

      if (!category) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Category not found');
      }

      res.status(httpStatus.OK).json({
        success: true,
        message: 'Category retrieved successfully',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new category (Admin only)
   */
  async createCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, slug, isActive } = req.body;

      const category = await categoryService.createCategory({ name, slug, isActive });

      res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Category created successfully',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a category (Admin only)
   */
  async updateCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const categoryId = asParamString(req.params.categoryId);
      const { name, slug, isActive } = req.body;

      const category = await categoryService.updateCategory(categoryId, {
        name,
        slug,
        isActive,
      });

      res.status(httpStatus.OK).json({
        success: true,
        message: 'Category updated successfully',
        data: category,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a category (Admin only)
   */
  async deleteCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const categoryId = asParamString(req.params.categoryId);

      await categoryService.deleteCategory(categoryId);

      res.status(httpStatus.OK).json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new CategoryController();
