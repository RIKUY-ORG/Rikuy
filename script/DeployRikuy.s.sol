// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../contracts/solidity/core/RikuyCoreV2.sol";
import "../contracts/solidity/core/Treasury.sol";
import "../contracts/solidity/core/ReportRegistry.sol";
import "../contracts/solidity/zk/MockSemaphoreAdapter.sol";
import "../contracts/solidity/governance/GovernmentRegistry.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title DeployRikuy
 * @notice Script de deploy para Rikuy - Multi-Network Compatible
 *
 * REDES SOPORTADAS:
 * - Arbitrum Sepolia (chainId: 421614)
 * - Arbitrum One (chainId: 42161)
 * - Rikuy Chain L3 (chainId: custom)
 * - Local (Anvil) para testing
 *
 * ORDEN DE DEPLOY:
 * 1. MockUSX (token de prueba)
 * 2. ReportRegistry (storage)
 * 3. MockSemaphoreAdapter (ZK mock - reemplazar en producción)
 * 4. Treasury (fondos y recompensas)
 * 5. RikuyCoreV2 (lógica principal)
 * 6. GovernmentRegistry (permisos gobierno)
 *
 * USAGE:
 * Arbitrum Sepolia: forge script script/DeployRikuy.s.sol --rpc-url arbitrum_sepolia --broadcast
 * Rikuy Chain:      forge script script/DeployRikuy.s.sol --rpc-url rikuy_chain --broadcast
 * Local:            forge script script/DeployRikuy.s.sol --rpc-url localhost --broadcast
 */

/// @notice Simple ERC20 mock for testing rewards
contract MockUSXToken is ERC20 {
    constructor() ERC20("Mock USX Token", "mUSX") {
        _mint(msg.sender, 1_000_000 * 1e18); // 1M tokens
    }
}

contract DeployRikuy is Script {
    // Chain IDs
    uint256 constant ARBITRUM_SEPOLIA = 421614;
    uint256 constant ARBITRUM_ONE = 42161;

    // Deployer
    address public deployer;

    // Contratos desplegados
    MockUSXToken public mockUSX;
    RikuyCoreV2 public rikuyCore;
    RikuyTreasury public treasury;
    ReportRegistry public reportRegistry;
    MockSemaphoreAdapter public semaphoreAdapter;
    GovernmentRegistry public governmentRegistry;

    // Proxies
    address public rikuyCoreProxy;
    address public treasuryProxy;
    address public reportRegistryProxy;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        deployer = vm.addr(deployerPrivateKey);

        console.log("============================================");
        console.log("RIKUY NETWORK - Deployment Script");
        console.log("============================================");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("--------------------------------------------");

        vm.startBroadcast(deployerPrivateKey);

        // ==========================================
        // STEP 1: Deploy MockUSX Token
        // ==========================================
        console.log("\n[1/6] Deploying MockUSX Token...");
        mockUSX = new MockUSXToken();
        console.log("      MockUSX:", address(mockUSX));
        console.log("      Balance:", mockUSX.balanceOf(deployer) / 1e18, "mUSX");

        // ==========================================
        // STEP 2: Deploy ReportRegistry (with Proxy)
        // ==========================================
        console.log("\n[2/6] Deploying ReportRegistry...");
        
        ReportRegistry registryImpl = new ReportRegistry();
        console.log("      Implementation:", address(registryImpl));

        bytes memory registryInitData = abi.encodeWithSelector(
            ReportRegistry.initialize.selector,
            deployer
        );
        ERC1967Proxy registryProxy = new ERC1967Proxy(
            address(registryImpl),
            registryInitData
        );
        reportRegistry = ReportRegistry(address(registryProxy));
        reportRegistryProxy = address(registryProxy);
        console.log("      Proxy:", reportRegistryProxy);

        // ==========================================
        // STEP 3: Deploy MockSemaphoreAdapter
        // ==========================================
        console.log("\n[3/6] Deploying MockSemaphoreAdapter...");
        console.log("      WARNING: This is a MOCK - Replace for production!");
        
        semaphoreAdapter = new MockSemaphoreAdapter();
        console.log("      MockSemaphoreAdapter:", address(semaphoreAdapter));

        // ==========================================
        // STEP 4: Deploy Treasury (UUPS Proxy)
        // ==========================================
        console.log("\n[4/6] Deploying Treasury...");
        
        RikuyTreasury treasuryImpl = new RikuyTreasury();
        console.log("      Implementation:", address(treasuryImpl));

        bytes memory treasuryInitData = abi.encodeWithSelector(
            RikuyTreasury.initialize.selector,
            deployer,
            address(mockUSX)
        );
        ERC1967Proxy treasuryProxyContract = new ERC1967Proxy(
            address(treasuryImpl),
            treasuryInitData
        );
        treasuryProxy = address(treasuryProxyContract);
        treasury = RikuyTreasury(payable(treasuryProxy));
        console.log("      Proxy:", treasuryProxy);

        // ==========================================
        // STEP 5: Deploy RikuyCoreV2 (UUPS Proxy)
        // ==========================================
        console.log("\n[5/6] Deploying RikuyCoreV2...");
        
        RikuyCoreV2 rikuyCoreImpl = new RikuyCoreV2();
        console.log("      Implementation:", address(rikuyCoreImpl));

        bytes memory coreInitData = abi.encodeWithSelector(
            RikuyCoreV2.initialize.selector,
            deployer,
            reportRegistryProxy,
            treasuryProxy,
            address(semaphoreAdapter)
        );
        ERC1967Proxy coreProxyContract = new ERC1967Proxy(
            address(rikuyCoreImpl),
            coreInitData
        );
        rikuyCoreProxy = address(coreProxyContract);
        rikuyCore = RikuyCoreV2(rikuyCoreProxy);
        console.log("      Proxy:", rikuyCoreProxy);

        // ==========================================
        // STEP 6: Deploy GovernmentRegistry
        // ==========================================
        console.log("\n[6/6] Deploying GovernmentRegistry...");
        governmentRegistry = new GovernmentRegistry(deployer);
        console.log("      GovernmentRegistry:", address(governmentRegistry));

        // ==========================================
        // POST-DEPLOYMENT: Configuration
        // ==========================================
        console.log("\n--------------------------------------------");
        console.log("Configuring permissions...");

        // Grant roles
        reportRegistry.grantRole(reportRegistry.CORE_ROLE(), rikuyCoreProxy);
        treasury.grantRole(treasury.OPERATOR_ROLE(), rikuyCoreProxy);
        rikuyCore.grantRole(rikuyCore.GOVERNMENT_ROLE(), deployer);
        treasury.grantRole(treasury.GOVERNMENT_ROLE(), deployer);

        // Register test government
        governmentRegistry.registerGovernment(
            deployer,
            "Rikuy Test Government",
            _getNetworkName()
        );

        // Fund treasury
        uint256 fundAmount = 100_000 * 1e18; // 100k tokens
        mockUSX.approve(treasuryProxy, fundAmount);
        treasury.depositFunds(fundAmount);
        console.log("Treasury funded with: 100,000 mUSX");

        vm.stopBroadcast();

        // ==========================================
        // DEPLOYMENT SUMMARY
        // ==========================================
        console.log("\n============================================");
        console.log("DEPLOYMENT COMPLETE");
        console.log("============================================");
        console.log("Network:            ", _getNetworkName());
        console.log("Chain ID:           ", block.chainid);
        console.log("--------------------------------------------");
        console.log("MockUSX:            ", address(mockUSX));
        console.log("ReportRegistry:     ", reportRegistryProxy);
        console.log("Treasury:           ", treasuryProxy);
        console.log("RikuyCoreV2:        ", rikuyCoreProxy);
        console.log("SemaphoreAdapter:   ", address(semaphoreAdapter));
        console.log("GovernmentRegistry: ", address(governmentRegistry));
        console.log("============================================");
        console.log("\nNext steps:");
        console.log("1. Update .env with contract addresses");
        console.log("2. Set NETWORK=rikuy (or arbitrum)");
        console.log("3. Restart backend: npm run dev");
        console.log("============================================\n");
    }

    function _getNetworkName() internal view returns (string memory) {
        if (block.chainid == ARBITRUM_SEPOLIA) return "Arbitrum Sepolia";
        if (block.chainid == ARBITRUM_ONE) return "Arbitrum One";
        if (block.chainid == 31337) return "Local (Anvil)";
        return "Rikuy Chain L3";
    }
}
