import { CreateReportRequest, CreateReportResponse, ReportCategory, ReportMetadata } from '../types';
import { ipfsService } from './ipfs.service';
import { aiService } from './ai.service';
import { relayerService } from './relayer.service';
import { getServiceLogger } from '../utils/logger';
import { config } from '../config';
import {
  GeofenceError,
  DuplicateImageError,
  ContentModerationError,
  createErrorFromException,
} from '../utils/errors';
import crypto from 'crypto';
import { ethers } from 'ethers';

const logger = getServiceLogger('ReportRelayerService');

class ReportRelayerService {

  // ─────────────────────────────────────────────────────────────────────────
  // EIP-712 — Typed structured data for citizen signature verification
  // ─────────────────────────────────────────────────────────────────────────

  private readonly EIP712_DOMAIN = {
    name: 'Rikuy',
    version: '2',
    chainId: parseInt(process.env.RIKUY_CHAIN_ID || '313370'),
  };

  private readonly EIP712_TYPES = {
    RikuyReport: [
      { name: 'contentHash', type: 'bytes32' },
      { name: 'category', type: 'uint16' },
      { name: 'accusedEntity', type: 'string' },
      { name: 'incidentDate', type: 'string' },
      { name: 'timestamp', type: 'uint256' },
    ],
  };

  /**
   * Verificar firma EIP-712 del ciudadano
   * @returns signatureHash si es valida, undefined si no se provee firma
   * @throws si la firma es invalida
   */
  private verifyEIP712Signature(
    signature: string,
    message: {
      contentHash: string;
      category: number;
      accusedEntity: string;
      incidentDate: string;
      timestamp: number;
    },
    expectedAddress: string,
  ): string {
    const recovered = ethers.verifyTypedData(
      this.EIP712_DOMAIN,
      this.EIP712_TYPES,
      message,
      signature,
    );

    if (recovered.toLowerCase() !== expectedAddress.toLowerCase()) {
      throw new Error(
        `EIP-712 signature mismatch: recovered ${recovered}, expected ${expectedAddress}`
      );
    }

    logger.info({ recovered }, 'EIP-712 signature verified');
    return ethers.keccak256(ethers.toUtf8Bytes(signature));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // REPORT CREATION — Ley 974 compliant
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Crear denuncia anonima con validez legal (Ley 974) — flujo completo:
   * 1. Upload foto a IPFS (EXIF stripped)
   * 2. AI analiza imagen (Gemini Pro Vision)
   * 3. Generar contentHash v2 (incluye campos legales Ley 974)
   * 4. Verificar firma EIP-712 del ciudadano (si existe)
   * 5. Almacenar metadata completa en IPFS (Pinata)
   * 6. Generar commitment anonimo + nullifier
   * 7. Enviar TX a blockchain via Relayer
   * 8. Cross-reference reportIds (IPFS <-> on-chain)
   */
  async createReport(request: CreateReportRequest): Promise<CreateReportResponse> {
    const startTime = Date.now();

    try {
      logger.info('Starting Ley 974 compliant report creation');

      this.validateLocation(request.location);

      // ── Step 1: Upload foto a IPFS ──
      logger.info('Step 1: Uploading image to IPFS');
      const { ipfsHash, url: imageUrl, fileHash } = await ipfsService.uploadImage(request.photo);

      const isDuplicate = await ipfsService.checkDuplicate(fileHash);
      if (isDuplicate) {
        throw new DuplicateImageError();
      }

      // ── Step 2: AI analiza imagen ──
      logger.info('Step 2: AI analyzing image');
      const aiAnalysis = await aiService.analyzeImage(imageUrl, request.category);

      const isAppropriate = await aiService.moderateImage(imageUrl);
      if (!isAppropriate) {
        throw new ContentModerationError();
      }

      // Usar detailedDescription (Ley 974) con fallback a description/AI
      const detailedDescription = request.detailedDescription || request.description || aiAnalysis.description;
      const accusedEntity = request.accusedEntity;
      const incidentDate = request.incidentDate;
      const evidenceDescription = request.evidenceDescription || '';

      // ── Step 3: Generar contentHash v2 con campos legales ──
      // CRITICO: Este hash se almacena on-chain en Stylus (write-once, sin upgrade).
      // Incluir todos los campos legales garantiza inmutabilidad verificable
      // segun Ley 974 Art. 18-24.
      logger.info('Step 3: Generating contentHash v2 (Ley 974 fields)');
      const contentHashTimestamp = Date.now();
      const contentHashPayload = {
        v: 2,
        ipfsHash,
        fileHash,
        category: request.category,
        accusedEntity,
        incidentDate,
        detailedDescription,
        evidenceDescription,
        ts: contentHashTimestamp,
      };

      const contentHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify(contentHashPayload))
      );

      // ── Step 4: Verificar firma EIP-712 (si existe) ──
      const walletAddress = request.walletAddress || ethers.ZeroAddress;
      let citizenSignatureHash: string | undefined;

      if (request.citizenSignature && walletAddress !== ethers.ZeroAddress) {
        logger.info('Step 4: Verifying EIP-712 citizen signature');
        try {
          citizenSignatureHash = this.verifyEIP712Signature(
            request.citizenSignature,
            {
              contentHash,
              category: request.category,
              accusedEntity,
              incidentDate,
              timestamp: contentHashTimestamp,
            },
            walletAddress,
          );
        } catch (sigError: any) {
          logger.warn({ error: sigError.message }, 'EIP-712 signature verification failed — proceeding without signature');
          // No bloquear el reporte si la firma falla — es opcional
        }
      } else {
        logger.info('Step 4: No citizen signature provided — skipping EIP-712 verification');
      }

      // ── Step 5: Almacenar metadata legal en IPFS (Pinata) ──
      const localReportId = this.generateReportId(fileHash, request.location);

      logger.info('Step 5: Storing complete metadata in IPFS (Pinata)');
      const reportMetadata: ReportMetadata = {
        protocol: 'rikuy-v2',
        version: '3.0.0',
        timestamp: Date.now(),
        reportId: localReportId,
        contentHash,
        category: {
          id: request.category,
          name: this.getCategoryName(request.category),
        },
        evidence: {
          imageIPFS: ipfsHash,
          imageHash: fileHash,
          description: detailedDescription,
          aiGenerated: !request.detailedDescription && !request.description,
          aiTags: aiAnalysis.tags,
        },
        // Campos legales Ley 974 — almacenamiento completo
        legalFields: {
          accusedEntity,
          incidentDate,
          detailedDescription,
          evidenceDescription,
          legalFramework: 'Ley 974 Art. 18-24',
          contentHashVersion: 2,
          citizenSignatureHash,
        },
        location: {
          approximate: {
            lat: this.roundCoordinate(request.location.lat),
            long: this.roundCoordinate(request.location.long),
            precision: '~200m',
          },
        },
        metadata: {
          deviceHash: this.generateDeviceHash(request),
          timestamp: Date.now(),
        },
      };

      const metadataResult = await ipfsService.uploadJSON(reportMetadata, {
        name: `rikuy-report-${localReportId}`,
        keyvalues: {
          reportId: localReportId,
          category: request.category.toString(),
          protocol: 'rikuy-v2',
          timestamp: Date.now().toString(),
        },
      });
      const metadataIpfsHash = metadataResult.ipfsHash;

      // ── Step 6: Generar commitment anonimo + nullifier ──
      logger.info('Step 6: Generating anonymous commitment');
      const nonce = Date.now();
      const commitment = relayerService.generateCommitment(walletAddress, nonce);
      const nullifier = relayerService.generateNullifier(commitment, fileHash);

      // Coordenadas multiplicadas por 1_000_000 para precision entera
      const latitude = Math.round(request.location.lat * 1_000_000);
      const longitude = Math.round(request.location.long * 1_000_000);

      // ── Step 7: Crear reporte on-chain ──
      logger.info('Step 7: Creating report on blockchain via Relayer');
      const relayerResult = await relayerService.createReport({
        contentHash,
        categoryId: request.category,
        commitment,
        nullifier,
        latitude,
        longitude,
        aiValidated: aiAnalysis.severity > 0,
      });

      // ── Step 8: Cross-reference + response ──
      const duration = Date.now() - startTime;
      logger.info({
        onChainReportId: relayerResult.reportId,
        localReportId,
        metadataIpfsHash,
        imageIpfsHash: ipfsHash,
        txHash: relayerResult.txHash,
        contentHashVersion: 2,
        hasCitizenSignature: !!citizenSignatureHash,
        gasCost: relayerResult.gasCost,
        duration,
      }, 'Ley 974 compliant report created successfully');

      return {
        success: true,
        reportId: relayerResult.reportId,
        contentHash,
        status: 'confirmado' as const,
        recompensa: {
          puntos: 0,
          mensaje: 'Tu reporte sera validado por la comunidad',
        },
        mensaje: 'Denuncia registrada con validez legal (Ley 974). Los datos son inmutables en blockchain.',
        blockchain: {
          transactionHash: relayerResult.txHash,
          blockNumber: relayerResult.blockNumber,
          metadataIpfsHash,
          imageIpfsHash: ipfsHash,
          gasUsed: relayerResult.gasUsed,
          gasCost: relayerResult.gasCost,
        },
      };

    } catch (error: any) {
      logger.error({
        error: error.message,
        category: request.category,
      }, 'Report creation failed');

      throw createErrorFromException(error);
    }
  }

  async getReport(reportId: string) {
    try {
      // Buscar metadata en Pinata por keyvalue reportId
      const files = await ipfsService.findByKeyValues({ reportId, protocol: 'rikuy-v2' }, 1);

      if (files.length === 0) {
        throw new Error('Report not found');
      }

      // Descargar metadata JSON desde IPFS
      const report = await ipfsService.getJSON<ReportMetadata>(files[0].ipfsHash);
      const blockchainStatus = await this.getBlockchainStatus(reportId);

      return {
        ...report,
        status: this.mapBlockchainStatusToUserFriendly(blockchainStatus),
        blockchain: blockchainStatus,
      };
    } catch (error: any) {
      logger.error({ error: error.message, reportId }, 'Get report failed');
      throw createErrorFromException(error);
    }
  }

  async getNearbyReports(lat: number, long: number, radiusKm: number = 5) {
    this.validateLocation({ lat, long });

    // Listar reportes desde Pinata, filtrar por ubicación en memoria
    const files = await ipfsService.findByKeyValues({ protocol: 'rikuy-v2' }, 100);

    const reports: any[] = [];
    for (const file of files) {
      try {
        const report = await ipfsService.getJSON<ReportMetadata>(file.ipfsHash);
        const distance = this.haversineDistance(
          lat, long,
          report.location.approximate.lat,
          report.location.approximate.long,
        );
        if (distance <= radiusKm) {
          reports.push({
            reportId: report.reportId,
            category: report.category.name,
            description: report.evidence.description,
            location: report.location.approximate,
            timestamp: new Date(report.timestamp),
          });
        }
      } catch {
        // Skip reportes con metadata corrupta
        continue;
      }
    }

    return reports;
  }

  /**
   * Haversine formula — distancia en km entre dos coordenadas
   */
  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private validateLocation(location: { lat: number; long: number }) {
    const { latMin, latMax, longMin, longMax } = {
      latMin: -23.0,
      latMax: -9.5,
      longMin: -70.0,
      longMax: -57.0,
    };

    if (
      location.lat < latMin ||
      location.lat > latMax ||
      location.long < longMin ||
      location.long > longMax
    ) {
      throw new GeofenceError('Bolivia');
    }
  }

  private generateReportId(fileHash: string, location: { lat: number; long: number }): string {
    const combined = `${fileHash}-${location.lat}-${location.long}-${Date.now()}`;
    return crypto.createHash('sha256').update(combined).digest('hex');
  }

  private roundCoordinate(coord: number): number {
    return Math.round(coord * 100) / 100;
  }

  private generateDeviceHash(request: any): string {
    const deviceInfo = `${request.photo.size}-${Date.now()}`;
    return crypto.createHash('sha256').update(deviceInfo).digest('hex').slice(0, 16);
  }

  private getCategoryName(category: ReportCategory): string {
    const names: Record<ReportCategory, string> = {
      0: 'Infraestructura',
      1: 'Inseguridad',
      2: 'Basura',
      3: 'Corrupción',
      4: 'Otro',
    };
    return names[category] || 'Otro';
  }

  private async getBlockchainStatus(reportId: string) {
    return {
      status: 'confirmed',
      confirmations: 12,
    };
  }

  private mapBlockchainStatusToUserFriendly(blockchainStatus: any): string {
    return 'En revisión';
  }
}

export const reportService = new ReportRelayerService();
