// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../src/core/RikuyCore.sol";
import "../src/core/Treasury.sol";
import "../src/core/ReportRegistry.sol";
import "../src/zk/MockZKVerifier.sol";
import "../src/governance/GovernmentRegistry.sol";
import "../src/aa/RikuyPaymaster.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title Deploy
 * @notice Script completo de deploy para RIKUY en Scroll Sepolia
 *
 * ORDEN DE DEPLOY:
 * 1. ReportRegistry (eternal storage)
 * 2. MockZKVerifier (privacidad mock)
 * 3. Treasury (fondos y pagos)
 * 4. RikuyCore (orquestador principal)
 * 5. GovernmentRegistry (whitelist gobiernos)
 * 6. RikuyPaymaster (gasless UX - opcional)
 *
 * USAGE:
 * forge script script/Deploy.s.sol:DeployScript --rpc-url scroll_sepolia --broadcast --verify -vvvv
 */
contract DeployScript is Script {

    // Dirección del deployer (admin inicial)
    address public deployer;

    // Contratos desplegados
    RikuyCore public rikuyCore;
    RikuyTreasury public treasury;
    ReportRegistry public reportRegistry;
    MockZKVerifier public zkVerifier;
    GovernmentRegistry public governmentRegistry;
    RikuyPaymaster public paymaster;

    // Proxies
    address public rikuyCoreProxy;
    address public treasuryProxy;

    // EntryPoint para AA (dirección oficial en testnets)
    // Scroll Sepolia EntryPoint v0.7: https://docs.scroll.io/en/developers/guides/account-abstraction/
    address public constant ENTRYPOINT_ADDRESS = 0x0000000071727De22E5E9d8BAf0edAc6f37da032;

    function run() public {
        // 1. Setup deployer
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        deployer = vm.addr(deployerPrivateKey);

        console.log("===========================================");
        console.log("RIKUY - Deployment Script");
        console.log("===========================================");
        console.log("Deployer:", deployer);
        console.log("Chain ID:", block.chainid);
        console.log("===========================================\n");

        vm.startBroadcast(deployerPrivateKey);

        // ==================================
        // PASO 1: ReportRegistry
        // ==================================
        console.log("1. Deploying ReportRegistry...");
        reportRegistry = new ReportRegistry();
        reportRegistry.initialize(deployer);
        console.log("   ReportRegistry deployed at:", address(reportRegistry));

        // ==================================
        // PASO 2: MockZKVerifier
        // ==================================
        console.log("\n2. Deploying MockZKVerifier...");
        zkVerifier = new MockZKVerifier();
        console.log("   MockZKVerifier deployed at:", address(zkVerifier));

        // ==================================
        // PASO 3: Treasury (con proxy UUPS)
        // ==================================
        console.log("\n3. Deploying Treasury (UUPS)...");

        // Deploy implementation
        RikuyTreasury treasuryImpl = new RikuyTreasury();
        console.log("   Treasury Implementation:", address(treasuryImpl));

        // Encode initializer
        bytes memory treasuryInitData = abi.encodeWithSelector(
            RikuyTreasury.initialize.selector,
            deployer
        );

        // Deploy proxy
        ERC1967Proxy treasuryProxyContract = new ERC1967Proxy(
            address(treasuryImpl),
            treasuryInitData
        );
        treasuryProxy = address(treasuryProxyContract);
        treasury = RikuyTreasury(payable(treasuryProxy));
        console.log("   Treasury Proxy:", treasuryProxy);

        // ==================================
        // PASO 4: RikuyCore (con proxy UUPS)
        // ==================================
        console.log("\n4. Deploying RikuyCore (UUPS)...");

        // Deploy implementation
        RikuyCore rikuyCoreImpl = new RikuyCore();
        console.log("   RikuyCore Implementation:", address(rikuyCoreImpl));

        // Encode initializer
        bytes memory coreInitData = abi.encodeWithSelector(
            RikuyCore.initialize.selector,
            deployer,
            address(reportRegistry),
            treasuryProxy,
            address(zkVerifier)
        );

        // Deploy proxy
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
        governmentRegistry = new GovernmentRegistry();
        console.log("   GovernmentRegistry deployed at:", address(governmentRegistry));

        // ==================================
        // PASO 6: RikuyPaymaster (opcional)
        // ==================================
        if (ENTRYPOINT_ADDRESS != address(0)) {
            console.log("\n6. Deploying RikuyPaymaster...");
            paymaster = new RikuyPaymaster(IEntryPoint(ENTRYPOINT_ADDRESS));
            console.log("   RikuyPaymaster deployed at:", address(paymaster));
        } else {
            console.log("\n6. Skipping Paymaster (no EntryPoint)");
        }

        // ==================================
        // CONFIGURACIÓN POST-DEPLOY
        // ==================================
        console.log("\n===========================================");
        console.log("POST-DEPLOYMENT CONFIGURATION");
        console.log("===========================================");

        // 1. Dar permisos a RikuyCore en ReportRegistry
        console.log("\n1. Granting OPERATOR_ROLE to RikuyCore in ReportRegistry...");
        reportRegistry.grantRole(reportRegistry.OPERATOR_ROLE(), rikuyCoreProxy);

        // 2. Dar permisos a RikuyCore en Treasury
        console.log("2. Granting OPERATOR_ROLE to RikuyCore in Treasury...");
        treasury.grantRole(treasury.OPERATOR_ROLE(), rikuyCoreProxy);

        // 3. Dar rol de gobierno al deployer (temporal, para testing)
        console.log("3. Granting GOVERNMENT_ROLE to deployer (for testing)...");
        rikuyCore.grantRole(rikuyCore.GOVERNMENT_ROLE(), deployer);
        treasury.grantRole(treasury.GOVERNMENT_ROLE(), deployer);

        // 4. Registrar gobierno de testing
        console.log("4. Registering test government...");
        governmentRegistry.registerGovernment(
            deployer,
            "Test Government",
            "Scroll Sepolia Testnet"
        );

        // 5. Fondear Treasury con fondos iniciales (0.1 ETH)
        console.log("5. Funding Treasury with 0.1 ETH...");
        treasury.depositFunds{value: 0.1 ether}();

        // 6. Fondear Paymaster si fue desplegado (0.05 ETH)
        if (address(paymaster) != address(0)) {
            console.log("6. Funding Paymaster with 0.05 ETH...");
            paymaster.deposit{value: 0.05 ether}();
        }

        vm.stopBroadcast();

        // ==================================
        // RESUMEN FINAL
        // ==================================
        console.log("\n===========================================");
        console.log("DEPLOYMENT SUMMARY");
        console.log("===========================================");
        console.log("RikuyCore Proxy:        ", rikuyCoreProxy);
        console.log("Treasury Proxy:         ", treasuryProxy);
        console.log("ReportRegistry:         ", address(reportRegistry));
        console.log("MockZKVerifier:         ", address(zkVerifier));
        console.log("GovernmentRegistry:     ", address(governmentRegistry));
        if (address(paymaster) != address(0)) {
            console.log("RikuyPaymaster:         ", address(paymaster));
        }
        console.log("===========================================");

        // Guardar addresses en archivo JSON
        _saveDeploymentInfo();

        console.log("\n✅ Deployment completed successfully!");
        console.log("\n📝 Next steps:");
        console.log("1. Copy addresses to backend/.env");
        console.log("2. Verify contracts on Scrollscan");
        console.log("3. Test creating a report");
        console.log("===========================================\n");
    }

    function _saveDeploymentInfo() internal {
        string memory json = "deployment";

        vm.serializeAddress(json, "RikuyCore", rikuyCoreProxy);
        vm.serializeAddress(json, "Treasury", treasuryProxy);
        vm.serializeAddress(json, "ReportRegistry", address(reportRegistry));
        vm.serializeAddress(json, "MockZKVerifier", address(zkVerifier));
        vm.serializeAddress(json, "GovernmentRegistry", address(governmentRegistry));

        if (address(paymaster) != address(0)) {
            vm.serializeAddress(json, "RikuyPaymaster", address(paymaster));
        }

        string memory finalJson = vm.serializeAddress(json, "deployer", deployer);

        vm.writeJson(finalJson, "./deployments/scroll-sepolia.json");
        console.log("\n💾 Deployment info saved to deployments/scroll-sepolia.json");
    }
}
