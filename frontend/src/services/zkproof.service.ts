/**
 * Servicio de generación de ZK Proofs con Semaphore Protocol
 */

import { Identity } from '@semaphore-protocol/identity';
// @ts-ignore - La generación de proofs requiere módulos WASM que TypeScript no puede inferir
import { generateProof } from '@semaphore-protocol/core';
import { SEMAPHORE_CONFIG } from '@/config/semaphore';
import type { ZKProof, ReportZKProof } from '@/types/semaphore';

export class ZKProofService {
  /**
   * Generar proof Semaphore para un reporte
   * @param identity Identidad Semaphore del usuario
   * @param reportHash Hash del reporte (mensaje a firmar)
   * @param scope Alcance del proof (ej: "rikuy-reports-2024")
   * @returns ZK Proof en formato Rikuy
   */
  static async generateReportProof(
    identity: Identity,
    reportHash: string,
    scope: string = 'rikuy-reports'
  ): Promise<ReportZKProof> {
    try {
      const groupId = SEMAPHORE_CONFIG.GROUP_ID;

      // Obtener merkle tree root del backend
      const merkleTreeRoot = await this.getMerkleTreeRoot();

      // Generar proof usando Semaphore
      // IMPORTANTE: Este paso requiere los archivos WASM y zkey del circuit
      // En producción, estos archivos deben estar en /public/semaphore/
      const fullProof = await generateProof(identity, {
        externalNullifier: scope,
        signal: reportHash,
        merkleTreeRoot,
      });

      // Convertir el proof al formato esperado por RikuyCoreV2
      const zkProof: ReportZKProof = {
        proof: this.flattenProof(fullProof.proof),
        publicSignals: {
          nullifier: fullProof.nullifier.toString(),
          merkleTreeRoot: merkleTreeRoot,
          message: reportHash,
          scope: scope,
        },
      };

      return zkProof;
    } catch (error) {
      console.error('Error generating ZK proof:', error);
      throw new Error('Failed to generate ZK proof. Please try again.');
    }
  }

  /**
   * Convertir proof Groth16 a formato plano [8 elementos]
   * @param proof Proof de Semaphore
   * @returns Array de 8 strings
   */
  private static flattenProof(proof: any): string[] {
    // Semaphore usa formato Groth16: { pi_a, pi_b, pi_c }
    // Necesitamos convertir a [pA[2], pB[4], pC[2]]
    return [
      proof.pi_a[0],
      proof.pi_a[1],
      proof.pi_b[0][0],
      proof.pi_b[0][1],
      proof.pi_b[1][0],
      proof.pi_b[1][1],
      proof.pi_c[0],
      proof.pi_c[1],
    ];
  }

  /**
   * Obtener el merkle tree root actual del grupo Semaphore
   * @returns Merkle tree root como string
   */
  private static async getMerkleTreeRoot(): Promise<string> {
    try {
      const response = await fetch(
        `${SEMAPHORE_CONFIG.BACKEND_API_URL}/api/identity/merkle-root`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch merkle tree root');
      }

      const data = await response.json();
      return data.merkleRoot;
    } catch (error) {
      console.error('Error fetching merkle tree root:', error);
      // En desarrollo, podemos usar un root dummy
      // En producción, esto debe fallar
      if (import.meta.env.DEV) {
        console.warn('Using dummy merkle root for development');
        return '0';
      }
      throw error;
    }
  }

  /**
   * Calcular hash de un reporte para usar como mensaje
   * @param reportData Datos del reporte
   * @returns Hash del reporte
   */
  static async hashReportData(reportData: {
    arkivTxId: string;
    category: number;
    timestamp: number;
  }): Promise<string> {
    // Crear un string determinístico con los datos del reporte
    const dataString = JSON.stringify({
      arkivTxId: reportData.arkivTxId,
      category: reportData.category,
      timestamp: reportData.timestamp,
    });

    // Calcular hash usando Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(dataString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return '0x' + hashHex;
  }

  /**
   * Verificar si un usuario tiene una identidad Semaphore válida
   * @param commitment Commitment de la identidad
   * @returns true si el commitment está en el grupo
   */
  static async verifyMembership(commitment: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${SEMAPHORE_CONFIG.BACKEND_API_URL}/api/identity/verify-membership`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ commitment }),
        }
      );

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.isMember;
    } catch (error) {
      console.error('Error verifying membership:', error);
      return false;
    }
  }
}
