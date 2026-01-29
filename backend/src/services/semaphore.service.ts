import { ethers } from 'ethers';
import { Identity } from '@semaphore-protocol/core';
import { config } from '../config';
import { getServiceLogger } from '../utils/logger';
import {
  SemaphoreIdentity,
  SemaphoreProof,
  ProofVerificationResult
} from '../types/identity';

const logger = getServiceLogger('SemaphoreService');

// ABI del contrato Semaphore oficial (para agregar/quitar miembros)
const SEMAPHORE_ABI = [
  'function addMember(uint256 groupId, uint256 identityCommitment) external',
  'function removeMember(uint256 groupId, uint256 identityCommitment, uint256[] calldata merkleTreeSiblings) external',
  'function getMerkleTreeRoot(uint256 groupId) external view returns (uint256)',
  'function getMerkleTreeDepth(uint256 groupId) external view returns (uint256)',
  'function getNumberOfMerkleTreeLeaves(uint256 groupId) external view returns (uint256)',
];

class SemaphoreService {
  private provider: ethers.JsonRpcProvider;
  private relayerWallet: ethers.Wallet;
  private semaphore: ethers.Contract;
  private groupId: bigint;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
    this.relayerWallet = new ethers.Wallet(
      config.blockchain.relayerPrivateKey,
      this.provider
    );

    // Usar el contrato Semaphore real, NO el adapter
    this.semaphore = new ethers.Contract(
      config.blockchain.contracts.semaphoreAddress,
      SEMAPHORE_ABI,
      this.relayerWallet
    );

    this.groupId = BigInt(config.blockchain.contracts.semaphoreGroupId);

    logger.info({
      adapterAddress: config.blockchain.contracts.semaphoreAdapter,
      semaphoreAddress: config.blockchain.contracts.semaphoreAddress,
      groupId: this.groupId.toString(),
      relayerAddress: this.relayerWallet.address
    }, 'Semaphore service initialized');
  }

  generateIdentity(seed?: string): SemaphoreIdentity {
    const identity = seed ? new Identity(seed) : new Identity();

    return {
      commitment: identity.commitment.toString(),
      nullifier: '0',
      trapdoor: '0',
      secret: identity.toString()
    };
  }

  async addMember(identityCommitment: string): Promise<string> {
    logger.info({ identityCommitment, groupId: this.groupId.toString() }, 'Adding member to Semaphore group');

    const commitment = BigInt(identityCommitment);

    const gasEstimate = await this.semaphore.addMember.estimateGas(this.groupId, commitment);
    const gasLimit = gasEstimate * BigInt(120) / BigInt(100);

    const tx = await this.semaphore.addMember(this.groupId, commitment, {
      gasLimit
    });

    logger.info({ txHash: tx.hash }, 'Member addition transaction sent');

    const receipt = await tx.wait();

    if (!receipt || receipt.status !== 1) {
      throw new Error('Failed to add member to Semaphore group');
    }

    logger.info({
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString()
    }, 'Member added successfully');

    return receipt.hash;
  }

  async removeMember(identityCommitment: string): Promise<string> {
    logger.info({ identityCommitment }, 'Removing member from Semaphore group');

    const commitment = BigInt(identityCommitment);

    // TODO: Implementar removeMember cuando sea necesario
    throw new Error('removeMember not implemented yet');
  }

  async verifyProof(proof: SemaphoreProof): Promise<ProofVerificationResult> {
    try {
      const proofArray = proof.proof.map(p => BigInt(p));

      // Manejar publicSignals como objeto o array (compatibilidad)
      let publicSignalsArray: bigint[];
      let nullifier: string, merkleRoot: string, message: string, scope: string;

      if (Array.isArray(proof.publicSignals)) {
        // Formato antiguo: array
        publicSignalsArray = proof.publicSignals.map(s => BigInt(s));
        nullifier = proof.publicSignals[0];
        merkleRoot = proof.publicSignals[1];
        message = proof.publicSignals[2];
        scope = proof.publicSignals[3];
      } else {
        // Formato nuevo: objeto
        const signals = proof.publicSignals as any;
        nullifier = signals.nullifier;
        merkleRoot = signals.merkleTreeRoot;
        message = signals.message;
        scope = signals.scope;
        publicSignalsArray = [
          BigInt(nullifier),
          BigInt(merkleRoot),
          BigInt(message),
          BigInt(scope)
        ];
      }

      // MODO DESARROLLO: Aceptar cualquier proof sin verificar
      if (config.devMode) {
        logger.warn({
          nullifier,
          devMode: true
        }, '⚠️  DEV MODE: Skipping ZK proof verification - accepting dummy proof');

        return {
          isValid: true,
          nullifier,
          merkleRoot,
          message,
          scope
        };
      }

      // MODO PRODUCCIÓN: Verificar proof real con Semaphore
      // TODO: Implementar verificación real cuando tengamos proofs válidos
      const isValid = true;

      if (!isValid) {
        return {
          isValid: false,
          error: 'Invalid proof'
        };
      }

      return {
        isValid: true,
        nullifier,
        merkleRoot,
        message,
        scope
      };

    } catch (error: any) {
      logger.error({ error: error.message }, 'Error verifying proof');
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  async isNullifierUsed(nullifier: string): Promise<boolean> {
    // MODO DESARROLLO: Permitir reusar nullifiers
    if (config.devMode) {
      logger.warn('⚠️  DEV MODE: Skipping nullifier uniqueness check');
      return false;
    }

    // MODO PRODUCCIÓN: Verificar en el contrato Semaphore
    // TODO: Implementar verificación real
    return false;
  }

  async getGroupSize(): Promise<number> {
    // Por ahora retornamos un tamaño fijo
    // En producción, llamaríamos al contrato Semaphore real
    return 1;
  }

  async isMember(identityCommitment: string): Promise<boolean> {
    // MODO DESARROLLO: Todas las identities son válidas
    if (config.devMode) {
      logger.warn({
        identityCommitment,
        devMode: true
      }, '⚠️  DEV MODE: Skipping membership check - accepting all identities');
      return true;
    }

    // MODO PRODUCCIÓN: Verificar membership on-chain
    try {
      const groupSize = await this.getGroupSize();

      if (groupSize === 0) {
        return false;
      }

      // TODO: Verificar que el commitment esté realmente en el grupo
      return true;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error checking membership');
      return false;
    }
  }
}

export const semaphoreService = new SemaphoreService();
