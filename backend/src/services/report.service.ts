import { CreateReportRequest, CreateReportResponse, ReportCategory, ArkivReportData } from '../types';
import { ipfsService } from './ipfs.service';
import { aiService } from './ai.service';
import { arkivService } from './arkiv.service';
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

  /**
   * Crear denuncia anónima — flujo completo:
   * 1. Upload foto a IPFS
   * 2. AI analiza imagen
   * 3. Almacenar metadata en Arkiv
   * 4. Generar commitment anónimo + nullifier
   * 5. Enviar TX a blockchain via Relayer
   */
  async createReport(request: CreateReportRequest): Promise<CreateReportResponse> {
    const startTime = Date.now();

    try {
      logger.info('Starting report creation with relayer');

      this.validateLocation(request.location);

      logger.info('Step 1: Uploading image to IPFS');
      const { ipfsHash, url: imageUrl, fileHash } = await ipfsService.uploadImage(request.photo);

      const isDuplicate = await ipfsService.checkDuplicate(fileHash);
      if (isDuplicate) {
        throw new DuplicateImageError();
      }

      logger.info('Step 2: AI analyzing image');
      const aiAnalysis = await aiService.analyzeImage(imageUrl, request.category);

      const isAppropriate = await aiService.moderateImage(imageUrl);
      if (!isAppropriate) {
        throw new ContentModerationError();
      }

      const description = request.description || aiAnalysis.description;

      const reportId = this.generateReportId(fileHash, request.location);

      logger.info('Step 3: Storing metadata in Arkiv');
      const arkivData: ArkivReportData = {
        protocol: 'rikuy-v1',
        version: '2.0.0',
        timestamp: Date.now(),
        reportId,
        category: {
          id: request.category,
          name: this.getCategoryName(request.category),
        },
        evidence: {
          imageIPFS: ipfsHash,
          imageHash: fileHash,
          description,
          aiGenerated: !request.description,
          aiTags: aiAnalysis.tags,
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

      const arkivTxId = await arkivService.storeReport(arkivData);

      logger.info('Step 4: Generating anonymous commitment');
      // El wallet address viene del header x-user-address (set by Privy)
      const walletAddress = (request as any).walletAddress || ethers.ZeroAddress;
      const nonce = Date.now();
      const commitment = relayerService.generateCommitment(walletAddress, nonce);
      const nullifier = relayerService.generateNullifier(commitment, fileHash);

      // Generar contentHash: hash de la evidencia completa
      const contentHash = ethers.keccak256(
        ethers.toUtf8Bytes(JSON.stringify({
          ipfsHash,
          fileHash,
          description,
          category: request.category,
        }))
      );

      // Coordenadas multiplicadas por 1_000_000 para precisión entera
      const latitude = Math.round(request.location.lat * 1_000_000);
      const longitude = Math.round(request.location.long * 1_000_000);

      logger.info('Step 5: Creating report on blockchain via Relayer');
      const relayerResult = await relayerService.createReport({
        contentHash,
        categoryId: request.category,
        commitment,
        nullifier,
        latitude,
        longitude,
        aiValidated: aiAnalysis.severity > 0,
      });

      const duration = Date.now() - startTime;
      logger.info({
        reportId: relayerResult.reportId,
        txHash: relayerResult.txHash,
        gasCost: relayerResult.gasCost,
        duration,
      }, 'Report created successfully via relayer');

      return {
        success: true,
        reportId: relayerResult.reportId,
        status: 'confirmado' as const,
        recompensa: {
          puntos: 0,
          mensaje: 'Tu reporte será validado por la comunidad',
        },
        mensaje: '¡Reporte creado exitosamente! Está siendo procesado por la comunidad.',
        _internal: {
          arkivTxId,
          txHash: relayerResult.txHash,
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
      const report = await arkivService.getReport(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

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

    const reports = await arkivService.getNearbyReports(lat, long, radiusKm);

    return reports.map(report => ({
      reportId: report.reportId,
      category: report.category.name,
      description: report.evidence.description,
      location: report.location.approximate,
      timestamp: new Date(report.timestamp),
    }));
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
