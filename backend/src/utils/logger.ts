import pino from 'pino';
import { config } from '../config';

/**
 * Logger profesional con Pino
 *
 * Features:
 * - Structured logging (JSON en producción)
 * - Pretty print en desarrollo
 * - Diferentes niveles (debug, info, warn, error)
 * - Metadata automática (timestamp, service, etc.)
 * - Performance optimizado
 */

const isDevelopment = config.nodeEnv === 'development';

export const logger = pino({
  // Nivel de log basado en environment
  level: isDevelopment ? 'debug' : 'info',

  // Metadata base que se incluye en todos los logs
  base: {
    service: 'rikuy-backend',
    env: config.nodeEnv,
  },

  // Configuración de timestamp
  timestamp: pino.stdTimeFunctions.isoTime,

  // Pretty print solo en desarrollo
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
          singleLine: false,
          messageFormat: '[{service}] {msg}',
        },
      }
    : undefined,

  // Serializers para objetos especiales
  serializers: {
    error: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
});

/**
 * Helper para logs con contexto de servicio
 *
 * Uso:
 * const log = getServiceLogger('IPFSService');
 * log.info('Uploading image...');
 */
export function getServiceLogger(serviceName: string) {
  return logger.child({ service: serviceName });
}

/**
 * Helper para logs de requests HTTP
 */
export function logRequest(method: string, path: string, statusCode: number, duration: number) {
  logger.info({
    type: 'http_request',
    method,
    path,
    statusCode,
    duration,
  }, `${method} ${path} ${statusCode} - ${duration}ms`);
}

/**
 * Helper para logs de errores con contexto completo
 */
export function logError(error: Error, context?: Record<string, any>) {
  logger.error({
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    ...context,
  }, error.message);
}

export default logger;
