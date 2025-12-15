import { Router, Request, Response } from 'express';
import { upload } from '../middleware/upload';
import { validate, schemas } from '../middleware/validation';
import { identityService } from '../services/identity.service';
import { DocumentType } from '../types/identity';

const router = Router();

router.post(
  '/verify',
  upload.fields([
    { name: 'documentImage', maxCount: 1 },
    { name: 'selfieImage', maxCount: 1 }
  ]),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (!files.documentImage || files.documentImage.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Imagen del documento es requerida'
        });
      }

      const body = {
        documentType: req.body.documentType as DocumentType,
        documentNumber: req.body.documentNumber,
        expedition: req.body.expedition,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        dateOfBirth: req.body.dateOfBirth,
        userAddress: req.body.userAddress
      };

      await schemas.verifyIdentity.parseAsync(body);

      const request = {
        ...body,
        documentImage: files.documentImage[0],
        selfieImage: files.selfieImage ? files.selfieImage[0] : undefined
      };

      const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      const result = await identityService.verifyDocument(request, ipAddress, userAgent);

      res.json(result);

    } catch (error: any) {
      console.error('[API] Verify identity error:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Error al verificar identidad'
      });
    }
  }
);

router.get('/status', async (req: Request, res: Response) => {
  try {
    const userAddress = req.query.userAddress || req.headers['x-user-address'];

    if (!userAddress || typeof userAddress !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'User address is required'
      });
    }

    const status = await identityService.getIdentityStatus(userAddress);

    res.json(status);

  } catch (error: any) {
    console.error('[API] Get identity status error:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estado de verificación'
    });
  }
});

router.post(
  '/revoke',
  validate(schemas.revokeIdentity),
  async (req: Request, res: Response) => {
    try {
      const { identityCommitment, reason } = req.body;

      await identityService.revokeIdentity(identityCommitment, reason);

      res.json({
        success: true,
        message: 'Identidad revocada exitosamente'
      });

    } catch (error: any) {
      console.error('[API] Revoke identity error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al revocar identidad'
      });
    }
  }
);

export default router;
