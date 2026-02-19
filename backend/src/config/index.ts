import dotenv from 'dotenv';
import { getNetworkConfig,getCurrentNetwork,type NetworkConfig } from './networks';

dotenv.config();

// Get current network configuration
// NOTA: getNetworkConfig() lee process.env — por eso networks.ts
// debe usar funciones (no constantes top-level) para las env vars
const networkConfig: NetworkConfig = getNetworkConfig();

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',
  devMode: process.env.DEV_MODE === 'true',

  // ═══════════════════════════════════════════════════════════════
  // CURRENT NETWORK (Selected via NETWORK env var)
  // ═══════════════════════════════════════════════════════════════
  network: getCurrentNetwork(),

  // ═══════════════════════════════════════════════════════════════
  // BLOCKCHAIN (Dynamic based on selected network)
  // ═══════════════════════════════════════════════════════════════
  blockchain: {
    rpcUrl: networkConfig.rpcUrl,
    chainId: networkConfig.chainId,
    networkName: networkConfig.networkName,
    explorerUrl: networkConfig.explorerUrl,
    relayerPrivateKey: process.env.RELAYER_PRIVATE_KEY!,
    contracts: {
      rikuyCoreV2: networkConfig.contracts.rikuyCoreV2,
      reportRegistry: networkConfig.contracts.reportRegistry,
      governmentRegistry: networkConfig.contracts.governmentRegistry,
      anonymousReport: networkConfig.contracts.anonymousReport,
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // IPFS (Pinata) — Fotos + Metadata legal (reemplaza Arkiv)
  // ═══════════════════════════════════════════════════════════════
  pinata: {
    jwt: process.env.PINATA_JWT!,
    gateway: process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud',
  },

  // ═══════════════════════════════════════════════════════════════
  // AI VISION (Multi-Provider for future AI Consensus)
  // ═══════════════════════════════════════════════════════════════
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY!,
    openaiApiKey: process.env.OPENAI_API_KEY,
    claudeApiKey: process.env.CLAUDE_API_KEY, // For AI Consensus (Phase 4)
  },

  // ═══════════════════════════════════════════════════════════════
  // REDIS (Caching)
  // ═══════════════════════════════════════════════════════════════
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // ═══════════════════════════════════════════════════════════════
  // SECURITY
  // ═══════════════════════════════════════════════════════════════
  security: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'), // 1 min
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '5'), // 5 requests
  },

  // ═══════════════════════════════════════════════════════════════
  // GEOFENCING (Bolivia bounds)
  // ═══════════════════════════════════════════════════════════════
  geofence: {
    latMin: -23.0,  // Sur de Bolivia
    latMax: -9.5,   // Norte de Bolivia (frontera con Brasil)
    longMin: -69.7, // Oeste de Bolivia (frontera con Chile)
    longMax: -57.4, // Este de Bolivia (frontera con Brasil)
  },
};

// ═══════════════════════════════════════════════════════════════
// ENVIRONMENT VALIDATION
// ═══════════════════════════════════════════════════════════════
const requiredEnvVars = [
  'RELAYER_PRIVATE_KEY',
  'PINATA_JWT',
  'GEMINI_API_KEY',
];

// Only validate contract addresses if not in devMode
const requiredContractVars = [
  // These are validated per-network, not globally
];

if (config.nodeEnv === 'production') {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  // Validate that we have contract addresses for the selected network
  if (!config.blockchain.contracts.rikuyCoreV2) {
    throw new Error(`Missing RikuyCoreV2 address for network: ${config.network}`);
  }
}

// Log current network on startup
console.log(`🌐 Network: ${config.network} (Chain ID: ${config.blockchain.chainId})`);
