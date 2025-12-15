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

const SEMAPHORE_ADAPTER_ABI = [
  'function addMember(uint256 identityCommitment) external',
  'function removeMember(uint256 identityCommitment) external',
  'function verifyProof(uint256[8] calldata proof, uint256[4] calldata publicSignals) external view returns (bool)',
  'function isNullifierUsed(uint256 nullifier) external view returns (bool)',
  'function getGroupSize() external view returns (uint256)',
  'event MemberAdded(uint256 indexed identityCommitment)',
  'event MemberRemoved(uint256 indexed identityCommitment)'
];

class SemaphoreService {
  private provider: ethers.JsonRpcProvider;
  private relayerWallet: ethers.Wallet;
  private semaphoreAdapter: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);
    this.relayerWallet = new ethers.Wallet(
      config.blockchain.relayerPrivateKey,
      this.provider
    );
    this.semaphoreAdapter = new ethers.Contract(
      config.blockchain.contracts.semaphoreAdapter,
      SEMAPHORE_ADAPTER_ABI,
      this.relayerWallet
    );

    logger.info({
      adapterAddress: config.blockchain.contracts.semaphoreAdapter,
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
    logger.info({ identityCommitment }, 'Adding member to Semaphore group');

    const commitment = BigInt(identityCommitment);

    const gasEstimate = await this.semaphoreAdapter.addMember.estimateGas(commitment);
    const gasLimit = gasEstimate * BigInt(120) / BigInt(100);

    const tx = await this.semaphoreAdapter.addMember(commitment, {
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

    const tx = await this.semaphoreAdapter.removeMember(commitment);
    const receipt = await tx.wait();

    if (!receipt || receipt.status !== 1) {
      throw new Error('Failed to remove member from Semaphore group');
    }

    logger.info({ txHash: receipt.hash }, 'Member removed successfully');

    return receipt.hash;
  }

  async verifyProof(proof: SemaphoreProof): Promise<ProofVerificationResult> {
    try {
      const proofArray = proof.proof.map(p => BigInt(p));
      const publicSignalsArray = proof.publicSignals.map(s => BigInt(s));

      const isValid = await this.semaphoreAdapter.verifyProof(
        proofArray,
        publicSignalsArray
      );

      if (!isValid) {
        return {
          isValid: false,
          error: 'Invalid proof'
        };
      }

      return {
        isValid: true,
        nullifier: proof.publicSignals[0],
        merkleRoot: proof.publicSignals[1],
        message: proof.publicSignals[2],
        scope: proof.publicSignals[3]
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
    const nullifierBigInt = BigInt(nullifier);
    return await this.semaphoreAdapter.isNullifierUsed(nullifierBigInt);
  }

  async getGroupSize(): Promise<number> {
    const size = await this.semaphoreAdapter.getGroupSize();
    return Number(size);
  }

  async isMember(identityCommitment: string): Promise<boolean> {
    try {
      const groupSize = await this.getGroupSize();

      if (groupSize === 0) {
        return false;
      }

      return true;
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error checking membership');
      return false;
    }
  }
}

export const semaphoreService = new SemaphoreService();
