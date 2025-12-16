/**
 * Tipos relacionados con Semaphore Protocol y ZK Proofs
 */

export interface SemaphoreIdentity {
  commitment: string;
  secret: string;
  nullifier?: string; // Optional - solo disponible después de generar proof
}

export interface ZKProof {
  proof: string[]; // [8] elementos del proof Groth16
  publicSignals: string[]; // [4] señales públicas
}

export interface SemaphoreProofData {
  merkleTreeDepth: number;
  merkleTreeRoot: string;
  nullifier: string;
  message: string;
  scope: string;
  points: string[]; // [8] puntos del proof
}

export interface ReportZKProof {
  proof: string[];
  publicSignals: {
    nullifier: string;
    merkleTreeRoot: string;
    message: string; // Hash del reporte
    scope: string; // Alcance/época del proof
  };
}

export interface IdentityStorage {
  commitment: string;
  encrypted: string; // Identidad cifrada
  createdAt: number;
}
