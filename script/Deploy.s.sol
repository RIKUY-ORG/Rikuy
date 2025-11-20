// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/core/RikuyCore.sol";
import "../src/core/Treasury.sol";
import "../src/core/ReportRegistry.sol";
import "../src/zk/MockZKVerifier.sol";
import "../src/governance/GovernmentRegistry.sol";
import "../src/aa/RikuyPaymaster.sol";
import "../src/mocks/MockUSX.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title Deploy
 * @notice Script completo de deploy para RIKUY con USX en Scroll
 *
 * REDES SOPORTADAS:
 * - Scroll Mainnet (chainId: 534352) → Usa USX REAL
 * - Scroll Sepolia (chainId: 534351) → Usa MockUSX
 *
 * USX REAL (Mainnet): 0x3b005fefC63Ca7c8d25eE21FbA3787229ba4CF03
 *
 * ORDEN DE DEPLOY:
 * 0. USX Token (solo en testnet - deploy mock)
 * 1. ReportRegistry
 * 2. MockZKVerifier
 * 3. Treasury (con USX)
 * 4. RikuyCore
 * 5. GovernmentRegistry
 * 6. RikuyPaymaster (gasless)
 *
 * USAGE:
 * Sepolia: forge script script/Deploy.s.sol --rpc-url scroll_sepolia --broadcast --verify
 * Mainnet: forge script script/Deploy.s.sol --rpc-url scroll --broadcast --verify
 */
contract DeployScript is Script {

    // Chain IDs
    uint256 constant SCROLL_MAINNET = 534352;
    uint256 constant SCROLL_SEPOLIA = 534351;

    // USX Token address (Mainnet)
    address constant USX_MAINNET = 0x3b005fefC63Ca7c8d25eE21FbA3787229ba4CF03;

    // EntryPoint v0.7 (mismo en mainnet y testnet)
    address constant ENTRYPOINT = 0x0000000071727De22E5E9d8BAf0edAc6f37da032;

    // Deployer
    address public deployer;

    // Contratos desplegados
    address public usxToken;
    MockUSX public mockUSX;
    RikuyCore public rikuyCore;
    RikuyTreasury public treasury;
    ReportRegistry public reportRegistry;
    MockZKVerifier public zkVerifier;
    GovernmentRegistry public governmentRegistry;
    RikuyPaymaster public paymaster;

    // Proxies
    address public rikuyCoreProxy;
    address public treasuryProxy;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        deployer = vm.addr(deployerPrivateKey);

        console.log("===========================================");
        console.log("RIKUY - Deploy Script con USX");
        console.log("===========================================");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);

        // Determinar qué USX usar
        if (block.chainid == SCROLL_MAINNET) {
            console.log("Network: Scroll MAINNET");
            console.log("Using REAL USX:", USX_MAINNET);
            usxToken = USX_MAINNET;
        } else if (block.chainid == SCROLL_SEPOLIA) {
            console.log("Network: Scroll SEPOLIA (Testnet)");
            console.log("Will deploy MockUSX for testing");
        } else {
            console.log("Network: Unknown/Local - deploying MockUSX");
        }

        console.log("===========================================\n");

        vm.startBroadcast(deployerPrivateKey);

        // ==================================
        // PASO 0: USX Token (solo testnet)
        // ==================================
        if (block.chainid != SCROLL_MAINNET) {
            console.log("0. Deploying MockUSX (testnet only)...");
            mockUSX = new MockUSX();
            usxToken = address(mockUSX);
            console.log("   MockUSX deployed at:", usxToken);
            console.log("   MockUSX balance:", mockUSX.balanceOf(deployer) / 1e18, "USX");
        }

        // ==================================
        // PASO 1: ReportRegistry (con Proxy)
        // ==================================
        console.log("\n1. Deploying ReportRegistry...");

        // Deploy implementation
        ReportRegistry registryImpl = new ReportRegistry();
        console.log("   ReportRegistry Implementation:", address(registryImpl));

        // Deploy proxy y inicializar
        bytes memory registryInitData = abi.encodeWithSelector(
            ReportRegistry.initialize.selector,
            deployer
        );
        ERC1967Proxy registryProxy = new ERC1967Proxy(
            address(registryImpl),
            registryInitData
        );
        reportRegistry = ReportRegistry(address(registryProxy));
        console.log("   ReportRegistry Proxy:", address(reportRegistry));

        // ==================================
        // PASO 2: MockZKVerifier
        // ==================================
        console.log("\n2. Deploying MockZKVerifier...");
        zkVerifier = new MockZKVerifier();
        console.log("   MockZKVerifier:", address(zkVerifier));

        // ==================================
        // PASO 3: Treasury con USX
        // ==================================
        console.log("\n3. Deploying Treasury (UUPS) with USX...");

        RikuyTreasury treasuryImpl = new RikuyTreasury();
        console.log("   Treasury Implementation:", address(treasuryImpl));

        bytes memory treasuryInitData = abi.encodeWithSelector(
            RikuyTreasury.initialize.selector,
            deployer,
            usxToken  // ← USX token address
        );

        ERC1967Proxy treasuryProxyContract = new ERC1967Proxy(
            address(treasuryImpl),
            treasuryInitData
        );
        treasuryProxy = address(treasuryProxyContract);
        treasury = RikuyTreasury(payable(treasuryProxy));
        console.log("   Treasury Proxy:", treasuryProxy);
        console.log("   Treasury USX Token:", usxToken);

        // ==================================
        // PASO 4: RikuyCore
        // ==================================
        console.log("\n4. Deploying RikuyCore (UUPS)...");

        RikuyCore rikuyCoreImpl = new RikuyCore();
        console.log("   RikuyCore Implementation:", address(rikuyCoreImpl));

        bytes memory coreInitData = abi.encodeWithSelector(
            RikuyCore.initialize.selector,
            deployer,
            address(reportRegistry),
            treasuryProxy,
            address(zkVerifier)
        );

        ERC1967Proxy coreProxyContract = new ERC1967Proxy(
            address(rikuyCoreImpl),
            coreInitData
        );
        rikuyCoreProxy = address(coreProxyContract);
        rikuyCore = RikuyCore(rikuyCoreProxy);
        console.log("   RikuyCore Proxy:", rikuyCoreProxy);

        // ==================================
        // PASO 5: GovernmentRegistry
        // ==================================
        console.log("\n5. Deploying GovernmentRegistry...");
        governmentRegistry = new GovernmentRegistry(deployer);
        console.log("   GovernmentRegistry:", address(governmentRegistry));

        // ==================================
        // PASO 6: RikuyPaymaster (Gasless UX)
        // ==================================
        console.log("\n6. Deploying RikuyPaymaster (gasless)...");
        paymaster = new RikuyPaymaster(IEntryPoint(ENTRYPOINT));
        console.log("   RikuyPaymaster:", address(paymaster));
        console.log("   EntryPoint:", ENTRYPOINT);

        // ==================================
        // POST-DEPLOYMENT: Configuración
        // ==================================
        console.log("\n===========================================");
        console.log("POST-DEPLOYMENT CONFIGURATION");
        console.log("===========================================");

        // 1. Permisos
        console.log("\n1. Granting roles...");
        reportRegistry.grantRole(reportRegistry.CORE_ROLE(), rikuyCoreProxy);
        treasury.grantRole(treasury.OPERATOR_ROLE(), rikuyCoreProxy);
        rikuyCore.grantRole(rikuyCore.GOVERNMENT_ROLE(), deployer);
        treasury.grantRole(treasury.GOVERNMENT_ROLE(), deployer);

        // 2. Registrar gobierno de prueba
        console.log("2. Registering test government...");
        governmentRegistry.registerGovernment(
            deployer,
            "Test Government",
            block.chainid == SCROLL_MAINNET ? "Scroll Mainnet" : "Scroll Sepolia"
        );

        // 3. Fondear Treasury con USX
        console.log("3. Funding Treasury with USX...");
        if (block.chainid != SCROLL_MAINNET) {
            // En testnet: fondear con MockUSX
            uint256 fundAmount = 100000 * 1e18; // 100k USX ($100k USD)
            mockUSX.approve(treasuryProxy, fundAmount);
            treasury.depositFunds(fundAmount);
            console.log("   Treasury funded with:", fundAmount / 1e18, "MockUSX");
        } else {
            console.log("   MANUAL: Gobierno debe aprobar y depositar USX real");
            console.log("   1. usxToken.approve(treasury, amount)");
            console.log("   2. treasury.depositFunds(amount)");
        }

        // 4. Fondear Paymaster
        console.log("4. Funding Paymaster for gasless txs...");
        paymaster.deposit{value: 0.1 ether}();
        console.log("   Paymaster funded with: 0.1 ETH");

        vm.stopBroadcast();

        // ==================================
        // RESUMEN FINAL
        // ==================================
        console.log("\n===========================================");
        console.log("DEPLOYMENT SUMMARY");
        console.log("===========================================");
        console.log("Network:", block.chainid == SCROLL_MAINNET ? "MAINNET" : "SEPOLIA");
        console.log("USX Token:              ", usxToken);
        console.log("RikuyCore Proxy:        ", rikuyCoreProxy);
        console.log("Treasury Proxy:         ", treasuryProxy);
        console.log("ReportRegistry:         ", address(reportRegistry));
        console.log("MockZKVerifier:         ", address(zkVerifier));
        console.log("GovernmentRegistry:     ", address(governmentRegistry));
        console.log("RikuyPaymaster:         ", address(paymaster));
        console.log("===========================================");

        // Guardar deployment info
        _saveDeploymentInfo();

        console.log("\nDeployment completed!");
        console.log("\nNext steps:");
        console.log("1. Copy addresses to backend/.env");
        console.log("2. Update RIKUY_CONTRACT_ADDRESS");
        console.log("3. Update USX_TOKEN_ADDRESS");
        if (block.chainid == SCROLL_MAINNET) {
            console.log("4. Government: Approve and deposit USX to Treasury");
        }
        console.log("===========================================\n");
    }

    function _saveDeploymentInfo() internal {
        string memory network = block.chainid == SCROLL_MAINNET ? "mainnet" : "sepolia";
        string memory json = "deployment";

        vm.serializeAddress(json, "usxToken", usxToken);
        vm.serializeAddress(json, "RikuyCore", rikuyCoreProxy);
        vm.serializeAddress(json, "Treasury", treasuryProxy);
        vm.serializeAddress(json, "ReportRegistry", address(reportRegistry));
        vm.serializeAddress(json, "MockZKVerifier", address(zkVerifier));
        vm.serializeAddress(json, "GovernmentRegistry", address(governmentRegistry));
        vm.serializeAddress(json, "RikuyPaymaster", address(paymaster));
        string memory finalJson = vm.serializeAddress(json, "deployer", deployer);

        string memory filename = string.concat("./deployments/scroll-", network, ".json");
        vm.writeJson(finalJson, filename);
        console.log("\nDeployment info saved to:", filename);
    }
}
