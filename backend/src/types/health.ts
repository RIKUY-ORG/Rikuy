// src/types/health.ts
import { NetworkType } from '../config/networks';

export interface HealthData {
  status: 'operational' | 'degraded' | 'down';
  service: 'rikuy-backend';
  environment: 'development' | 'staging' | 'production';
  environmentInfo: {
    name: string;
    message: string;
  };
  timestamp: number;
  uptime: number;
  memory: NodeJS.MemoryUsage;
  version: string;
  features: {
    rateLimiting: boolean;
    metrics: boolean;
    blockchain: boolean;
    network: string;
    chainId?: number;
    networkType?: NetworkType;
  };
  debug?: {
    rpcUrl?: string;
    contracts?: {
      rikuyCoreV2?: string;
      reportRegistry?: string;
      governmentRegistry?: string;
      anonymousReport?: string;
    };
    envVars?: Record<string, string | undefined>;
  };
  endpoints?: Record<string, string>;
}

export interface MetricsData {
  totalRequests: number;
  requestsByMethod: Record<string, number>;
  requestsByPath: Record<string, number>;
  responseTimes: number[];
  activeConnections: number;
  errors: number;
  startTime: number;
  avgResponseTime: number;
  uptime: number;
  uptimeHuman: string;
  responseTimeStats: {
    min: number;
    max: number;
    avg: number;
  };
}

export interface IdentityStatusData {
  success: boolean;
  wallet?: string;
  network?: string;
  chainId?: number;
  data?: {
    isVerified: boolean;
    verifiedAt?: string;
    commitment?: string;
    canCreateReports: boolean;
    status: string;
  };
  error?: string;
  timestamp?: number;
}