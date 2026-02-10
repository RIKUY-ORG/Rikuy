// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "forge-std/Script.sol";
import "../contracts/solidity/core/RikuyCoreV2.sol";
import "../contracts/solidity/core/Treasury.sol";
import "../contracts/solidity/core/ReportRegistry.sol";
import "../contracts/solidity/zk/MockSemaphoreAdapter.sol";
import "../contracts/solidity/governance/GovernmentRegistry.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSXToken is ERC20 {
    constructor() ERC20("Mock USX Token", "mUSX") {
        _mint(msg.sender, 1_000_000 * 1e18);
    }
}

contract DeployLocal is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("--------------------------------------------");
        console.log("Deploying to Local L3 (Chain ID: %s)", block.chainid);
        console.log("Deployer: %s", deployer);
        console.log("--------------------------------------------");

        vm.startBroadcast(deployerPrivateKey);

        // 1. MockUSX
        MockUSXToken mockUSX = new MockUSXToken();
        console.log("MockUSX: %s", address(mockUSX));

        // 2. ReportRegistry (Proxy)
        ReportRegistry registryImpl = new ReportRegistry();
        bytes memory regInit = abi.encodeWithSelector(ReportRegistry.initialize.selector, deployer);
        ERC1967Proxy regProxy = new ERC1967Proxy(address(registryImpl), regInit);
        ReportRegistry reportRegistry = ReportRegistry(address(regProxy));
        console.log("ReportRegistry Proxy: %s", address(regProxy));

        // 3. Semaphore Adapter (Mock)
        MockSemaphoreAdapter adapter = new MockSemaphoreAdapter();
        console.log("SemaphoreAdapter: %s", address(adapter));

        // 4. Treasury (Proxy)
        RikuyTreasury treasuryImpl = new RikuyTreasury();
        bytes memory treasInit = abi.encodeWithSelector(RikuyTreasury.initialize.selector, deployer, address(mockUSX));
        ERC1967Proxy treasProxy = new ERC1967Proxy(address(treasuryImpl), treasInit);
        RikuyTreasury treasury = RikuyTreasury(payable(address(treasProxy)));
        console.log("Treasury Proxy: %s", address(treasProxy));

        // 5. RikuyCore (Proxy)
        RikuyCoreV2 coreImpl = new RikuyCoreV2();
        bytes memory coreInit = abi.encodeWithSelector(
            RikuyCoreV2.initialize.selector,
            deployer,
            address(regProxy),
            address(treasProxy),
            address(adapter)
        );
        ERC1967Proxy coreProxy = new ERC1967Proxy(address(coreImpl), coreInit);
        RikuyCoreV2 rikuyCore = RikuyCoreV2(address(coreProxy));
        console.log("RikuyCore Proxy: %s", address(coreProxy));

        // 6. GovernmentRegistry
        GovernmentRegistry govReg = new GovernmentRegistry(deployer);
        console.log("GovernmentRegistry: %s", address(govReg));

        // Configuración
        console.log("Configuring Roles...");
        reportRegistry.grantRole(reportRegistry.CORE_ROLE(), address(coreProxy));
        treasury.grantRole(treasury.OPERATOR_ROLE(), address(coreProxy));
        rikuyCore.grantRole(rikuyCore.GOVERNMENT_ROLE(), deployer);
        treasury.grantRole(treasury.GOVERNMENT_ROLE(), deployer);

        govReg.registerGovernment(deployer, "Rikuy Local Gov", "L3 Local");

        // Fondear Treasury
        mockUSX.approve(address(treasProxy), 100_000 * 1e18);
        treasury.depositFunds(100_000 * 1e18);

        vm.stopBroadcast();

        // Exportar JSON para Frontend
        string memory json = "json";
        vm.serializeAddress(json, "MockUSX", address(mockUSX));
        vm.serializeAddress(json, "ReportRegistry", address(regProxy));
        vm.serializeAddress(json, "Treasury", address(treasProxy));
        vm.serializeAddress(json, "RikuyCore", address(coreProxy));
        vm.serializeAddress(json, "SemaphoreAdapter", address(adapter));
        vm.serializeAddress(json, "GovernmentRegistry", address(govReg));
        string memory finalJson = vm.serializeString(json, "chainId", vm.toString(block.chainid));

        vm.writeJson(finalJson, "./frontend/src/config/contracts.json");
        console.log("JSON exported to ./frontend/src/config/contracts.json");
    }
}
