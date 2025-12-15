/**
 * Backend Relayer Service
 *
 * Este servicio permite que el backend firme y envíe transacciones blockchain
 * en nombre del usuario. El usuario nunca necesita ETH ni saber de gas fees.
 *
 * Flujo:
 * 1. Usuario genera ZK proof en su dispositivo (privado)
 * 2. Usuario envía proof al backend via HTTP
 * 3. Backend verifica el proof y crea la TX
 * 4. Backend paga el gas → Usuario feliz, no sabe nada de crypto
 */

import { ethers } from 'ethers';
import { config } from '../config';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

// TODO: Generar este ABI después de compilar RikuyCoreV2.sol
import RikuyCoreV2ABI from '../contracts/abis/RikuyCoreV2.json';

// Types para el servicio

export interface ZKProofData {
  proof: string[]; // [8 elementos] proof Groth16 aplanado
  publicSignals: string[]; // [4 elementos] [nullifier, merkleRoot, message, scope]
}

export interface CreateReportParams {
  arkivTxId: string; // bytes32
  categoryId: number; // 0-4
  zkProof: ZKProofData;
}

export interface RelayerTxResult {
  reportId: string;
  txHash: string;
  blockNumber: number;
  gasUsed: string;
  gasCost: string; // en ETH
}

export interface RelayerBalance {
  balance: string; // en ETH
  balanceWei: bigint;
  isLow: boolean; // < 0.01 ETH
  isCritical: boolean; // < 0.001 ETH
}

/**
 * Servicio principal del relayer
 * Maneja toda la lógica de firmar y enviar transacciones por el usuario
 */
export class BlockchainRelayerService {
  private provider: ethers.JsonRpcProvider;
  private relayerWallet: ethers.Wallet;
  private rikuyCore: ethers.Contract;

  // Umbrales para monitoreo de balance
  // Si baja de esto, empezamos a preocuparnos
  private readonly MIN_BALANCE = ethers.parseEther('0.01'); // 0.01 ETH
  private readonly CRITICAL_BALANCE = ethers.parseEther('0.001'); // 0.001 ETH

  constructor() {
    // Inicializar provider
    this.provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);

    // Inicializar relayer wallet (backend wallet que paga gas)
    this.relayerWallet = new ethers.Wallet(
      config.blockchain.relayerPrivateKey,
      this.provider
    );

    // Inicializar contrato RikuyCoreV2
    this.rikuyCore = new ethers.Contract(
      config.blockchain.contracts.rikuyCoreV2,
      RikuyCoreV2ABI,
      this.relayerWallet // Conectado con wallet que firma
    );

    logger.info({
      relayerAddress: this.relayerWallet.address,
      chainId: config.blockchain.chainId,
    }, '[Relayer] Service initialized');

    // Verificar balance al iniciar para saber si estamos bien de fondos
    this.checkBalance().catch(err => {
      logger.error({ error: err }, '[Relayer] Error checking initial balance');
    });
  }

  /**
   * Método principal: Crear reporte en blockchain
   *
   * Aquí es donde pasa la magia - el usuario envió su proof,
   * nosotros verificamos todo y pagamos el gas por ellos.
   */
  async createReport(params: CreateReportParams): Promise<RelayerTxResult> {
    try {
      logger.info({
        categoryId: params.categoryId,
      }, '[Relayer] Creating report on-chain');

      // Verificar balance antes de enviar TX
      await this.ensureSufficientBalance();

      // Convertir arkivTxId a bytes32
      const arkivTxIdBytes32 = ethers.encodeBytes32String(
        params.arkivTxId.slice(0, 31) // Max 31 chars
      );

      // Formatear proof y public signals
      const zkProof = params.zkProof.proof.map(p => BigInt(p));
      const pubSignals = params.zkProof.publicSignals.map(s => BigInt(s));

      // Estimar gas
      const gasEstimate = await this.rikuyCore.createReport.estimateGas(
        arkivTxIdBytes32,
        params.categoryId,
        zkProof,
        pubSignals
      );

      // Agregar 20% buffer al gas
      const gasLimit = gasEstimate * BigInt(120) / BigInt(100);

      logger.debug({
        estimated: gasEstimate.toString(),
        withBuffer: gasLimit.toString(),
      }, '[Relayer] Gas estimate');

      // Enviar transacción (backend firma y paga gas)
      const tx = await this.rikuyCore.createReport(
        arkivTxIdBytes32,
        params.categoryId,
        zkProof,
        pubSignals,
        {
          gasLimit,
          // Scroll suele tener gas price automático, pero podemos especificarlo
          // maxFeePerGas: await this.getRecommendedGasPrice(),
        }
      );

      logger.info({
        txHash: tx.hash,
        nonce: tx.nonce,
      }, '[Relayer] Transaction sent');

      // Esperar confirmación
      const receipt = await tx.wait();

      if (!receipt || receipt.status !== 1) {
        throw new Error('Transaction failed or not mined');
      }

      // Extraer reportId del evento
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = this.rikuyCore.interface.parseLog(log);
          return parsed?.name === 'ReportCreated';
        } catch {
          return false;
        }
      });

      if (!event) {
        throw new Error('ReportCreated event not found');
      }

      const parsedEvent = this.rikuyCore.interface.parseLog(event);
      const reportId = parsedEvent?.args?.reportId;

      // Calcular costo de gas
      const gasUsed = receipt.gasUsed;
      const gasPrice = receipt.gasPrice || BigInt(0);
      const gasCost = gasUsed * gasPrice;
      const gasCostEth = ethers.formatEther(gasCost);

      logger.info({
        reportId,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: gasUsed.toString(),
        gasCost: gasCostEth + ' ETH',
      }, '[Relayer] Transaction confirmed');

      // Monitorear balance después de TX
      this.checkBalance().catch(err => {
        logger.error({ error: err }, '[Relayer] Error checking balance after TX');
      });

      return {
        reportId: reportId.toString(),
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: gasUsed.toString(),
        gasCost: gasCostEth,
      };

    } catch (error: any) {
      logger.error({
        error: error.message,
        code: error.code,
      }, '[Relayer] Error creating report');

      // Errores específicos
      if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new AppError(
          'RELAYER_INSUFFICIENT_FUNDS',
          'Backend wallet has insufficient funds. Please contact support.',
          503
        );
      }

      if (error.message?.includes('Invalid ZK proof')) {
        throw new AppError(
          'INVALID_ZK_PROOF',
          'Zero-knowledge proof verification failed',
          400
        );
      }

      throw new AppError(
        'BLOCKCHAIN_TX_FAILED',
        'Failed to create report on blockchain',
        500
      );
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // BALANCE MONITORING
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Verifica el balance del relayer wallet
   */
  async checkBalance(): Promise<RelayerBalance> {
    try {
      const balanceWei = await this.provider.getBalance(this.relayerWallet.address);
      const balanceEth = ethers.formatEther(balanceWei);

      const isLow = balanceWei < this.MIN_BALANCE;
      const isCritical = balanceWei < this.CRITICAL_BALANCE;

      logger.info({
        address: this.relayerWallet.address,
        balance: balanceEth + ' ETH',
        isLow,
        isCritical,
      }, '[Relayer] Balance check');

      // Alertas
      if (isCritical) {
        logger.error({
          balance: balanceEth,
          threshold: ethers.formatEther(this.CRITICAL_BALANCE),
        }, '[Relayer] 🚨 CRITICAL: Balance critically low!');
        // TODO: Enviar alerta (email, Slack, etc)
      } else if (isLow) {
        logger.warn({
          balance: balanceEth,
          threshold: ethers.formatEther(this.MIN_BALANCE),
        }, '[Relayer] ⚠️  Balance is low');
        // TODO: Enviar notificación
      }

      return {
        balance: balanceEth,
        balanceWei,
        isLow,
        isCritical,
      };

    } catch (error) {
      logger.error({ error }, '[Relayer] Error checking balance');
      throw error;
    }
  }

  /**
   * Verifica que hay suficiente balance antes de enviar TX
   */
  private async ensureSufficientBalance(): Promise<void> {
    const { isCritical, balance } = await this.checkBalance();

    if (isCritical) {
      throw new AppError(
        'RELAYER_INSUFFICIENT_FUNDS',
        `Backend wallet balance critically low (${balance} ETH). Service temporarily unavailable.`,
        503
      );
    }
  }

  /**
   * Obtiene gas price recomendado (con buffer)
   */
  private async getRecommendedGasPrice(): Promise<bigint> {
    const feeData = await this.provider.getFeeData();
    const gasPrice = feeData.gasPrice || BigInt(0);

    // Agregar 10% buffer
    return gasPrice * BigInt(110) / BigInt(100);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // UTILITY METHODS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Obtiene información del relayer
   */
  getRelayerInfo(): {
    address: string;
    chainId: number;
    networkName: string;
  } {
    return {
      address: this.relayerWallet.address,
      chainId: config.blockchain.chainId,
      networkName: config.blockchain.networkName,
    };
  }

  /**
   * Verifica si una transacción está confirmada
   */
  async isTransactionConfirmed(txHash: string): Promise<boolean> {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      return receipt !== null && receipt.status === 1;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene el costo estimado de crear un reporte
   */
  async estimateReportCost(): Promise<{ gasEstimate: string; costEth: string }> {
    try {
      // Mock data para estimación
      const mockArkivId = ethers.encodeBytes32String('mock');
      const mockProof = Array(8).fill(BigInt(0));
      const mockSignals = Array(4).fill(BigInt(0));

      const gasEstimate = await this.rikuyCore.createReport.estimateGas(
        mockArkivId,
        0,
        mockProof,
        mockSignals
      );

      const feeData = await this.provider.getFeeData();
      const gasPrice = feeData.gasPrice || BigInt(0);

      const costWei = gasEstimate * gasPrice;
      const costEth = ethers.formatEther(costWei);

      return {
        gasEstimate: gasEstimate.toString(),
        costEth,
      };

    } catch (error) {
      logger.error({ error }, '[Relayer] Error estimating cost');
      throw error;
    }
  }
}

// Singleton export
export const relayerService = new BlockchainRelayerService();
