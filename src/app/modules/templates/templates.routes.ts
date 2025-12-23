import express, { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import auth from '../../middlewares/auth';
import { TemplatesController } from './templates.controller';
import {
  createTemplateSchema,
  getTemplateByTypeParamsSchema,
  getTemplateParamsSchema,
  testTemplateSchema,
  updateTemplateSchema,
} from './templates.validation';

const router = express.Router();

/**
 * Middleware to validate request body/params
 */
const validateBody =
  (schema: z.ZodTypeAny) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req.body ?? {});
      req.body = parsed;
      return next();
    } catch (err) {
      return next(err);
    }
  };

const validateParams =
  (schema: z.ZodTypeAny) => async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req.params ?? {});
      req.params = parsed as any;
      return next();
    } catch (err) {
      return next(err);
    }
  };

/**
 * Public endpoints (read-only)
 */

// Get all templates
router.get('/', TemplatesController.getTemplates);

// Get template by ID
router.get('/:id', validateParams(getTemplateParamsSchema), TemplatesController.getTemplateById);

// Get template by type
router.get(
  '/type/:type',
  validateParams(getTemplateByTypeParamsSchema),
  TemplatesController.getTemplateByType,
);

/**
 * Admin endpoints (protected)
 */

// Create template
router.post(
  '/',
  auth('SUPER_ADMIN', 'ADMIN'),
  validateBody(createTemplateSchema),
  TemplatesController.createTemplate,
);

// Update template
router.patch(
  '/:id',
  auth('SUPER_ADMIN', 'ADMIN'),
  validateParams(getTemplateParamsSchema),
  validateBody(updateTemplateSchema),
  TemplatesController.updateTemplate,
);

// Delete template
router.delete(
  '/:id',
  auth('SUPER_ADMIN', 'ADMIN'),
  validateParams(getTemplateParamsSchema),
  TemplatesController.deleteTemplate,
);

// Test template rendering
router.post(
  '/:id/test',
  auth('SUPER_ADMIN', 'ADMIN'),
  validateParams(getTemplateParamsSchema),
  validateBody(testTemplateSchema),
  TemplatesController.testTemplate,
);

export const TemplatesRoutes = router;
