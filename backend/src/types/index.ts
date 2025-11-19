// Types para el backend de RIKUY

export enum ReportCategory {
  INFRAESTRUCTURA = 0,
  INSEGURIDAD = 1,
  BASURA = 2
}

export interface CreateReportRequest {
  photo: Express.Multer.File;
  category: ReportCategory;
  description?: string;
  location: {
    lat: number;
    long: number;
    accuracy: number;
  };
  userSecret?: string; // Para generar ZK proof (opcional)
}

export interface CreateReportResponse {
  success: boolean;
  reportId: string;
  status: 'procesando' | 'confirmado' | 'validado' | 'resuelto';
  recompensa: {
    puntos: number;
    mensaje: string;
  };
  mensaje: string;
  // Campos internos (no exponer al frontend, solo para logging)
  _internal?: {
    arkivTxId: string;
    scrollTxHash: string;
  };
}

export interface ArkivReportData {
  protocol: 'rikuy-v1';
  version: string;
  timestamp: number;
  reportId: string;
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
  location: {
    approximate: {
      lat: number;
      long: number;
      precision: string;
    };
    zkProof?: {
      nullifier: string;
      verified: boolean;
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
  datosReporte?: ArkivReportData;
  // Campos internos
  _internal?: {
    blockchainStatus: number;
    upvotes: number;
    downvotes: number;
  };
}
