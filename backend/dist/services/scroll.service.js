"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrollService = void 0;
const ethers_1 = require("ethers");
const config_1 = require("../config");
// ABI simplificado (solo las funciones que usamos)
const RIKUY_ABI = [
    'function createReport(bytes32 _arkivTxId, uint16 _categoryId, uint256[8] calldata _zkProof) external returns (bytes32 reportId)',
    'function validateReport(bytes32 _reportId, bool _isValid) external',
    'function getReportStatus(bytes32 _reportId) external view returns (uint8 status, uint256 upvotes, uint256 downvotes, bool isVerified, bool isResolved)',
    'event ReportCreated(bytes32 indexed reportId, bytes32 indexed nullifier, bytes32 arkivTxId, uint16 category, uint256 timestamp)',
];
/**
 * Servicio para interactuar con smart contracts en Scroll
 */
class ScrollService {
    provider;
    wallet;
    contract;
    constructor() {
        this.provider = new ethers_1.ethers.JsonRpcProvider(config_1.config.blockchain.rpcUrl);
        this.wallet = new ethers_1.ethers.Wallet(config_1.config.blockchain.relayerPrivateKey, this.provider);
        this.contract = new ethers_1.ethers.Contract(config_1.config.blockchain.contracts.rikuyCoreV2, RIKUY_ABI, this.wallet);
    }
    /**
     * Crear reporte en blockchain
     */
    async createReport(arkivTxId, categoryId, zkProof) {
        try {
            console.log(`[Scroll] Creating report on-chain...`);
            // Convertir arkivTxId a bytes32
            // arkivTxId ya es un hash SHA-256 hex, solo necesitamos agregar 0x
            const arkivTxIdBytes = arkivTxId.startsWith('0x')
                ? arkivTxId
                : `0x${arkivTxId}`;
            // Mock ZK proof (8 elementos)
            // En producción, esto viene del ZK prover
            const mockProof = zkProof.length === 8 ? zkProof : [0, 0, 0, 0, 0, 0, 0, 0];
            // Estimar gas primero
            const gasEstimate = await this.contract.createReport.estimateGas(arkivTxIdBytes, categoryId, mockProof);
            console.log(`[Scroll] Gas estimate: ${gasEstimate.toString()}`);
            // Enviar transacción
            const tx = await this.contract.createReport(arkivTxIdBytes, categoryId, mockProof, {
                gasLimit: (gasEstimate * 120n) / 100n, // +20% buffer
            });
            console.log(`[Scroll] TX sent: ${tx.hash}`);
            // Esperar confirmación
            const receipt = await tx.wait();
            // Extraer reportId del evento
            const event = receipt.logs
                .map((log) => {
                try {
                    return this.contract.interface.parseLog(log);
                }
                catch {
                    return null;
                }
            })
                .find((e) => e?.name === 'ReportCreated');
            const reportId = event?.args?.reportId || ethers_1.ethers.id(`report-${Date.now()}`);
            console.log(`[Scroll] Report created: ${reportId}`);
            return {
                txHash: receipt.hash,
                reportId,
            };
        }
        catch (error) {
            console.error('[Scroll] Create report failed:', error);
            throw new Error(`Blockchain transaction failed: ${error.message}`);
        }
    }
    /**
     * Validar reporte (upvote/downvote)
     */
    async validateReport(reportId, isValid) {
        try {
            console.log(`[Scroll] Validating report ${reportId}: ${isValid}`);
            // reportId ya es un hash SHA-256 hex, solo necesitamos agregar 0x
            const reportIdBytes = reportId.startsWith('0x')
                ? reportId
                : `0x${reportId}`;
            const tx = await this.contract.validateReport(reportIdBytes, isValid);
            const receipt = await tx.wait();
            console.log(`[Scroll] Validation TX: ${receipt.hash}`);
            return receipt.hash;
        }
        catch (error) {
            console.error('[Scroll] Validation failed:', error);
            throw new Error(`Validation failed: ${error.message}`);
        }
    }
    /**
     * Obtener estado de reporte
     */
    async getReportStatus(reportId) {
        try {
            // reportId ya es un hash SHA-256 hex, solo necesitamos agregar 0x
            const reportIdBytes = reportId.startsWith('0x')
                ? reportId
                : `0x${reportId}`;
            const result = await this.contract.getReportStatus(reportIdBytes);
            return {
                status: Number(result[0]),
                upvotes: Number(result[1]),
                downvotes: Number(result[2]),
                isVerified: result[3],
                isResolved: result[4],
            };
        }
        catch (error) {
            console.error('[Scroll] Get status failed:', error);
            throw new Error('Failed to fetch report status');
        }
    }
    /**
     * Obtener balance del wallet
     */
    async getBalance() {
        const balance = await this.provider.getBalance(this.wallet.address);
        return ethers_1.ethers.formatEther(balance);
    }
}
exports.scrollService = new ScrollService();
