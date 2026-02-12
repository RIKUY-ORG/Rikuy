// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../contracts/solidity/core/RikuyCoreV2.sol";
import "../contracts/solidity/core/ReportRegistry.sol";
import "../contracts/solidity/governance/GovernmentRegistry.sol";
import "../contracts/solidity/zk/CitizenZkVerifier.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployAllL3 is Script {
    ReportRegistry public reportRegistry;
    RikuyCoreV2 public rikuyCore;
    GovernmentRegistry public governmentRegistry;
    CitizenZkVerifier public zkVerifier;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // AnonymousReport Stylus contract address (deployed separately via cargo-stylus)
        address anonymousReportAddress = vm.envOr("ANONYMOUS_REPORT_ADDRESS", address(0));

        console.log("--------------------------------------------");
        console.log("MASTER DEPLOYMENT: Rikuy Chain L3 + Stylus");
        console.log("Chain ID: %s", block.chainid);
        console.log("Deployer: %s", deployer);
        console.log("AnonymousReport (Stylus): %s", anonymousReportAddress);
        console.log("--------------------------------------------");

        vm.startBroadcast(deployerPrivateKey);

        // ==========================================
        // 1. CORE SYSTEM DEPLOYMENT
        // ==========================================

        // 1.1 ReportRegistry (Proxy)
        ReportRegistry registryImpl = new ReportRegistry();
        bytes memory regInit = abi.encodeWithSelector(ReportRegistry.initialize.selector, deployer);
        ERC1967Proxy regProxy = new ERC1967Proxy(address(registryImpl), regInit);
        reportRegistry = ReportRegistry(address(regProxy));
        console.log("ReportRegistry Proxy: %s", address(regProxy));

        // 1.2 RikuyCore (Proxy) — uses AnonymousReport Stylus contract
        RikuyCoreV2 coreImpl = new RikuyCoreV2();
        bytes memory coreInit = abi.encodeWithSelector(
            RikuyCoreV2.initialize.selector,
            deployer,
            address(regProxy),
            anonymousReportAddress
        );
        ERC1967Proxy coreProxy = new ERC1967Proxy(address(coreImpl), coreInit);
        rikuyCore = RikuyCoreV2(address(coreProxy));
        console.log("RikuyCore Proxy: %s", address(coreProxy));

        // 1.3 GovernmentRegistry
        governmentRegistry = new GovernmentRegistry(deployer);
        console.log("GovernmentRegistry: %s", address(governmentRegistry));

        // ==========================================
        // 2. ZK IDENTITY MODULE
        // ==========================================

        zkVerifier = new CitizenZkVerifier();
        console.log("CitizenZkVerifier: %s", address(zkVerifier));

        // ==========================================
        // 3. CONFIGURATION & WIRING
        // ==========================================
        console.log("\nConfiguring Permissions & Roles...");

        reportRegistry.grantRole(reportRegistry.CORE_ROLE(), address(rikuyCore));
        rikuyCore.grantRole(rikuyCore.GOVERNMENT_ROLE(), deployer);

        governmentRegistry.registerGovernment(deployer, "Gobierno Autonomo Test", "L3 Local");

        vm.stopBroadcast();

        // ==========================================
        // 4. EXPORT CONFIGURATION
        // ==========================================
        string memory json = "json";

        vm.serializeAddress(json, "ReportRegistry", address(reportRegistry));
        vm.serializeAddress(json, "RikuyCore", address(rikuyCore));
        vm.serializeAddress(json, "AnonymousReport", anonymousReportAddress);
        vm.serializeAddress(json, "GovernmentRegistry", address(governmentRegistry));
        vm.serializeAddress(json, "CitizenZkVerifier", address(zkVerifier));

        string memory finalJson = vm.serializeString(json, "chainId", vm.toString(block.chainid));

        vm.writeJson(finalJson, "./frontend/src/config/contracts.json");
        console.log("\n[SUCCESS] Configuration exported to ./frontend/src/config/contracts.json");
    }
}
