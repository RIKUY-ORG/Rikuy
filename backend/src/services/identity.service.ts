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
  CIValidationResult,
} from '../types/identity';

const logger = getServiceLogger('IdentityService');

/**
 * Servicio de identidad — flujo Reclaim Protocol
 *
 * Reclaim nos da solo: CI + Nombre completo (desde ciudadaniadigital.bo)
 *
 * Flujo:
 * 1. Frontend obtiene proof de Reclaim → extrae CI + nombre
 * 2. Frontend envia CI + fullName + walletAddress al backend
 * 3. Backend valida formato del CI boliviano (5-8 dígitos, opcional complemento)
 * 4. Backend verifica que ese CI no este ya registrado (via ciHash)
 * 5. Backend genera commitment anonimo: keccak256(wallet + salt + nonce)
 * 6. Backend registra commitment on-chain via relayerService.registerCitizen()
 * 7. El commitment se usa despues para denuncias anonimas
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
    const { ci, fullName, walletAddress } = request;

    logger.info({ walletAddress }, 'Starting citizen verification (Reclaim flow)');

    try {
      // Rate limiting
      this.checkRateLimit(walletAddress);

      // Validar formato del CI boliviano (5-8 dígitos, opcional complemento)
      const ciValidation = this.validateCI(ci);
      if (!ciValidation.isValid) {
        throw new Error(ciValidation.error || 'CI inválido');
      }

      // Validar nombre
      if (!fullName || fullName.trim().length < 3) {
        throw new Error('Nombre del ciudadano inválido');
      }

      // Verificar que el CI no este ya registrado (usando solo dígitos para el hash)
      const ciHash = this.hashCI(ci);
      const existingByCi = this.findIdentityByCiHash(ciHash);
      if (existingByCi) {
        await this.logAttempt(walletAddress, false, RejectionReason.DUPLICATE_IDENTITY, ipAddress, userAgent);
        throw new Error('Este CI ya ha sido verificado');
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
        ciHash,
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
  // VALIDATION
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Validar formato del CI boliviano:
   * - Parte numérica: 5-8 dígitos (flexible según rango real)
   * - Complemento opcional: guión seguido de 1-3 caracteres alfanuméricos
   * 
   * Patrón: ^(\d{5,8})(?:-([A-Za-z0-9]{1,3}))?$
   * 
   * Ejemplos válidos:
   *   - 123456 (6 dígitos)
   *   - 1234567 (7 dígitos)
   *   - 12345678 (8 dígitos)
   *   - 1234567-1A (con complemento)
   *   - 123456-B (con complemento corto)
   */
  validateCI(ci: string): CIValidationResult {
    const trimmedCI = ci.trim();
    
    // Patrón para CI boliviano:
    // - Parte numérica: 5-8 dígitos (ajustable según investigación)
    // - Complemento opcional: guión seguido de 1-3 caracteres alfanuméricos
    const ciPattern = /^(\d{5,8})(?:-([A-Za-z0-9]{1,3}))?$/;
    
    const match = trimmedCI.match(ciPattern);
    
    if (!match) {
      return {
        isValid: false,
        error: 'Formato de CI inválido. Debe contener 5-8 dígitos, opcionalmente con complemento (ej: 1234567-1A)',
      };
    }

    const numericPart = match[1];      // Parte numérica (5-8 dígitos)
    const complement = match[2];       // Complemento opcional

    // Validaciones adicionales
    if (numericPart.length < 5) {
      return {
        isValid: false,
        error: 'El CI debe tener al menos 5 dígitos',
      };
    }

    if (numericPart.length > 8) {
      return {
        isValid: false,
        error: 'El CI no puede tener más de 8 dígitos (sin contar complemento)',
      };
    }

    // Si hay complemento, validar longitud
    if (complement && complement.length > 3) {
      return {
        isValid: false,
        error: 'El complemento del CI no puede exceder 3 caracteres',
      };
    }

    return {
      isValid: true,
      normalized: trimmedCI,  // Mantener formato original con complemento
      numericPart,            // Parte numérica para hashing
      complement,             // Complemento para referencia
    };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Genera hash del CI usando SOLO la parte numérica
   * Esto permite que el mismo CI con diferentes complementos
   * sea detectado como duplicado (casos de duplicidad)
   */
  private hashCI(ci: string): string {
    // Extraer solo dígitos para el hash (ignorar complemento y guión)
    const cleanDigits = ci.replace(/\D/g, '');
    return crypto.createHash('sha256').update(cleanDigits).digest('hex');
  }

  private findIdentityByCiHash(ciHash: string): StoredIdentity | undefined {
    return Array.from(this.identities.values()).find(
      (identity) => identity.ciHash === ciHash
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
    if (errorMessage.includes('CI') || errorMessage.includes('dígito') || errorMessage.includes('Formato'))
      return RejectionReason.INVALID_CI_FORMAT;
    if (errorMessage.includes('verificado') || errorMessage.includes('identidad'))
      return RejectionReason.DUPLICATE_IDENTITY;
    if (errorMessage.includes('Límite'))
      return RejectionReason.RATE_LIMITED;
    return RejectionReason.RECLAIM_PROOF_FAILED;
  }
}

export const identityService = new IdentityService();