// src/middleware/metrics.ts
import { Request, Response, NextFunction } from 'express';

interface Metrics {
  totalRequests: number;
  requestsByMethod: Record<string, number>;
  requestsByPath: Record<string, number>;
  responseTimes: number[];
  activeConnections: number;
  errors: number;
  startTime: number;
}

const metrics: Metrics = {
  totalRequests: 0,
  requestsByMethod: {},
  requestsByPath: {},
  responseTimes: [],
  activeConnections: 0,
  errors: 0,
  startTime: Date.now(),
};

export const metricsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  metrics.totalRequests++;
  metrics.activeConnections++;
  
  const method = req.method;
  const path = req.route?.path || req.path;
  
  metrics.requestsByMethod[method] = (metrics.requestsByMethod[method] || 0) + 1;
  metrics.requestsByPath[path] = (metrics.requestsByPath[path] || 0) + 1;
  
  const startTime = Date.now();
  
  res.on('finish', () => {
    metrics.activeConnections--;
    const duration = Date.now() - startTime;
    metrics.responseTimes.push(duration);
    
    if (res.statusCode >= 400) {
      metrics.errors++;
    }
    
    // Mantener solo últimas 1000 respuestas
    if (metrics.responseTimes.length > 1000) {
      metrics.responseTimes.shift();
    }
  });
  
  next();
};

export const getMetrics = () => {
  const avgResponseTime = metrics.responseTimes.length > 0
    ? metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length
    : 0;
  
  const uptime = Date.now() - metrics.startTime;
  
  return {
    ...metrics,
    avgResponseTime: Math.round(avgResponseTime * 100) / 100,
    uptime: Math.floor(uptime / 1000),
    uptimeHuman: `${Math.floor(uptime / 3600000)}h ${Math.floor((uptime % 3600000) / 60000)}m`,
    responseTimeStats: {
      min: Math.min(...metrics.responseTimes),
      max: Math.max(...metrics.responseTimes),
      avg: Math.round(avgResponseTime * 100) / 100,
    },
  };
};