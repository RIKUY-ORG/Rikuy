// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../contracts/solidity/core/RikuyCoreV2.sol";
import "../contracts/solidity/core/ReportRegistry.sol";
import "../contracts/solidity/governance/GovernmentRegistry.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title DeployRikuy
 * @notice Script de deploy para Rikuy - Multi-Network Compatible
 *
 * REDES SOPORTADAS:
 * - Arbitrum Sepolia (chainId: 421614)
 * - Arbitrum One (chainId: 42161)
 * - Rikuy Chain L3 (chainId: 313370)
 * - Local (Anvil) para testing
 *
 * ORDEN DE DEPLOY:
 * 1. ReportRegistry (storage)
 * 2. RikuyCoreV2 (lógica principal + Stylus AnonymousReport)
 * 3. GovernmentRegistry (permisos gobierno)
 *
 * USAGE:
 * Arbitrum Sepolia: forge script script/DeployRikuy.s.sol --rpc-url arbitrum_sepolia --broadcast
 * Rikuy Chain:      forge script script/DeployRikuy.s.sol --rpc-url rikuy_chain --broadcast
 * Local:            forge script script/DeployRikuy.s.sol --rpc-url localhost --broadcast
 */
contract DeployRikuy is Script {
    // Chain IDs
    uint256 constant ARBITRUM_SEPOLIA = 421614;
    uint256 constant ARBITRUM_ONE = 42161;
    uint256 constant RIKUY_CHAIN = 313370;

    // Deployer
    address public deployer;

    // Deployed contracts
    RikuyCoreV2 public rikuyCore;
    ReportRegistry public reportRegistry;
    GovernmentRegistry public governmentRegistry;

    // Proxies
    address public rikuyCoreProxy;
    address public reportRegistryProxy;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        deployer = vm.addr(deployerPrivateKey);

        // AnonymousReport Stylus contract (deployed separately via cargo-stylus)
        address anonymousReportAddress = vm.envOr("ANONYMOUS_REPORT_ADDRESS", address(0));

        console.log("============================================");
        console.log("RIKUY NETWORK - Deployment Script");
        console.log("============================================");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("AnonymousReport (Stylus):", anonymousReportAddress);
        console.log("--------------------------------------------");

        vm.startBroadcast(deployerPrivateKey);

        // ==========================================
        // STEP 1: Deploy ReportRegistry (with Proxy)
        // ==========================================
        console.log("\n[1/3] Deploying ReportRegistry...");

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
        // STEP 2: Deploy RikuyCoreV2 (UUPS Proxy)
        // ==========================================
        console.log("\n[2/3] Deploying RikuyCoreV2...");

        RikuyCoreV2 rikuyCoreImpl = new RikuyCoreV2();
        console.log("      Implementation:", address(rikuyCoreImpl));

        bytes memory coreInitData = abi.encodeWithSelector(
            RikuyCoreV2.initialize.selector,
            deployer,
            reportRegistryProxy,
            anonymousReportAddress
        );
        ERC1967Proxy coreProxyContract = new ERC1967Proxy(
            address(rikuyCoreImpl),
            coreInitData
        );
        rikuyCoreProxy = address(coreProxyContract);
        rikuyCore = RikuyCoreV2(rikuyCoreProxy);
        console.log("      Proxy:", rikuyCoreProxy);

        // ==========================================
        // STEP 3: Deploy GovernmentRegistry
        // ==========================================
        console.log("\n[3/3] Deploying GovernmentRegistry...");
        governmentRegistry = new GovernmentRegistry(deployer);
        console.log("      GovernmentRegistry:", address(governmentRegistry));

        // ==========================================
        // POST-DEPLOYMENT: Configuration
        // ==========================================
        console.log("\n--------------------------------------------");
        console.log("Configuring permissions...");

        // Grant roles
        reportRegistry.grantRole(reportRegistry.CORE_ROLE(), rikuyCoreProxy);
        rikuyCore.grantRole(rikuyCore.GOVERNMENT_ROLE(), deployer);

        // Register test government
        governmentRegistry.registerGovernment(
            deployer,
            "Rikuy Test Government",
            _getNetworkName()
        );

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
        console.log("ReportRegistry:     ", reportRegistryProxy);
        console.log("RikuyCoreV2:        ", rikuyCoreProxy);
        console.log("AnonymousReport:    ", anonymousReportAddress);
        console.log("GovernmentRegistry: ", address(governmentRegistry));
        console.log("============================================");
        console.log("\nNext steps:");
        console.log("1. Deploy Stylus contract: make deploy-stylus RPC=<url> KEY=<key>");
        console.log("2. Update .env with contract addresses");
        console.log("3. Set NETWORK=rikuy");
        console.log("4. Restart backend: pnpm dev");
        console.log("============================================\n");
    }

    function _getNetworkName() internal view returns (string memory) {
        if (block.chainid == ARBITRUM_SEPOLIA) return "Arbitrum Sepolia";
        if (block.chainid == ARBITRUM_ONE) return "Arbitrum One";
        if (block.chainid == RIKUY_CHAIN) return "Rikuy Chain L3";
        if (block.chainid == 31337) return "Local (Anvil)";
        return "Unknown Network";
    }
}
