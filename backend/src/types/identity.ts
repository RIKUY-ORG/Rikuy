// Types para verificacion de identidad — flujo Reclaim Protocol
// Reclaim solo nos da: CI (numero) + Nombre del ciudadano
// desde ciudadaniadigital.bo

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
  ci: string;        // Numero de CI boliviano
  fullName: string;  // Nombre completo del ciudadano
}

// ──────────────────────────────────────────────────────────────────────────
// REQUEST / RESPONSE
// ──────────────────────────────────────────────────────────────────────────

export interface VerifyIdentityRequest {
  ci: string;            // CI del ciudadano (de Reclaim)
  fullName: string;      // Nombre completo (de Reclaim)
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

export interface CIValidationResult {
  isValid: boolean;
  normalized?: string;  // CI limpio (solo digitos)
  error?: string;
}

export function isValidDepartment(dept: string): dept is BolivianDepartment {
  return Object.values(BolivianDepartment).includes(dept as BolivianDepartment);
}
