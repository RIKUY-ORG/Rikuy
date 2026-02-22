// Types para verificacion de identidad — flujo Reclaim Protocol
// Reclaim nos da: 'usuario' + 'rol' desde ciudadaniadigital.bo

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REVOKED = 'REVOKED',
}

export enum RejectionReason {
  DUPLICATE_IDENTITY = 'DUPLICATE_IDENTITY',
  INVALID_CI_FORMAT = 'INVALID_CI_FORMAT',
  RECLAIM_PROOF_FAILED = 'RECLAIM_PROOF_FAILED',
  RATE_LIMITED = 'RATE_LIMITED',
}

export enum BolivianDepartment {
  LP = 'LP', // La Paz
  CB = 'CB', // Cochabamba
  SC = 'SC', // Santa Cruz
  OR = 'OR', // Oruro
  PT = 'PT', // Potosi
  TJ = 'TJ', // Tarija
  CH = 'CH', // Chuquisaca
  BN = 'BN', // Beni
  PD = 'PD', // Pando
}

// ──────────────────────────────────────────────────────────────────────────
// RECLAIM DATA (lo que obtenemos de ciudadaniadigital.bo)
// ──────────────────────────────────────────────────────────────────────────

export interface ReclaimCitizenData {
  usuario: string;   // Usuario de Ciudadania Digital Bolivia
}

// ──────────────────────────────────────────────────────────────────────────
// REQUEST / RESPONSE
// ──────────────────────────────────────────────────────────────────────────

export interface VerifyIdentityRequest {
  usuario: string;       // Usuario de Ciudadania Digital (de Reclaim)
  walletAddress: string; // Privy embedded wallet
  reclaimProof?: any;    // Proof de Reclaim Protocol (para verificacion on-chain)
}

export interface VerifyIdentityResponse {
  success: boolean;
  message: string;
  data: {
    verified: boolean;
    commitment: string;  // Anonymous commitment (keccak256)
    txHash: string;      // On-chain registration tx
    status: VerificationStatus;
    verifiedAt: string;
  };
}

export interface IdentityStatusResponse {
  success: boolean;
  data: {
    isVerified: boolean;
    verifiedAt?: string;
    commitment?: string;
    canCreateReports: boolean;
    status: VerificationStatus;
  };
}

// ──────────────────────────────────────────────────────────────────────────
// STORAGE (en memoria — en prod seria DB)
// ──────────────────────────────────────────────────────────────────────────

export interface StoredIdentity {
  id: string;
  walletAddress: string;
  ciHash: string;          // SHA256(ci) — nunca almacenar CI en texto plano
  commitment: string;       // Anonymous commitment (bytes32)
  verifiedAt: Date;
  status: VerificationStatus;
  revokedAt?: Date;
  revokedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VerificationAttempt {
  id: string;
  walletAddress: string;
  success: boolean;
  failureReason?: RejectionReason;
  ipAddress: string;
  userAgent: string;
  attemptedAt: Date;
}

// ──────────────────────────────────────────────────────────────────────────
// VALIDATION HELPERS
// ──────────────────────────────────────────────────────────────────────────

/**
 * Resultado de validación del CI boliviano
 * 
 * @property isValid - Indica si el CI es válido
 * @property normalized - CI completo con formato original (incluye complemento si existe)
 * @property numericPart - Solo la parte numérica del CI (sin complemento)
 * @property complement - Complemento alfanumérico opcional (ej: "1A", "B")
 * @property error - Mensaje de error si isValid es false
 */
export interface CIValidationResult {
  isValid: boolean;
  normalized?: string;  // CI con formato original (incluye complemento si existe)
  numericPart?: string; // Solo los dígitos (para hashing y detección de duplicados)
  complement?: string;  // Complemento opcional (ej: "1A", "B")
  error?: string;
}

export function isValidDepartment(dept: string): dept is BolivianDepartment {
  return Object.values(BolivianDepartment).includes(dept as BolivianDepartment);
}