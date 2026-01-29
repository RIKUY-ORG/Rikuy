/**
 * Utilidad para reintentar operaciones que pueden fallar temporalmente
 * Útil para llamadas a servicios externos (IPFS, Arkiv, Scroll)
 */

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Ejecuta una función con retry logic
 * @param fn Función a ejecutar
 * @param options Opciones de retry
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Si es el último intento, lanzar el error
      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Calcular delay con backoff exponencial
      const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);

      // Callback opcional
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      console.log(`[Retry] Intento ${attempt}/${maxAttempts} falló. Reintentando en ${delay}ms...`);

      // Esperar antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Wrapper para servicios externos con retry automático
 */
export function retryableService<T extends Record<string, any>>(
  service: T,
  methodNames: (keyof T)[],
  retryOptions?: RetryOptions
): T {
  const wrappedService = { ...service };

  for (const methodName of methodNames) {
    const originalMethod = service[methodName];

    if (typeof originalMethod === 'function') {
      (wrappedService as any)[methodName] = async function (...args: any[]) {
        return withRetry(
          () => originalMethod.apply(service, args),
          {
            ...retryOptions,
            onRetry: (attempt, error) => {
              console.log(`[${String(methodName)}] Reintento ${attempt} - Error: ${error.message}`);
            },
          }
        );
      };
    }
  }

  return wrappedService;
}
