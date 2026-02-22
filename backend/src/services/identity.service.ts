import crypto from 'crypto';
import { relayerService } from './relayer.service';
import { getServiceLogger } from '../utils/logger';
import {
  VerifyIdentityRequest,
  VerifyIdentityResponse,
  IdentityStatusResponse,
  VerificationStatus,
  RejectionReason,
  StoredIdentity,
  VerificationAttempt,
} from '../types/identity';

const logger = getServiceLogger('IdentityService');

/**
 * Servicio de identidad — flujo Reclaim Protocol
 *
 * Reclaim nos da: 'usuario' + 'rol' (desde ciudadaniadigital.bo)
 *
 * Flujo:
 * 1. Frontend obtiene proof de Reclaim → extrae 'usuario' de Ciudadania Digital
 * 2. Frontend envia usuario + walletAddress al backend
 * 3. Backend verifica que ese usuario no este ya registrado (via usuarioHash)
 * 4. Backend genera commitment anonimo: keccak256(wallet + salt + nonce)
 * 5. Backend registra commitment on-chain via relayerService.registerCitizen()
 * 6. El commitment se usa despues para denuncias anonimas
 */
class IdentityService {
  private identities: Map<string, StoredIdentity> = new Map();
  private attempts: Map<string, VerificationAttempt[]> = new Map();

  /**
   * Verificar ciudadania y registrar commitment anonimo
   */
  async verifyCitizen(
    request: VerifyIdentityRequest,
    ipAddress: string,
    userAgent: string
  ): Promise<VerifyIdentityResponse> {
    const { usuario, walletAddress } = request;

    logger.info({ walletAddress }, 'Starting citizen verification (Reclaim flow)');

    try {
      // Rate limiting
      this.checkRateLimit(walletAddress);

      // Validar usuario de Ciudadania Digital
      if (!usuario || usuario.trim().length < 1) {
        throw new Error('Usuario de Ciudadania Digital inválido');
      }

      // Verificar que el usuario no este ya registrado
      const usuarioHash = this.hashUsuario(usuario);
      const existingByUsuario = this.findIdentityByUsuarioHash(usuarioHash);
      if (existingByUsuario) {
        await this.logAttempt(walletAddress, false, RejectionReason.DUPLICATE_IDENTITY, ipAddress, userAgent);
        throw new Error('Este usuario de Ciudadania Digital ya ha sido verificado');
      }

      // Verificar que el wallet no tenga ya una identidad
      const existingByWallet = this.identities.get(walletAddress);
      if (existingByWallet) {
        await this.logAttempt(walletAddress, false, RejectionReason.DUPLICATE_IDENTITY, ipAddress, userAgent);
        throw new Error('Este wallet ya tiene una identidad verificada');
      }

      // Generar commitment anonimo via relayer
      const nonce = Date.now();
      const commitment = relayerService.generateCommitment(walletAddress, nonce);

      logger.info({ commitment: commitment.slice(0, 16) + '...' }, 'Anonymous commitment generated');

      // Registrar ciudadano on-chain via relayer
      const { txHash } = await relayerService.registerCitizen({ commitment });

      logger.info({ txHash }, 'Citizen registered on-chain');

      // Almacenar identidad localmente
      const storedIdentity: StoredIdentity = {
        id: crypto.randomUUID(),
        walletAddress,
        ciHash: usuarioHash,
        commitment,
        verifiedAt: new Date(),
        status: VerificationStatus.VERIFIED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.identities.set(walletAddress, storedIdentity);

      await this.logAttempt(walletAddress, true, undefined, ipAddress, userAgent);

      logger.info({ walletAddress, identityId: storedIdentity.id }, 'Citizen verified and stored');

      return {
        success: true,
        message: 'Ciudadania verificada exitosamente',
        data: {
          verified: true,
          commitment,
          txHash,
          status: VerificationStatus.VERIFIED,
          verifiedAt: new Date().toISOString(),
        },
      };
    } catch (error: any) {
      logger.error({ error: error.message, walletAddress }, 'Citizen verification failed');

      await this.logAttempt(
        walletAddress,
        false,
        this.categorizeError(error.message),
        ipAddress,
        userAgent
      );

      throw error;
    }
  }

  async getIdentityStatus(walletAddress: string): Promise<IdentityStatusResponse> {
    const identity = this.identities.get(walletAddress);

    if (!identity) {
      return {
        success: true,
        data: {
          isVerified: false,
          canCreateReports: false,
          status: VerificationStatus.PENDING,
        },
      };
    }

    return {
      success: true,
      data: {
        isVerified: identity.status === VerificationStatus.VERIFIED,
        verifiedAt: identity.verifiedAt.toISOString(),
        commitment: identity.commitment,
        canCreateReports: identity.status === VerificationStatus.VERIFIED,
        status: identity.status,
      },
    };
  }

  async revokeIdentity(commitment: string, reason: string): Promise<void> {
    logger.info({ commitment: commitment.slice(0, 16) + '...', reason }, 'Revoking identity');

    const identity = Array.from(this.identities.values()).find(
      (i) => i.commitment === commitment
    );

    if (!identity) {
      throw new Error('Identity not found');
    }

    // TODO: Revocar on-chain si se implementa en el contrato
    identity.status = VerificationStatus.REVOKED;
    identity.revokedAt = new Date();
    identity.revokedReason = reason;
    identity.updatedAt = new Date();

    this.identities.set(identity.walletAddress, identity);

    logger.info({ commitment: commitment.slice(0, 16) + '...' }, 'Identity revoked');
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Genera hash del usuario de Ciudadania Digital
   * Nunca almacenamos el usuario en texto plano
   */
  private hashUsuario(usuario: string): string {
    const normalized = usuario.trim().toLowerCase();
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  private findIdentityByUsuarioHash(usuarioHash: string): StoredIdentity | undefined {
    return Array.from(this.identities.values()).find(
      (identity) => identity.ciHash === usuarioHash
    );
  }

  private checkRateLimit(walletAddress: string): void {
    const attempts = this.attempts.get(walletAddress) || [];

    const last24h = attempts.filter(
      (a) => Date.now() - a.attemptedAt.getTime() < 24 * 60 * 60 * 1000
    );

    if (last24h.length >= 3) {
      throw new Error('Límite de intentos diarios alcanzado (3/día)');
    }

    const lastHour = attempts.filter(
      (a) => Date.now() - a.attemptedAt.getTime() < 60 * 60 * 1000
    );

    if (lastHour.length >= 2) {
      throw new Error('Límite de intentos por hora alcanzado (2/hora)');
    }
  }

  private async logAttempt(
    walletAddress: string,
    success: boolean,
    failureReason?: RejectionReason,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const attempt: VerificationAttempt = {
      id: crypto.randomUUID(),
      walletAddress,
      success,
      failureReason,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      attemptedAt: new Date(),
    };

    const userAttempts = this.attempts.get(walletAddress) || [];
    userAttempts.push(attempt);
    this.attempts.set(walletAddress, userAttempts);
  }

  private categorizeError(errorMessage: string): RejectionReason {
    if (errorMessage.includes('usuario') || errorMessage.includes('Ciudadania'))
      return RejectionReason.INVALID_CI_FORMAT;
    if (errorMessage.includes('verificado') || errorMessage.includes('identidad'))
      return RejectionReason.DUPLICATE_IDENTITY;
    if (errorMessage.includes('Límite'))
      return RejectionReason.RATE_LIMITED;
    return RejectionReason.RECLAIM_PROOF_FAILED;
  }
}

export const identityService = new IdentityService();