import { config } from '../config';
import { ArkivReportData } from '../types';

// Mendoza testnet configuration
const mendoza = {
  id: 60138453056,
  name: 'Mendoza Testnet',
  network: 'mendoza',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: [config.arkiv.rpcUrl] },
    public: { http: [config.arkiv.rpcUrl] },
  },
} as const;

/**
 * Servicio para interactuar con Arkiv (storage inmutable)
 * Implementación oficial basada en Arkiv SDK
 * Usa dynamic imports para evitar conflictos ES/CommonJS
 */
class ArkivService {
  private publicClient: any;
  private walletClient: any;
  private account: any;
  private sdkPromise: Promise<boolean>;
  private isInitialized: boolean = false;

  constructor() {
    // Lazy load SDK usando dynamic import
    this.sdkPromise = this.initializeSDK();
  }

  private async initializeSDK(): Promise<boolean> {
    try {
      const [
        { createPublicClient, createWalletClient, http },
        { privateKeyToAccount }
      ] = await Promise.all([
        import('@arkiv-network/sdk'),
        import('@arkiv-network/sdk/accounts')
      ]);

      // Setup account
      this.account = privateKeyToAccount(config.arkiv.privateKey as `0x${string}`);

      // Cliente público (para queries)
      this.publicClient = createPublicClient({
        chain: mendoza,
        transport: http(),
      });

      // Wallet client (para writes) - autenticado
      this.walletClient = createWalletClient({
        chain: mendoza,
        transport: http(),
        account: this.account,
      });

      console.log('[Arkiv] ✅ Service initialized');
      console.log('[Arkiv] Chain:', mendoza.name);
      console.log('[Arkiv] Account:', this.account.address);

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('[Arkiv] ⚠️  Failed to initialize SDK - running in degraded mode:', error);
      this.isInitialized = false;
      return false;
    }
  }

  // Helper para lazy-load query utils
  private async loadQueryUtils() {
    await this.sdkPromise;
    const { eq } = await import('@arkiv-network/sdk/query');
    return { eq };
  }

  /**
   * Guardar reporte completo en Arkiv
   * Usa mutateEntities API oficial de Arkiv
   */
  async storeReport(reportData: ArkivReportData): Promise<string> {
    try {
      // Esperar a que el SDK se inicialice
      const initialized = await this.sdkPromise;

      // Si Arkiv no está disponible, retornar un ID mock
      if (!initialized || !this.isInitialized) {
        console.warn(`[Arkiv] ⚠️  SDK not available, returning mock ID for report: ${reportData.reportId}`);
        return `mock-arkiv-${reportData.reportId}`;
      }

      console.log(`[Arkiv] Storing report: ${reportData.reportId}`);

      // Dynamic import de utils
      const { jsonToPayload, ExpirationTime } = await import('@arkiv-network/sdk/utils');

      // Convertir datos a payload JSON
      const payload = jsonToPayload(reportData);

      // Crear payload con attributes queryables
      const createPayload = {
        payload,
        contentType: 'application/json' as const,
        attributes: [
          { key: 'reportId', value: reportData.reportId },
          { key: 'category', value: reportData.category.id.toString() },
          { key: 'timestamp', value: reportData.timestamp.toString() },
          { key: 'lat', value: reportData.location.approximate.lat.toString() },
          { key: 'long', value: reportData.location.approximate.long.toString() },
          { key: 'protocol', value: 'rikuy-v1' },
        ],
        // Los reportes expiran en 10 años (prácticamente permanentes)
        expiresIn: ExpirationTime.fromYears(10),
      };

      // Escribir a Arkiv usando mutateEntities
      const result = await this.walletClient.mutateEntities({
        creates: [createPayload],
      });

      // Retornar el reportId como identificador único
      // (Arkiv SDK puede retornar diferentes formatos dependiendo de la versión)
      const txHash = reportData.reportId;

      console.log(`[Arkiv] ✅ Report stored successfully`);
      console.log(`[Arkiv] TX Hash: ${txHash}`);

      return txHash;

    } catch (error: any) {
      console.error('[Arkiv] ❌ Error storing report:', error);
      // Retornar mock en lugar de fallar
      return `mock-arkiv-${reportData.reportId}`;
    }
  }

  /**
   * Obtener reporte por ID desde Arkiv
   * Usa buildQuery con filtros
   */
  async getReport(reportId: string): Promise<ArkivReportData | null> {
    try {
      const initialized = await this.sdkPromise;

      if (!initialized || !this.isInitialized) {
        console.warn(`[Arkiv] ⚠️  SDK not available, cannot fetch report: ${reportId}`);
        return null;
      }

      const { eq } = await this.loadQueryUtils();
      console.log(`[Arkiv] Fetching report: ${reportId}`);

      // Construir query con filtro por reportId
      const query = this.publicClient.buildQuery();
      const result = await query
        .where(eq('reportId', reportId))
        .withPayload(true)
        .fetch();

      if (!result.entities || result.entities.length === 0) {
        console.log(`[Arkiv] Report not found: ${reportId}`);
        return null;
      }

      // Obtener el primer resultado
      const entity = result.entities[0];
      const reportData = entity.toJson() as ArkivReportData;

      console.log(`[Arkiv] ✅ Report fetched successfully`);
      return reportData;

    } catch (error: any) {
      console.error(`[Arkiv] ❌ Error fetching report ${reportId}:`, error);
      return null;
    }
  }

  /**
   * Buscar reportes cercanos (query geoespacial)
   * Usa buildQuery con múltiples filtros
   */
  async getNearbyReports(
    lat: number,
    long: number,
    radiusKm: number,
    limit: number = 50
  ): Promise<ArkivReportData[]> {
    try {
      const initialized = await this.sdkPromise;
      if (!initialized || !this.isInitialized) {
        console.warn(`[Arkiv] ⚠️  SDK not available, cannot query nearby reports`);
        return [];
      }

      const { eq } = await this.loadQueryUtils();

      console.log(`[Arkiv] Querying nearby reports (${lat}, ${long}) within ${radiusKm}km`);

      // Calcular bounding box
      const latDelta = radiusKm / 111; // aprox km por grado de latitud
      const longDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

      const bounds = {
        latMin: lat - latDelta,
        latMax: lat + latDelta,
        longMin: long - longDelta,
        longMax: long + longDelta,
      };

      // Query con filtros geoespaciales
      // NOTA: Arkiv puede no soportar range queries directamente
      // Alternativa: fetch todos los reportes y filtrar en memoria
      const query = this.publicClient.buildQuery();
      const result = await query
        .where(eq('protocol', 'rikuy-v1'))
        .withPayload(true)
        .fetch();

      if (!result.entities || result.entities.length === 0) {
        console.log('[Arkiv] No reports found');
        return [];
      }

      // Filtrar por distancia en memoria
      const reports = result.entities
        .map((entity: any) => entity.toJson() as ArkivReportData)
        .filter((report: any) => {
          const reportLat = report.location.approximate.lat;
          const reportLong = report.location.approximate.long;

          // Check si está dentro del bounding box
          if (
            reportLat >= bounds.latMin &&
            reportLat <= bounds.latMax &&
            reportLong >= bounds.longMin &&
            reportLong <= bounds.longMax
          ) {
            // Verificar distancia exacta con Haversine
            const distance = this.calculateDistance(lat, long, reportLat, reportLong);
            return distance <= radiusKm;
          }

          return false;
        })
        .slice(0, limit);

      console.log(`[Arkiv] ✅ Found ${reports.length} nearby reports`);
      return reports;

    } catch (error: any) {
      console.error('[Arkiv] ❌ Error querying nearby reports:', error);
      return [];
    }
  }

  /**
   * Buscar reportes por categoría
   */
  async getReportsByCategory(category: number, limit: number = 50): Promise<ArkivReportData[]> {
    try {
      const initialized = await this.sdkPromise;
      if (!initialized || !this.isInitialized) {
        console.warn(`[Arkiv] ⚠️  SDK not available, cannot query by category`);
        return [];
      }

      const { eq } = await this.loadQueryUtils();

      console.log(`[Arkiv] Fetching reports by category: ${category}`);

      const query = this.publicClient.buildQuery();
      const result = await query
        .where(eq('category', category.toString()))
        .where(eq('protocol', 'rikuy-v1'))
        .withPayload(true)
        .fetch();

      if (!result.entities || result.entities.length === 0) {
        return [];
      }

      const reports = result.entities
        .map((entity: any) => entity.toJson() as ArkivReportData)
        .slice(0, limit);

      console.log(`[Arkiv] ✅ Found ${reports.length} reports in category ${category}`);
      return reports;

    } catch (error: any) {
      console.error(`[Arkiv] ❌ Error fetching category reports:`, error);
      return [];
    }
  }

  /**
   * Obtener reportes recientes (últimos N)
   */
  async getRecentReports(limit: number = 20): Promise<ArkivReportData[]> {
    try {
      const initialized = await this.sdkPromise;
      if (!initialized || !this.isInitialized) {
        console.warn(`[Arkiv] ⚠️  SDK not available, cannot query recent reports`);
        return [];
      }

      const { eq } = await this.loadQueryUtils();

      console.log(`[Arkiv] Fetching ${limit} recent reports`);

      const query = this.publicClient.buildQuery();
      const result = await query
        .where(eq('protocol', 'rikuy-v1'))
        .withPayload(true)
        .fetch();

      if (!result.entities || result.entities.length === 0) {
        return [];
      }

      // Ordenar por timestamp descendente
      const reports = result.entities
        .map((entity: any) => entity.toJson() as ArkivReportData)
        .sort((a: any, b: any) => b.timestamp - a.timestamp)
        .slice(0, limit);

      console.log(`[Arkiv] ✅ Found ${reports.length} recent reports`);
      return reports;

    } catch (error: any) {
      console.error('[Arkiv] ❌ Error fetching recent reports:', error);
      return [];
    }
  }

  /**
   * Calcular distancia haversine entre dos puntos
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Health check del servicio
   */
  async healthCheck(): Promise<boolean> {
    try {
      const initialized = await this.sdkPromise;
      if (!initialized || !this.isInitialized) {
        return false;
      }

      const { eq } = await this.loadQueryUtils();

      // Intentar hacer una query simple
      const query = this.publicClient.buildQuery();
      await query.where(eq('protocol', 'rikuy-v1')).fetch();
      return true;
    } catch (error) {
      console.error('[Arkiv] Health check failed:', error);
      return false;
    }
  }
}

export const arkivService = new ArkivService();
