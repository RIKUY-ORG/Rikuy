// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/solidity/core/ReportRegistry.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title ReportRegistryTest
 * @notice Tests for ReportRegistry — packed storage, nullifier checks, access control
 */
contract ReportRegistryTest is Test {
    ReportRegistry public registry;
    address public admin = address(0xAD);
    address public coreRole = address(0xC0);
    address public attacker = address(0xBAD);

    event ReportStored(bytes32 indexed reportId, bytes32 arkivTxId, uint16 category);
    event ValidationRecorded(bytes32 indexed reportId, address indexed validator);
    event ReportResolved(bytes32 indexed reportId);

    function setUp() public {
        // Deploy implementation + proxy (UUPS pattern)
        ReportRegistry impl = new ReportRegistry();
        bytes memory initData = abi.encodeWithSelector(
            ReportRegistry.initialize.selector,
            admin
        );
        ERC1967Proxy proxy = new ERC1967Proxy(address(impl), initData);
        registry = ReportRegistry(address(proxy));

        // Grant CORE_ROLE to the mock core address
        vm.startPrank(admin);
        registry.grantRole(registry.CORE_ROLE(), coreRole);
        vm.stopPrank();
    }

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    function test_initialize_setsAdmin() public view {
        assertTrue(registry.hasRole(registry.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(registry.hasRole(registry.CORE_ROLE(), admin));
    }

    function test_initialize_cannotReinitialize() public {
        vm.expectRevert();
        registry.initialize(attacker);
    }

    // =========================================================================
    // STORE REPORT
    // =========================================================================

    function test_storeReport_success() public {
        bytes32 reportId = keccak256("report-1");
        bytes32 arkivTxId = keccak256("arkiv-1");
        bytes32 nullifier = keccak256("null-1");
        uint16 category = 0; // INFRAESTRUCTURA

        vm.prank(coreRole);
        vm.expectEmit(true, false, false, true);
        emit ReportStored(reportId, arkivTxId, category);
        registry.storeReport(reportId, arkivTxId, nullifier, category);

        // Verify storage
        IReportRegistry.Report memory report = registry.getReport(reportId);
        assertEq(report.arkivTxId, arkivTxId);
        assertEq(report.nullifierHash, nullifier);
        assertEq(report.categoryId, category);
        assertEq(report.validationScore, 0);
        assertFalse(report.isResolved);
        assertGt(report.timestamp, 0);
    }

    function test_storeReport_allCategories() public {
        for (uint16 i = 0; i <= 4; i++) {
            bytes32 reportId = keccak256(abi.encodePacked("report-", i));
            bytes32 nullifier = keccak256(abi.encodePacked("null-", i));

            vm.prank(coreRole);
            registry.storeReport(reportId, keccak256("arkiv"), nullifier, i);

            IReportRegistry.Report memory report = registry.getReport(reportId);
            assertEq(report.categoryId, i);
        }
        assertEq(registry.getTotalReports(), 5);
    }

    function test_storeReport_revert_invalidCategory() public {
        vm.prank(coreRole);
        vm.expectRevert("Invalid category");
        registry.storeReport(
            keccak256("r"), keccak256("a"), keccak256("n"), 5
        );
    }

    function test_storeReport_revert_duplicateNullifier() public {
        bytes32 nullifier = keccak256("unique-null");

        vm.prank(coreRole);
        registry.storeReport(keccak256("r1"), keccak256("a1"), nullifier, 0);

        vm.prank(coreRole);
        vm.expectRevert("Nullifier already used");
        registry.storeReport(keccak256("r2"), keccak256("a2"), nullifier, 1);
    }

    function test_storeReport_revert_unauthorized() public {
        vm.prank(attacker);
        vm.expectRevert();
        registry.storeReport(
            keccak256("r"), keccak256("a"), keccak256("n"), 0
        );
    }

    // =========================================================================
    // VALIDATION
    // =========================================================================

    function test_recordValidation_success() public {
        bytes32 reportId = keccak256("report-val");
        address validator = address(0x123);

        vm.prank(coreRole);
        registry.storeReport(reportId, keccak256("a"), keccak256("n"), 0);

        vm.prank(coreRole);
        vm.expectEmit(true, true, false, true);
        emit ValidationRecorded(reportId, validator);
        registry.recordValidation(reportId, validator);

        assertTrue(registry.hasUserValidated(reportId, validator));
    }

    function test_recordValidation_revert_duplicate() public {
        bytes32 reportId = keccak256("report-dup");
        address validator = address(0x456);

        vm.prank(coreRole);
        registry.storeReport(reportId, keccak256("a"), keccak256("n"), 0);

        vm.prank(coreRole);
        registry.recordValidation(reportId, validator);

        vm.prank(coreRole);
        vm.expectRevert("Already validated");
        registry.recordValidation(reportId, validator);
    }

    function test_incrementValidationScore() public {
        bytes32 reportId = keccak256("report-score");

        vm.prank(coreRole);
        registry.storeReport(reportId, keccak256("a"), keccak256("n"), 0);

        vm.prank(coreRole);
        registry.incrementValidationScore(reportId);

        IReportRegistry.Report memory report = registry.getReport(reportId);
        assertEq(report.validationScore, 1);
    }

    function test_incrementValidationScore_revert_maxScore() public {
        bytes32 reportId = keccak256("report-max");

        vm.prank(coreRole);
        registry.storeReport(reportId, keccak256("a"), keccak256("n"), 0);

        // Increment to 255
        for (uint256 i = 0; i < 255; i++) {
            vm.prank(coreRole);
            registry.incrementValidationScore(reportId);
        }

        vm.prank(coreRole);
        vm.expectRevert("Max score reached");
        registry.incrementValidationScore(reportId);
    }

    // =========================================================================
    // RESOLUTION
    // =========================================================================

    function test_markAsResolved() public {
        bytes32 reportId = keccak256("report-resolve");

        vm.prank(coreRole);
        registry.storeReport(reportId, keccak256("a"), keccak256("n"), 0);

        vm.prank(coreRole);
        vm.expectEmit(true, false, false, true);
        emit ReportResolved(reportId);
        registry.markAsResolved(reportId);

        IReportRegistry.Report memory report = registry.getReport(reportId);
        assertTrue(report.isResolved);
    }

    function test_markAsResolved_revert_alreadyResolved() public {
        bytes32 reportId = keccak256("report-double-resolve");

        vm.prank(coreRole);
        registry.storeReport(reportId, keccak256("a"), keccak256("n"), 0);

        vm.prank(coreRole);
        registry.markAsResolved(reportId);

        vm.prank(coreRole);
        vm.expectRevert("Already resolved");
        registry.markAsResolved(reportId);
    }

    // =========================================================================
    // QUERIES
    // =========================================================================

    function test_nullifierTracking() public {
        bytes32 nullifier = keccak256("tracked-null");
        assertFalse(registry.isNullifierUsed(nullifier));

        vm.prank(coreRole);
        registry.storeReport(keccak256("r"), keccak256("a"), nullifier, 0);

        assertTrue(registry.isNullifierUsed(nullifier));
    }

    function test_getTotalReports_andIndex() public {
        assertEq(registry.getTotalReports(), 0);

        bytes32 reportId1 = keccak256("r1");
        bytes32 reportId2 = keccak256("r2");

        vm.prank(coreRole);
        registry.storeReport(reportId1, keccak256("a1"), keccak256("n1"), 0);
        vm.prank(coreRole);
        registry.storeReport(reportId2, keccak256("a2"), keccak256("n2"), 1);

        assertEq(registry.getTotalReports(), 2);
        assertEq(registry.getReportIdByIndex(0), reportId1);
        assertEq(registry.getReportIdByIndex(1), reportId2);
    }

    function test_getReportIdByIndex_revert_outOfBounds() public {
        vm.expectRevert("Index out of bounds");
        registry.getReportIdByIndex(0);
    }

    // =========================================================================
    // FUZZ TESTS
    // =========================================================================

    function testFuzz_storeReport_categoryBounds(uint16 category) public {
        vm.assume(category <= 4);
        bytes32 nullifier = keccak256(abi.encodePacked("fuzz-", category));

        vm.prank(coreRole);
        registry.storeReport(keccak256(abi.encodePacked("fr-", category)), keccak256("a"), nullifier, category);
    }

    function testFuzz_storeReport_revert_invalidCategory(uint16 category) public {
        vm.assume(category > 4);
        vm.prank(coreRole);
        vm.expectRevert("Invalid category");
        registry.storeReport(keccak256("fr"), keccak256("a"), keccak256("fn"), category);
    }
}
