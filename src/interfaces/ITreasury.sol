// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface ITreasury {
    function releaseRewards(
        bytes32 _reportId,
        uint16 _category,
        address _reporter,
        address[] calldata _validators
    ) external;

    function getCategoryReward(uint16 _category) external view returns (uint256);
    function getTreasuryBalance() external view returns (uint256);
}
