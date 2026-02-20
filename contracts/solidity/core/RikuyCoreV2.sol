// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../interfaces/IReportRegistry.sol";
import "../interfaces/IAnonymousReport.sol";

/**
 * @title RikuyCoreV2
 * @notice Contrato principal de RIKUY - Orquesta denuncias anónimas
 * @dev Backend Relayer firma transacciones en nombre del usuario (paga gas).
 *      La lógica de anonimato y almacenamiento de reportes vive en el
 *      contrato Stylus (AnonymousReport.rs) para eficiencia WASM.
 *
 * Flujo:
 * 1. Usuario crea denuncia en frontend (foto, descripción, ubicación)
 * 2. Backend genera commitment anónimo: hash(wallet + salt + nonce)
 * 3. Backend envía TX via Relayer → RikuyCoreV2.createReport()
 * 4. RikuyCoreV2 delega al contrato Stylus para storage + nullifier check
 * 5. Gas subsidiado → Usuario no paga nada
 */
contract RikuyCoreV2 is UUPSUpgradeable, AccessControlUpgradeable {

    bytes32 public constant GOVERNMENT_ROLE = keccak256("GOVERNMENT");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR");
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER");

    IReportRegistry public reportRegistry;
    IAnonymousReport public anonymousReport; // Stylus contract

    uint8 public constant VERIFICATION_THRESHOLD = 5;

    // Tracking de validadores por reporte
    mapping(bytes32 => address[]) private reportValidators;
    mapping(bytes32 => uint256) private reportUpvotes;
    mapping(bytes32 => uint256) private reportDownvotes;

    enum ReportStatus { Pending, Verified, Disputed, Resolved }

    event ReportCreated(
        bytes32 indexed reportId,
        bytes32 indexed commitment,
        bytes32 contentHash,
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
        address _anonymousReport
    ) public initializer {
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(OPERATOR_ROLE, _admin);

        reportRegistry = IReportRegistry(_reportRegistry);
        anonymousReport = IAnonymousReport(_anonymousReport);
    }

    /**
     * @notice Agregar backend wallet como relayer
     */
    function addRelayer(address _relayer) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(RELAYER_ROLE, _relayer);
    }

    /**
     * @notice Crear denuncia anónima (v2 - Stylus backed)
     * @param _contentHash Hash de la evidencia (foto + descripción)
     * @param _categoryId Categoría del incidente (0-4)
     * @param _commitment Identidad anónima del denunciante
     * @param _nullifier Nullifier único para evitar doble-denuncia
     * @param _latitude Latitud (* 1_000_000 para precisión)
     * @param _longitude Longitud (* 1_000_000 para precisión)
     * @param _aiValidated Si la AI validó el contenido como legítimo
     * @dev Solo puede ser llamado por RELAYER (backend wallet).
     *      El commitment se genera en backend: keccak256(wallet + salt + nonce)
     *      donde salt es secreto del backend → el commitment no revela identidad.
     */
    function createReport(
        bytes32 _contentHash,
        uint16 _categoryId,
        bytes32 _commitment,
        bytes32 _nullifier,
        int64 _latitude,
        int64 _longitude,
        bool _aiValidated
    ) external onlyRole(RELAYER_ROLE) returns (bytes32 reportId) {

        // Generar ID único del reporte
        reportId = keccak256(abi.encodePacked(
            _commitment,
            _nullifier,
            block.timestamp,
            _contentHash,
            _categoryId
        ));

        // Delegar almacenamiento al contrato Stylus (WASM)
        // Stylus valida: categoría, geo-bounds Bolivia, nullifier único
        anonymousReport.storeReport(
            reportId,
            _commitment,
            _contentHash,
            _nullifier,
            _categoryId,
            _latitude,
            _longitude,
            _aiValidated
        );

        // También guardar en ReportRegistry para compatibilidad con
        // el flujo de validación/resolución existente
        reportRegistry.storeReport(
            reportId,
            _contentHash,       // content hash como arkivTxId
            _nullifier,         // nullifier como nullifierHash
            _categoryId
        );

        emit ReportCreated(
            reportId,
            _commitment,
            _contentHash,
            _categoryId,
            block.timestamp
        );

        return reportId;
    }

    /**
     * @notice Registrar commitment de ciudadano verificado
     * @param _commitment El commitment anónimo a registrar
     * @dev Se llama después de que Reclaim Protocol verifica ciudadanía
     */
    function registerCitizen(bytes32 _commitment) external onlyRole(RELAYER_ROLE) {
        anonymousReport.registerCommitment(_commitment);
    }

    /**
     * @notice Validar reporte (votar si es real o no)
     * @param _reportId ID del reporte
     * @param _isValid true = es real, false = es falso
     */
    function validateReport(bytes32 _reportId, bool _isValid) external {
        require(anonymousReport.reportExists(_reportId), "Report does not exist");
        require(!anonymousReport.isReportResolved(_reportId), "Report already resolved");
        require(!reportRegistry.hasUserValidated(_reportId, msg.sender), "Already validated");

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
            anonymousReport.incrementValidation(_reportId);
            reportRegistry.incrementValidationScore(_reportId);
            emit ReportVerified(_reportId, reportUpvotes[_reportId]);
        }
    }

    /**
     * @notice Resolver reporte (solo gobierno)
     * @param _reportId ID del reporte
     * @param _approved true = aprobar, false = rechazar
     */
    function resolveReport(bytes32 _reportId, bool _approved)
        external
        onlyRole(GOVERNMENT_ROLE)
    {
        require(anonymousReport.reportExists(_reportId), "Report does not exist");
        require(!anonymousReport.isReportResolved(_reportId), "Already resolved");
        require(reportUpvotes[_reportId] >= VERIFICATION_THRESHOLD, "Not enough validations");

        // Marcar como resuelto en Stylus y ReportRegistry
        anonymousReport.resolveReport(_reportId);
        reportRegistry.markAsResolved(_reportId);

        ReportStatus finalStatus = _approved ? ReportStatus.Resolved : ReportStatus.Disputed;

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
        upvotes = reportUpvotes[_reportId];
        downvotes = reportDownvotes[_reportId];
        isVerified = upvotes >= VERIFICATION_THRESHOLD;
        isResolved = anonymousReport.isReportResolved(_reportId);

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
