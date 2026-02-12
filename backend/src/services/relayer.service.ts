/**
 * Backend Relayer Service
 *
 * Este servicio permite que el backend firme y envíe transacciones blockchain
 * en nombre del usuario. El usuario nunca necesita ETH ni saber de gas fees.
 *
 * Flujo (Stylus v2):
 * 1. Usuario sube foto + ubicación al backend
 * 2. Backend genera commitment anónimo: keccak256(wallet + salt + nonce)
 * 3. Backend envía TX via Relayer → RikuyCoreV2.createReport()
 * 4. RikuyCoreV2 delega al contrato Stylus (AnonymousReport) para storage
 * 5. Backend paga el gas → Usuario no paga nada
 */

import { ethers } from 'ethers';
import { config } from '../config';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';
import crypto from 'crypto';

// TODO: Generar este ABI después de compilar RikuyCoreV2.sol
import RikuyCoreV2ABI from '../contracts/abis/RikuyCoreV2.json';

// ─────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────

export interface CreateReportParams {
  contentHash: string;     // bytes32 — hash de la evidencia (foto + descripción)
  categoryId: number;      // 0-4
  commitment: string;      // bytes32 — identidad anónima del reporter
  nullifier: string;       // bytes32 — previene doble-denuncia por sesión
  latitude: number;        // int64 — latitud * 1_000_000
  longitude: number;       // int64 — longitud * 1_000_000
  aiValidated: boolean;    // Si la AI validó el contenido
}

export interface RegisterCitizenParams {
  commitment: string;      // bytes32 — commitment anónimo del ciudadano
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
  isLow: boolean;      // < 0.01 ETH
  isCritical: boolean;  // < 0.001 ETH
}

// Salt secreto del backend para generar commitments anónimos
// En producción esto debe ser un secret rotado y almacenado seguro
const COMMITMENT_SALT = process.env.COMMITMENT_SALT || crypto.randomBytes(32).toString('hex');

/**
 * Servicio principal del relayer
 * Maneja toda la lógica de firmar y enviar transacciones por el usuario
 */
export class BlockchainRelayerService {
  private provider: ethers.JsonRpcProvider;
  private relayerWallet: ethers.Wallet;
  private rikuyCore: ethers.Contract;

  private readonly MIN_BALANCE = ethers.parseEther('0.01');
  private readonly CRITICAL_BALANCE = ethers.parseEther('0.001');

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);

    this.relayerWallet = new ethers.Wallet(
      config.blockchain.relayerPrivateKey,
      this.provider
    );

    this.rikuyCore = new ethers.Contract(
      config.blockchain.contracts.rikuyCoreV2,
      RikuyCoreV2ABI.abi,
      this.relayerWallet
    );

    logger.info({
      relayerAddress: this.relayerWallet.address,
      chainId: config.blockchain.chainId,
    }, '[Relayer] Service initialized');

    this.checkBalance().catch(err => {
      logger.error({ error: err }, '[Relayer] Error checking initial balance');
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // ANONYMITY: Commitment generation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Generar commitment anónimo para un usuario
   * commitment = keccak256(wallet + salt + nonce)
   * El salt es secreto del backend → el commitment no revela identidad
   */
  generateCommitment(walletAddress: string, nonce: number): string {
    const packed = ethers.solidityPacked(
      ['address', 'bytes32', 'uint256'],
      [walletAddress, '0x' + COMMITMENT_SALT, nonce]
    );
    return ethers.keccak256(packed);
  }

  /**
   * Generar nullifier único para una sesión de denuncia
   * nullifier = keccak256(commitment + sessionData + timestamp)
   */
  generateNullifier(commitment: string, sessionData: string): string {
    const packed = ethers.solidityPacked(
      ['bytes32', 'string', 'uint256'],
      [commitment, sessionData, Date.now()]
    );
    return ethers.keccak256(packed);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TRANSACTIONS
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Registrar ciudadano verificado (post Reclaim Protocol)
   * Llama a RikuyCoreV2.registerCitizen(commitment)
   */
  async registerCitizen(params: RegisterCitizenParams): Promise<{ txHash: string }> {
    try {
      logger.info('[Relayer] Registering citizen commitment');

      await this.ensureSufficientBalance();

      const tx = await this.rikuyCore.registerCitizen(params.commitment);
      const receipt = await tx.wait();

      if (!receipt || receipt.status !== 1) {
        throw new Error('registerCitizen transaction failed');
      }

      logger.info({ txHash: receipt.hash }, '[Relayer] Citizen registered');
      return { txHash: receipt.hash };
    } catch (error: any) {
      logger.error({ error: error.message }, '[Relayer] Error registering citizen');
      throw new AppError('REGISTER_CITIZEN_FAILED', 'Failed to register citizen', 500);
    }
  }

  /**
   * Crear reporte anónimo en blockchain via RikuyCoreV2.createReport()
   *
   * La nueva firma del contrato:
   * createReport(contentHash, categoryId, commitment, nullifier, latitude, longitude, aiValidated)
   */
  async createReport(params: CreateReportParams): Promise<RelayerTxResult> {
    try {
      logger.info({
        categoryId: params.categoryId,
      }, '[Relayer] Creating report on-chain');

      await this.ensureSufficientBalance();

      // Estimar gas
      const gasEstimate = await this.rikuyCore.createReport.estimateGas(
        params.contentHash,
        params.categoryId,
        params.commitment,
        params.nullifier,
        params.latitude,
        params.longitude,
        params.aiValidated
      );

      const gasLimit = gasEstimate * BigInt(120) / BigInt(100);

      logger.debug({
        estimated: gasEstimate.toString(),
        withBuffer: gasLimit.toString(),
      }, '[Relayer] Gas estimate');

      // Enviar transacción
      const tx = await this.rikuyCore.createReport(
        params.contentHash,
        params.categoryId,
        params.commitment,
        params.nullifier,
        params.latitude,
        params.longitude,
        params.aiValidated,
        { gasLimit }
      );

      logger.info({
        txHash: tx.hash,
        nonce: tx.nonce,
      }, '[Relayer] Transaction sent');

      const receipt = await tx.wait();

      if (!receipt || receipt.status !== 1) {
        throw new Error('Transaction failed or not mined');
      }

      // Extraer reportId del evento ReportCreated
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

      if (error.code === 'INSUFFICIENT_FUNDS') {
        throw new AppError(
          'RELAYER_INSUFFICIENT_FUNDS',
          'Backend wallet has insufficient funds. Please contact support.',
          503
        );
      }

      if (error.message?.includes('NullifierAlreadyUsed')) {
        throw new AppError(
          'NULLIFIER_ALREADY_USED',
          'This report session has already been submitted',
          400
        );
      }

      if (error.message?.includes('OutOfBoundsLocation')) {
        throw new AppError(
          'INVALID_LOCATION',
          'Location is outside of Bolivia boundaries',
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

      if (isCritical) {
        logger.error({
          balance: balanceEth,
          threshold: ethers.formatEther(this.CRITICAL_BALANCE),
        }, '[Relayer] CRITICAL: Balance critically low!');
      } else if (isLow) {
        logger.warn({
          balance: balanceEth,
          threshold: ethers.formatEther(this.MIN_BALANCE),
        }, '[Relayer] Balance is low');
      }

      return { balance: balanceEth, balanceWei, isLow, isCritical };
    } catch (error) {
      logger.error({ error }, '[Relayer] Error checking balance');
      throw error;
    }
  }

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

  // ─────────────────────────────────────────────────────────────────────────
  // UTILITY
  // ─────────────────────────────────────────────────────────────────────────

  getRelayerInfo(): { address: string; chainId: number; networkName: string } {
    return {
      address: this.relayerWallet.address,
      chainId: config.blockchain.chainId,
      networkName: config.blockchain.networkName,
    };
  }

  async isTransactionConfirmed(txHash: string): Promise<boolean> {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      return receipt !== null && receipt.status === 1;
    } catch {
      return false;
    }
  }
}

// Singleton export
export const relayerService = new BlockchainRelayerService();
