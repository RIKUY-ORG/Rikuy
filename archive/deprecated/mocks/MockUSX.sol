// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSX
 * @notice Mock de USX para testing en Scroll Sepolia
 * @dev En Mainnet usar: 0x3b005fefC63Ca7c8d25eE21FbA3787229ba4CF03
 *
 * IMPORTANTE:
 * - Este mock SOLO para Sepolia testnet
 * - En producción (Scroll Mainnet) usar USX REAL
 * - Los usuarios nunca ven esto, solo ven "$100 USD recibidos"
 */
contract MockUSX is ERC20, Ownable {

    /**
     * @notice Constructor - Crea token mock con supply para testing
     */
    constructor() ERC20("USD Exchange", "USX") Ownable(msg.sender) {
        _mint(msg.sender, 10_000_000 * 1e18);
    }

    /**
     * @notice Mintear más USX (solo owner = gobierno)
     * @dev Simula al gobierno depositando más fondos
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /**
     * @notice Faucet para testing - usuarios pueden obtener USX gratis
     * @dev En testnet, usuarios necesitan USX para probar retiros
     */
    function faucet() external {
        require(balanceOf(msg.sender) < 10000 * 1e18, "Ya tienes suficiente USX");
        _mint(msg.sender, 1000 * 1e18); // Regalar $1000 USD en USX
    }

    /**
     * @notice 18 decimales (igual que USX real)
     */
    function decimals() public pure override returns (uint8) {
        return 18;
    }
}
