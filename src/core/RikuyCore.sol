// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../interfaces/IReportRegistry.sol";
import "../interfaces/ITreasury.sol";
import "../interfaces/IZKVerifier.sol";

/**
 * @title RikuyCore
 * @notice Contrato principal de RIKUY - Orquesta todo el sistema
 * @dev UUPS upgradeable para flexibilidad durante hackathon
 *
 * Flujo:
 * 1. createReport() → Usuario anónimo crea reporte con ZK proof
 * 2. validateReport() → Vecinos validan si es real
 * 3. resolveReport() → Gobierno aprueba y libera fondos
 */
contract RikuyCore is UUPSUpgradeable, AccessControlUpgradeable {

    bytes32 public constant GOVERNMENT_ROLE = keccak256("GOVERNMENT");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR");

    IReportRegistry public reportRegistry;
    ITreasury public treasury;
    IZKVerifier public zkVerifier;

    uint8 public constant VERIFICATION_THRESHOLD = 5; // 5 validaciones para verificar

    // Tracking de validadores por reporte
    mapping(bytes32 => address[]) private reportValidators;
    mapping(bytes32 => uint256) private reportUpvotes;
    mapping(bytes32 => uint256) private reportDownvotes;

    // Tracking de reportes por usuario (para analytics, opcional)
    mapping(address => bytes32[]) private userReports;

    enum ReportStatus { Pending, Verified, Disputed, Resolved }

    event ReportCreated(
        bytes32 indexed reportId,
        bytes32 indexed nullifier,
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
        address _zkVerifier
    ) public initializer {
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(OPERATOR_ROLE, _admin);

        reportRegistry = IReportRegistry(_reportRegistry);
        treasury = ITreasury(_treasury);
        zkVerifier = IZKVerifier(_zkVerifier);
    }

    /**
     * @notice Crear reporte anónimo con ZK proof
     * @param _arkivTxId Hash de transacción en Arkiv (evidencia inmutable)
     * @param _categoryId Categoría (0: Infraestructura, 1: Inseguridad, 2: Basura)
     * @param _zkProof Array con proof Groth16 [pA, pB, pC, pubSignals]
     * @dev ZK proof demuestra: (1) tienes secret válido, (2) estabas cerca, (3) sin revelar ubicación
     */
    function createReport(
        bytes32 _arkivTxId,
        uint16 _categoryId,
        uint256[8] calldata _zkProof  // [pA[2], pB[4], pC[2]]
    ) external returns (bytes32 reportId) {
        require(_categoryId <= 2, "Invalid category");

        // Decodificar proof (Groth16 format)
        uint256[2] memory pA = [_zkProof[0], _zkProof[1]];
        uint256[2][2] memory pB = [[_zkProof[2], _zkProof[3]], [_zkProof[4], _zkProof[5]]];
        uint256[2] memory pC = [_zkProof[6], _zkProof[7]];

        // Public signals del proof (hardcodeados para simplificar, en prod vienen del proof)
        // TODO: Pasar como parámetro adicional
        uint256[4] memory pubSignals = [
            uint256(uint160(msg.sender)), // nullifier (temporal, reemplazar con hash real)
            0, // merkleRoot (opcional)
            _categoryId,
            0  // proximityHash
        ];

        // Verificar ZK proof
        bool isValidProof = zkVerifier.verifyProof(pA, pB, pC, pubSignals);
        require(isValidProof, "Invalid ZK proof");

        // Generar ID único del reporte
        bytes32 nullifier = bytes32(pubSignals[0]);
        reportId = keccak256(abi.encodePacked(nullifier, block.timestamp, _arkivTxId));

        // Guardar en registry
        reportRegistry.storeReport(reportId, _arkivTxId, nullifier, _categoryId);

        // Tracking (opcional)
        userReports[msg.sender].push(reportId);

        emit ReportCreated(reportId, nullifier, _arkivTxId, _categoryId, block.timestamp);

        return reportId;
    }

    /**
     * @notice Validar reporte (votar si es real o no)
     * @param _reportId ID del reporte
     * @param _isValid true = es real, false = es falso
     * @dev Solo puedes validar una vez por reporte. Si alcanza threshold, se marca como verificado.
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
     * @dev Si se aprueba, se liberan fondos automáticamente desde Treasury
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
            address reporter = address(uint160(uint256(report.nullifierHash))); // Temporal
            address[] memory validators = reportValidators[_reportId];

            treasury.releaseRewards(_reportId, report.categoryId, reporter, validators);
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
     * @notice Obtener reportes de un usuario
     */
    function getUserReports(address _user) external view returns (bytes32[] memory) {
        return userReports[_user];
    }

    /**
     * @notice Actualizar dirección de Treasury (emergencia)
     */
    function setTreasury(address _newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        treasury = ITreasury(_newTreasury);
    }

    /**
     * @notice Actualizar threshold de verificación
     */
    function setVerificationThreshold(uint8 _newThreshold) external onlyRole(DEFAULT_ADMIN_ROLE) {
        // Implementar como variable de estado si se necesita cambiar
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
