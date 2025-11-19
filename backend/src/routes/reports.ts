import { Router, Request, Response } from 'express';
import { reportService } from '../services/report.service';
import { scrollService } from '../services/scroll.service';
import { upload } from '../middleware/upload';
import { reportRateLimiter } from '../middleware/rateLimit';
import { validate, schemas } from '../middleware/validation';
import { CreateReportRequest } from '../types';

const router = Router();

/**
 * POST /api/reports
 * Crear nuevo reporte (ENDPOINT PRINCIPAL)
 */
router.post(
  '/',
  reportRateLimiter,
  upload.single('photo'),
  async (req: Request, res: Response) => {
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
      await schemas.createReport.parseAsync(body);

      // Crear request
      const request: CreateReportRequest = {
        photo: req.file,
        category: body.category,
        description: body.description,
        location: body.location,
        userSecret: body.userSecret,
      };

      // Procesar
      const result = await reportService.createReport(request);

      res.json(result);

    } catch (error: any) {
      console.error('[API] Create report error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al crear reporte',
      });
    }
  }
);

/**
 * GET /api/reports/nearby
 * Buscar reportes cercanos
 * IMPORTANTE: Esta ruta debe estar ANTES de /:id para que funcione correctamente
 */
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const query = {
      lat: parseFloat(req.query.lat as string),
      long: parseFloat(req.query.long as string),
      radiusKm: parseFloat(req.query.radiusKm as string) || 5,
      category: req.query.category ? parseInt(req.query.category as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
    };

    await schemas.nearbyReports.parseAsync(query);

    const reports = await reportService.getNearbyReports(
      query.lat,
      query.long,
      query.radiusKm,
      query.category
    );

    res.json({
      success: true,
      data: reports,
    });

  } catch (error: any) {
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
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const report = await reportService.getReport(req.params.id);

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

  } catch (error: any) {
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
router.post(
  '/:id/validate',
  validate(schemas.validateReport),
  async (req: Request, res: Response) => {
    try {
      const txHash = await scrollService.validateReport(
        req.params.id,
        req.body.isValid
      );

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

    } catch (error: any) {
      console.error('[API] Validate report error:', error);
      res.status(500).json({
        success: false,
        error: 'No pudimos registrar tu validación. Por favor intenta de nuevo.',
      });
    }
  }
);

export default router;
