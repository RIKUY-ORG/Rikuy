// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IReportRegistry {
    struct Report {
        bytes32 arkivTxId;
        bytes32 nullifierHash;
        uint32 timestamp;
        uint16 categoryId;
        uint8 validationScore;
        bool isResolved;
    }

    function storeReport(
        bytes32 _reportId,
        bytes32 _arkivTxId,
        bytes32 _nullifierHash,
        uint16 _categoryId
    ) external;

    function recordValidation(bytes32 _reportId, address _validator) external;
    function incrementValidationScore(bytes32 _reportId) external;
    function markAsResolved(bytes32 _reportId) external;
    function getReport(bytes32 _reportId) external view returns (Report memory);
    function hasUserValidated(bytes32 _reportId, address _validator) external view returns (bool);
    function isNullifierUsed(bytes32 _nullifier) external view returns (bool);
}
