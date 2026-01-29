// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IPaymaster
 * @notice Interface para RikuyPaymaster
 */
interface IPaymaster {
    /**
     * @notice Obtener balance depositado en EntryPoint
     */
    function getDeposit() external view returns (uint256);

    /**
     * @notice Fondear paymaster
     */
    function deposit() external payable;

    /**
     * @notice Retirar fondos
     */
    function withdrawTo(address payable recipient, uint256 amount) external;

    /**
     * @notice Eventos
     */
    event GasSponsored(address indexed user, uint256 actualGasCost, bytes4 functionSelector);
    event RateLimitHit(address indexed user, string reason);
}
