// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../interfaces/IReportRegistry.sol";

/**
 * @title ReportRegistry
 * @notice Storage contract optimizado para reportes
 * @dev Packed struct = 72 bytes (3 slots) para ahorrar gas en Scroll
 */
contract ReportRegistry is Initializable, AccessControlUpgradeable, IReportRegistry {

    bytes32 public constant CORE_ROLE = keccak256("CORE_ROLE");

    mapping(bytes32 => Report) private reports;
    mapping(bytes32 => bool) private nullifierUsed;
    mapping(bytes32 => mapping(address => bool)) private hasValidated;

    bytes32[] public reportIds;

    uint16 public constant CATEGORY_INFRAESTRUCTURA = 0;
    uint16 public constant CATEGORY_INSEGURIDAD = 1;
    uint16 public constant CATEGORY_BASURA = 2;

    event ReportStored(bytes32 indexed reportId, bytes32 arkivTxId, uint16 category);
    event ValidationRecorded(bytes32 indexed reportId, address indexed validator);
    event ReportResolved(bytes32 indexed reportId);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _admin) public initializer {
        __AccessControl_init();
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(CORE_ROLE, _admin);
    }

    function storeReport(
        bytes32 _reportId,
        bytes32 _arkivTxId,
        bytes32 _nullifierHash,
        uint16 _categoryId
    ) external onlyRole(CORE_ROLE) {
        require(!nullifierUsed[_nullifierHash], "Nullifier already used");
        require(_categoryId <= 2, "Invalid category");

        reports[_reportId] = Report({
            arkivTxId: _arkivTxId,
            nullifierHash: _nullifierHash,
            timestamp: uint32(block.timestamp),
            categoryId: _categoryId,
            validationScore: 0,
            isResolved: false
        });

        nullifierUsed[_nullifierHash] = true;
        reportIds.push(_reportId);

        emit ReportStored(_reportId, _arkivTxId, _categoryId);
    }

    function recordValidation(bytes32 _reportId, address _validator) external onlyRole(CORE_ROLE) {
        require(!hasValidated[_reportId][_validator], "Already validated");
        hasValidated[_reportId][_validator] = true;
        emit ValidationRecorded(_reportId, _validator);
    }

    function incrementValidationScore(bytes32 _reportId) external onlyRole(CORE_ROLE) {
        require(reports[_reportId].validationScore < 255, "Max score reached");
        reports[_reportId].validationScore++;
    }

    function markAsResolved(bytes32 _reportId) external onlyRole(CORE_ROLE) {
        require(!reports[_reportId].isResolved, "Already resolved");
        reports[_reportId].isResolved = true;
        emit ReportResolved(_reportId);
    }

    function getReport(bytes32 _reportId) external view returns (Report memory) {
        return reports[_reportId];
    }

    function hasUserValidated(bytes32 _reportId, address _validator) external view returns (bool) {
        return hasValidated[_reportId][_validator];
    }

    function isNullifierUsed(bytes32 _nullifier) external view returns (bool) {
        return nullifierUsed[_nullifier];
    }

    function getTotalReports() external view returns (uint256) {
        return reportIds.length;
    }

    function getReportIdByIndex(uint256 _index) external view returns (bytes32) {
        require(_index < reportIds.length, "Index out of bounds");
        return reportIds[_index];
    }
}
