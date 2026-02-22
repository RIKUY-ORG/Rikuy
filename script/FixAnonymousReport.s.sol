// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../contracts/solidity/core/RikuyCoreV2.sol";
import "../test/mocks/MockAnonymousReport.sol";

/**
 * @title FixAnonymousReport
 * @notice Deploy a Solidity AnonymousReport and update RikuyCoreV2 proxy
 * @dev Fixes the issue where the Stylus WASM program is not activated on the fresh L3 chain.
 *      Deploys MockAnonymousReport (full Solidity implementation of IAnonymousReport)
 *      and upgrades RikuyCoreV2 to a version with setAnonymousReport().
 */
contract FixAnonymousReport is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Existing proxy address
        address rikuyCoreProxy = 0x61FC4578863DA32DC4e879F59e1cb673dA498618;

        console.log("--------------------------------------------");
        console.log("Fixing AnonymousReport on Chain ID: %s", block.chainid);
        console.log("Deployer: %s", deployer);
        console.log("RikuyCore Proxy: %s", rikuyCoreProxy);
        console.log("--------------------------------------------");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy new RikuyCoreV2 implementation (with setAnonymousReport)
        RikuyCoreV2 newImpl = new RikuyCoreV2();
        console.log("New RikuyCoreV2 Impl: %s", address(newImpl));

        // 2. Upgrade proxy to new implementation
        RikuyCoreV2 core = RikuyCoreV2(rikuyCoreProxy);
        core.upgradeToAndCall(address(newImpl), "");
        console.log("Proxy upgraded");

        // 3. Deploy MockAnonymousReport with admin = RikuyCore proxy
        //    (so RikuyCoreV2 can call registerCommitment, storeReport, etc.)
        MockAnonymousReport mockAR = new MockAnonymousReport(rikuyCoreProxy);
        console.log("MockAnonymousReport: %s", address(mockAR));

        // 4. Update RikuyCoreV2 to use the new AnonymousReport
        core.setAnonymousReport(address(mockAR));
        console.log("AnonymousReport updated in RikuyCoreV2");

        vm.stopBroadcast();

        // Update the contracts JSON
        string memory json = "json";
        vm.serializeAddress(json, "ReportRegistry", 0x1b8E378f489021029b4e9049F261B204Def16974);
        vm.serializeAddress(json, "RikuyCore", rikuyCoreProxy);
        vm.serializeAddress(json, "AnonymousReport", address(mockAR));
        vm.serializeAddress(json, "GovernmentRegistry", 0x098FF07f87C1AAec0dD5b16c2F0199aA2b60bB75);
        string memory finalJson = vm.serializeString(json, "chainId", vm.toString(block.chainid));
        vm.writeJson(finalJson, "./frontend/src/config/contracts.json");
        console.log("contracts.json updated with new AnonymousReport address");
    }
}
