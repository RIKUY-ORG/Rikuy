import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Middleware de validación con Zod
 */
export const validate = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Datos inválidos',
          details: error.errors,
        });
      }
      next(error);
    }
  };
};

// Schemas de validación
export const schemas = {
  createReport: z.object({
    category: z.number().int().min(0).max(2),
    description: z.string().max(500).optional(),
    location: z.object({
      lat: z.number().min(-55).max(-21),
      long: z.number().min(-73.5).max(-53),
      accuracy: z.number().positive(),
    }),
    userSecret: z.string().optional(),
  }),

  validateReport: z.object({
    reportId: z.string().min(1),
    isValid: z.boolean(),
  }),

  nearbyReports: z.object({
    lat: z.number().min(-90).max(90),
    long: z.number().min(-180).max(180),
    radiusKm: z.number().positive().max(50),
    category: z.number().int().min(0).max(2).optional(),
    limit: z.number().int().positive().max(100).optional(),
  }),
};
