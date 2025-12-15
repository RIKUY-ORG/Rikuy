// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../interfaces/IReportRegistry.sol";
import "../interfaces/ITreasury.sol";
import "../zk/SemaphoreAdapter.sol";

/**
 * @title RikuyCoreV2
 * @notice Contrato principal de RIKUY - Versión con Backend Relayer
 * @dev Backend firma transacciones en nombre del usuario (paga gas)
 *      Usuario genera ZK proof localmente (privacidad mantenida)
 *
 * Flujo:
 * 1. Usuario genera ZK proof en su dispositivo (privado)
 * 2. Usuario envía proof al backend (HTTP)
 * 3. Backend verifica proof y crea TX on-chain
 * 4. Backend paga gas → Usuario no necesita ETH
 */
contract RikuyCoreV2 is UUPSUpgradeable, AccessControlUpgradeable {

    bytes32 public constant GOVERNMENT_ROLE = keccak256("GOVERNMENT");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR");
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER"); // Backend wallet

    IReportRegistry public reportRegistry;
    ITreasury public treasury;
    SemaphoreAdapter public semaphoreAdapter;

    uint8 public constant VERIFICATION_THRESHOLD = 5;

    // Tracking de validadores por reporte
    mapping(bytes32 => address[]) private reportValidators;
    mapping(bytes32 => uint256) private reportUpvotes;
    mapping(bytes32 => uint256) private reportDownvotes;

    enum ReportStatus { Pending, Verified, Disputed, Resolved }

    event ReportCreated(
        bytes32 indexed reportId,
        uint256 indexed nullifier,
        bytes32 arkivTxId,
        uint16 category,
        uint256 timestamp
    );
    event ReportValidated(
        bytes32 indexed reportId,
        address indexed validator,
        bool isValid
    );
    event ReportVerified(bytes32 indexed reportId, uint256 totalValidations);
    event ReportResolved(
        bytes32 indexed reportId,
        ReportStatus finalStatus,
        address indexed governmentApprover
    );

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _admin,
        address _reportRegistry,
        address _treasury,
        address _semaphoreAdapter
    ) public initializer {
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(OPERATOR_ROLE, _admin);

        reportRegistry = IReportRegistry(_reportRegistry);
        treasury = ITreasury(_treasury);
        semaphoreAdapter = SemaphoreAdapter(_semaphoreAdapter);
    }

    /**
     * @notice Agregar backend wallet como relayer (puede crear reportes)
     * @param _relayer Dirección del backend wallet
     */
    function addRelayer(address _relayer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(RELAYER_ROLE, _relayer);
    }

    /**
     * @notice Crear reporte anónimo con ZK proof (versión Backend Relayer)
     * @param _arkivTxId Hash de transacción en Arkiv (evidencia inmutable)
     * @param _categoryId Categoría del incidente
     * @param _zkProof Proof Groth16 [pA[2], pB[4], pC[2]]
     * @param _pubSignals Public signals [nullifier, merkleRoot, message, scope]
     * @dev Solo puede ser llamado por RELAYER (backend wallet)
     *      Usuario genera proof localmente → Backend solo envía TX
     */
    function createReport(
        bytes32 _arkivTxId,
        uint16 _categoryId,
        uint256[8] calldata _zkProof,
        uint256[4] calldata _pubSignals
    ) external onlyRole(RELAYER_ROLE) returns (bytes32 reportId) {

        require(_categoryId <= 4, "Invalid category"); // 0-4 según spec

        // Decodificar proof Groth16
        uint256[2] memory pA = [_zkProof[0], _zkProof[1]];
        uint256[2][2] memory pB = [[_zkProof[2], _zkProof[3]], [_zkProof[4], _zkProof[5]]];
        uint256[2] memory pC = [_zkProof[6], _zkProof[7]];

        // Verificar ZK proof usando Semaphore
        bool isValidProof = semaphoreAdapter.verifyProof(pA, pB, pC, _pubSignals);
        require(isValidProof, "Invalid ZK proof");

        // Validar proof on-chain (marca nullifier como usado)
        semaphoreAdapter.validateProof(pA, pB, pC, _pubSignals);

        // Extraer nullifier
        uint256 nullifier = _pubSignals[0];

        // Generar ID único del reporte
        reportId = keccak256(abi.encodePacked(
            nullifier,
            block.timestamp,
            _arkivTxId,
            _categoryId
        ));

        // Guardar en registry
        reportRegistry.storeReport(
            reportId,
            _arkivTxId,
            bytes32(nullifier),
            _categoryId
        );

        emit ReportCreated(
            reportId,
            nullifier,
            _arkivTxId,
            _categoryId,
            block.timestamp
        );

        return reportId;
    }

    /**
     * @notice Validar reporte (votar si es real o no)
     * @param _reportId ID del reporte
     * @param _isValid true = es real, false = es falso
     * @dev Cualquiera puede validar (ciudadanos verificando reportes)
     */
    function validateReport(bytes32 _reportId, bool _isValid) external {
        IReportRegistry.Report memory report = reportRegistry.getReport(_reportId);
        require(report.timestamp > 0, "Report does not exist");
        require(!report.isResolved, "Report already resolved");
        require(!reportRegistry.hasUserValidated(_reportId, msg.sender), "Already validated");

        // Registrar validación
        reportRegistry.recordValidation(_reportId, msg.sender);

        if (_isValid) {
            reportUpvotes[_reportId]++;
            reportValidators[_reportId].push(msg.sender);
        } else {
            reportDownvotes[_reportId]++;
        }

        emit ReportValidated(_reportId, msg.sender, _isValid);

        // Auto-verificar si alcanza threshold
        if (reportUpvotes[_reportId] >= VERIFICATION_THRESHOLD) {
            reportRegistry.incrementValidationScore(_reportId);
            emit ReportVerified(_reportId, reportUpvotes[_reportId]);
        }
    }

    /**
     * @notice Resolver reporte (solo gobierno)
     * @param _reportId ID del reporte
     * @param _approved true = aprobar y pagar, false = rechazar
     */
    function resolveReport(bytes32 _reportId, bool _approved)
        external
        onlyRole(GOVERNMENT_ROLE)
    {
        IReportRegistry.Report memory report = reportRegistry.getReport(_reportId);
        require(report.timestamp > 0, "Report does not exist");
        require(!report.isResolved, "Already resolved");
        require(reportUpvotes[_reportId] >= VERIFICATION_THRESHOLD, "Not enough validations");

        // Marcar como resuelto
        reportRegistry.markAsResolved(_reportId);

        ReportStatus finalStatus = _approved ? ReportStatus.Resolved : ReportStatus.Disputed;

        // Si aprobado, liberar recompensas
        if (_approved) {
            address[] memory validators = reportValidators[_reportId];

            // IMPORTANTE: No podemos pagar al reporter porque es anónimo
            // La recompensa se maneja off-chain o via otro mecanismo
            treasury.releaseRewards(
                _reportId,
                report.categoryId,
                address(0), // Reporter anónimo (no podemos pagar on-chain)
                validators
            );
        }

        emit ReportResolved(_reportId, finalStatus, msg.sender);
    }

    /**
     * @notice Obtener estado de un reporte
     */
    function getReportStatus(bytes32 _reportId)
        external
        view
        returns (
            ReportStatus status,
            uint256 upvotes,
            uint256 downvotes,
            bool isVerified,
            bool isResolved
        )
    {
        IReportRegistry.Report memory report = reportRegistry.getReport(_reportId);

        upvotes = reportUpvotes[_reportId];
        downvotes = reportDownvotes[_reportId];
        isVerified = upvotes >= VERIFICATION_THRESHOLD;
        isResolved = report.isResolved;

        if (isResolved) {
            status = ReportStatus.Resolved;
        } else if (isVerified) {
            status = ReportStatus.Verified;
        } else if (downvotes > upvotes) {
            status = ReportStatus.Disputed;
        } else {
            status = ReportStatus.Pending;
        }

        return (status, upvotes, downvotes, isVerified, isResolved);
    }

    /**
     * @notice Obtener validadores de un reporte
     */
    function getReportValidators(bytes32 _reportId) external view returns (address[] memory) {
        return reportValidators[_reportId];
    }

    /**
     * @notice Upgrade authorization
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {}
}
