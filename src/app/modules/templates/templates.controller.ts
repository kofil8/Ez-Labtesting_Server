import { Request, Response } from 'express';
import catchAsync from '../../helpers/catchAsync';
import sendResponse from '../../helpers/sendResponse';
import { TemplatesService } from './templates.service';
import {
  CreateTemplateInput,
  TestTemplateInput,
  UpdateTemplateInput,
} from './templates.validation';

export const TemplatesController = {
  /**
   * Get all templates
   */
  getTemplates: catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 20 } = req.query as any;

    const result = await TemplatesService.getTemplates(parseInt(page) || 1, parseInt(limit) || 20);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Templates retrieved successfully',
      data: result.data,
      meta: result.meta,
    });
  }),

  /**
   * Get template by ID
   */
  getTemplateById: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    const template = await TemplatesService.getTemplateById(id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Template retrieved successfully',
      data: template,
    });
  }),

  /**
   * Get template by type
   */
  getTemplateByType: catchAsync(async (req: Request, res: Response) => {
    const { type } = req.params as any;

    const template = await TemplatesService.getTemplateByType(type);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Template retrieved successfully',
      data: template,
    });
  }),

  /**
   * Create template
   */
  createTemplate: catchAsync(async (req: Request, res: Response) => {
    const data: CreateTemplateInput = req.body;

    const template = await TemplatesService.createTemplate(data);

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: 'Template created successfully',
      data: template,
    });
  }),

  /**
   * Update template
   */
  updateTemplate: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const data: UpdateTemplateInput = req.body;

    const template = await TemplatesService.updateTemplate(id, data);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Template updated successfully',
      data: template,
    });
  }),

  /**
   * Delete template
   */
  deleteTemplate: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;

    await TemplatesService.deleteTemplate(id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Template deleted successfully',
    });
  }),

  /**
   * Test template rendering
   */
  testTemplate: catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { data }: TestTemplateInput = req.body;

    const result = await TemplatesService.testTemplate(id, data);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: 'Template test completed',
      data: result,
    });
  }),
};
