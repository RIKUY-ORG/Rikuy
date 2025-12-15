import { CreateReportRequest, CreateReportResponse, ReportCategory, ArkivReportData } from '../types';
import { ipfsService } from './ipfs.service';
import { aiService } from './ai.service';
import { arkivService } from './arkiv.service';
import { relayerService } from './relayer.service';
import { semaphoreService } from './semaphore.service';
import { getServiceLogger } from '../utils/logger';
import {
  GeofenceError,
  DuplicateImageError,
  ContentModerationError,
  createErrorFromException,
} from '../utils/errors';
import crypto from 'crypto';

const logger = getServiceLogger('ReportRelayerService');

interface CreateReportWithProofRequest extends CreateReportRequest {
  zkProof: {
    proof: string[];
    publicSignals: string[];
  };
}

class ReportRelayerService {

  async createReport(request: CreateReportWithProofRequest): Promise<CreateReportResponse> {
    const startTime = Date.now();

    try {
      logger.info('Starting report creation with relayer');

      logger.info('Step 0: Verifying ZK proof');
      const proofResult = await semaphoreService.verifyProof(request.zkProof);

      if (!proofResult.isValid) {
        throw new Error(`Invalid ZK proof: ${proofResult.error}`);
      }

      const nullifierUsed = await semaphoreService.isNullifierUsed(proofResult.nullifier!);
      if (nullifierUsed) {
        throw new Error('This proof has already been used');
      }

      logger.info({ nullifier: proofResult.nullifier }, 'ZK proof verified successfully');

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

      logger.info('Step 3: Storing in Arkiv');
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
          zkProof: {
            nullifier: request.zkProof.publicSignals[0],
            verified: true,
          },
        },
        metadata: {
          deviceHash: this.generateDeviceHash(request),
          timestamp: Date.now(),
        },
      };

      const arkivTxId = await arkivService.storeReport(arkivData);

      logger.info('Step 4: Creating on blockchain via Relayer');
      const relayerResult = await relayerService.createReport({
        arkivTxId,
        categoryId: request.category,
        zkProof: request.zkProof,
      });

      const estimatedReward = this.calculateEstimatedReward(request.category, aiAnalysis.severity);

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
          puntos: estimatedReward,
          mensaje: `Podrás ganar hasta ${estimatedReward} puntos cuando tu reporte sea validado`,
        },
        mensaje: '¡Reporte creado exitosamente! Está siendo procesado por la comunidad.',
        _internal: {
          arkivTxId,
          scrollTxHash: relayerResult.txHash,
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
      latMin: -55.0,
      latMax: -21.0,
      longMin: -73.5,
      longMax: -53.0,
    };

    if (
      location.lat < latMin ||
      location.lat > latMax ||
      location.long < longMin ||
      location.long > longMax
    ) {
      throw new GeofenceError();
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

  private calculateEstimatedReward(category: ReportCategory, severity: number): number {
    const basePoints = 100;
    const categoryMultiplier = category === 3 ? 2 : 1;
    const severityBonus = severity * 10;
    return basePoints + severityBonus * categoryMultiplier;
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
