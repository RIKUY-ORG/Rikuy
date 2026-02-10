// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../contracts/solidity/core/RikuyCoreV2.sol";
import "../contracts/solidity/core/Treasury.sol";
import "../contracts/solidity/core/ReportRegistry.sol";
import "../contracts/solidity/zk/MockSemaphoreAdapter.sol";
import "../contracts/solidity/governance/GovernmentRegistry.sol";
import "../contracts/solidity/zk/CitizenZkVerifier.sol"; // ZK Identity
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSXToken is ERC20 {
    constructor() ERC20("Mock USX Token", "mUSX") {
        _mint(msg.sender, 1_000_000 * 1e18);
    }
}

contract DeployAllL3 is Script {
    // State variables to be accessible for export
    MockUSXToken public mockUSX;
    ReportRegistry public reportRegistry;
    RikuyTreasury public treasury;
    RikuyCoreV2 public rikuyCore;
    GovernmentRegistry public governmentRegistry;
    MockSemaphoreAdapter public semaphoreAdapter;
    CitizenZkVerifier public zkVerifier;

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("--------------------------------------------");
        console.log("MASTER DEPLOYMENT: Rikuy Chain L3 (Hackathon Edition)");
        console.log("Chain ID: %s", block.chainid);
        console.log("Deployer: %s", deployer);
        console.log("--------------------------------------------");

        vm.startBroadcast(deployerPrivateKey);

        // ==========================================
        // 1. CORE SYSTEM DEPLOYMENT
        // ==========================================
        
        // 1.1 MockUSX
        mockUSX = new MockUSXToken();
        console.log("MockUSX: %s", address(mockUSX));

        // 1.2 ReportRegistry (Proxy)
        ReportRegistry registryImpl = new ReportRegistry();
        bytes memory regInit = abi.encodeWithSelector(ReportRegistry.initialize.selector, deployer);
        ERC1967Proxy regProxy = new ERC1967Proxy(address(registryImpl), regInit);
        reportRegistry = ReportRegistry(address(regProxy));
        console.log("ReportRegistry Proxy: %s", address(regProxy));

        // 1.3 Semaphore Adapter (Mock) - Reemplaza con real si tienes contrato Semaphore
        semaphoreAdapter = new MockSemaphoreAdapter();
        console.log("SemaphoreAdapter: %s", address(semaphoreAdapter));

        // 1.4 Treasury (Proxy)
        RikuyTreasury treasuryImpl = new RikuyTreasury();
        bytes memory treasInit = abi.encodeWithSelector(RikuyTreasury.initialize.selector, deployer, address(mockUSX));
        ERC1967Proxy treasProxy = new ERC1967Proxy(address(treasuryImpl), treasInit);
        treasury = RikuyTreasury(payable(address(treasProxy)));
        console.log("Treasury Proxy: %s", address(treasProxy));

        // 1.5 RikuyCore (Proxy)
        RikuyCoreV2 coreImpl = new RikuyCoreV2();
        bytes memory coreInit = abi.encodeWithSelector(
            RikuyCoreV2.initialize.selector,
            deployer,
            address(regProxy),
            address(treasProxy),
            address(semaphoreAdapter) // Usando Mock por ahora
        );
        ERC1967Proxy coreProxy = new ERC1967Proxy(address(coreImpl), coreInit);
        rikuyCore = RikuyCoreV2(address(coreProxy));
        console.log("RikuyCore Proxy: %s", address(coreProxy));

        // 1.6 GovernmentRegistry
        governmentRegistry = new GovernmentRegistry(deployer);
        console.log("GovernmentRegistry: %s", address(governmentRegistry));

        // ==========================================
        // 2. HACKATHON MODULES (ZK IDENTITY)
        // ==========================================
        
        // 2.1 Citizen ZK Verifier (Reclaim Protocol)
        zkVerifier = new CitizenZkVerifier();
        console.log("CitizenZkVerifier: %s", address(zkVerifier));

        // ==========================================
        // 3. CONFIGURATION & WIRING
        // ==========================================
        console.log("\nConfiguring Permissions & Roles...");
        
        // Core -> Registry
        reportRegistry.grantRole(reportRegistry.CORE_ROLE(), address(rikuyCore));
        // Core -> Treasury
        treasury.grantRole(treasury.OPERATOR_ROLE(), address(rikuyCore));
        // Deployer -> Core Government
        rikuyCore.grantRole(rikuyCore.GOVERNMENT_ROLE(), deployer);
        // Deployer -> Treasury Government
        treasury.grantRole(treasury.GOVERNMENT_ROLE(), deployer);

        // Register default government
        governmentRegistry.registerGovernment(deployer, "Gobierno Autonomo Test", "L3 Local");

        // Fund Treasury
        mockUSX.approve(address(treasury), 100_000 * 1e18);
        treasury.depositFunds(100_000 * 1e18);
        console.log("Treasury funded with 100k mUSX");

        vm.stopBroadcast();

        // ==========================================
        // 4. EXPORT CONFIGURATION (FRONTEND)
        // ==========================================
        string memory json = "json";
        
        vm.serializeAddress(json, "MockUSX", address(mockUSX));
        vm.serializeAddress(json, "ReportRegistry", address(reportRegistry));
        vm.serializeAddress(json, "Treasury", address(treasury));
        vm.serializeAddress(json, "RikuyCore", address(rikuyCore));
        vm.serializeAddress(json, "SemaphoreAdapter", address(semaphoreAdapter));
        vm.serializeAddress(json, "GovernmentRegistry", address(governmentRegistry));
        vm.serializeAddress(json, "CitizenZkVerifier", address(zkVerifier));
        
        string memory finalJson = vm.serializeString(json, "chainId", vm.toString(block.chainid));

        // Escribir en la ruta del frontend
        // IMPORTANTE: Asegúrate de que esta ruta existe o ajústala
        vm.writeJson(finalJson, "./frontend/src/config/contracts.json");
        console.log("\n[SUCCESS] Configuration exported to ./frontend/src/config/contracts.json");
    }
}
