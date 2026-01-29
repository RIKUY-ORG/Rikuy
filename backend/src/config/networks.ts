/**
 * Network Configurations for Rikuy
 *
 * Supports multiple networks:
 * - scroll: Legacy Scroll Sepolia (testnet actual)
 * - arbitrum: Arbitrum Sepolia (transición)
 * - rikuy: Rikuy Chain L3 (objetivo final)
 */

export type NetworkType = 'scroll' | 'arbitrum' | 'rikuy';

export interface NetworkConfig {
  rpcUrl: string;
  chainId: number;
  networkName: string;
  explorerUrl: string;
  contracts: {
    rikuyCoreV2: string;
    reportRegistry: string;
    treasury: string;
    governmentRegistry: string;
    semaphoreAdapter: string;
    semaphoreAddress: string;
    semaphoreGroupId: string;
    mockUsx: string;
  };
}

// ═══════════════════════════════════════════════════════════════
// SCROLL SEPOLIA (Legacy)
// ═══════════════════════════════════════════════════════════════
export const scrollConfig: NetworkConfig = {
  rpcUrl: process.env.SCROLL_RPC_URL || 'https://sepolia-rpc.scroll.io',
  chainId: parseInt(process.env.SCROLL_CHAIN_ID || '534351'),
  networkName: 'scroll-sepolia',
  explorerUrl: 'https://sepolia.scrollscan.com',
  contracts: {
    rikuyCoreV2: process.env.SCROLL_RIKUY_CORE_ADDRESS || '0xEaa6cB7Fa8BEBEa72c78fAd2170b103aC1C2F126',
    reportRegistry: process.env.SCROLL_REPORT_REGISTRY_ADDRESS || '0xdc3c4c07e4675cf1BBDEa627026e92170f9F5AE1',
    treasury: process.env.SCROLL_TREASURY_ADDRESS || '0xb53cd2E6a71E88C4Df5863CD8c257077cD8C1aa2',
    governmentRegistry: process.env.SCROLL_GOVERNMENT_REGISTRY_ADDRESS || '0xD65C9aA84b78a2aDea2011CD992F2475a4CD01a0',
    semaphoreAdapter: process.env.SCROLL_SEMAPHORE_ADAPTER_ADDRESS || '0x098FF07f87C1AAec0dD5b16c2F0199aA2b60bB75',
    semaphoreAddress: process.env.SCROLL_SEMAPHORE_ADDRESS || '0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D',
    semaphoreGroupId: process.env.SCROLL_SEMAPHORE_GROUP_ID || '30',
    mockUsx: process.env.SCROLL_MOCK_USX_ADDRESS || '0xD15ED9ea64B0a1d9535374F27de79111EbE872C1',
  },
};

// ═══════════════════════════════════════════════════════════════
// ARBITRUM SEPOLIA (Transition)
// ═══════════════════════════════════════════════════════════════
export const arbitrumConfig: NetworkConfig = {
  rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
  chainId: parseInt(process.env.ARBITRUM_CHAIN_ID || '421614'),
  networkName: 'arbitrum-sepolia',
  explorerUrl: 'https://sepolia.arbiscan.io',
  contracts: {
    rikuyCoreV2: process.env.ARBITRUM_RIKUY_CORE_ADDRESS || '',
    reportRegistry: process.env.ARBITRUM_REPORT_REGISTRY_ADDRESS || '',
    treasury: process.env.ARBITRUM_TREASURY_ADDRESS || '',
    governmentRegistry: process.env.ARBITRUM_GOVERNMENT_REGISTRY_ADDRESS || '',
    semaphoreAdapter: process.env.ARBITRUM_SEMAPHORE_ADAPTER_ADDRESS || '',
    semaphoreAddress: process.env.ARBITRUM_SEMAPHORE_ADDRESS || '',
    semaphoreGroupId: process.env.ARBITRUM_SEMAPHORE_GROUP_ID || '',
    mockUsx: process.env.ARBITRUM_MOCK_USX_ADDRESS || '',
  },
};

// ═══════════════════════════════════════════════════════════════
// RIKUY CHAIN L3 (Target - Arbitrum Orbit)
// ═══════════════════════════════════════════════════════════════
export const rikuyChainConfig: NetworkConfig = {
  rpcUrl: process.env.RIKUY_CHAIN_RPC_URL || '',
  chainId: parseInt(process.env.RIKUY_CHAIN_ID || '0'),
  networkName: 'rikuy-chain',
  explorerUrl: process.env.RIKUY_CHAIN_EXPLORER_URL || '',
  contracts: {
    rikuyCoreV2: process.env.RIKUY_CHAIN_RIKUY_CORE_ADDRESS || '',
    reportRegistry: process.env.RIKUY_CHAIN_REPORT_REGISTRY_ADDRESS || '',
    treasury: process.env.RIKUY_CHAIN_TREASURY_ADDRESS || '',
    governmentRegistry: process.env.RIKUY_CHAIN_GOVERNMENT_REGISTRY_ADDRESS || '',
    semaphoreAdapter: process.env.RIKUY_CHAIN_SEMAPHORE_ADAPTER_ADDRESS || '',
    semaphoreAddress: process.env.RIKUY_CHAIN_SEMAPHORE_ADDRESS || '',
    semaphoreGroupId: process.env.RIKUY_CHAIN_SEMAPHORE_GROUP_ID || '',
    mockUsx: process.env.RIKUY_CHAIN_MOCK_USX_ADDRESS || '',
  },
};

// ═══════════════════════════════════════════════════════════════
// NETWORK SELECTOR
// ═══════════════════════════════════════════════════════════════
const networkConfigs: Record<NetworkType, NetworkConfig> = {
  scroll: scrollConfig,
  arbitrum: arbitrumConfig,
  rikuy: rikuyChainConfig,
};

/**
 * Get the current network configuration based on NETWORK env var
 * @returns NetworkConfig for the selected network
 */
export function getNetworkConfig(): NetworkConfig {
  const network = (process.env.NETWORK || 'scroll') as NetworkType;

  if (!networkConfigs[network]) {
    throw new Error(`Unknown network: ${network}. Valid options: scroll, arbitrum, rikuy`);
  }

  return networkConfigs[network];
}

/**
 * Get the current network type
 */
export function getCurrentNetwork(): NetworkType {
  return (process.env.NETWORK || 'scroll') as NetworkType;
}
