/**
 * Configuración de Semaphore Protocol para Rikuy
 */

/**
 * Normaliza URL removiendo slashes finales para evitar dobles slashes
 */
function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, ''); // Remueve todos los slashes al final
}

export const SEMAPHORE_CONFIG = {
  // Estas variables se deben configurar después del deployment
  // Por ahora usamos valores placeholder
  SEMAPHORE_CONTRACT_ADDRESS: import.meta.env.VITE_SEMAPHORE_ADDRESS || '0x0000000000000000000000000000000000000000',
  GROUP_ID: import.meta.env.VITE_SEMAPHORE_GROUP_ID || '0',
  MERKLE_TREE_DEPTH: 20, // Profundidad estándar de Semaphore

  // Configuración de Scroll
  SCROLL_RPC_URL: import.meta.env.VITE_SCROLL_RPC_URL || 'https://sepolia-rpc.scroll.io',
  SCROLL_CHAIN_ID: import.meta.env.VITE_SCROLL_CHAIN_ID || '534351',

  // Backend API - Normalizado para evitar dobles slashes
  BACKEND_API_URL: normalizeUrl(import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001'),
};

// Constantes de categorías (deben coincidir con los contratos)
export const CATEGORIES = {
  INFRAESTRUCTURA: 0,
  INSEGURIDAD: 1,
  BASURA: 2,
  SERVICIOS_PUBLICOS: 3,
  OTRO: 4,
} as const;

export const CATEGORY_NAMES: Record<number, string> = {
  [CATEGORIES.INFRAESTRUCTURA]: 'Infraestructura',
  [CATEGORIES.INSEGURIDAD]: 'Inseguridad/Drogas',
  [CATEGORIES.BASURA]: 'Basura',
  [CATEGORIES.SERVICIOS_PUBLICOS]: 'Servicios Públicos',
  [CATEGORIES.OTRO]: 'Otro',
};

// Storage keys
export const STORAGE_KEYS = {
  SEMAPHORE_IDENTITY: 'rikuy_semaphore_identity',
  USER_COMMITMENT: 'rikuy_user_commitment',
} as const;
