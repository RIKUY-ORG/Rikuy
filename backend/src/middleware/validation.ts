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
    category: z.number().int().min(0).max(4),
    description: z.string().max(500).optional(),
    location: z.object({
      lat: z.number().min(-23).max(-9.5),    // Bolivia bounds
      long: z.number().min(-69.7).max(-57.4), // Bolivia bounds
      accuracy: z.number().positive(),
    }),
    zkProof: z.object({
      proof: z.array(z.string()).length(8),
      publicSignals: z.array(z.string()).length(4),
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
    category: z.number().int().min(0).max(4).optional(),
    limit: z.number().int().positive().max(100).optional(),
  }),

  verifyIdentity: z.object({
    documentType: z.enum(['CI', 'PASSPORT']),
    documentNumber: z.string().min(7).max(15),
    expedition: z.string().length(2).optional(),
    firstName: z.string().min(2).max(50),
    lastName: z.string().min(2).max(50),
    dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    userAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  }),

  revokeIdentity: z.object({
    identityCommitment: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
    reason: z.string().min(10).max(500),
  }),
};
