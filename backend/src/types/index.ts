// Types para el backend de RIKUY

export enum ReportCategory {
  INFRAESTRUCTURA = 0,
  INSEGURIDAD = 1,
  BASURA = 2,
  CORRUPCION = 3,
  OTRO = 4
}

export interface CreateReportRequest {
  photo: Express.Multer.File;
  category: ReportCategory;
  description?: string;
  // Campos legales Ley 974
  accusedEntity: string;        // "Identificacion del denunciado" — persona, cargo, institucion
  incidentDate: string;          // "Temporalidad" — ISO 8601 date (cuando ocurrieron los hechos)
  detailedDescription: string;   // "Relacion de hechos" — descripcion detallada (50-2000 chars)
  evidenceDescription?: string;  // Descripcion de la prueba adjunta
  citizenSignature?: string;     // Firma EIP-712 del ciudadano (non-repudiation)
  location: {
    lat: number;
    long: number;
    accuracy: number;
  };
  walletAddress?: string; // From Privy embedded wallet
}

export interface CreateReportResponse {
  success: boolean;
  reportId: string;          // On-chain reportId (canonical)
  contentHash: string;       // Hash de toda la evidencia (verificable on-chain)
  status: 'procesando' | 'confirmado' | 'validado' | 'resuelto';
  recompensa: {
    puntos: number;
    mensaje: string;
  };
  mensaje: string;
  blockchain: {
    transactionHash: string;   // TX hash para verificar en explorador
    blockNumber: number;       // Bloque de confirmacion
    metadataIpfsHash: string;  // CID de metadata legal en IPFS (Pinata)
    imageIpfsHash: string;     // CID de la foto en IPFS (Pinata)
    gasUsed?: string;
    gasCost?: string;
  };
}

export interface ReportMetadata {
  protocol: 'rikuy-v2';
  version: string;
  timestamp: number;
  reportId: string;
  contentHash: string;         // Referencia cruzada al hash almacenado on-chain
  category: {
    id: number;
    name: string;
  };
  evidence: {
    imageIPFS: string;
    imageHash: string;
    description: string;
    aiGenerated: boolean;
    aiTags?: string[];
  };
  // Campos legales Ley 974 (almacenamiento completo en IPFS)
  legalFields: {
    accusedEntity: string;       // A quien se denuncia
    incidentDate: string;        // Cuando ocurrieron los hechos
    detailedDescription: string; // Relacion de hechos completa
    evidenceDescription: string; // Que muestra la prueba
    legalFramework: string;      // Ley aplicable
    contentHashVersion: number;  // Version del hash para verificacion
    citizenSignatureHash?: string; // Hash de la firma EIP-712 (si existe)
  };
  location: {
    approximate: {
      lat: number;
      long: number;
      precision: string;
    };
  };
  metadata: {
    deviceHash?: string;
    timestamp: number;
  };
}

export interface ValidationRequest {
  reportId: string;
  isValid: boolean;
}

export interface NearbyReportsQuery {
  lat: number;
  long: number;
  radiusKm: number;
  category?: ReportCategory;
  limit?: number;
}

export interface ReportStatus {
  reportId: string;
  estado: 'procesando' | 'confirmado' | 'validado' | 'resuelto';
  validaciones: {
    positivas: number;
    negativas: number;
    confiabilidad: number; // 0-100%
  };
  verificado: boolean;
  resuelto: boolean;
  recompensaGanada?: number; // En puntos
  datosReporte?: ReportMetadata;
  // Campos internos
  _internal?: {
    blockchainStatus: number;
    upvotes: number;
    downvotes: number;
  };
}
