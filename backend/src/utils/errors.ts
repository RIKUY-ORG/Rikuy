/**
 * Sistema de errores profesional para RIKUY Backend
 *
 * Cada error tiene:
 * - code: Código único para identificar el tipo de error
 * - message: Mensaje user-friendly en español
 * - statusCode: HTTP status code apropiado
 * - isOperational: true para errores esperados, false para bugs
 * - details: Metadata adicional (opcional)
 */

/**
 * Error base de la aplicación
 */
export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: any;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: any
  ) {
    super(message);

    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;

    // Capturar stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convierte el error a un objeto JSON para respuesta HTTP
   */
  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

/**
 * Error de validación (400)
 * Uso: Datos de entrada inválidos
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super('VALIDATION_ERROR', message, 400, details);
  }
}

/**
 * Error de recurso no encontrado (404)
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Recurso') {
    super('NOT_FOUND', `${resource} no encontrado`, 404);
  }
}

/**
 * Error de conflicto (409)
 * Uso: Duplicados, condiciones de race, etc.
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super('CONFLICT', message, 409, details);
  }
}

/**
 * Error de rate limit excedido (429)
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Demasiadas solicitudes. Por favor intenta más tarde.') {
    super('RATE_LIMIT_EXCEEDED', message, 429);
  }
}

/**
 * Error de servicio externo (502)
 * Uso: Cuando IPFS, Arkiv, OpenAI, etc. fallan
 */
export class ExternalServiceError extends AppError {
  public readonly service: string;

  constructor(service: string, message: string, details?: any) {
    super(
      'EXTERNAL_SERVICE_ERROR',
      message || `Error en servicio externo: ${service}`,
      502,
      details
    );
    this.service = service;
  }
}

/**
 * Error de blockchain (502)
 * Uso: Transacciones fallidas, gas insuficiente, etc.
 */
export class BlockchainError extends AppError {
  public readonly txHash?: string;

  constructor(message: string, txHash?: string, details?: any) {
    super('BLOCKCHAIN_ERROR', message, 502, { ...details, txHash });
    this.txHash = txHash;
  }
}

/**
 * Error de ubicación fuera de geofence (400)
 */
export class GeofenceError extends AppError {
  constructor(country: string = 'Argentina') {
    super(
      'GEOFENCE_ERROR',
      `Solo aceptamos reportes dentro de ${country}`,
      400
    );
  }
}

/**
 * Error de contenido inapropiado (400)
 */
export class ContentModerationError extends AppError {
  constructor(reason?: string) {
    super(
      'CONTENT_MODERATION_ERROR',
      reason || 'La imagen no cumple con nuestros estándares de contenido',
      400
    );
  }
}

/**
 * Error de imagen duplicada (409)
 */
export class DuplicateImageError extends AppError {
  constructor() {
    super(
      'DUPLICATE_IMAGE',
      'Esta foto ya fue reportada anteriormente',
      409
    );
  }
}

/**
 * Determina si un error es operacional (esperado) o un bug
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Factory para crear errores desde errores genéricos
 * Útil para convertir errores de librerías externas a nuestros errores
 */
export function createErrorFromException(error: any): AppError {
  // Si ya es un AppError, retornarlo
  if (error instanceof AppError) {
    return error;
  }

  // Detectar errores comunes de librerías externas
  const errorMessage = error.message || 'Error desconocido';

  // Errores de IPFS/Pinata
  if (errorMessage.includes('IPFS') || errorMessage.includes('Pinata')) {
    return new ExternalServiceError(
      'IPFS',
      'No pudimos procesar tu foto. Por favor intenta de nuevo.',
      { originalError: errorMessage }
    );
  }

  // Errores de OpenAI
  if (errorMessage.includes('OpenAI') || errorMessage.includes('AI')) {
    return new ExternalServiceError(
      'OpenAI',
      'No pudimos analizar tu foto. Por favor intenta de nuevo.',
      { originalError: errorMessage }
    );
  }

  // Errores de Arkiv
  if (errorMessage.includes('Arkiv') || errorMessage.includes('storage')) {
    return new ExternalServiceError(
      'Arkiv',
      'No pudimos guardar tu reporte. Por favor intenta de nuevo.',
      { originalError: errorMessage }
    );
  }

  // Errores de blockchain
  if (
    errorMessage.includes('blockchain') ||
    errorMessage.includes('transaction') ||
    errorMessage.includes('gas') ||
    errorMessage.includes('revert')
  ) {
    return new BlockchainError(
      'No pudimos confirmar tu reporte en blockchain. Por favor intenta de nuevo.',
      undefined,
      { originalError: errorMessage }
    );
  }

  // Error genérico
  return new AppError(
    'INTERNAL_ERROR',
    'Hubo un problema al procesar tu solicitud. Por favor intenta de nuevo.',
    500,
    { originalError: errorMessage }
  );
}
