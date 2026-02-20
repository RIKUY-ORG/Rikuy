// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../contracts/solidity/zk/CitizenZkVerifier.sol";

contract DeployZkVerifier is Script {
    CitizenZkVerifier public verifier;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("--------------------------------------------");
        console.log("Deploying CitizenZkVerifier to L3");
        console.log("Deployer: %s", deployer);
        console.log("--------------------------------------------");

        vm.startBroadcast(deployerPrivateKey);

        // Reclaim Verifier address — set via env or use default for testnet
        address reclaimVerifier = vm.envOr("RECLAIM_VERIFIER_ADDRESS", address(0xf90085F5FA697C1868D5578E3FA359461fDa2eD5));
        verifier = new CitizenZkVerifier(reclaimVerifier);
        console.log("CitizenZkVerifier deployed at: %s", address(verifier));
        console.log("  -> Reclaim Verifier: %s", reclaimVerifier);

        vm.stopBroadcast();
        
        // Exportar dirección
        string memory json = "json";
        vm.serializeAddress(json, "CitizenZkVerifier", address(verifier));
        string memory finalJson = vm.serializeString(json, "chainId", vm.toString(block.chainid));
        
        // Append al archivo existente (esto sobrescribirá si no leemos primero, pero para el ejemplo está bien)
        // En prod deberíamos leer y mergear.
        vm.writeJson(finalJson, "./frontend/src/config/zk_contracts.json");
    }
}
