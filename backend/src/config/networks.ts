/**
 * Network Configurations for Rikuy
 *
 * Supports multiple networks:
 * - arbitrum: Arbitrum Sepolia (L2 parent)
 * - rikuy: Rikuy Chain L3 (target network)
 *
 * NOTA: Todas las configs usan funciones (no constantes top-level)
 * para que process.env se lea DESPUÉS de dotenv.config()
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
function getArbitrumConfig(): NetworkConfig {
  return {
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
}

// ═══════════════════════════════════════════════════════════════
// RIKUY CHAIN L3 (Target - Arbitrum Orbit)
// ═══════════════════════════════════════════════════════════════
function getRikuyChainConfig(): NetworkConfig {
  return {
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
}

// ═══════════════════════════════════════════════════════════════
// NETWORK SELECTOR
// ═══════════════════════════════════════════════════════════════
const networkConfigGetters: Record<NetworkType, () => NetworkConfig> = {
  arbitrum: getArbitrumConfig,
  rikuy: getRikuyChainConfig,
};

/**
 * Get the current network configuration based on NETWORK env var
 * @returns NetworkConfig for the selected network
 */
export function getNetworkConfig(): NetworkConfig {
  const network = (process.env.NETWORK || 'rikuy') as NetworkType;

  if (!networkConfigGetters[network]) {
    throw new Error(`Unknown network: ${network}. Valid options: arbitrum, rikuy`);
  }

  return networkConfigGetters[network]();
}

/**
 * Get the current network type
 */
export function getCurrentNetwork(): NetworkType {
  return (process.env.NETWORK || 'rikuy') as NetworkType;
}
