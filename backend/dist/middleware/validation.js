"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemas = exports.validate = void 0;
const zod_1 = require("zod");
/**
 * Middleware de validacion con Zod
 */
const validate = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync(req.body);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
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
exports.validate = validate;
// Schemas de validacion
exports.schemas = {
    // Crear reporte anonimo — campos legales Ley 974
    createReport: zod_1.z.object({
        category: zod_1.z.number().int().min(0).max(4),
        description: zod_1.z.string().max(500).optional(), // backward-compat (usa detailedDescription si existe)
        // Campos legales Ley 974 (Art. 18-24)
        accusedEntity: zod_1.z.string().min(1).max(200), // Identificacion del denunciado
        incidentDate: zod_1.z.string().min(1).max(30), // Cuando ocurrieron los hechos
        detailedDescription: zod_1.z.string().min(50).max(2000), // Relacion de hechos detallada
        evidenceDescription: zod_1.z.string().max(500).optional(), // Que muestra la prueba adjunta
        citizenSignature: zod_1.z.string().regex(/^0x[a-fA-F0-9]+$/).optional(), // Firma EIP-712 (opcional)
        location: zod_1.z.object({
            lat: zod_1.z.number().min(-23).max(-9.5), // Bolivia bounds
            long: zod_1.z.number().min(-69.7).max(-57.4), // Bolivia bounds
            accuracy: zod_1.z.number().positive(),
        }),
    }),
    // Validar reporte (votacion comunitaria)
    validateReport: zod_1.z.object({
        reportId: zod_1.z.string().min(1),
        isValid: zod_1.z.boolean(),
    }),
    // Buscar reportes cercanos
    nearbyReports: zod_1.z.object({
        lat: zod_1.z.number().min(-90).max(90),
        long: zod_1.z.number().min(-180).max(180),
        radiusKm: zod_1.z.number().positive().max(50),
        category: zod_1.z.number().int().min(0).max(4).optional(),
        limit: zod_1.z.number().int().positive().max(100).optional(),
    }),
    // Verificar ciudadania (post Reclaim — Ciudadania Digital devuelve 'usuario' y 'rol')
    verifyCitizen: zod_1.z.object({
        usuario: zod_1.z.string().min(1).max(100), // Usuario de Ciudadania Digital Bolivia
        walletAddress: zod_1.z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(), // Puede venir del header
        reclaimProof: zod_1.z.any().optional(), // Proof de Reclaim Protocol
    }),
    // Revocar identidad
    revokeIdentity: zod_1.z.object({
        commitment: zod_1.z.string().regex(/^0x[a-fA-F0-9]{64}$/),
        reason: zod_1.z.string().min(10).max(500),
    }),
};
