// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "./DeployRikuy.s.sol";
import "forge-std/console.sol";

contract DeployL3 is DeployRikuy {
    function runL3() public {
        // Ejecutar la lógica de despliegue heredada
        run();

        // Exportar direcciones a JSON para el frontend
        string memory json = "json";
        vm.serializeAddress(json, "MockUSX", address(mockUSX));
        vm.serializeAddress(json, "ReportRegistry", reportRegistryProxy);
        vm.serializeAddress(json, "Treasury", treasuryProxy);
        vm.serializeAddress(json, "RikuyCore", rikuyCoreProxy);
        vm.serializeAddress(json, "SemaphoreAdapter", address(semaphoreAdapter));
        vm.serializeAddress(json, "GovernmentRegistry", address(governmentRegistry));
        
        string memory finalJson = vm.serializeString(json, "chainId", vm.toString(block.chainid));

        // Ruta relativa desde la raíz del proyecto foundry
        string memory path = "./frontend/src/config/contracts.json";
        vm.writeJson(finalJson, path);
        
        console.log("\n[+] Contract addresses saved to:", path);
    }
}
