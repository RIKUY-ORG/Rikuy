// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/core/RikuyCoreV2.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title DeployRikuyCoreV2
 * @notice Script para deployar RikuyCoreV2 con MockSemaphoreAdapter
 *
 * Uso:
 * forge script script/DeployRikuyCoreV2.s.sol:DeployRikuyCoreV2 \
 *   --rpc-url $SCROLL_RPC_URL \
 *   --broadcast
 */
contract DeployRikuyCoreV2 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("RELAYER_PRIVATE_KEY");
        address admin = vm.envAddress("RELAYER_ADDRESS");
        address reportRegistry = vm.envAddress("REPORT_REGISTRY_ADDRESS");
        address treasury = vm.envAddress("TREASURY_ADDRESS");

        // Hardcoded MockAdapter address (el .env no se lee bien)
        address mockAdapter = 0x098FF07f87C1AAec0dD5b16c2F0199aA2b60bB75;

        console.log("\n==============================================");
        console.log("Deploying RikuyCoreV2 to Scroll Sepolia");
        console.log("==============================================\n");
        console.log("Admin:", admin);
        console.log("ReportRegistry:", reportRegistry);
        console.log("Treasury:", treasury);
        console.log("MockSemaphoreAdapter:", mockAdapter);
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy implementation
        RikuyCoreV2 implementation = new RikuyCoreV2();
        console.log("Implementation deployed:", address(implementation));

        // 2. Prepare initialization data
        bytes memory initData = abi.encodeWithSelector(
            RikuyCoreV2.initialize.selector,
            admin,           // _admin
            reportRegistry,  // _reportRegistry
            treasury,        // _treasury
            mockAdapter      // _semaphoreAdapter (MockAdapter!)
        );

        // 3. Deploy proxy
        ERC1967Proxy proxy = new ERC1967Proxy(
            address(implementation),
            initData
        );

        console.log("Proxy deployed:", address(proxy));

        // 4. Grant RELAYER_ROLE to admin
        RikuyCoreV2 rikuyCore = RikuyCoreV2(address(proxy));
        rikuyCore.addRelayer(admin);
        console.log("RELAYER_ROLE granted to:", admin);

        vm.stopBroadcast();

        console.log("\n==============================================");
        console.log("Deployment Complete!");
        console.log("==============================================");
        console.log("RikuyCoreV2 Proxy:", address(proxy));
        console.log("Implementation:", address(implementation));
        console.log("\n==============================================");
        console.log("Next Steps:");
        console.log("==============================================");
        console.log("1. Update backend/.env:");
        console.log("   RIKUY_CORE_V2_ADDRESS=%s", address(proxy));
        console.log("\n2. Restart backend to use new contract");
        console.log("\n3. Test report creation flow!");
        console.log("==============================================\n");
    }
}
