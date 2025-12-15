"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schemas = exports.validate = void 0;
const zod_1 = require("zod");
/**
 * Middleware de validación con Zod
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
                    error: 'Datos inválidos',
                    details: error.errors,
                });
            }
            next(error);
        }
    };
};
exports.validate = validate;
// Schemas de validación
exports.schemas = {
    createReport: zod_1.z.object({
        category: zod_1.z.number().int().min(0).max(4),
        description: zod_1.z.string().max(500).optional(),
        location: zod_1.z.object({
            lat: zod_1.z.number().min(-55).max(-21),
            long: zod_1.z.number().min(-73.5).max(-53),
            accuracy: zod_1.z.number().positive(),
        }),
        zkProof: zod_1.z.object({
            proof: zod_1.z.array(zod_1.z.string()).length(8),
            publicSignals: zod_1.z.array(zod_1.z.string()).length(4),
        }),
        userSecret: zod_1.z.string().optional(),
    }),
    validateReport: zod_1.z.object({
        reportId: zod_1.z.string().min(1),
        isValid: zod_1.z.boolean(),
    }),
    nearbyReports: zod_1.z.object({
        lat: zod_1.z.number().min(-90).max(90),
        long: zod_1.z.number().min(-180).max(180),
        radiusKm: zod_1.z.number().positive().max(50),
        category: zod_1.z.number().int().min(0).max(4).optional(),
        limit: zod_1.z.number().int().positive().max(100).optional(),
    }),
};
