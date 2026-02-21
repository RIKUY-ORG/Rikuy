// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/solidity/core/RikuyCoreV2.sol";
import "../contracts/solidity/core/ReportRegistry.sol";
import "../test/mocks/MockAnonymousReport.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title RikuyCoreV2Test
 * @notice Tests for the main Rikuy orchestrator contract
 * @dev Uses MockAnonymousReport to simulate the Stylus contract
 */
contract RikuyCoreV2Test is Test {
    RikuyCoreV2 public core;
    ReportRegistry public registry;
    MockAnonymousReport public mockStylus;

    address public admin = address(0xAD);
    address public relayer = address(0xBE);
    address public government = address(0xC0);
    address public user1 = address(0x1);
    address public user2 = address(0x2);
    address public attacker = address(0xBAD);

    // Valid Bolivia coordinates (La Paz, scaled by 1_000_000)
    int64 constant LAT_LA_PAZ = -16_500_000;
    int64 constant LON_LA_PAZ = -68_150_000;

    event ReportCreated(
        bytes32 indexed reportId,
        bytes32 indexed commitment,
        bytes32 contentHash,
        uint16 category,
        uint256 timestamp
    );
    event ReportValidated(
        bytes32 indexed reportId,
        address indexed validator,
        bool isValid
    );
    event ReportVerified(bytes32 indexed reportId, uint256 totalValidations);

    function setUp() public {
        vm.startPrank(admin);

        // 1. Deploy MockAnonymousReport with temp admin
        mockStylus = new MockAnonymousReport(address(0));

        // 2. Deploy ReportRegistry via proxy
        ReportRegistry registryImpl = new ReportRegistry();
        bytes memory registryInit = abi.encodeWithSelector(
            ReportRegistry.initialize.selector, admin
        );
        ERC1967Proxy registryProxy = new ERC1967Proxy(address(registryImpl), registryInit);
        registry = ReportRegistry(address(registryProxy));

        // 3. Deploy RikuyCoreV2 via proxy
        RikuyCoreV2 coreImpl = new RikuyCoreV2();
        bytes memory coreInit = abi.encodeWithSelector(
            RikuyCoreV2.initialize.selector,
            admin,
            address(registry),
            address(mockStylus)
        );
        ERC1967Proxy coreProxy = new ERC1967Proxy(address(coreImpl), coreInit);
        core = RikuyCoreV2(address(coreProxy));

        // 4. Set MockAnonymousReport admin to the core proxy address
        mockStylus.setAdmin(address(core));

        // 5. Grant CORE_ROLE to core on ReportRegistry
        registry.grantRole(registry.CORE_ROLE(), address(core));

        // 6. Add relayer and government roles
        core.addRelayer(relayer);
        core.grantRole(core.GOVERNMENT_ROLE(), government);

        vm.stopPrank();
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    function _createReport(
        bytes32 contentHash,
        uint16 category,
        bytes32 commitment,
        bytes32 nullifier
    ) internal returns (bytes32) {
        vm.prank(relayer);
        return core.createReport(
            contentHash, category, commitment, nullifier,
            LAT_LA_PAZ, LON_LA_PAZ, true
        );
    }

    function _createDefaultReport() internal returns (bytes32) {
        return _createReport(
            keccak256("evidence-photo"),
            0, // INFRAESTRUCTURA
            keccak256("commitment-1"),
            keccak256("nullifier-1")
        );
    }

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    function test_initialize_rolesSet() public view {
        assertTrue(core.hasRole(core.DEFAULT_ADMIN_ROLE(), admin));
        assertTrue(core.hasRole(core.OPERATOR_ROLE(), admin));
        assertTrue(core.hasRole(core.RELAYER_ROLE(), relayer));
        assertTrue(core.hasRole(core.GOVERNMENT_ROLE(), government));
    }

    function test_initialize_contractsLinked() public view {
        assertEq(address(core.reportRegistry()), address(registry));
        assertEq(address(core.anonymousReport()), address(mockStylus));
    }

    function test_initialize_cannotReinitialize() public {
        vm.expectRevert();
        core.initialize(attacker, address(registry), address(mockStylus));
    }

    // =========================================================================
    // CREATE REPORT
    // =========================================================================

    function test_createReport_success() public {
        bytes32 contentHash = keccak256("photo-evidence");
        bytes32 commitment = keccak256("anon-commitment");
        bytes32 nullifier = keccak256("unique-nullifier");

        vm.prank(relayer);
        bytes32 reportId = core.createReport(
            contentHash, 0, commitment, nullifier,
            LAT_LA_PAZ, LON_LA_PAZ, true
        );

        // Verify in ReportRegistry
        IReportRegistry.Report memory report = registry.getReport(reportId);
        assertEq(report.nullifierHash, nullifier);
        assertEq(report.categoryId, 0);
        assertFalse(report.isResolved);

        // Verify in MockStylus
        assertTrue(mockStylus.reportExists(reportId));
        assertEq(mockStylus.getReportContentHash(reportId), contentHash);
        assertEq(mockStylus.getReportCategory(reportId), 0);
    }

    function test_createReport_allCategories() public {
        for (uint16 cat = 0; cat <= 4; cat++) {
            bytes32 nullifier = keccak256(abi.encodePacked("null-cat-", cat));
            bytes32 commitment = keccak256(abi.encodePacked("commit-", cat));

            vm.prank(relayer);
            bytes32 reportId = core.createReport(
                keccak256("content"), cat, commitment, nullifier,
                LAT_LA_PAZ, LON_LA_PAZ, true
            );

            assertEq(mockStylus.getReportCategory(reportId), cat);
        }
    }

    function test_createReport_emitsEvent() public {
        bytes32 contentHash = keccak256("photo");
        bytes32 commitment = keccak256("commit");
        bytes32 nullifier = keccak256("null");

        vm.prank(relayer);
        // We check indexed params: reportId (unknown), commitment
        vm.expectEmit(false, true, false, false);
        emit ReportCreated(bytes32(0), commitment, contentHash, 0, 0);
        core.createReport(
            contentHash, 0, commitment, nullifier,
            LAT_LA_PAZ, LON_LA_PAZ, true
        );
    }

    function test_createReport_revert_notRelayer() public {
        vm.prank(attacker);
        vm.expectRevert();
        core.createReport(
            keccak256("c"), 0, keccak256("co"), keccak256("n"),
            LAT_LA_PAZ, LON_LA_PAZ, true
        );
    }

    function test_createReport_revert_duplicateNullifier() public {
        bytes32 nullifier = keccak256("same-nullifier");

        vm.prank(relayer);
        core.createReport(
            keccak256("c1"), 0, keccak256("co1"), nullifier,
            LAT_LA_PAZ, LON_LA_PAZ, true
        );

        vm.prank(relayer);
        vm.expectRevert(); // NullifierAlreadyUsed from MockStylus
        core.createReport(
            keccak256("c2"), 0, keccak256("co2"), nullifier,
            LAT_LA_PAZ, LON_LA_PAZ, true
        );
    }

    // =========================================================================
    // REGISTER CITIZEN
    // =========================================================================

    function test_registerCitizen() public {
        bytes32 commitment = keccak256("citizen-commitment");

        vm.prank(relayer);
        core.registerCitizen(commitment);

        assertTrue(mockStylus.isCommitmentRegistered(commitment));
    }

    function test_registerCitizen_revert_notRelayer() public {
        vm.prank(attacker);
        vm.expectRevert();
        core.registerCitizen(keccak256("c"));
    }

    // =========================================================================
    // VALIDATE REPORT
    // =========================================================================

    function test_validateReport_upvote() public {
        bytes32 reportId = _createDefaultReport();

        vm.prank(user1);
        core.validateReport(reportId, true);

        (,uint256 upvotes, uint256 downvotes,,) = core.getReportStatus(reportId);
        assertEq(upvotes, 1);
        assertEq(downvotes, 0);
    }

    function test_validateReport_downvote() public {
        bytes32 reportId = _createDefaultReport();

        vm.prank(user1);
        core.validateReport(reportId, false);

        (,uint256 upvotes, uint256 downvotes,,) = core.getReportStatus(reportId);
        assertEq(upvotes, 0);
        assertEq(downvotes, 1);
    }

    function test_validateReport_revert_nonExistentReport() public {
        vm.prank(user1);
        vm.expectRevert("Report does not exist");
        core.validateReport(keccak256("fake"), true);
    }

    function test_validateReport_revert_doubleValidation() public {
        bytes32 reportId = _createDefaultReport();

        vm.prank(user1);
        core.validateReport(reportId, true);

        vm.prank(user1);
        vm.expectRevert("Already validated");
        core.validateReport(reportId, true);
    }

    function test_validateReport_autoVerifyAtThreshold() public {
        bytes32 reportId = _createDefaultReport();

        // 5 validators upvote (VERIFICATION_THRESHOLD = 5)
        for (uint160 i = 10; i < 15; i++) {
            address validator = address(i);
            vm.prank(validator);
            core.validateReport(reportId, true);
        }

        (RikuyCoreV2.ReportStatus status, uint256 upvotes,, bool isVerified,) =
            core.getReportStatus(reportId);

        assertEq(upvotes, 5);
        assertTrue(isVerified);
        assertEq(uint8(status), uint8(RikuyCoreV2.ReportStatus.Verified));
    }

    function test_validateReport_emitsEvent() public {
        bytes32 reportId = _createDefaultReport();

        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit ReportValidated(reportId, user1, true);
        core.validateReport(reportId, true);
    }

    function test_validateReport_getValidators() public {
        bytes32 reportId = _createDefaultReport();

        vm.prank(user1);
        core.validateReport(reportId, true);
        vm.prank(user2);
        core.validateReport(reportId, true);

        address[] memory validators = core.getReportValidators(reportId);
        assertEq(validators.length, 2);
        assertEq(validators[0], user1);
        assertEq(validators[1], user2);
    }

    // =========================================================================
    // RESOLVE REPORT
    // =========================================================================

    function test_resolveReport_approved() public {
        bytes32 reportId = _createDefaultReport();

        // Reach threshold
        for (uint160 i = 10; i < 15; i++) {
            vm.prank(address(i));
            core.validateReport(reportId, true);
        }

        vm.prank(government);
        core.resolveReport(reportId, true);

        (RikuyCoreV2.ReportStatus status,,,, bool isResolved) =
            core.getReportStatus(reportId);

        assertTrue(isResolved);
        assertEq(uint8(status), uint8(RikuyCoreV2.ReportStatus.Resolved));
    }

    function test_resolveReport_revert_notGovernment() public {
        bytes32 reportId = _createDefaultReport();

        vm.prank(attacker);
        vm.expectRevert();
        core.resolveReport(reportId, true);
    }

    function test_resolveReport_revert_notEnoughValidations() public {
        bytes32 reportId = _createDefaultReport();

        // Only 2 validations (threshold is 5)
        vm.prank(user1);
        core.validateReport(reportId, true);
        vm.prank(user2);
        core.validateReport(reportId, true);

        vm.prank(government);
        vm.expectRevert("Not enough validations");
        core.resolveReport(reportId, true);
    }

    function test_resolveReport_revert_alreadyResolved() public {
        bytes32 reportId = _createDefaultReport();

        for (uint160 i = 10; i < 15; i++) {
            vm.prank(address(i));
            core.validateReport(reportId, true);
        }

        vm.prank(government);
        core.resolveReport(reportId, true);

        vm.prank(government);
        vm.expectRevert("Already resolved");
        core.resolveReport(reportId, true);
    }

    // =========================================================================
    // REPORT STATUS
    // =========================================================================

    function test_getReportStatus_pending() public {
        bytes32 reportId = _createDefaultReport();

        (RikuyCoreV2.ReportStatus status,,,,) = core.getReportStatus(reportId);
        assertEq(uint8(status), uint8(RikuyCoreV2.ReportStatus.Pending));
    }

    function test_getReportStatus_disputed() public {
        bytes32 reportId = _createDefaultReport();

        // More downvotes than upvotes
        vm.prank(user1);
        core.validateReport(reportId, false);

        (RikuyCoreV2.ReportStatus status,,,,) = core.getReportStatus(reportId);
        assertEq(uint8(status), uint8(RikuyCoreV2.ReportStatus.Disputed));
    }

    // =========================================================================
    // ACCESS CONTROL
    // =========================================================================

    function test_addRelayer_onlyAdmin() public {
        address newRelayer = address(0x9999);

        vm.prank(admin);
        core.addRelayer(newRelayer);
        assertTrue(core.hasRole(core.RELAYER_ROLE(), newRelayer));
    }

    function test_addRelayer_revert_notAdmin() public {
        vm.prank(attacker);
        vm.expectRevert();
        core.addRelayer(attacker);
    }

    // =========================================================================
    // UPGRADE AUTHORIZATION
    // =========================================================================

    function test_upgrade_onlyAdmin() public {
        RikuyCoreV2 newImpl = new RikuyCoreV2();

        vm.prank(admin);
        core.upgradeToAndCall(address(newImpl), "");
    }

    function test_upgrade_revert_notAdmin() public {
        RikuyCoreV2 newImpl = new RikuyCoreV2();

        vm.prank(attacker);
        vm.expectRevert();
        core.upgradeToAndCall(address(newImpl), "");
    }
}
