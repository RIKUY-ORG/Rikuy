import { Router, Request, Response } from 'express';
import { validate, schemas } from '../middleware/validation';
import { identityService } from '../services/identity.service';
import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk';

const router = Router();

/**
 * POST /api/identity/reclaim-init
 * Inicializar sesion de Reclaim Protocol desde el backend
 *
 * El APP_SECRET nunca se expone al frontend.
 * El backend genera la requestUrl y statusUrl que el frontend usa
 * para mostrar el QR y hacer polling por el proof.
 */
router.post('/reclaim-init', async (req: Request, res: Response) => {
  try {
    const appId = process.env.RECLAIM_APP_ID;
    const appSecret = process.env.RECLAIM_APP_SECRET;
    const providerId = process.env.RECLAIM_PROVIDER_ID;

    if (!appId || !appSecret || !providerId) {
      return res.status(503).json({
        success: false,
        error: 'Reclaim Protocol not configured on server',
      });
    }

    const reclaimRequest = await ReclaimProofRequest.init(appId, appSecret, providerId);
    const requestUrl = await reclaimRequest.getRequestUrl();

    // Obtener statusUrl para polling
    const statusUrl = reclaimRequest.getStatusUrl
      ? await reclaimRequest.getStatusUrl()
      : undefined;

    console.log('[Reclaim] Session initialized, requestUrl generated');

    res.json({
      success: true,
      data: {
        requestUrl,
        statusUrl: statusUrl || null,
        appId,
        providerId,
      },
    });

  } catch (error: any) {
    console.error('[API] Reclaim init error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error inicializando sesion de Reclaim',
    });
  }
});

/**
 * POST /api/identity/verify
 * Verificar ciudadania boliviana (post Reclaim Protocol)
 *
 * El frontend ya obtuvo el proof de Reclaim y extrajo CI + nombre.
 * Este endpoint recibe esos datos + walletAddress y registra el commitment on-chain.
 */
router.post(
  '/verify',
  validate(schemas.verifyCitizen),
  async (req: Request, res: Response) => {
    try {
      const { ci, fullName, reclaimProof } = req.body;

      // walletAddress desde body o header de Privy
      const walletAddress = req.body.walletAddress
        || req.headers['x-user-address'] as string;

      if (!walletAddress) {
        return res.status(400).json({
          success: false,
          error: 'Wallet address es requerido',
        });
      }

      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      const result = await identityService.verifyCitizen(
        { ci, fullName, walletAddress, reclaimProof },
        ipAddress,
        userAgent
      );

      res.json(result);

    } catch (error: any) {
      console.error('[API] Verify citizen error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al verificar ciudadania',
      });
    }
  }
);

/**
 * GET /api/identity/status
 * Consultar estado de verificacion
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const walletAddress = (req.query.walletAddress as string)
      || (req.headers['x-user-address'] as string);

    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        error: 'Wallet address es requerido',
      });
    }

    const status = await identityService.getIdentityStatus(walletAddress);

    res.json(status);

  } catch (error: any) {
    console.error('[API] Get identity status error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estado de verificacion',
    });
  }
});

/**
 * POST /api/identity/revoke
 * Revocar identidad verificada
 */
router.post(
  '/revoke',
  validate(schemas.revokeIdentity),
  async (req: Request, res: Response) => {
    try {
      const { commitment, reason } = req.body;

      await identityService.revokeIdentity(commitment, reason);

      res.json({
        success: true,
        message: 'Identidad revocada exitosamente',
      });

    } catch (error: any) {
      console.error('[API] Revoke identity error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al revocar identidad',
      });
    }
  }
);

export default router;
