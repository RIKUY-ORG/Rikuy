"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_service_1 = require("../services/report.service");
const scroll_service_1 = require("../services/scroll.service");
const upload_1 = require("../middleware/upload");
const rateLimit_1 = require("../middleware/rateLimit");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
/**
 * POST /api/reports
 * Crear nuevo reporte (ENDPOINT PRINCIPAL)
 */
router.post('/', rateLimit_1.reportRateLimiter, upload_1.upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Foto es requerida',
            });
        }
        // Parsear body
        const body = {
            category: parseInt(req.body.category),
            description: req.body.description,
            location: JSON.parse(req.body.location),
            userSecret: req.body.userSecret,
        };
        // Validar
        await validation_1.schemas.createReport.parseAsync(body);
        // Crear request
        const request = {
            photo: req.file,
            category: body.category,
            description: body.description,
            location: body.location,
            userSecret: body.userSecret,
        };
        // Procesar
        const result = await report_service_1.reportService.createReport(request);
        res.json(result);
    }
    catch (error) {
        console.error('[API] Create report error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error al crear reporte',
        });
    }
});
/**
 * GET /api/reports/nearby
 * Buscar reportes cercanos
 * IMPORTANTE: Esta ruta debe estar ANTES de /:id para que funcione correctamente
 */
router.get('/nearby', async (req, res) => {
    try {
        const query = {
            lat: parseFloat(req.query.lat),
            long: parseFloat(req.query.long),
            radiusKm: parseFloat(req.query.radiusKm) || 5,
            category: req.query.category ? parseInt(req.query.category) : undefined,
            limit: req.query.limit ? parseInt(req.query.limit) : 50,
        };
        await validation_1.schemas.nearbyReports.parseAsync(query);
        const reports = await report_service_1.reportService.getNearbyReports(query.lat, query.long, query.radiusKm, query.category);
        res.json({
            success: true,
            data: reports,
        });
    }
    catch (error) {
        console.error('[API] Nearby reports error:', error);
        res.status(400).json({
            success: false,
            error: 'No pudimos buscar reportes cercanos. Verifica tu ubicación e intenta de nuevo.',
        });
    }
});
/**
 * GET /api/reports/:id
 * Obtener reporte por ID
 */
router.get('/:id', async (req, res) => {
    try {
        const report = await report_service_1.reportService.getReport(req.params.id);
        if (!report.datosReporte) {
            return res.status(404).json({
                success: false,
                error: 'No encontramos ese reporte. Verifica el ID e intenta de nuevo.',
            });
        }
        res.json({
            success: true,
            reporte: report,
        });
    }
    catch (error) {
        console.error('[API] Get report error:', error);
        res.status(500).json({
            success: false,
            error: 'No pudimos obtener el reporte. Por favor intenta de nuevo.',
        });
    }
});
/**
 * POST /api/reports/:id/validate
 * Validar (votar) un reporte
 */
router.post('/:id/validate', (0, validation_1.validate)(validation_1.schemas.validateReport), async (req, res) => {
    try {
        const txHash = await scroll_service_1.scrollService.validateReport(req.params.id, req.body.isValid);
        // Respuesta user-friendly sin exponer blockchain
        res.json({
            success: true,
            mensaje: req.body.isValid
                ? '¡Gracias por validar este reporte! Tu voto ha sido registrado.'
                : 'Tu voto ha sido registrado. Ayudas a mantener la calidad de la comunidad.',
            // Datos técnicos ocultos
            _internal: {
                txHash,
            },
        });
    }
    catch (error) {
        console.error('[API] Validate report error:', error);
        res.status(500).json({
            success: false,
            error: 'No pudimos registrar tu validación. Por favor intenta de nuevo.',
        });
    }
});
exports.default = router;
