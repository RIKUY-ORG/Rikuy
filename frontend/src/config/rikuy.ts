/**
 * Configuracion de Rikuy - Plataforma de denuncias anonimas
 * Red: Rikuy Chain L3 (Arbitrum Orbit)
 */

/**
 * Normaliza URL removiendo slashes finales para evitar dobles slashes
 */
function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

export const RIKUY_CONFIG = {
  BACKEND_API_URL: normalizeUrl(import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001'),
};

// Constantes de categorias (deben coincidir con los contratos)
export const CATEGORIES = {
  INFRAESTRUCTURA: 0,
  INSEGURIDAD: 1,
  BASURA: 2,
  CORRUPCION: 3,
  OTRO: 4,
} as const;

export const CATEGORY_NAMES: Record<number, string> = {
  [CATEGORIES.INFRAESTRUCTURA]: 'Infraestructura',
  [CATEGORIES.INSEGURIDAD]: 'Inseguridad/Drogas',
  [CATEGORIES.BASURA]: 'Basura',
  [CATEGORIES.CORRUPCION]: 'Corrupcion',
  [CATEGORIES.OTRO]: 'Otro',
};

// Storage keys
export const STORAGE_KEYS = {
  VERIFIED: 'rikuy_verified',
  COMMITMENT: 'rikuy_commitment',
} as const;
