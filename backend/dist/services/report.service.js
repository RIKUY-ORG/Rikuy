"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportService = void 0;
const ipfs_service_1 = require("./ipfs.service");
const ai_service_1 = require("./ai.service");
const relayer_service_1 = require("./relayer.service");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const crypto_1 = __importDefault(require("crypto"));
const ethers_1 = require("ethers");
const logger = (0, logger_1.getServiceLogger)('ReportRelayerService');
class ReportRelayerService {
    // ─────────────────────────────────────────────────────────────────────────
    // EIP-712 — Typed structured data for citizen signature verification
    // ─────────────────────────────────────────────────────────────────────────
    EIP712_DOMAIN = {
        name: 'Rikuy',
        version: '2',
        chainId: parseInt(process.env.RIKUY_CHAIN_ID || '313370'),
    };
    EIP712_TYPES = {
        RikuyReport: [
            { name: 'contentHash', type: 'bytes32' },
            { name: 'category', type: 'uint16' },
            { name: 'accusedEntity', type: 'string' },
            { name: 'incidentDate', type: 'string' },
            { name: 'timestamp', type: 'uint256' },
        ],
    };
    /**
     * Verificar firma EIP-712 del ciudadano
     * @returns signatureHash si es valida, undefined si no se provee firma
     * @throws si la firma es invalida
     */
    verifyEIP712Signature(signature, message, expectedAddress) {
        const recovered = ethers_1.ethers.verifyTypedData(this.EIP712_DOMAIN, this.EIP712_TYPES, message, signature);
        if (recovered.toLowerCase() !== expectedAddress.toLowerCase()) {
            throw new Error(`EIP-712 signature mismatch: recovered ${recovered}, expected ${expectedAddress}`);
        }
        logger.info({ recovered }, 'EIP-712 signature verified');
        return ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(signature));
    }
    // ─────────────────────────────────────────────────────────────────────────
    // REPORT CREATION — Ley 974 compliant
    // ─────────────────────────────────────────────────────────────────────────
    /**
     * Crear denuncia anonima con validez legal (Ley 974) — flujo completo:
     * 1. Upload foto a IPFS (EXIF stripped)
     * 2. AI analiza imagen (Gemini Pro Vision)
     * 3. Generar contentHash v2 (incluye campos legales Ley 974)
     * 4. Verificar firma EIP-712 del ciudadano (si existe)
     * 5. Almacenar metadata completa en IPFS (Pinata)
     * 6. Generar commitment anonimo + nullifier
     * 7. Enviar TX a blockchain via Relayer
     * 8. Cross-reference reportIds (IPFS <-> on-chain)
     */
    async createReport(request) {
        const startTime = Date.now();
        try {
            logger.info('Starting Ley 974 compliant report creation');
            this.validateLocation(request.location);
            // ── Step 1: Upload foto a IPFS ──
            logger.info('Step 1: Uploading image to IPFS');
            const { ipfsHash, url: imageUrl, fileHash } = await ipfs_service_1.ipfsService.uploadImage(request.photo);
            const isDuplicate = await ipfs_service_1.ipfsService.checkDuplicate(fileHash);
            if (isDuplicate) {
                throw new errors_1.DuplicateImageError();
            }
            // ── Step 2: AI analiza imagen ──
            logger.info('Step 2: AI analyzing image');
            const aiAnalysis = await ai_service_1.aiService.analyzeImage(imageUrl, request.category);
            const isAppropriate = await ai_service_1.aiService.moderateImage(imageUrl);
            if (!isAppropriate) {
                throw new errors_1.ContentModerationError();
            }
            // Usar detailedDescription (Ley 974) con fallback a description/AI
            const detailedDescription = request.detailedDescription || request.description || aiAnalysis.description;
            const accusedEntity = request.accusedEntity;
            const incidentDate = request.incidentDate;
            const evidenceDescription = request.evidenceDescription || '';
            // ── Step 3: Generar contentHash v2 con campos legales ──
            // CRITICO: Este hash se almacena on-chain en Stylus (write-once, sin upgrade).
            // Incluir todos los campos legales garantiza inmutabilidad verificable
            // segun Ley 974 Art. 18-24.
            logger.info('Step 3: Generating contentHash v2 (Ley 974 fields)');
            const contentHashTimestamp = Date.now();
            const contentHashPayload = {
                v: 2,
                ipfsHash,
                fileHash,
                category: request.category,
                accusedEntity,
                incidentDate,
                detailedDescription,
                evidenceDescription,
                ts: contentHashTimestamp,
            };
            const contentHash = ethers_1.ethers.keccak256(ethers_1.ethers.toUtf8Bytes(JSON.stringify(contentHashPayload)));
            // ── Step 4: Verificar firma EIP-712 (si existe) ──
            const walletAddress = request.walletAddress || ethers_1.ethers.ZeroAddress;
            let citizenSignatureHash;
            if (request.citizenSignature && walletAddress !== ethers_1.ethers.ZeroAddress) {
                logger.info('Step 4: Verifying EIP-712 citizen signature');
                try {
                    citizenSignatureHash = this.verifyEIP712Signature(request.citizenSignature, {
                        contentHash,
                        category: request.category,
                        accusedEntity,
                        incidentDate,
                        timestamp: contentHashTimestamp,
                    }, walletAddress);
                }
                catch (sigError) {
                    logger.warn({ error: sigError.message }, 'EIP-712 signature verification failed — proceeding without signature');
                    // No bloquear el reporte si la firma falla — es opcional
                }
            }
            else {
                logger.info('Step 4: No citizen signature provided — skipping EIP-712 verification');
            }
            // ── Step 5: Almacenar metadata legal en IPFS (Pinata) ──
            const localReportId = this.generateReportId(fileHash, request.location);
            logger.info('Step 5: Storing complete metadata in IPFS (Pinata)');
            const reportMetadata = {
                protocol: 'rikuy-v2',
                version: '3.0.0',
                timestamp: Date.now(),
                reportId: localReportId,
                contentHash,
                category: {
                    id: request.category,
                    name: this.getCategoryName(request.category),
                },
                evidence: {
                    imageIPFS: ipfsHash,
                    imageHash: fileHash,
                    description: detailedDescription,
                    aiGenerated: !request.detailedDescription && !request.description,
                    aiTags: aiAnalysis.tags,
                },
                // Campos legales Ley 974 — almacenamiento completo
                legalFields: {
                    accusedEntity,
                    incidentDate,
                    detailedDescription,
                    evidenceDescription,
                    legalFramework: 'Ley 974 Art. 18-24',
                    contentHashVersion: 2,
                    citizenSignatureHash,
                },
                location: {
                    approximate: {
                        lat: this.roundCoordinate(request.location.lat),
                        long: this.roundCoordinate(request.location.long),
                        precision: '~200m',
                    },
                },
                metadata: {
                    deviceHash: this.generateDeviceHash(request),
                    timestamp: Date.now(),
                },
            };
            const metadataResult = await ipfs_service_1.ipfsService.uploadJSON(reportMetadata, {
                name: `rikuy-report-${localReportId}`,
                keyvalues: {
                    reportId: localReportId,
                    category: request.category.toString(),
                    protocol: 'rikuy-v2',
                    timestamp: Date.now().toString(),
                },
            });
            const metadataIpfsHash = metadataResult.ipfsHash;
            // ── Step 6: Generar commitment anonimo + nullifier ──
            logger.info('Step 6: Generating anonymous commitment');
            const nonce = Date.now();
            const commitment = relayer_service_1.relayerService.generateCommitment(walletAddress, nonce);
            const nullifier = relayer_service_1.relayerService.generateNullifier(commitment, fileHash);
            // Coordenadas multiplicadas por 1_000_000 para precision entera
            const latitude = Math.round(request.location.lat * 1_000_000);
            const longitude = Math.round(request.location.long * 1_000_000);
            // ── Step 7: Crear reporte on-chain ──
            logger.info('Step 7: Creating report on blockchain via Relayer');
            const relayerResult = await relayer_service_1.relayerService.createReport({
                contentHash,
                categoryId: request.category,
                commitment,
                nullifier,
                latitude,
                longitude,
                aiValidated: aiAnalysis.severity > 0,
            });
            // ── Step 8: Cross-reference + response ──
            const duration = Date.now() - startTime;
            logger.info({
                onChainReportId: relayerResult.reportId,
                localReportId,
                metadataIpfsHash,
                imageIpfsHash: ipfsHash,
                txHash: relayerResult.txHash,
                contentHashVersion: 2,
                hasCitizenSignature: !!citizenSignatureHash,
                gasCost: relayerResult.gasCost,
                duration,
            }, 'Ley 974 compliant report created successfully');
            return {
                success: true,
                reportId: relayerResult.reportId,
                contentHash,
                status: 'confirmado',
                recompensa: {
                    puntos: 0,
                    mensaje: 'Tu reporte sera validado por la comunidad',
                },
                mensaje: 'Denuncia registrada con validez legal (Ley 974). Los datos son inmutables en blockchain.',
                blockchain: {
                    transactionHash: relayerResult.txHash,
                    blockNumber: relayerResult.blockNumber,
                    metadataIpfsHash,
                    imageIpfsHash: ipfsHash,
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
            // Buscar metadata en Pinata por keyvalue reportId
            const files = await ipfs_service_1.ipfsService.findByKeyValues({ reportId, protocol: 'rikuy-v2' }, 1);
            if (files.length === 0) {
                throw new Error('Report not found');
            }
            // Descargar metadata JSON desde IPFS
            const report = await ipfs_service_1.ipfsService.getJSON(files[0].ipfsHash);
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
        // Listar reportes desde Pinata, filtrar por ubicación en memoria
        const files = await ipfs_service_1.ipfsService.findByKeyValues({ protocol: 'rikuy-v2' }, 100);
        const reports = [];
        for (const file of files) {
            try {
                const report = await ipfs_service_1.ipfsService.getJSON(file.ipfsHash);
                const distance = this.haversineDistance(lat, long, report.location.approximate.lat, report.location.approximate.long);
                if (distance <= radiusKm) {
                    reports.push({
                        reportId: report.reportId,
                        category: report.category.name,
                        description: report.evidence.description,
                        location: report.location.approximate,
                        timestamp: new Date(report.timestamp),
                    });
                }
            }
            catch {
                // Skip reportes con metadata corrupta
                continue;
            }
        }
        return reports;
    }
    /**
     * Haversine formula — distancia en km entre dos coordenadas
     */
    haversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radio de la Tierra en km
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    toRad(deg) {
        return deg * (Math.PI / 180);
    }
    validateLocation(location) {
        const { latMin, latMax, longMin, longMax } = {
            latMin: -23.0,
            latMax: -9.5,
            longMin: -70.0,
            longMax: -57.0,
        };
        if (location.lat < latMin ||
            location.lat > latMax ||
            location.long < longMin ||
            location.long > longMax) {
            throw new errors_1.GeofenceError('Bolivia');
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
