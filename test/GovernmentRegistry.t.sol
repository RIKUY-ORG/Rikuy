// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/solidity/governance/GovernmentRegistry.sol";

/**
 * @title GovernmentRegistryTest
 * @notice Tests for GovernmentRegistry — government registration, activation/deactivation
 */
contract GovernmentRegistryTest is Test {
    GovernmentRegistry public registry;
    address public admin = address(0xAD);
    address public gov1 = address(0xC1);
    address public gov2 = address(0xC2);
    address public attacker = address(0xBAD);

    event GovernmentRegistered(address indexed govAddress, string name, string jurisdiction);
    event GovernmentDeactivated(address indexed govAddress);
    event GovernmentActivated(address indexed govAddress);

    function setUp() public {
        vm.prank(admin);
        registry = new GovernmentRegistry(admin);
    }

    // =========================================================================
    // REGISTRATION
    // =========================================================================

    function test_registerGovernment_success() public {
        vm.prank(admin);
        vm.expectEmit(true, false, false, true);
        emit GovernmentRegistered(gov1, "Alcaldia La Paz", "La Paz");
        registry.registerGovernment(gov1, "Alcaldia La Paz", "La Paz");

        assertTrue(registry.isActiveGovernment(gov1));

        (string memory name, string memory jurisdiction, bool isActive, uint256 registeredAt) =
            registry.getGovernmentInfo(gov1);

        assertEq(name, "Alcaldia La Paz");
        assertEq(jurisdiction, "La Paz");
        assertTrue(isActive);
        assertGt(registeredAt, 0);
    }

    function test_registerGovernment_multipleGovs() public {
        vm.startPrank(admin);
        registry.registerGovernment(gov1, "Alcaldia La Paz", "La Paz");
        registry.registerGovernment(gov2, "Alcaldia Cochabamba", "Cochabamba");
        vm.stopPrank();

        address[] memory govs = registry.getAllGovernments();
        assertEq(govs.length, 2);
        assertEq(govs[0], gov1);
        assertEq(govs[1], gov2);
    }

    function test_registerGovernment_revert_zeroAddress() public {
        vm.prank(admin);
        vm.expectRevert("Invalid address");
        registry.registerGovernment(address(0), "Test", "Test");
    }

    function test_registerGovernment_revert_alreadyRegistered() public {
        vm.prank(admin);
        registry.registerGovernment(gov1, "Alcaldia La Paz", "La Paz");

        vm.prank(admin);
        vm.expectRevert("Already registered");
        registry.registerGovernment(gov1, "Otro Nombre", "Otra Jurisdiccion");
    }

    function test_registerGovernment_revert_notOwner() public {
        vm.prank(attacker);
        vm.expectRevert();
        registry.registerGovernment(gov1, "Hack", "Hack");
    }

    // =========================================================================
    // DEACTIVATION
    // =========================================================================

    function test_deactivateGovernment_success() public {
        vm.prank(admin);
        registry.registerGovernment(gov1, "Alcaldia La Paz", "La Paz");

        vm.prank(admin);
        vm.expectEmit(true, false, false, true);
        emit GovernmentDeactivated(gov1);
        registry.deactivateGovernment(gov1);

        assertFalse(registry.isActiveGovernment(gov1));
    }

    function test_deactivateGovernment_revert_alreadyInactive() public {
        vm.prank(admin);
        registry.registerGovernment(gov1, "Alcaldia La Paz", "La Paz");

        vm.prank(admin);
        registry.deactivateGovernment(gov1);

        vm.prank(admin);
        vm.expectRevert("Already inactive");
        registry.deactivateGovernment(gov1);
    }

    function test_deactivateGovernment_revert_notOwner() public {
        vm.prank(admin);
        registry.registerGovernment(gov1, "Alcaldia La Paz", "La Paz");

        vm.prank(attacker);
        vm.expectRevert();
        registry.deactivateGovernment(gov1);
    }

    // =========================================================================
    // ACTIVATION
    // =========================================================================

    function test_activateGovernment_success() public {
        vm.prank(admin);
        registry.registerGovernment(gov1, "Alcaldia La Paz", "La Paz");

        vm.prank(admin);
        registry.deactivateGovernment(gov1);

        vm.prank(admin);
        vm.expectEmit(true, false, false, true);
        emit GovernmentActivated(gov1);
        registry.activateGovernment(gov1);

        assertTrue(registry.isActiveGovernment(gov1));
    }

    function test_activateGovernment_revert_alreadyActive() public {
        vm.prank(admin);
        registry.registerGovernment(gov1, "Alcaldia La Paz", "La Paz");

        vm.prank(admin);
        vm.expectRevert("Already active");
        registry.activateGovernment(gov1);
    }

    function test_activateGovernment_revert_notOwner() public {
        vm.prank(admin);
        registry.registerGovernment(gov1, "Alcaldia La Paz", "La Paz");

        vm.prank(admin);
        registry.deactivateGovernment(gov1);

        vm.prank(attacker);
        vm.expectRevert();
        registry.activateGovernment(gov1);
    }

    // =========================================================================
    // QUERIES
    // =========================================================================

    function test_isActiveGovernment_unregistered() public view {
        assertFalse(registry.isActiveGovernment(address(0x999)));
    }

    function test_getGovernmentInfo_unregistered() public view {
        (string memory name, string memory jurisdiction, bool isActive, uint256 registeredAt) =
            registry.getGovernmentInfo(address(0x999));

        assertEq(name, "");
        assertEq(jurisdiction, "");
        assertFalse(isActive);
        assertEq(registeredAt, 0);
    }

    function test_getAllGovernments_empty() public view {
        address[] memory govs = registry.getAllGovernments();
        assertEq(govs.length, 0);
    }

    // =========================================================================
    // FULL LIFECYCLE
    // =========================================================================

    function test_fullLifecycle_registerDeactivateReactivate() public {
        vm.startPrank(admin);

        // Register
        registry.registerGovernment(gov1, "Alcaldia La Paz", "La Paz");
        assertTrue(registry.isActiveGovernment(gov1));

        // Deactivate
        registry.deactivateGovernment(gov1);
        assertFalse(registry.isActiveGovernment(gov1));

        // Reactivate
        registry.activateGovernment(gov1);
        assertTrue(registry.isActiveGovernment(gov1));

        vm.stopPrank();
    }
}
