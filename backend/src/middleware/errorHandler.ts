import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, isOperationalError } from '../utils/errors';
import { config } from '../config';
import logger from '../utils/logger';

/**
 * Middleware global de manejo de errores
 *
 * Este middleware debe ir al FINAL de todas las rutas
 * Captura todos los errores que ocurran en la aplicación
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Si las headers ya fueron enviadas, delegar a Express default handler
  if (res.headersSent) {
    return next(error);
  }

  // Log del error con contexto completo
  const errorContext = {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      body: sanitizeBody(req.body),
    },
  };

  // Determinar nivel de log
  if (error instanceof AppError && error.statusCode < 500) {
    // Errores del cliente (4xx) son warnings
    logger.warn(errorContext, 'Client error');
  } else {
    // Errores del servidor (5xx) son errors
    logger.error(errorContext, 'Server error');
  }

  // ═══════════════════════════════════════════════════════════════════════
  // MANEJO DE ERRORES ESPECÍFICOS
  // ═══════════════════════════════════════════════════════════════════════

  // 1. AppError - nuestros errores customizados
  if (error instanceof AppError) {
    return res.status(error.statusCode).json(error.toJSON());
  }

  // 2. ZodError - errores de validación de schemas
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Error de validación en los datos enviados',
        details: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    });
  }

  // 3. Multer errors - errores de upload de archivos
  if (error.name === 'MulterError') {
    const multerError = error as any;
    const multerMessages: Record<string, string> = {
      LIMIT_FILE_SIZE: 'El archivo excede el tamaño máximo permitido (10MB)',
      LIMIT_FILE_COUNT: 'Demasiados archivos',
      LIMIT_UNEXPECTED_FILE: 'Campo de archivo inesperado',
      LIMIT_FIELD_KEY: 'Nombre de campo demasiado largo',
      LIMIT_FIELD_VALUE: 'Valor de campo demasiado largo',
      LIMIT_FIELD_COUNT: 'Demasiados campos',
      LIMIT_PART_COUNT: 'Demasiadas partes en el formulario',
    };

    return res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: multerMessages[multerError.code] || 'Error al subir archivo',
      },
    });
  }

  // 4. SyntaxError - errores de JSON malformado
  if (error instanceof SyntaxError && 'body' in error) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_JSON',
        message: 'El JSON enviado está malformado',
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════════════
  // ERROR GENÉRICO (no identificado)
  // ═══════════════════════════════════════════════════════════════════════

  const isDevelopment = config.nodeEnv === 'development';

  // En desarrollo, mostrar más detalles
  if (isDevelopment) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Error interno del servidor',
        stack: error.stack,
        details: {
          name: error.name,
          ...(error as any),
        },
      },
    });
  }

  // En producción, mensaje genérico (no exponer detalles)
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Error interno del servidor. Por favor intenta de nuevo.',
    },
  });
}

/**
 * Sanitiza el body del request para logging
 * Remueve campos sensibles como passwords, tokens, etc.
 */
function sanitizeBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sensitiveFields = [
    'password',
    'token',
    'apiKey',
    'secret',
    'privateKey',
    'authorization',
  ];

  const sanitized = { ...body };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Middleware para manejar rutas no encontradas (404)
 * Debe ir ANTES del errorHandler pero DESPUÉS de todas las rutas
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Ruta no encontrada: ${req.method} ${req.path}`,
    },
  });
}

/**
 * Wrapper para async route handlers
 * Captura errores en funciones async y los pasa al error handler
 *
 * Uso:
 * router.get('/path', asyncHandler(async (req, res) => {
 *   // código que puede hacer throw
 * }));
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
