// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../contracts/solidity/core/RikuyCoreV2.sol";
import "../contracts/solidity/core/ReportRegistry.sol";
import "../contracts/solidity/governance/GovernmentRegistry.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract DeployLocal is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // AnonymousReport Stylus contract (deployed separately via cargo-stylus)
        address anonymousReportAddress = vm.envOr("ANONYMOUS_REPORT_ADDRESS", address(0));

        console.log("--------------------------------------------");
        console.log("Deploying to Local L3 (Chain ID: %s)", block.chainid);
        console.log("Deployer: %s", deployer);
        console.log("AnonymousReport (Stylus): %s", anonymousReportAddress);
        console.log("--------------------------------------------");

        vm.startBroadcast(deployerPrivateKey);

        // 1. ReportRegistry (Proxy)
        ReportRegistry registryImpl = new ReportRegistry();
        bytes memory regInit = abi.encodeWithSelector(ReportRegistry.initialize.selector, deployer);
        ERC1967Proxy regProxy = new ERC1967Proxy(address(registryImpl), regInit);
        ReportRegistry reportRegistry = ReportRegistry(address(regProxy));
        console.log("ReportRegistry Proxy: %s", address(regProxy));

        // 2. RikuyCore (Proxy)
        RikuyCoreV2 coreImpl = new RikuyCoreV2();
        bytes memory coreInit = abi.encodeWithSelector(
            RikuyCoreV2.initialize.selector,
            deployer,
            address(regProxy),
            anonymousReportAddress
        );
        ERC1967Proxy coreProxy = new ERC1967Proxy(address(coreImpl), coreInit);
        RikuyCoreV2 rikuyCore = RikuyCoreV2(address(coreProxy));
        console.log("RikuyCore Proxy: %s", address(coreProxy));

        // 3. GovernmentRegistry
        GovernmentRegistry govReg = new GovernmentRegistry(deployer);
        console.log("GovernmentRegistry: %s", address(govReg));

        // Configuration
        console.log("Configuring Roles...");
        reportRegistry.grantRole(reportRegistry.CORE_ROLE(), address(coreProxy));
        rikuyCore.grantRole(rikuyCore.GOVERNMENT_ROLE(), deployer);

        // Grant RELAYER_ROLE to backend wallet (defaults to deployer for dev/testing)
        address relayerAddress = vm.envOr("RELAYER_ADDRESS", deployer);
        rikuyCore.addRelayer(relayerAddress);
        console.log("Relayer: %s", relayerAddress);

        govReg.registerGovernment(deployer, "Rikuy Local Gov", "L3 Local");

        vm.stopBroadcast();

        // Export JSON for Frontend
        string memory json = "json";
        vm.serializeAddress(json, "ReportRegistry", address(regProxy));
        vm.serializeAddress(json, "RikuyCore", address(coreProxy));
        vm.serializeAddress(json, "AnonymousReport", anonymousReportAddress);
        vm.serializeAddress(json, "GovernmentRegistry", address(govReg));
        string memory finalJson = vm.serializeString(json, "chainId", vm.toString(block.chainid));

        vm.writeJson(finalJson, "./frontend/src/config/contracts.json");
        console.log("JSON exported to ./frontend/src/config/contracts.json");
    }
}
