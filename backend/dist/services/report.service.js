"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportService = void 0;
const ipfs_service_1 = require("./ipfs.service");
const ai_service_1 = require("./ai.service");
const arkiv_service_1 = require("./arkiv.service");
const relayer_service_1 = require("./relayer.service");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const crypto_1 = __importDefault(require("crypto"));
const logger = (0, logger_1.getServiceLogger)('ReportRelayerService');
class ReportRelayerService {
    async createReport(request) {
        const startTime = Date.now();
        try {
            logger.info('Starting report creation with relayer');
            this.validateLocation(request.location);
            logger.info('Step 1: Uploading image to IPFS');
            const { ipfsHash, url: imageUrl, fileHash } = await ipfs_service_1.ipfsService.uploadImage(request.photo);
            const isDuplicate = await ipfs_service_1.ipfsService.checkDuplicate(fileHash);
            if (isDuplicate) {
                throw new errors_1.DuplicateImageError();
            }
            logger.info('Step 2: AI analyzing image');
            const aiAnalysis = await ai_service_1.aiService.analyzeImage(imageUrl, request.category);
            const isAppropriate = await ai_service_1.aiService.moderateImage(imageUrl);
            if (!isAppropriate) {
                throw new errors_1.ContentModerationError();
            }
            const description = request.description || aiAnalysis.description;
            const reportId = this.generateReportId(fileHash, request.location);
            logger.info('Step 3: Storing in Arkiv');
            const arkivData = {
                protocol: 'rikuy-v1',
                version: '2.0.0',
                timestamp: Date.now(),
                reportId,
                category: {
                    id: request.category,
                    name: this.getCategoryName(request.category),
                },
                evidence: {
                    imageIPFS: ipfsHash,
                    imageHash: fileHash,
                    description,
                    aiGenerated: !request.description,
                    aiTags: aiAnalysis.tags,
                },
                location: {
                    approximate: {
                        lat: this.roundCoordinate(request.location.lat),
                        long: this.roundCoordinate(request.location.long),
                        precision: '~200m',
                    },
                    zkProof: {
                        nullifier: request.zkProof.publicSignals[0],
                        verified: true,
                    },
                },
                metadata: {
                    deviceHash: this.generateDeviceHash(request),
                    timestamp: Date.now(),
                },
            };
            const arkivTxId = await arkiv_service_1.arkivService.storeReport(arkivData);
            logger.info('Step 4: Creating on blockchain via Relayer');
            const relayerResult = await relayer_service_1.relayerService.createReport({
                arkivTxId,
                categoryId: request.category,
                zkProof: request.zkProof,
            });
            const estimatedReward = this.calculateEstimatedReward(request.category, aiAnalysis.severity);
            const duration = Date.now() - startTime;
            logger.info({
                reportId: relayerResult.reportId,
                txHash: relayerResult.txHash,
                gasCost: relayerResult.gasCost,
                duration,
            }, 'Report created successfully via relayer');
            return {
                success: true,
                reportId: relayerResult.reportId,
                status: 'confirmado',
                recompensa: {
                    puntos: estimatedReward,
                    mensaje: `Podrás ganar hasta ${estimatedReward} puntos cuando tu reporte sea validado`,
                },
                mensaje: '¡Reporte creado exitosamente! Está siendo procesado por la comunidad.',
                _internal: {
                    arkivTxId,
                    scrollTxHash: relayerResult.txHash,
                    gasUsed: relayerResult.gasUsed,
                    gasCost: relayerResult.gasCost,
                },
            };
        }
        catch (error) {
            logger.error({
                error: error.message,
                category: request.category,
            }, 'Report creation failed');
            throw (0, errors_1.createErrorFromException)(error);
        }
    }
    async getReport(reportId) {
        try {
            const report = await arkiv_service_1.arkivService.getReport(reportId);
            if (!report) {
                throw new Error('Report not found');
            }
            const blockchainStatus = await this.getBlockchainStatus(reportId);
            return {
                ...report,
                status: this.mapBlockchainStatusToUserFriendly(blockchainStatus),
                blockchain: blockchainStatus,
            };
        }
        catch (error) {
            logger.error({ error: error.message, reportId }, 'Get report failed');
            throw (0, errors_1.createErrorFromException)(error);
        }
    }
    async getNearbyReports(lat, long, radiusKm = 5) {
        this.validateLocation({ lat, long });
        const reports = await arkiv_service_1.arkivService.getNearbyReports(lat, long, radiusKm);
        return reports.map(report => ({
            reportId: report.reportId,
            category: report.category.name,
            description: report.evidence.description,
            location: report.location.approximate,
            timestamp: new Date(report.timestamp),
        }));
    }
    validateLocation(location) {
        const { latMin, latMax, longMin, longMax } = {
            latMin: -55.0,
            latMax: -21.0,
            longMin: -73.5,
            longMax: -53.0,
        };
        if (location.lat < latMin ||
            location.lat > latMax ||
            location.long < longMin ||
            location.long > longMax) {
            throw new errors_1.GeofenceError();
        }
    }
    generateReportId(fileHash, location) {
        const combined = `${fileHash}-${location.lat}-${location.long}-${Date.now()}`;
        return crypto_1.default.createHash('sha256').update(combined).digest('hex');
    }
    roundCoordinate(coord) {
        return Math.round(coord * 100) / 100;
    }
    generateDeviceHash(request) {
        const deviceInfo = `${request.photo.size}-${Date.now()}`;
        return crypto_1.default.createHash('sha256').update(deviceInfo).digest('hex').slice(0, 16);
    }
    getCategoryName(category) {
        const names = {
            0: 'Infraestructura',
            1: 'Inseguridad',
            2: 'Basura',
            3: 'Corrupción',
            4: 'Otro',
        };
        return names[category] || 'Otro';
    }
    calculateEstimatedReward(category, severity) {
        const basePoints = 100;
        const categoryMultiplier = category === 3 ? 2 : 1;
        const severityBonus = severity * 10;
        return basePoints + severityBonus * categoryMultiplier;
    }
    async getBlockchainStatus(reportId) {
        return {
            status: 'confirmed',
            confirmations: 12,
        };
    }
    mapBlockchainStatusToUserFriendly(blockchainStatus) {
        return 'En revisión';
    }
}
exports.reportService = new ReportRelayerService();
