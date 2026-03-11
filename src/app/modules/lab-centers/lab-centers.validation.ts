import { z } from 'zod';

export const createLabCenterSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(200),
    address: z.string().min(1, 'Address is required').max(500),
    phone: z.string().max(20).optional(),
    email: z.string().email('Invalid email format').max(200).optional(),
    website: z.string().url('Invalid URL format').max(500).optional(),
    type: z.string().min(1, 'Type is required').max(100),
    hours: z.string().max(500).optional(),
    status: z.string().max(50).optional().default('Open'),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    rating: z.number().min(0).max(5).optional().default(0),
    reviewCount: z.number().int().min(0).optional().default(0),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateLabCenterSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    address: z.string().min(1).max(500).optional(),
    phone: z.string().max(20).optional(),
    email: z.string().email('Invalid email format').max(200).optional(),
    website: z.string().url('Invalid URL format').max(500).optional(),
    type: z.string().min(1).max(100).optional(),
    hours: z.string().max(500).optional(),
    status: z.string().max(50).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    rating: z.number().min(0).max(5).optional(),
    reviewCount: z.number().int().min(0).optional(),
    isActive: z.boolean().optional(),
    lastVerified: z.string().datetime().optional(),
  }),
});

export const labCenterQuerySchema = z.object({
  query: z.object({
    lat: z.string().optional(),
    lng: z.string().optional(),
    radius: z.string().optional().default('50'),
    search: z.string().optional(),
    type: z.string().optional(),
    status: z.string().optional(),
    isActive: z.string().optional().default('true'),
  }),
});

export const geocodeSchema = z.object({
  body: z.object({
    address: z.string().min(1, 'Address is required'),
  }),
});

export const autocompleteQuerySchema = z.object({
  query: z.object({
    input: z.string().min(1, 'input is required'),
  }),
});

export const placeDetailsParamsSchema = z.object({
  params: z.object({
    placeId: z.string().min(1, 'placeId is required'),
  }),
});

export type CreateLabCenterInput = z.infer<typeof createLabCenterSchema>['body'];
export type UpdateLabCenterInput = z.infer<typeof updateLabCenterSchema>['body'];
export type LabCenterQueryInput = z.infer<typeof labCenterQuerySchema>['query'];
export type GeocodeInput = z.infer<typeof geocodeSchema>['body'];
export type AutocompleteQueryInput = z.infer<typeof autocompleteQuerySchema>['query'];
export type PlaceDetailsParamsInput = z.infer<typeof placeDetailsParamsSchema>['params'];
