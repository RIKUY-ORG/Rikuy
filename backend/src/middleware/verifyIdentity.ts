import { Request, Response, NextFunction } from 'express';
import { semaphoreService } from '../services/semaphore.service';
import { getServiceLogger } from '../utils/logger';

const logger = getServiceLogger('VerifyIdentityMiddleware');

export async function verifyZKProof(req: Request, res: Response, next: NextFunction) {
  try {
    const zkProof = req.body.zkProof;

    if (!zkProof) {
      return res.status(400).json({
        success: false,
        error: 'ZK proof es requerido. Debes verificar tu identidad primero.'
      });
    }

    if (!zkProof.proof || !Array.isArray(zkProof.proof) || zkProof.proof.length !== 8) {
      return res.status(400).json({
        success: false,
        error: 'Formato de proof inválido'
      });
    }

    if (!zkProof.publicSignals || !Array.isArray(zkProof.publicSignals) || zkProof.publicSignals.length !== 4) {
      return res.status(400).json({
        success: false,
        error: 'Formato de public signals inválido'
      });
    }

    const verificationResult = await semaphoreService.verifyProof(zkProof);

    if (!verificationResult.isValid) {
      logger.warn({ error: verificationResult.error }, 'Invalid ZK proof submitted');
      return res.status(403).json({
        success: false,
        error: 'Proof inválido. No estás registrado en el grupo Semaphore o tu proof es incorrecto.'
      });
    }

    const nullifierUsed = await semaphoreService.isNullifierUsed(verificationResult.nullifier!);

    if (nullifierUsed) {
      logger.warn({ nullifier: verificationResult.nullifier }, 'Nullifier already used');
      return res.status(403).json({
        success: false,
        error: 'Este proof ya fue usado. No puedes reutilizar el mismo proof.'
      });
    }

    logger.info({ nullifier: verificationResult.nullifier }, 'ZK proof verified successfully');

    next();

  } catch (error: any) {
    logger.error({ error: error.message }, 'Error verifying ZK proof');
    return res.status(500).json({
      success: false,
      error: 'Error al verificar proof de identidad'
    });
  }
}
