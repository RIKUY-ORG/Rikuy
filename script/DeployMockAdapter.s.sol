// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/zk/MockSemaphoreAdapter.sol";

/**
 * @title DeployMockAdapter
 * @notice Script para deployar MockSemaphoreAdapter en Scroll Sepolia
 *
 * ⚠️ SOLO PARA DESARROLLO - NO USAR EN PRODUCCIÓN
 *
 * Uso:
 * forge script script/DeployMockAdapter.s.sol:DeployMockAdapter \
 *   --rpc-url $SCROLL_RPC_URL \
 *   --broadcast \
 *   --verify
 */
contract DeployMockAdapter is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("RELAYER_PRIVATE_KEY");

        console.log("\n==============================================");
        console.log("Deploying MockSemaphoreAdapter to Scroll Sepolia");
        console.log("==============================================\n");

        vm.startBroadcast(deployerPrivateKey);

        // Deploy MockSemaphoreAdapter
        MockSemaphoreAdapter mockAdapter = new MockSemaphoreAdapter();

        vm.stopBroadcast();

        console.log("\n==============================================");
        console.log("Deployment Complete!");
        console.log("==============================================");
        console.log("MockSemaphoreAdapter:", address(mockAdapter));
        console.log("\nIs Mock:", mockAdapter.IS_MOCK());
        console.log("\n==============================================");
        console.log("Next Steps:");
        console.log("==============================================");
        console.log("1. Update backend/.env:");
        console.log("   SEMAPHORE_ADAPTER_ADDRESS=%s", address(mockAdapter));
        console.log("\n2. Restart backend to use new Mock Adapter");
        console.log("\n3. WARNING: This contract accepts ANY proof without verification!");
        console.log("   DO NOT use in production!");
        console.log("==============================================\n");
    }
}
