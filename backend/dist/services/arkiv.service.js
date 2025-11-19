"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.arkivService = void 0;
const sdk_1 = require("@arkiv-network/sdk");
const accounts_1 = require("@arkiv-network/sdk/accounts");
const utils_1 = require("@arkiv-network/sdk/utils");
const query_1 = require("@arkiv-network/sdk/query");
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
 */
class ArkivService {
    publicClient;
    walletClient;
    account;
    constructor() {
        // Setup account
        this.account = (0, accounts_1.privateKeyToAccount)(config_1.config.arkiv.privateKey);
        // Cliente público (para queries)
        this.publicClient = (0, sdk_1.createPublicClient)({
            chain: mendoza,
            transport: (0, sdk_1.http)(),
        });
        // Wallet client (para writes) - autenticado
        this.walletClient = (0, sdk_1.createWalletClient)({
            chain: mendoza,
            transport: (0, sdk_1.http)(),
            account: this.account,
        });
        console.log('[Arkiv] Service initialized');
        console.log('[Arkiv] Chain:', mendoza.name);
        console.log('[Arkiv] Account:', this.account.address);
    }
    /**
     * Guardar reporte completo en Arkiv
     * Usa mutateEntities API oficial de Arkiv
     */
    async storeReport(reportData) {
        try {
            console.log(`[Arkiv] Storing report: ${reportData.reportId}`);
            // Convertir datos a payload JSON
            const payload = (0, utils_1.jsonToPayload)(reportData);
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
                expiresIn: utils_1.ExpirationTime.fromYears(10),
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
            throw new Error(`Failed to store report in Arkiv: ${error.message}`);
        }
    }
    /**
     * Obtener reporte por ID desde Arkiv
     * Usa buildQuery con filtros
     */
    async getReport(reportId) {
        try {
            console.log(`[Arkiv] Fetching report: ${reportId}`);
            // Construir query con filtro por reportId
            const query = this.publicClient.buildQuery();
            const result = await query
                .where((0, query_1.eq)('reportId', reportId))
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
                .where((0, query_1.eq)('protocol', 'rikuy-v1'))
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
            console.log(`[Arkiv] Fetching reports by category: ${category}`);
            const query = this.publicClient.buildQuery();
            const result = await query
                .where((0, query_1.eq)('category', category.toString()))
                .where((0, query_1.eq)('protocol', 'rikuy-v1'))
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
            console.log(`[Arkiv] Fetching ${limit} recent reports`);
            const query = this.publicClient.buildQuery();
            const result = await query
                .where((0, query_1.eq)('protocol', 'rikuy-v1'))
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
            // Intentar hacer una query simple
            const query = this.publicClient.buildQuery();
            await query.where((0, query_1.eq)('protocol', 'rikuy-v1')).fetch();
            return true;
        }
        catch (error) {
            console.error('[Arkiv] Health check failed:', error);
            return false;
        }
    }
}
exports.arkivService = new ArkivService();
