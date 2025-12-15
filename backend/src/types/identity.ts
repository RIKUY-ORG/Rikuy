import { Express } from 'express';

export enum DocumentType {
  CI = 'CI',
  PASSPORT = 'PASSPORT'
}

export enum BolivianDepartment {
  LP = 'LP',
  CB = 'CB',
  SC = 'SC',
  OR = 'OR',
  PT = 'PT',
  TJ = 'TJ',
  CH = 'CH',
  BN = 'BN',
  PD = 'PD'
}

export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  REVOKED = 'REVOKED'
}

export enum VerificationMethod {
  OCR_AUTO = 'OCR_AUTO',
  MANUAL = 'MANUAL',
  HYBRID = 'HYBRID'
}

export enum RejectionReason {
  INVALID_FORMAT = 'INVALID_FORMAT',
  EXPIRED_DOCUMENT = 'EXPIRED_DOCUMENT',
  POOR_IMAGE_QUALITY = 'POOR_IMAGE_QUALITY',
  DOCUMENT_NOT_READABLE = 'DOCUMENT_NOT_READABLE',
  DUPLICATE_IDENTITY = 'DUPLICATE_IDENTITY',
  FRAUDULENT_DOCUMENT = 'FRAUDULENT_DOCUMENT',
  NOT_BOLIVIAN = 'NOT_BOLIVIAN',
  INCOMPLETE_DATA = 'INCOMPLETE_DATA'
}

export interface VerifyIdentityRequest {
  documentType: DocumentType;
  documentNumber: string;
  expedition?: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  documentImage: Express.Multer.File;
  selfieImage?: Express.Multer.File;
  userAddress?: string;
}

export interface VerifyIdentityResponse {
  success: boolean;
  message: string;
  data: {
    verified: boolean;
    identity: {
      commitment: string;
      secret: string;
    };
    semaphoreGroupId: string;
    status: VerificationStatus;
    verifiedAt: string;
  };
}

export interface VerifyIdentityError {
  success: false;
  error: string;
  reason: RejectionReason;
  details?: string;
}

export interface IdentityStatusResponse {
  success: boolean;
  data: {
    isVerified: boolean;
    verifiedAt?: string;
    documentType?: DocumentType;
    semaphoreGroupId?: string;
    identityCommitment?: string;
    canCreateReports: boolean;
    status: VerificationStatus;
  };
}

export interface ExtractedCIData {
  documentNumber: string;
  expedition: BolivianDepartment;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  confidence: number;
  rawText: string;
}

export interface ExtractedPassportData {
  passportNumber: string;
  nationality: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  sex: string;
  issueDate: string;
  expiryDate: string;
  confidence: number;
  rawText: string;
}

export interface DocumentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  extractedData?: ExtractedCIData | ExtractedPassportData;
}

export interface SemaphoreIdentity {
  commitment: string;
  nullifier: string;
  trapdoor: string;
  secret: string;
}

export interface SemaphoreProof {
  proof: string[];
  publicSignals: string[];
}

export interface ProofVerificationResult {
  isValid: boolean;
  nullifier?: string;
  merkleRoot?: string;
  message?: string;
  scope?: string;
  error?: string;
}

export interface StoredIdentity {
  id: string;
  userAddress: string;
  documentType: DocumentType;
  documentNumberHash: string;
  firstNameEncrypted: string;
  lastNameEncrypted: string;
  dateOfBirthEncrypted: string;
  identityCommitment: string;
  identitySecretEncrypted: string;
  semaphoreGroupId: string;
  verifiedAt: Date;
  verifiedBy?: string;
  verificationMethod: VerificationMethod;
  status: VerificationStatus;
  revokedAt?: Date;
  revokedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VerificationAttempt {
  id: string;
  userAddress: string;
  documentType: DocumentType;
  success: boolean;
  failureReason?: RejectionReason;
  failureDetails?: string;
  ipAddress: string;
  userAgent: string;
  attemptedAt: Date;
}

export interface IdentityServiceConfig {
  encryptionKey: string;
  maxAttemptsPerDay: number;
  maxAttemptsPerHour: number;
  semaphoreGroupId: string;
  semaphoreAdapterAddress: string;
  ocrProvider: 'tesseract' | 'google' | 'azure';
  ocrApiKey?: string;
  requireSelfie: boolean;
  minImageWidth: number;
  minImageHeight: number;
}

export interface BolivianCIData {
  number: string;
  expedition: BolivianDepartment;
}

export interface CIValidationResult {
  isValid: boolean;
  normalized?: BolivianCIData;
  error?: string;
}

export function isExtractedCIData(data: any): data is ExtractedCIData {
  return (
    typeof data === 'object' &&
    'documentNumber' in data &&
    'expedition' in data
  );
}

export function isExtractedPassportData(data: any): data is ExtractedPassportData {
  return (
    typeof data === 'object' &&
    'passportNumber' in data &&
    'nationality' in data
  );
}

export function isValidDepartment(dept: string): dept is BolivianDepartment {
  return Object.values(BolivianDepartment).includes(dept as BolivianDepartment);
}
