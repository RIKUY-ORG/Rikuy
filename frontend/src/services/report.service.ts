/**
 * Servicio para crear y gestionar reportes
 */

import { SEMAPHORE_CONFIG, CATEGORIES } from '@/config/semaphore';
import { ZKProofService } from './zkproof.service';
import type { Identity } from '@semaphore-protocol/identity';
import type { ReportZKProof } from '@/types/semaphore';

export interface CreateReportData {
  photo: File;
  category: keyof typeof CATEGORIES;
  location: {
    lat: number;
    long: number;
    accuracy: number;
  };
}

export interface CreateReportResponse {
  success: boolean;
  reportId: string;
  arkivTxId: string;
  message: string;
}

export class ReportService {
  /**
   * Crear un reporte anónimo con ZK proof
   * @param identity Identidad Semaphore del usuario
   * @param reportData Datos del reporte
   * @returns Respuesta del backend con el ID del reporte
   */
  static async createReport(
    identity: Identity,
    reportData: CreateReportData
  ): Promise<CreateReportResponse> {
    try {
      // Paso 1: Subir foto y crear reporte en el backend (sin ZK proof aún)
      const formData = new FormData();
      formData.append('photo', reportData.photo);
      formData.append('category', CATEGORIES[reportData.category].toString());
      formData.append('location', JSON.stringify(reportData.location));

      // Primero creamos el reporte para obtener el arkivTxId
      const uploadResponse = await fetch(
        `${SEMAPHORE_CONFIG.BACKEND_API_URL}/api/reports/prepare`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!uploadResponse.ok) {
        const error = await uploadResponse.json();
        throw new Error(error.message || 'Failed to prepare report');
      }

      const { arkivTxId } = await uploadResponse.json();

      // Paso 2: Generar ZK proof con los datos del reporte
      const reportHash = await ZKProofService.hashReportData({
        arkivTxId,
        category: CATEGORIES[reportData.category],
        timestamp: Date.now(),
      });

      const zkProof = await ZKProofService.generateReportProof(
        identity,
        reportHash,
        'rikuy-reports-v1'
      );

      // Paso 3: Enviar el reporte completo con ZK proof al backend
      const submitResponse = await fetch(
        `${SEMAPHORE_CONFIG.BACKEND_API_URL}/api/reports`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            arkivTxId,
            category: CATEGORIES[reportData.category],
            location: reportData.location,
            zkProof: {
              proof: zkProof.proof,
              publicSignals: [
                zkProof.publicSignals.nullifier,
                zkProof.publicSignals.merkleTreeRoot,
                zkProof.publicSignals.message,
                zkProof.publicSignals.scope,
              ],
            },
          }),
        }
      );

      if (!submitResponse.ok) {
        const error = await submitResponse.json();
        throw new Error(error.message || 'Failed to submit report');
      }

      const response = await submitResponse.json();

      return {
        success: true,
        reportId: response.reportId,
        arkivTxId,
        message: 'Report created successfully',
      };
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  }

  /**
   * Obtener reportes cercanos
   * @param location Ubicación del usuario
   * @param radius Radio en metros
   * @returns Lista de reportes
   */
  static async getNearbyReports(
    location: { lat: number; long: number },
    radius: number = 1000
  ): Promise<any[]> {
    try {
      const response = await fetch(
        `${SEMAPHORE_CONFIG.BACKEND_API_URL}/api/reports/nearby?lat=${location.lat}&long=${location.long}&radius=${radius}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching nearby reports:', error);
      return [];
    }
  }

  /**
   * Validar un reporte (votar si es real o falso)
   * @param reportId ID del reporte
   * @param isValid true si el reporte es válido
   * @param userAddress Dirección del validador
   */
  static async validateReport(
    reportId: string,
    isValid: boolean,
    userAddress: string
  ): Promise<void> {
    try {
      const response = await fetch(
        `${SEMAPHORE_CONFIG.BACKEND_API_URL}/api/reports/${reportId}/validate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isValid,
            validatorAddress: userAddress,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to validate report');
      }
    } catch (error) {
      console.error('Error validating report:', error);
      throw error;
    }
  }
}
