import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

/**
 * Middleware de validacion con Zod
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
          error: 'Datos invalidos',
          details: error.errors,
        });
      }
      next(error);
    }
  };
};

// Schemas de validacion
export const schemas = {
  // Crear reporte anonimo — campos legales Ley 974
  createReport: z.object({
    category: z.number().int().min(0).max(4),
    description: z.string().max(500).optional(), // backward-compat (usa detailedDescription si existe)
    // Campos legales Ley 974 (Art. 18-24)
    accusedEntity: z.string().min(1).max(200),                         // Identificacion del denunciado
    incidentDate: z.string().min(1).max(30),                           // Cuando ocurrieron los hechos
    detailedDescription: z.string().min(50).max(2000),                 // Relacion de hechos detallada
    evidenceDescription: z.string().max(500).optional(),               // Que muestra la prueba adjunta
    citizenSignature: z.string().regex(/^0x[a-fA-F0-9]+$/).optional(), // Firma EIP-712 (opcional)
    location: z.object({
      lat: z.number().min(-23).max(-9.5),     // Bolivia bounds
      long: z.number().min(-69.7).max(-57.4),  // Bolivia bounds
      accuracy: z.number().positive(),
    }),
  }),

  // Validar reporte (votacion comunitaria)
  validateReport: z.object({
    reportId: z.string().min(1),
    isValid: z.boolean(),
  }),

  // Buscar reportes cercanos
  nearbyReports: z.object({
    lat: z.number().min(-90).max(90),
    long: z.number().min(-180).max(180),
    radiusKm: z.number().positive().max(50),
    category: z.number().int().min(0).max(4).optional(),
    limit: z.number().int().positive().max(100).optional(),
  }),

  // Verificar ciudadania (post Reclaim — Ciudadania Digital devuelve 'usuario' y 'rol')
  verifyCitizen: z.object({
    usuario: z.string().min(1).max(100),        // Usuario de Ciudadania Digital Bolivia
    walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(), // Puede venir del header
    reclaimProof: z.any().optional(),           // Proof de Reclaim Protocol
  }),

  // Revocar identidad
  revokeIdentity: z.object({
    commitment: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
    reason: z.string().min(10).max(500),
  }),
};
