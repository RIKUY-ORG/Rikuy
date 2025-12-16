import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  nodeEnv: process.env.NODE_ENV || 'development',

  // Arkiv
  arkiv: {
    rpcUrl: process.env.ARKIV_RPC_URL || 'https://mendoza.hoodi.arkiv.network/rpc',
    privateKey: process.env.ARKIV_PRIVATE_KEY!,
    chainId: 60138453056,
  },

  // IPFS (Pinata)
  pinata: {
    jwt: process.env.PINATA_JWT!,
    gateway: process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud',
  },

  // AI Vision
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY!,
    openaiApiKey: process.env.OPENAI_API_KEY,
  },

  // Blockchain (Scroll)
  blockchain: {
    rpcUrl: process.env.SCROLL_RPC_URL || 'https://sepolia-rpc.scroll.io',
    chainId: parseInt(process.env.SCROLL_CHAIN_ID || '534351'),
    networkName: 'scroll-sepolia',
    relayerPrivateKey: process.env.RELAYER_PRIVATE_KEY!,
    contracts: {
      rikuyCoreV2: process.env.RIKUY_CORE_V2_ADDRESS!,
      semaphoreAdapter: process.env.SEMAPHORE_ADAPTER_ADDRESS!,
      reportRegistry: process.env.REPORT_REGISTRY_ADDRESS!,
      treasury: process.env.TREASURY_ADDRESS!,
    },
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'), // 1 min
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '5'), // 5 requests
  },

  // Geofencing (Argentina bounds)
  geofence: {
    latMin: -55.0,
    latMax: -21.0,
    longMin: -73.5,
    longMax: -53.0,
  },
};

const requiredEnvVars = [
  'ARKIV_PRIVATE_KEY',
  'PINATA_JWT',
  'GEMINI_API_KEY',
  'RELAYER_PRIVATE_KEY',
  'RIKUY_CORE_V2_ADDRESS',
  'SEMAPHORE_ADAPTER_ADDRESS',
  'REPORT_REGISTRY_ADDRESS',
  'TREASURY_ADDRESS',
];

if (config.nodeEnv === 'production') {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
}
