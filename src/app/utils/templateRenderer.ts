import { NotificationTemplate } from '@prisma/client';
import Handlebars from 'handlebars';
import logger from './logger';

interface RenderedTemplate {
  emailSubject: string;
  emailBody: string;
  pushTitle: string;
  pushBody: string;
}

/**
 * Render a template string with Handlebars
 * @param template - Template string with {{variables}}
 * @param data - Object containing variable values
 * @returns Rendered string
 */
export const renderTemplate = (template: string, data: Record<string, any> = {}): string => {
  try {
    const compiled = Handlebars.compile(template);
    return compiled(data);
  } catch (error) {
    logger.error('Error rendering template:', error);
    // Return original template if rendering fails
    return template;
  }
};

/**
 * Render all parts of a notification template
 * @param template - NotificationTemplate object
 * @param data - Object containing variable values
 * @returns Object with all rendered template parts
 */
export const renderNotificationTemplate = (
  template: NotificationTemplate,
  data: Record<string, any> = {},
): RenderedTemplate => {
  try {
    return {
      emailSubject: renderTemplate(template.emailSubject, data),
      emailBody: renderTemplate(template.emailBody, data),
      pushTitle: renderTemplate(template.pushTitle, data),
      pushBody: renderTemplate(template.pushBody, data),
    };
  } catch (error) {
    logger.error('Error rendering notification template:', error);
    // Return original template if rendering fails
    return {
      emailSubject: template.emailSubject,
      emailBody: template.emailBody,
      pushTitle: template.pushTitle,
      pushBody: template.pushBody,
    };
  }
};

interface TemplateVariable {
  name: string;
  description: string;
  example?: string;
}

/**
 * Validate if data contains all required variables
 * @param data - Data object to validate
 * @param variables - Array of required variables
 * @returns Object with validation result and missing variables
 */
export const validateTemplateData = (
  data: Record<string, any>,
  variables: any[],
): { valid: boolean; missingVariables: string[] } => {
  const missingVariables: string[] = [];

  try {
    const parsedVariables: TemplateVariable[] = Array.isArray(variables)
      ? variables
      : JSON.parse(variables);

    for (const variable of parsedVariables) {
      if (!(variable.name in data)) {
        missingVariables.push(variable.name);
      }
    }

    return {
      valid: missingVariables.length === 0,
      missingVariables,
    };
  } catch (error) {
    logger.error('Error validating template data:', error);
    return {
      valid: false,
      missingVariables: [],
    };
  }
};

/**
 * Get variable names from template
 * @param variables - Variables array from template
 * @returns Array of variable names
 */
export const getTemplateVariableNames = (variables: any[]): string[] => {
  try {
    const parsedVariables: TemplateVariable[] = Array.isArray(variables)
      ? variables
      : JSON.parse(variables);

    return parsedVariables.map((v) => v.name);
  } catch (error) {
    logger.error('Error getting template variable names:', error);
    return [];
  }
};
