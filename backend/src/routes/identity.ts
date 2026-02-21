import { Router, Request, Response } from 'express';
import { validate, schemas } from '../middleware/validation';
import { identityService } from '../services/identity.service';

const router = Router();

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
 * Consultar estado de verificacion (con soporte HTML/JSON)
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const walletAddress = (req.query.walletAddress as string)
      || (req.headers['x-user-address'] as string);

    if (!walletAddress) {
      return res.formatResponse({
        success: false,
        error: 'Wallet address es requerido',
        example: '/api/identity/status?walletAddress=0x123...'
      }, { 
        title: 'Error - Wallet requerida',
        template: 'status' 
      });
    }

    const status = await identityService.getIdentityStatus(walletAddress);

    // Preparar datos para la respuesta
    const responseData = {
      success: true,
      wallet: walletAddress,
      data: status,
      timestamp: Date.now(),
    };

    // Usar formatResponse para HTML/JSON automático
    res.formatResponse(responseData, { 
      title: 'Estado de Verificación', 
      template: 'status' 
    });

  } catch (error: any) {
    console.error('[API] Get identity status error:', error);
    
    res.formatResponse({
      success: false,
      error: 'Error al obtener estado de verificacion',
      wallet: req.query.walletAddress as string || req.headers['x-user-address'] as string,
    }, { 
      title: 'Error - Estado de Verificación',
      template: 'status'
    });
  }
});

/**
 * GET /api/identity/status/html
 * Versión HTML explícita del estado (opcional, para enlaces directos)
 */
router.get('/status/html', async (req: Request, res: Response) => {
  try {
    const walletAddress = (req.query.walletAddress as string)
      || (req.headers['x-user-address'] as string);

    if (!walletAddress) {
      // Redirigir a la página principal con error
      return res.redirect('/?error=missing-wallet');
    }

    const status = await identityService.getIdentityStatus(walletAddress);

    const responseData = {
      success: true,
      wallet: walletAddress,
      data: status,
      timestamp: Date.now(),
    };

    // Forzar HTML con template específico
    res.formatResponse(responseData, { 
      title: 'Estado de Verificación', 
      template: 'status' 
    });

  } catch (error: any) {
    console.error('[API] Get identity status HTML error:', error);
    res.redirect('/?error=verification-error');
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