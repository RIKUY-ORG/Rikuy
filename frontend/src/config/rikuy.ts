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

// Nombres legibles para las categorías (por valor numérico)
export const CATEGORY_NAMES_BY_VALUE: Record<number, string> = {
  [CATEGORIES.INFRAESTRUCTURA]: 'Infraestructura',
  [CATEGORIES.INSEGURIDAD]: 'Inseguridad/Drogas',
  [CATEGORIES.BASURA]: 'Basura',
  [CATEGORIES.CORRUPCION]: 'Corrupcion',
  [CATEGORIES.OTRO]: 'Otro',
};

// Nombres legibles para las categorías (por clave)
export const CATEGORY_NAMES: Record<keyof typeof CATEGORIES, string> = {
  INFRAESTRUCTURA: 'Infraestructura',
  INSEGURIDAD: 'Inseguridad/Drogas',
  BASURA: 'Basura',
  CORRUPCION: 'Corrupción',
  OTRO: 'Otro',
};

// Storage keys
export const STORAGE_KEYS = {
  VERIFIED: 'rikuy_verified',
  COMMITMENT: 'rikuy_commitment',
} as const;

// Tipos de utilidad
export type CategoryKey = keyof typeof CATEGORIES;
export type CategoryValue = typeof CATEGORIES[CategoryKey];