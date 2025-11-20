/**
 * RIKUY - Configuración Frontend
 * Generado automáticamente del deployment en Scroll Sepolia
 */

export const CONTRACTS = {
  // Contrato principal
  RikuyCore: {
    address: '0x2b514e6ebaa9a7dEd3f7c6c668708ae92791f478',
    abi: require('./RikuyCore.abi.json'),
  },

  // Registry de reportes
  ReportRegistry: {
    address: '0xdc3c4c07e4675cf1BBDEa627026e92170f9F5AE1',
    abi: require('./ReportRegistry.abi.json'),
  },

  // Treasury
  Treasury: {
    address: '0xb53cd2E6a71E88C4Df5863CD8c257077cD8C1aa2',
    abi: require('./RikuyTreasury.abi.json'),
  },

  // Token de prueba (MockUSX)
  MockUSX: {
    address: '0xD615074c2603336fa0Da8AF44B5CCB9D9C0B2F9c',
    abi: require('./MockUSX.abi.json'),
  },
} as const;

export const NETWORK = {
  chainId: 534351, // Scroll Sepolia
  name: 'Scroll Sepolia',
  rpcUrl: 'https://sepolia-rpc.scroll.io/',
  blockExplorer: 'https://sepolia.scrollscan.com',
} as const;

export const BACKEND = {
  baseUrl: 'http://localhost:3001',
  endpoints: {
    health: '/health',
    createReport: '/api/reports',
    getReport: '/api/reports/:id',
    listReports: '/api/reports',
  },
} as const;

export const IPFS = {
  gateway: 'https://gateway.pinata.cloud',
} as const;

// Configuración de la app
export const APP_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
  maxReportsPerDay: 5,
  maxReportsPerHour: 2,
  minRewardAmount: '100000000000000000000', // 100 tokens (18 decimals)
  maxRewardAmount: '1000000000000000000000', // 1000 tokens (18 decimals)
} as const;
