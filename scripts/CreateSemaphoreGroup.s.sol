// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "@semaphore/interfaces/ISemaphore.sol";

/**
 * @title CreateSemaphoreGroup
 * @notice Script para crear un grupo Semaphore en Scroll Sepolia
 *
 * USAGE:
 * forge script script/CreateSemaphoreGroup.s.sol \
 *   --rpc-url $SCROLL_RPC_URL \
 *   --broadcast \
 *   --private-key $PRIVATE_KEY
 */
contract CreateSemaphoreGroupScript is Script {

    // Dirección de Semaphore en Scroll Sepolia
    address constant SEMAPHORE_ADDRESS = 0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("===========================================");
        console.log("RIKUY - Creando Grupo Semaphore");
        console.log("===========================================");
        console.log("Deployer:", deployer);
        console.log("Semaphore Address:", SEMAPHORE_ADDRESS);
        console.log("Chain ID:", block.chainid);
        console.log("===========================================\n");

        ISemaphore semaphore = ISemaphore(SEMAPHORE_ADDRESS);

        // Verificar que Semaphore existe
        uint256 currentGroupCounter = semaphore.groupCounter();
        console.log("Current Semaphore groups:", currentGroupCounter);

        vm.startBroadcast(deployerPrivateKey);

        // Crear grupo con el deployer como admin
        // Merkle tree duration: 1 hour (3600 seconds)
        uint256 groupId = semaphore.createGroup(deployer, 3600);

        vm.stopBroadcast();

        console.log("\n===========================================");
        console.log("GRUPO CREADO EXITOSAMENTE");
        console.log("===========================================");
        console.log("Group ID:", groupId);
        console.log("Admin:", deployer);
        console.log("Merkle Tree Duration: 3600 seconds (1 hour)");
        console.log("===========================================\n");

        console.log("\n===========================================");
        console.log("SIGUIENTE PASO:");
        console.log("===========================================");
        console.log("Actualizar .env con:");
        console.log(string.concat("SEMAPHORE_GROUP_ID=", vm.toString(groupId)));
        console.log("\nLuego ejecutar: forge script script/Deploy.s.sol");
        console.log("===========================================\n");
    }
}
