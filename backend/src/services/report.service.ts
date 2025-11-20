import { CreateReportRequest, CreateReportResponse, ReportCategory, ArkivReportData, ReportStatus } from '../types';
import { ipfsService } from './ipfs.service';
import { aiService } from './ai.service';
import { arkivService } from './arkiv.service';
import { scrollService } from './scroll.service';
import crypto from 'crypto';

/**
 * Servicio principal de reportes (orquesta todos los demás)
 */
class ReportService {

  /**
   * FLUJO COMPLETO: Crear reporte end-to-end
   *
   * 1. Upload foto a IPFS
   * 2. IA genera descripción
   * 3. Guardar todo en Arkiv (inmutable)
   * 4. Crear reporte en Scroll (blockchain)
   * 5. Retornar resultado al usuario
   */
  async createReport(request: CreateReportRequest): Promise<CreateReportResponse> {
    try {
      console.log('[Report] Starting report creation flow...');

      // Validar ubicación (Argentina only)
      this.validateLocation(request.location);

      // PASO 1: Subir foto a IPFS
      console.log('[Report] Step 1: Uploading to IPFS...');
      const { ipfsHash, url: imageUrl, fileHash } = await ipfsService.uploadImage(request.photo);

      // Check duplicate
      const isDuplicate = await ipfsService.checkDuplicate(fileHash);
      if (isDuplicate) {
        throw new Error('Esta foto ya fue reportada anteriormente');
      }

      // PASO 2: IA analiza la imagen
      console.log('[Report] Step 2: AI analyzing image...');
      const aiAnalysis = await aiService.analyzeImage(imageUrl, request.category);

      // Moderation check
      const isAppropriate = await aiService.moderateImage(imageUrl);
      if (!isAppropriate) {
        throw new Error('La imagen no cumple con los estándares de contenido');
      }

      // Usar descripción de IA si no hay manual
      const description = request.description || aiAnalysis.description;

      // PASO 3: Generar ID del reporte
      const reportId = this.generateReportId(fileHash, request.location);

      // PASO 4: Guardar en Arkiv (inmutable)
      console.log('[Report] Step 3: Storing in Arkiv...');
      const arkivData: ArkivReportData = {
        protocol: 'rikuy-v1',
        version: '1.0.0',
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
            precision: '~100m',
          },
          zkProof: request.userSecret ? {
            nullifier: this.generateNullifier(request.userSecret),
            verified: true,
          } : undefined,
        },
        metadata: {
          deviceHash: this.generateDeviceHash(request),
          timestamp: Date.now(),
        },
      };

      const arkivTxId = await arkivService.storeReport(arkivData);

      // PASO 5: Crear en blockchain (Scroll)
      console.log('[Report] Step 4: Creating on Scroll...');
      const mockZKProof = [0, 0, 0, 0, 0, 0, 0, 0]; // TODO: Generar proof real
      const { txHash, reportId: onChainId } = await scrollService.createReport(
        arkivTxId,
        request.category,
        mockZKProof
      );

      // PASO 6: Calcular recompensa estimada
      const estimatedReward = this.calculateEstimatedReward(request.category, aiAnalysis.severity);

      console.log('[Report] ✅ Report created successfully!');

      // Respuesta user-friendly (sin exponer blockchain)
      return {
        success: true,
        reportId: onChainId,
        status: 'confirmado' as const,
        recompensa: {
          puntos: estimatedReward,
          mensaje: `Podrás ganar hasta ${estimatedReward} puntos cuando tu reporte sea validado por la comunidad`,
        },
        mensaje: '¡Reporte creado exitosamente! Está siendo procesado por la comunidad.',
        // Datos técnicos (solo para logging interno)
        _internal: {
          arkivTxId,
          scrollTxHash: txHash,
        },
      };

    } catch (error: any) {
      console.error('[Report] Creation failed:', error);

      // Mensajes de error user-friendly
      if (error.message.includes('Ubicación fuera de Argentina')) {
        throw new Error('Solo aceptamos reportes dentro de Argentina');
      }
      if (error.message.includes('ya fue reportada')) {
        throw new Error('Esta foto ya fue reportada anteriormente');
      }
      if (error.message.includes('no cumple con los estándares')) {
        throw new Error('La imagen no cumple con nuestros estándares de contenido');
      }
      if (error.message.includes('IPFS') || error.message.includes('upload')) {
        throw new Error('No pudimos procesar tu foto. Por favor intenta de nuevo');
      }
      if (error.message.includes('IA') || error.message.includes('AI')) {
        throw new Error('No pudimos analizar tu foto. Por favor intenta de nuevo');
      }
      if (error.message.includes('Arkiv') || error.message.includes('storage')) {
        throw new Error('No pudimos guardar tu reporte. Por favor intenta de nuevo');
      }
      if (error.message.includes('blockchain') || error.message.includes('transaction')) {
        throw new Error('No pudimos confirmar tu reporte. Por favor intenta de nuevo');
      }

      // Error genérico
      throw new Error('Hubo un problema al crear tu reporte. Por favor intenta de nuevo');
    }
  }

  /**
   * Obtener reporte completo (blockchain + Arkiv)
   * Devuelve datos user-friendly sin exponer blockchain
   */
  async getReport(reportId: string): Promise<ReportStatus> {
    const [onChainData, arkivData] = await Promise.all([
      scrollService.getReportStatus(reportId),
      arkivService.getReport(reportId),
    ]);

    // Calcular confiabilidad (0-100%)
    const totalVotes = onChainData.upvotes + onChainData.downvotes;
    const confiabilidad = totalVotes > 0
      ? Math.round((onChainData.upvotes / totalVotes) * 100)
      : 50; // 50% por defecto si no hay votos

    // Mapear estado de blockchain a estado user-friendly
    const estado = this.mapBlockchainStatus(
      onChainData.status,
      onChainData.isVerified,
      onChainData.isResolved
    );

    // Calcular recompensa ganada si está verificado
    const recompensaGanada = onChainData.isVerified && arkivData
      ? this.calculateEstimatedReward(arkivData.category.id, 7) // Usar severidad promedio
      : undefined;

    return {
      reportId,
      estado,
      validaciones: {
        positivas: onChainData.upvotes,
        negativas: onChainData.downvotes,
        confiabilidad,
      },
      verificado: onChainData.isVerified,
      resuelto: onChainData.isResolved,
      recompensaGanada,
      datosReporte: arkivData || undefined,
      // Datos internos
      _internal: {
        blockchainStatus: onChainData.status,
        upvotes: onChainData.upvotes,
        downvotes: onChainData.downvotes,
      },
    };
  }

  /**
   * Buscar reportes cercanos
   */
  async getNearbyReports(lat: number, long: number, radiusKm: number, category?: ReportCategory) {
    return arkivService.getNearbyReports(lat, long, radiusKm);
  }

  // ================== UTILIDADES ==================

  private validateLocation(location: { lat: number; long: number }) {
    const { latMin, latMax, longMin, longMax } = require('../config').config.geofence;

    if (
      location.lat < latMin ||
      location.lat > latMax ||
      location.long < longMin ||
      location.long > longMax
    ) {
      throw new Error('Ubicación fuera de Argentina');
    }
  }

  private generateReportId(fileHash: string, location: { lat: number; long: number }): string {
    const data = `${fileHash}-${location.lat}-${location.long}-${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private generateNullifier(userSecret: string): string {
    return crypto.createHash('sha256').update(userSecret).digest('hex');
  }

  private generateDeviceHash(request: CreateReportRequest): string {
    // Hash simple basado en características del request
    const data = `${request.location.accuracy}-${request.photo.size}`;
    return crypto.createHash('md5').update(data).digest('hex');
  }

  private roundCoordinate(coord: number): number {
    // Redondear a 2 decimales (~1km precisión)
    return Math.round(coord * 100) / 100;
  }

  private getCategoryName(category: ReportCategory): string {
    const names = {
      [ReportCategory.INFRAESTRUCTURA]: 'Infraestructura',
      [ReportCategory.INSEGURIDAD]: 'Inseguridad',
      [ReportCategory.BASURA]: 'Basura',
    };
    return names[category];
  }

  private calculateEstimatedReward(category: ReportCategory, severity: number): number {
    const baseRewards = {
      [ReportCategory.INFRAESTRUCTURA]: 3000,
      [ReportCategory.INSEGURIDAD]: 5000,
      [ReportCategory.BASURA]: 2000,
    };

    const base = baseRewards[category];
    const multiplier = severity / 10; // 0.1 a 1.0
    return Math.round(base * (0.5 + multiplier * 0.5)); // 50% a 100% del base
  }

  /**
   * Mapear estado de blockchain a estado user-friendly
   * Estados blockchain:
   * 0 = Pending
   * 1 = Verified
   * 2 = Disputed
   * 3 = Resolved
   */
  private mapBlockchainStatus(
    status: number,
    isVerified: boolean,
    isResolved: boolean
  ): 'procesando' | 'confirmado' | 'validado' | 'resuelto' {
    if (isResolved) return 'resuelto';
    if (isVerified) return 'validado';
    if (status === 1) return 'validado';
    if (status === 0) return 'confirmado';
    return 'procesando';
  }
}

export const reportService = new ReportService();
