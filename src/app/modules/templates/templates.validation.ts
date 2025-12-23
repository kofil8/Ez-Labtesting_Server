import { NotificationType } from '@prisma/client';
import { z } from 'zod';

// Template variable schema
const templateVariableSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  example: z.string().optional(),
});

// Create template schema
export const createTemplateSchema = z.object({
  type: z.nativeEnum(NotificationType),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  emailSubject: z.string().min(1).max(200),
  emailBody: z.string().min(1),
  pushTitle: z.string().min(1).max(200),
  pushBody: z.string().min(1).max(500),
  variables: z.array(templateVariableSchema).default([]),
  isActive: z.boolean().default(true),
});

// Update template schema
export const updateTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  emailSubject: z.string().min(1).max(200).optional(),
  emailBody: z.string().min(1).optional(),
  pushTitle: z.string().min(1).max(200).optional(),
  pushBody: z.string().min(1).max(500).optional(),
  variables: z.array(templateVariableSchema).optional(),
  isActive: z.boolean().optional(),
});

// Get template params schema
export const getTemplateParamsSchema = z.object({
  id: z.string().uuid(),
});

// Get template by type params schema
export const getTemplateByTypeParamsSchema = z.object({
  type: z.nativeEnum(NotificationType),
});

// Test template schema
export const testTemplateSchema = z.object({
  data: z.record(z.any()).default({}),
});

// Types
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type TestTemplateInput = z.infer<typeof testTemplateSchema>;
