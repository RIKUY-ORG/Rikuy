// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IAnonymousReport
 * @notice Interface for the Stylus AnonymousReport contract
 * @dev This interface allows Solidity contracts (RikuyCoreV2) to interact
 *      with the Rust/WASM AnonymousReport contract via standard ABI calls.
 *      The Stylus contract handles anonymous reporting with commitment-based
 *      identity and on-chain data storage.
 */
interface IAnonymousReport {
    // =========================================================================
    // ANONYMITY
    // =========================================================================

    /// @notice Generate an anonymous commitment from wallet + salt + nonce
    /// @param wallet The user's wallet address
    /// @param salt Secret salt (only backend knows this)
    /// @param nonce Session nonce for uniqueness
    /// @return commitment The anonymous commitment hash
    function generateCommitment(
        address wallet,
        bytes32 salt,
        uint256 nonce
    ) external view returns (bytes32 commitment);

    /// @notice Register a commitment (called once per verified citizen)
    /// @param commitment The commitment to register
    function registerCommitment(bytes32 commitment) external;

    /// @notice Check if a commitment is registered
    /// @param commitment The commitment to check
    /// @return True if the commitment is registered
    function isCommitmentRegistered(bytes32 commitment) external view returns (bool);

    // =========================================================================
    // REPORTS
    // =========================================================================

    /// @notice Store an anonymous report on-chain
    /// @param reportId Unique report identifier
    /// @param commitment Anonymous identity of the reporter
    /// @param contentHash Hash of the report evidence (photo + description)
    /// @param nullifier Unique nullifier to prevent double-reporting
    /// @param category Report category (0-4)
    /// @param latitude Location latitude (* 1_000_000)
    /// @param longitude Location longitude (* 1_000_000)
    /// @param aiValidated Whether AI validated the content
    function storeReport(
        bytes32 reportId,
        bytes32 commitment,
        bytes32 contentHash,
        bytes32 nullifier,
        uint16 category,
        int64 latitude,
        int64 longitude,
        bool aiValidated
    ) external;

    /// @notice Increment validation score for a report
    /// @param reportId The report to validate
    /// @return newScore The new validation score
    function incrementValidation(bytes32 reportId) external returns (uint8 newScore);

    /// @notice Mark a report as resolved
    /// @param reportId The report to resolve
    function resolveReport(bytes32 reportId) external;

    // =========================================================================
    // QUERIES
    // =========================================================================

    function getReportContentHash(bytes32 reportId) external view returns (bytes32);
    function getReportCategory(bytes32 reportId) external view returns (uint16);
    function getReportLocation(bytes32 reportId) external view returns (int64 latitude, int64 longitude);
    function getReportScore(bytes32 reportId) external view returns (uint8);
    function isReportResolved(bytes32 reportId) external view returns (bool);
    function reportExists(bytes32 reportId) external view returns (bool);
    function isNullifierUsed(bytes32 nullifier) external view returns (bool);
    function getTotalReports() external view returns (uint256);
    function getReportIdByIndex(uint256 index) external view returns (bytes32);
    function verifyReportIntegrity(bytes32 reportId, bytes32 contentHash) external view returns (bool);
    function isAiValidated(bytes32 reportId) external view returns (bool);
    function getReportTimestamp(bytes32 reportId) external view returns (uint32);
    function getReportCommitment(bytes32 reportId) external view returns (bytes32);
}
