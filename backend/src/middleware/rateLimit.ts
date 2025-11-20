import { Request, Response, NextFunction } from 'express';
import { createClient } from 'redis';
import { config } from '../config';

const redisClient = createClient({ url: config.redis.url });
redisClient.connect().catch(console.error);

/**
 * Rate limiting middleware usando Redis
 */
export const rateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const identifier = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `rate:${identifier}`;

    const requests = await redisClient.incr(key);

    if (requests === 1) {
      await redisClient.expire(key, Math.floor(config.security.rateLimitWindow / 1000));
    }

    if (requests > config.security.rateLimitMax) {
      return res.status(429).json({
        success: false,
        error: 'Demasiadas solicitudes. Intenta nuevamente en 1 minuto.',
      });
    }

    next();
  } catch (error) {
    console.error('[RateLimit] Error:', error);
    next(); // Permitir en caso de error de Redis
  }
};

/**
 * Rate limit más estricto para reportes (prevenir spam)
 */
export const reportRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const identifier = req.ip || req.socket.remoteAddress || 'unknown';
    const dailyKey = `report:daily:${identifier}`;
    const hourlyKey = `report:hourly:${identifier}`;

    const [dailyCount, hourlyCount] = await Promise.all([
      redisClient.incr(dailyKey),
      redisClient.incr(hourlyKey),
    ]);

    if (dailyCount === 1) {
      await redisClient.expire(dailyKey, 86400); // 24 horas
    }
    if (hourlyCount === 1) {
      await redisClient.expire(hourlyKey, 3600); // 1 hora
    }

    if (dailyCount > 5) {
      return res.status(429).json({
        success: false,
        error: 'Límite diario de reportes alcanzado (máximo 5 por día).',
      });
    }

    if (hourlyCount > 2) {
      return res.status(429).json({
        success: false,
        error: 'Espera al menos 30 minutos entre reportes.',
      });
    }

    next();
  } catch (error) {
    console.error('[ReportRateLimit] Error:', error);
    next();
  }
};
