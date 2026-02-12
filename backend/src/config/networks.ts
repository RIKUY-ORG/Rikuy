/**
 * Network Configurations for Rikuy
 *
 * Supports multiple networks:
 * - arbitrum: Arbitrum Sepolia (L2 parent)
 * - rikuy: Rikuy Chain L3 (target network)
 */

export type NetworkType = 'arbitrum' | 'rikuy';

export interface NetworkConfig {
  rpcUrl: string;
  chainId: number;
  networkName: string;
  explorerUrl: string;
  contracts: {
    rikuyCoreV2: string;
    reportRegistry: string;
    governmentRegistry: string;
    anonymousReport: string;
  };
}

// ═══════════════════════════════════════════════════════════════
// ARBITRUM SEPOLIA (L2 Parent)
// ═══════════════════════════════════════════════════════════════
export const arbitrumConfig: NetworkConfig = {
  rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
  chainId: parseInt(process.env.ARBITRUM_CHAIN_ID || '421614'),
  networkName: 'arbitrum-sepolia',
  explorerUrl: 'https://sepolia.arbiscan.io',
  contracts: {
    rikuyCoreV2: process.env.ARBITRUM_RIKUY_CORE_ADDRESS || '',
    reportRegistry: process.env.ARBITRUM_REPORT_REGISTRY_ADDRESS || '',
    governmentRegistry: process.env.ARBITRUM_GOVERNMENT_REGISTRY_ADDRESS || '',
    anonymousReport: '',
  },
};

// ═══════════════════════════════════════════════════════════════
// RIKUY CHAIN L3 (Target - Arbitrum Orbit)
// ═══════════════════════════════════════════════════════════════
export const rikuyChainConfig: NetworkConfig = {
  rpcUrl: process.env.RIKUY_CHAIN_RPC_URL || '',
  chainId: parseInt(process.env.RIKUY_CHAIN_ID || '313370'),
  networkName: 'rikuy-chain',
  explorerUrl: process.env.RIKUY_CHAIN_EXPLORER_URL || '',
  contracts: {
    rikuyCoreV2: process.env.RIKUY_CHAIN_RIKUY_CORE_ADDRESS || '',
    reportRegistry: process.env.RIKUY_CHAIN_REPORT_REGISTRY_ADDRESS || '',
    governmentRegistry: process.env.RIKUY_CHAIN_GOVERNMENT_REGISTRY_ADDRESS || '',
    anonymousReport: process.env.RIKUY_CHAIN_ANONYMOUS_REPORT_ADDRESS || '',
  },
};

// ═══════════════════════════════════════════════════════════════
// NETWORK SELECTOR
// ═══════════════════════════════════════════════════════════════
const networkConfigs: Record<NetworkType, NetworkConfig> = {
  arbitrum: arbitrumConfig,
  rikuy: rikuyChainConfig,
};

/**
 * Get the current network configuration based on NETWORK env var
 * @returns NetworkConfig for the selected network
 */
export function getNetworkConfig(): NetworkConfig {
  const network = (process.env.NETWORK || 'rikuy') as NetworkType;

  if (!networkConfigs[network]) {
    throw new Error(`Unknown network: ${network}. Valid options: arbitrum, rikuy`);
  }

  return networkConfigs[network];
}

/**
 * Get the current network type
 */
export function getCurrentNetwork(): NetworkType {
  return (process.env.NETWORK || 'rikuy') as NetworkType;
}
