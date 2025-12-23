import { NotificationType } from '@prisma/client';
import httpStatus from 'http-status';
import { prisma } from '../../../shared/prisma';
import ApiError from '../../errors/ApiErrors';
import logger from '../../utils/logger';
import { renderNotificationTemplate } from '../../utils/templateRenderer';
import { CreateTemplateInput, UpdateTemplateInput } from './templates.validation';

export const TemplatesService = {
  /**
   * Get all templates with pagination
   */
  async getTemplates(page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const [templates, total] = await Promise.all([
        prisma.notificationTemplate.findMany({
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.notificationTemplate.count(),
      ]);

      return {
        data: templates,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Error getting templates:', error);
      throw error;
    }
  },

  /**
   * Get single template by ID
   */
  async getTemplateById(id: string) {
    try {
      const template = await prisma.notificationTemplate.findUnique({
        where: { id },
      });

      if (!template) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Template not found');
      }

      return template;
    } catch (error) {
      logger.error('Error getting template by ID:', error);
      throw error;
    }
  },

  /**
   * Get template by notification type
   */
  async getTemplateByType(type: NotificationType) {
    try {
      const template = await prisma.notificationTemplate.findUnique({
        where: { type },
      });

      if (!template) {
        throw new ApiError(httpStatus.NOT_FOUND, `Template not found for type: ${type}`);
      }

      return template;
    } catch (error) {
      logger.error('Error getting template by type:', error);
      throw error;
    }
  },

  /**
   * Create new template
   */
  async createTemplate(data: CreateTemplateInput) {
    try {
      // Check if template already exists for this type
      const existing = await prisma.notificationTemplate.findUnique({
        where: { type: data.type },
      });

      if (existing) {
        throw new ApiError(httpStatus.CONFLICT, `Template already exists for type: ${data.type}`);
      }

      const template = await prisma.notificationTemplate.create({
        data: {
          type: data.type,
          name: data.name,
          description: data.description,
          emailSubject: data.emailSubject,
          emailBody: data.emailBody,
          pushTitle: data.pushTitle,
          pushBody: data.pushBody,
          variables: data.variables || [],
          isActive: data.isActive !== undefined ? data.isActive : true,
        },
      });

      logger.info(`✅ Template created: ${data.type}`);
      return template;
    } catch (error) {
      logger.error('Error creating template:', error);
      throw error;
    }
  },

  /**
   * Update template
   */
  async updateTemplate(id: string, data: UpdateTemplateInput) {
    try {
      const existing = await prisma.notificationTemplate.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Template not found');
      }

      const updated = await prisma.notificationTemplate.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.emailSubject && { emailSubject: data.emailSubject }),
          ...(data.emailBody && { emailBody: data.emailBody }),
          ...(data.pushTitle && { pushTitle: data.pushTitle }),
          ...(data.pushBody && { pushBody: data.pushBody }),
          ...(data.variables && { variables: data.variables }),
          ...(data.isActive !== undefined && { isActive: data.isActive }),
        },
      });

      logger.info(`✅ Template updated: ${id}`);
      return updated;
    } catch (error) {
      logger.error('Error updating template:', error);
      throw error;
    }
  },

  /**
   * Delete template
   */
  async deleteTemplate(id: string) {
    try {
      const template = await prisma.notificationTemplate.findUnique({
        where: { id },
      });

      if (!template) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Template not found');
      }

      // Check if template is in use (optional - depends on business logic)
      // For now, allow deletion

      await prisma.notificationTemplate.delete({
        where: { id },
      });

      logger.info(`✅ Template deleted: ${id}`);
      return { success: true };
    } catch (error) {
      logger.error('Error deleting template:', error);
      throw error;
    }
  },

  /**
   * Test template rendering with sample data
   */
  async testTemplate(id: string, data: Record<string, any> = {}) {
    try {
      const template = await prisma.notificationTemplate.findUnique({
        where: { id },
      });

      if (!template) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Template not found');
      }

      const rendered = renderNotificationTemplate(template, data);

      return {
        original: {
          emailSubject: template.emailSubject,
          emailBody: template.emailBody,
          pushTitle: template.pushTitle,
          pushBody: template.pushBody,
        },
        rendered,
      };
    } catch (error) {
      logger.error('Error testing template:', error);
      throw error;
    }
  },
};
