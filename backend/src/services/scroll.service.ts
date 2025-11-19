import { ethers } from 'ethers';
import { config } from '../config';

// ABI simplificado (solo las funciones que usamos)
const RIKUY_ABI = [
  'function createReport(bytes32 _arkivTxId, uint16 _categoryId, uint256[8] calldata _zkProof) external returns (bytes32 reportId)',
  'function validateReport(bytes32 _reportId, bool _isValid) external',
  'function getReportStatus(bytes32 _reportId) external view returns (uint8 status, uint256 upvotes, uint256 downvotes, bool isVerified, bool isResolved)',
  'event ReportCreated(bytes32 indexed reportId, bytes32 indexed nullifier, bytes32 arkivTxId, uint16 category, uint256 timestamp)',
];

/**
 * Servicio para interactuar con smart contracts en Scroll
 */
class ScrollService {
  private provider: ethers.Provider;
  private wallet: ethers.Wallet;
  private contract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.scroll.rpcUrl);
    this.wallet = new ethers.Wallet(config.arkiv.privateKey, this.provider);
    this.contract = new ethers.Contract(
      config.scroll.contractAddress,
      RIKUY_ABI,
      this.wallet
    );
  }

  /**
   * Crear reporte en blockchain
   */
  async createReport(
    arkivTxId: string,
    categoryId: number,
    zkProof: number[]
  ): Promise<{
    txHash: string;
    reportId: string;
  }> {
    try {
      console.log(`[Scroll] Creating report on-chain...`);

      // Convertir arkivTxId a bytes32
      const arkivTxIdBytes = ethers.id(arkivTxId); // keccak256

      // Mock ZK proof (8 elementos)
      // En producción, esto viene del ZK prover
      const mockProof = zkProof.length === 8 ? zkProof : [0, 0, 0, 0, 0, 0, 0, 0];

      // Estimar gas primero
      const gasEstimate = await this.contract.createReport.estimateGas(
        arkivTxIdBytes,
        categoryId,
        mockProof
      );

      console.log(`[Scroll] Gas estimate: ${gasEstimate.toString()}`);

      // Enviar transacción
      const tx = await this.contract.createReport(
        arkivTxIdBytes,
        categoryId,
        mockProof,
        {
          gasLimit: (gasEstimate * 120n) / 100n, // +20% buffer
        }
      );

      console.log(`[Scroll] TX sent: ${tx.hash}`);

      // Esperar confirmación
      const receipt = await tx.wait();

      // Extraer reportId del evento
      const event = receipt.logs
        .map((log: any) => {
          try {
            return this.contract.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((e: any) => e?.name === 'ReportCreated');

      const reportId = event?.args?.reportId || ethers.id(`report-${Date.now()}`);

      console.log(`[Scroll] Report created: ${reportId}`);

      return {
        txHash: receipt.hash,
        reportId,
      };

    } catch (error: any) {
      console.error('[Scroll] Create report failed:', error);
      throw new Error(`Blockchain transaction failed: ${error.message}`);
    }
  }

  /**
   * Validar reporte (upvote/downvote)
   */
  async validateReport(reportId: string, isValid: boolean): Promise<string> {
    try {
      console.log(`[Scroll] Validating report ${reportId}: ${isValid}`);

      const reportIdBytes = ethers.id(reportId);

      const tx = await this.contract.validateReport(reportIdBytes, isValid);
      const receipt = await tx.wait();

      console.log(`[Scroll] Validation TX: ${receipt.hash}`);

      return receipt.hash;

    } catch (error: any) {
      console.error('[Scroll] Validation failed:', error);
      throw new Error(`Validation failed: ${error.message}`);
    }
  }

  /**
   * Obtener estado de reporte
   */
  async getReportStatus(reportId: string): Promise<{
    status: number;
    upvotes: number;
    downvotes: number;
    isVerified: boolean;
    isResolved: boolean;
  }> {
    try {
      const reportIdBytes = ethers.id(reportId);

      const result = await this.contract.getReportStatus(reportIdBytes);

      return {
        status: Number(result[0]),
        upvotes: Number(result[1]),
        downvotes: Number(result[2]),
        isVerified: result[3],
        isResolved: result[4],
      };

    } catch (error) {
      console.error('[Scroll] Get status failed:', error);
      throw new Error('Failed to fetch report status');
    }
  }

  /**
   * Obtener balance del wallet
   */
  async getBalance(): Promise<string> {
    const balance = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(balance);
  }
}

export const scrollService = new ScrollService();
