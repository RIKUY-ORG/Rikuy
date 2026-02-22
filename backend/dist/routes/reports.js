"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_service_1 = require("../services/report.service");
const identity_service_1 = require("../services/identity.service");
const upload_1 = require("../middleware/upload");
const validation_1 = require("../middleware/validation");
const config_1 = require("../config");
const router = (0, express_1.Router)();
/**
 * POST /api/reports
 * Crear nuevo reporte anonimo
 *
 * El walletAddress viene del header x-user-address (set by Privy)
 * No se requiere zkProof — la anonimidad se maneja con commitments
 */
router.post('/', upload_1.upload.single('photo'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Foto es requerida',
            });
        }
        const body = {
            category: parseInt(req.body.category),
            description: req.body.description,
            // Campos legales Ley 974
            accusedEntity: req.body.accusedEntity,
            incidentDate: req.body.incidentDate,
            detailedDescription: req.body.detailedDescription,
            evidenceDescription: req.body.evidenceDescription,
            citizenSignature: req.body.citizenSignature,
            location: JSON.parse(req.body.location),
        };
        await validation_1.schemas.createReport.parseAsync(body);
        // walletAddress desde header de Privy (embedded wallet)
        const walletAddress = req.headers['x-user-address'] || undefined;
        // ── Verificar ciudadanía boliviana (Reclaim Protocol) ──
        // Solo ciudadanos verificados pueden crear reportes (Ley 974)
        if (!config_1.config.devMode) {
            if (!walletAddress) {
                return res.status(401).json({
                    success: false,
                    error: 'Wallet address requerido. Conecta tu wallet primero.',
                });
            }
            const identity = await identity_service_1.identityService.getIdentityStatus(walletAddress);
            if (!identity.data.canCreateReports) {
                return res.status(403).json({
                    success: false,
                    error: 'Debes verificar tu ciudadanía boliviana antes de crear reportes.',
                    verificacionUrl: '/verificar-identidad',
                });
            }
        }
        const request = {
            photo: req.file,
            category: body.category,
            description: body.description,
            // Campos legales Ley 974
            accusedEntity: body.accusedEntity,
            incidentDate: body.incidentDate,
            detailedDescription: body.detailedDescription,
            evidenceDescription: body.evidenceDescription,
            citizenSignature: body.citizenSignature,
            location: body.location,
            walletAddress,
        };
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
        const reports = await report_service_1.reportService.getNearbyReports(query.lat, query.long, query.radiusKm);
        res.json({
            success: true,
            data: reports,
        });
    }
    catch (error) {
        console.error('[API] Nearby reports error:', error);
        res.status(400).json({
            success: false,
            error: 'No pudimos buscar reportes cercanos. Verifica tu ubicacion e intenta de nuevo.',
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
        if (!report) {
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
exports.default = router;
