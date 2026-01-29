// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

interface ITreasury {
    /** Liberar recompensas en USX a reporter y validadores
     */
    function releaseRewards(
        bytes32 _reportId,
        uint16 _category,
        address _reporter,
        address[] calldata _validators
    ) external;

    /**
     * @notice Obtener recompensa en USX por categoría
     */
    function getCategoryReward(uint16 _category) external view returns (uint256);

    /**
     * @notice Obtener balance de USX en el Treasury
     */
    function getTreasuryBalance() external view returns (uint256);

    /**
     * @notice Depositar USX en el Treasury (gobierno)
     */
    function depositFunds(uint256 _amount) external;
}
