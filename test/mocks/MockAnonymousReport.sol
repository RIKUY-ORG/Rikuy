// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../contracts/solidity/interfaces/IAnonymousReport.sol";

/**
 * @title MockAnonymousReport
 * @notice Mock del contrato Stylus (Rust/WASM) para testing en Foundry
 * @dev Simula el comportamiento de AnonymousReport.rs en Solidity puro
 */
contract MockAnonymousReport is IAnonymousReport {
    address public admin;

    mapping(bytes32 => bool) private commitments;
    mapping(bytes32 => bool) private nullifiers;
    mapping(bytes32 => bool) private _reportExists;
    mapping(bytes32 => bool) private _reportResolved;
    mapping(bytes32 => bytes32) private _reportContentHash;
    mapping(bytes32 => bytes32) private _reportCommitment;
    mapping(bytes32 => uint16) private _reportCategory;
    mapping(bytes32 => int64) private _reportLat;
    mapping(bytes32 => int64) private _reportLon;
    mapping(bytes32 => uint8) private _reportScore;
    mapping(bytes32 => bool) private _reportAiValidated;
    mapping(bytes32 => uint32) private _reportTimestamp;

    bytes32[] private _reportIds;

    // Bolivia geo-bounds (scaled by 1_000_000)
    int64 constant LAT_MIN = -23_000_000;
    int64 constant LAT_MAX = -9_500_000;
    int64 constant LON_MIN = -69_700_000;
    int64 constant LON_MAX = -57_400_000;

    error NullifierAlreadyUsed();
    error ReportNotFound();
    error InvalidCategory();
    error OutOfBoundsLocation();
    error Unauthorized();

    constructor(address _admin) {
        admin = _admin;
    }

    function setAdmin(address _admin) external {
        admin = _admin;
    }

    modifier onlyAdmin() {
        if (msg.sender != admin) revert Unauthorized();
        _;
    }

    function generateCommitment(
        address wallet,
        bytes32 salt,
        uint256 nonce
    ) external pure returns (bytes32 commitment) {
        return keccak256(abi.encodePacked(wallet, salt, nonce));
    }

    function registerCommitment(bytes32 commitment) external onlyAdmin {
        commitments[commitment] = true;
    }

    function isCommitmentRegistered(bytes32 commitment) external view returns (bool) {
        return commitments[commitment];
    }

    function storeReport(
        bytes32 reportId,
        bytes32 commitment,
        bytes32 contentHash,
        bytes32 nullifier,
        uint16 category,
        int64 latitude,
        int64 longitude,
        bool aiValidated
    ) external onlyAdmin {
        if (nullifiers[nullifier]) revert NullifierAlreadyUsed();
        if (category > 4) revert InvalidCategory();
        if (latitude < LAT_MIN || latitude > LAT_MAX) revert OutOfBoundsLocation();
        if (longitude < LON_MIN || longitude > LON_MAX) revert OutOfBoundsLocation();

        nullifiers[nullifier] = true;
        _reportExists[reportId] = true;
        _reportContentHash[reportId] = contentHash;
        _reportCommitment[reportId] = commitment;
        _reportCategory[reportId] = category;
        _reportLat[reportId] = latitude;
        _reportLon[reportId] = longitude;
        _reportScore[reportId] = 0;
        _reportAiValidated[reportId] = aiValidated;
        _reportTimestamp[reportId] = uint32(block.timestamp);
        _reportIds.push(reportId);
    }

    function incrementValidation(bytes32 reportId) external onlyAdmin returns (uint8 newScore) {
        if (!_reportExists[reportId]) revert ReportNotFound();
        _reportScore[reportId]++;
        return _reportScore[reportId];
    }

    function resolveReport(bytes32 reportId) external onlyAdmin {
        if (!_reportExists[reportId]) revert ReportNotFound();
        _reportResolved[reportId] = true;
    }

    function getReportContentHash(bytes32 reportId) external view returns (bytes32) {
        return _reportContentHash[reportId];
    }

    function getReportCategory(bytes32 reportId) external view returns (uint16) {
        return _reportCategory[reportId];
    }

    function getReportLocation(bytes32 reportId) external view returns (int64 latitude, int64 longitude) {
        return (_reportLat[reportId], _reportLon[reportId]);
    }

    function getReportScore(bytes32 reportId) external view returns (uint8) {
        return _reportScore[reportId];
    }

    function isReportResolved(bytes32 reportId) external view returns (bool) {
        return _reportResolved[reportId];
    }

    function reportExists(bytes32 reportId) external view returns (bool) {
        return _reportExists[reportId];
    }

    function isNullifierUsed(bytes32 nullifier) external view returns (bool) {
        return nullifiers[nullifier];
    }

    function getTotalReports() external view returns (uint256) {
        return _reportIds.length;
    }

    function getReportIdByIndex(uint256 index) external view returns (bytes32) {
        return _reportIds[index];
    }

    function verifyReportIntegrity(bytes32 reportId, bytes32 contentHash) external view returns (bool) {
        return _reportContentHash[reportId] == contentHash;
    }

    function isAiValidated(bytes32 reportId) external view returns (bool) {
        return _reportAiValidated[reportId];
    }

    function getReportTimestamp(bytes32 reportId) external view returns (uint32) {
        return _reportTimestamp[reportId];
    }

    function getReportCommitment(bytes32 reportId) external view returns (bytes32) {
        return _reportCommitment[reportId];
    }
}
