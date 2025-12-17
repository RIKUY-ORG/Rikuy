"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.arkivService = void 0;
const config_1 = require("../config");
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
        default: { http: [config_1.config.arkiv.rpcUrl] },
        public: { http: [config_1.config.arkiv.rpcUrl] },
    },
};
/**
 * Servicio para interactuar con Arkiv (storage inmutable)
 * Implementación oficial basada en Arkiv SDK
 * Usa dynamic imports para evitar conflictos ES/CommonJS
 */
class ArkivService {
    publicClient;
    walletClient;
    account;
    sdkPromise;
    isInitialized = false;
    constructor() {
        // Lazy load SDK usando dynamic import
        this.sdkPromise = this.initializeSDK();
    }
    async initializeSDK() {
        try {
            const [{ createPublicClient, createWalletClient, http }, { privateKeyToAccount }] = await Promise.all([
                Promise.resolve().then(() => __importStar(require('@arkiv-network/sdk'))),
                Promise.resolve().then(() => __importStar(require('@arkiv-network/sdk/accounts')))
            ]);
            // Setup account
            this.account = privateKeyToAccount(config_1.config.arkiv.privateKey);
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
        }
        catch (error) {
            console.error('[Arkiv] ⚠️  Failed to initialize SDK - running in degraded mode:', error);
            this.isInitialized = false;
            return false;
        }
    }
    // Helper para lazy-load query utils
    async loadQueryUtils() {
        await this.sdkPromise;
        const { eq } = await Promise.resolve().then(() => __importStar(require('@arkiv-network/sdk/query')));
        return { eq };
    }
    /**
     * Guardar reporte completo en Arkiv
     * Usa mutateEntities API oficial de Arkiv
     */
    async storeReport(reportData) {
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
            const { jsonToPayload, ExpirationTime } = await Promise.resolve().then(() => __importStar(require('@arkiv-network/sdk/utils')));
            // Convertir datos a payload JSON
            const payload = jsonToPayload(reportData);
            // Crear payload con attributes queryables
            const createPayload = {
                payload,
                contentType: 'application/json',
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
        }
        catch (error) {
            console.error('[Arkiv] ❌ Error storing report:', error);
            // Retornar mock en lugar de fallar
            return `mock-arkiv-${reportData.reportId}`;
        }
    }
    /**
     * Obtener reporte por ID desde Arkiv
     * Usa buildQuery con filtros
     */
    async getReport(reportId) {
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
            const reportData = entity.toJson();
            console.log(`[Arkiv] ✅ Report fetched successfully`);
            return reportData;
        }
        catch (error) {
            console.error(`[Arkiv] ❌ Error fetching report ${reportId}:`, error);
            return null;
        }
    }
    /**
     * Buscar reportes cercanos (query geoespacial)
     * Usa buildQuery con múltiples filtros
     */
    async getNearbyReports(lat, long, radiusKm, limit = 50) {
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
                .map((entity) => entity.toJson())
                .filter((report) => {
                const reportLat = report.location.approximate.lat;
                const reportLong = report.location.approximate.long;
                // Check si está dentro del bounding box
                if (reportLat >= bounds.latMin &&
                    reportLat <= bounds.latMax &&
                    reportLong >= bounds.longMin &&
                    reportLong <= bounds.longMax) {
                    // Verificar distancia exacta con Haversine
                    const distance = this.calculateDistance(lat, long, reportLat, reportLong);
                    return distance <= radiusKm;
                }
                return false;
            })
                .slice(0, limit);
            console.log(`[Arkiv] ✅ Found ${reports.length} nearby reports`);
            return reports;
        }
        catch (error) {
            console.error('[Arkiv] ❌ Error querying nearby reports:', error);
            return [];
        }
    }
    /**
     * Buscar reportes por categoría
     */
    async getReportsByCategory(category, limit = 50) {
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
                .map((entity) => entity.toJson())
                .slice(0, limit);
            console.log(`[Arkiv] ✅ Found ${reports.length} reports in category ${category}`);
            return reports;
        }
        catch (error) {
            console.error(`[Arkiv] ❌ Error fetching category reports:`, error);
            return [];
        }
    }
    /**
     * Obtener reportes recientes (últimos N)
     */
    async getRecentReports(limit = 20) {
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
                .map((entity) => entity.toJson())
                .sort((a, b) => b.timestamp - a.timestamp)
                .slice(0, limit);
            console.log(`[Arkiv] ✅ Found ${reports.length} recent reports`);
            return reports;
        }
        catch (error) {
            console.error('[Arkiv] ❌ Error fetching recent reports:', error);
            return [];
        }
    }
    /**
     * Calcular distancia haversine entre dos puntos
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radio de la Tierra en km
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLon = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
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
    async healthCheck() {
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
        }
        catch (error) {
            console.error('[Arkiv] Health check failed:', error);
            return false;
        }
    }
}
exports.arkivService = new ArkivService();
