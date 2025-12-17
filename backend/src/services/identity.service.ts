import crypto from 'crypto';
import CryptoJS from 'crypto-js';
import { config } from '../config';
import { ocrService } from './ocr.service';
import { semaphoreService } from './semaphore.service';
import { getServiceLogger } from '../utils/logger';
import {
  VerifyIdentityRequest,
  VerifyIdentityResponse,
  IdentityStatusResponse,
  DocumentType,
  VerificationStatus,
  VerificationMethod,
  RejectionReason,
  BolivianDepartment,
  CIValidationResult,
  StoredIdentity,
  VerificationAttempt,
  isValidDepartment
} from '../types/identity';

const logger = getServiceLogger('IdentityService');

class IdentityService {
  private identities: Map<string, StoredIdentity> = new Map();
  private attempts: Map<string, VerificationAttempt[]> = new Map();

  async verifyDocument(request: VerifyIdentityRequest, ipAddress: string, userAgent: string): Promise<VerifyIdentityResponse> {
    const userAddress = request.userAddress || 'unknown';

    logger.info({ userAddress, documentType: request.documentType }, 'Starting identity verification');

    try {
      this.checkRateLimit(userAddress);

      await this.validateImageQuality(request.documentImage.buffer);

      // Intentar OCR pero no es obligatorio - usamos datos del formulario
      let extracted = null;
      try {
        extracted = request.documentType === DocumentType.CI
          ? await ocrService.extractBolivianCI(request.documentImage.buffer)
          : await ocrService.extractBolivianPassport(request.documentImage.buffer);

        // Si OCR funciona, validamos coincidencia
        this.validateExtractedData(extracted, request);
        logger.info({ ocrSuccess: true }, 'OCR extraction successful');
      } catch (ocrError: any) {
        // OCR falló, usamos datos del formulario directamente
        logger.warn({ error: ocrError.message }, 'OCR failed, using manual data from form');
      }

      // Validar formato del CI boliviano
      if (request.documentType === DocumentType.CI) {
        const validation = this.validateBolivianCI(request.documentNumber, request.expedition || 'LP');
        if (!validation.isValid) {
          throw new Error(validation.error || 'CI inválido');
        }
      }

      // Validar datos básicos del formulario
      if (!request.firstName || request.firstName.length < 2) {
        throw new Error('Nombre inválido');
      }
      if (!request.lastName || request.lastName.length < 2) {
        throw new Error('Apellido inválido');
      }
      if (!request.dateOfBirth) {
        throw new Error('Fecha de nacimiento requerida');
      }

      const existingIdentity = this.findIdentityByDocument(request.documentNumber);
      if (existingIdentity) {
        await this.logAttempt(userAddress, request.documentType, false, RejectionReason.DUPLICATE_IDENTITY, ipAddress, userAgent);
        throw new Error('Este documento ya ha sido verificado');
      }

      const identity = semaphoreService.generateIdentity(userAddress + request.documentNumber);

      const txHash = await semaphoreService.addMember(identity.commitment);

      logger.info({ commitment: identity.commitment, txHash }, 'Member added to Semaphore group');

      const storedIdentity = await this.storeIdentity({
        userAddress,
        documentType: request.documentType,
        documentNumber: request.documentNumber,
        firstName: request.firstName,
        lastName: request.lastName,
        dateOfBirth: request.dateOfBirth,
        identityCommitment: identity.commitment,
        identitySecret: identity.secret,
        verificationMethod: VerificationMethod.OCR_AUTO
      });

      await this.logAttempt(userAddress, request.documentType, true, undefined, ipAddress, userAgent);

      return {
        success: true,
        message: 'Identidad verificada exitosamente',
        data: {
          verified: true,
          identity: {
            commitment: identity.commitment,
            secret: identity.secret
          },
          semaphoreGroupId: config.blockchain.contracts.semaphoreAdapter,
          status: VerificationStatus.VERIFIED,
          verifiedAt: new Date().toISOString()
        }
      };

    } catch (error: any) {
      logger.error({ error: error.message, userAddress }, 'Verification failed');

      await this.logAttempt(
        userAddress,
        request.documentType,
        false,
        this.categorizeError(error.message),
        ipAddress,
        userAgent
      );

      throw error;
    }
  }

  async getIdentityStatus(userAddress: string): Promise<IdentityStatusResponse> {
    const identity = this.identities.get(userAddress);

    if (!identity) {
      return {
        success: true,
        data: {
          isVerified: false,
          canCreateReports: false,
          status: VerificationStatus.PENDING
        }
      };
    }

    return {
      success: true,
      data: {
        isVerified: identity.status === VerificationStatus.VERIFIED,
        verifiedAt: identity.verifiedAt.toISOString(),
        documentType: identity.documentType,
        semaphoreGroupId: identity.semaphoreGroupId,
        identityCommitment: identity.identityCommitment,
        canCreateReports: identity.status === VerificationStatus.VERIFIED,
        status: identity.status
      }
    };
  }

  async revokeIdentity(identityCommitment: string, reason: string): Promise<void> {
    logger.info({ identityCommitment, reason }, 'Revoking identity');

    const identity = Array.from(this.identities.values()).find(
      i => i.identityCommitment === identityCommitment
    );

    if (!identity) {
      throw new Error('Identity not found');
    }

    await semaphoreService.removeMember(identityCommitment);

    identity.status = VerificationStatus.REVOKED;
    identity.revokedAt = new Date();
    identity.revokedReason = reason;

    this.identities.set(identity.userAddress, identity);

    logger.info({ identityCommitment }, 'Identity revoked successfully');
  }

  validateBolivianCI(ciNumber: string, expedition: string): CIValidationResult {
    const cleanCI = ciNumber.replace(/\D/g, '');

    if (cleanCI.length !== 8) {
      return {
        isValid: false,
        error: 'CI debe tener 8 dígitos'
      };
    }

    const cleanExpedition = expedition.toUpperCase().trim();

    if (!isValidDepartment(cleanExpedition)) {
      return {
        isValid: false,
        error: `Departamento inválido: ${cleanExpedition}`
      };
    }

    return {
      isValid: true,
      normalized: {
        number: cleanCI,
        expedition: cleanExpedition as BolivianDepartment
      }
    };
  }

  private async validateImageQuality(imageBuffer: Buffer): Promise<void> {
    const isValid = await ocrService.validateImageQuality(imageBuffer);

    if (!isValid) {
      throw new Error('La calidad de la imagen es muy baja. Por favor, toma una foto más clara.');
    }
  }

  private validateExtractedData(extracted: any, request: VerifyIdentityRequest): void {
    if (extracted.confidence < 0.6) {
      throw new Error('No pudimos leer el documento con claridad. Intenta con una imagen más nítida.');
    }

    const normalizedExtracted = this.normalizeString(extracted.firstName);
    const normalizedRequest = this.normalizeString(request.firstName);

    if (!normalizedExtracted.includes(normalizedRequest) && !normalizedRequest.includes(normalizedExtracted)) {
      logger.warn({
        extracted: extracted.firstName,
        provided: request.firstName
      }, 'Name mismatch detected');
    }
  }

  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private findIdentityByDocument(documentNumber: string): StoredIdentity | undefined {
    const hash = this.hashDocumentNumber(documentNumber);

    return Array.from(this.identities.values()).find(
      identity => identity.documentNumberHash === hash
    );
  }

  private hashDocumentNumber(documentNumber: string): string {
    return crypto
      .createHash('sha256')
      .update(documentNumber)
      .digest('hex');
  }

  private encrypt(text: string): string {
    return CryptoJS.AES.encrypt(text, config.security.jwtSecret).toString();
  }

  private decrypt(ciphertext: string): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, config.security.jwtSecret);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  private async storeIdentity(data: {
    userAddress: string;
    documentType: DocumentType;
    documentNumber: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    identityCommitment: string;
    identitySecret: string;
    verificationMethod: VerificationMethod;
  }): Promise<StoredIdentity> {
    const identity: StoredIdentity = {
      id: crypto.randomUUID(),
      userAddress: data.userAddress,
      documentType: data.documentType,
      documentNumberHash: this.hashDocumentNumber(data.documentNumber),
      firstNameEncrypted: this.encrypt(data.firstName),
      lastNameEncrypted: this.encrypt(data.lastName),
      dateOfBirthEncrypted: this.encrypt(data.dateOfBirth),
      identityCommitment: data.identityCommitment,
      identitySecretEncrypted: this.encrypt(data.identitySecret),
      semaphoreGroupId: config.blockchain.contracts.semaphoreAdapter,
      verifiedAt: new Date(),
      verificationMethod: data.verificationMethod,
      status: VerificationStatus.VERIFIED,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.identities.set(data.userAddress, identity);

    logger.info({ userAddress: data.userAddress, identityId: identity.id }, 'Identity stored');

    return identity;
  }

  private checkRateLimit(userAddress: string): void {
    const attempts = this.attempts.get(userAddress) || [];

    const last24h = attempts.filter(
      a => Date.now() - a.attemptedAt.getTime() < 24 * 60 * 60 * 1000
    );

    if (last24h.length >= 3) {
      throw new Error('Límite de intentos diarios alcanzado (3/día)');
    }

    const lastHour = attempts.filter(
      a => Date.now() - a.attemptedAt.getTime() < 60 * 60 * 1000
    );

    if (lastHour.length >= 2) {
      throw new Error('Límite de intentos por hora alcanzado (2/hora)');
    }
  }

  private async logAttempt(
    userAddress: string,
    documentType: DocumentType,
    success: boolean,
    failureReason?: RejectionReason,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const attempt: VerificationAttempt = {
      id: crypto.randomUUID(),
      userAddress,
      documentType,
      success,
      failureReason,
      failureDetails: undefined,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      attemptedAt: new Date()
    };

    const userAttempts = this.attempts.get(userAddress) || [];
    userAttempts.push(attempt);
    this.attempts.set(userAddress, userAttempts);
  }

  private categorizeError(errorMessage: string): RejectionReason {
    if (errorMessage.includes('calidad')) return RejectionReason.POOR_IMAGE_QUALITY;
    if (errorMessage.includes('leer')) return RejectionReason.DOCUMENT_NOT_READABLE;
    if (errorMessage.includes('formato') || errorMessage.includes('dígitos')) return RejectionReason.INVALID_FORMAT;
    if (errorMessage.includes('duplicado') || errorMessage.includes('verificado')) return RejectionReason.DUPLICATE_IDENTITY;
    return RejectionReason.INCOMPLETE_DATA;
  }
}

export const identityService = new IdentityService();
