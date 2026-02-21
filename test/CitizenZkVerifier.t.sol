// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../contracts/solidity/zk/CitizenZkVerifier.sol";
import "../contracts/solidity/zk/lib/Reclaim.sol";
import "../test/mocks/MockReclaimVerifier.sol";

/**
 * @title CitizenZkVerifierTest
 * @notice Tests for CitizenZkVerifier — ZK citizenship verification via Reclaim Protocol
 */
contract CitizenZkVerifierTest is Test {
    CitizenZkVerifier public verifier;
    MockReclaimVerifier public mockReclaim;

    address public admin;
    address public user1 = address(0x1);
    address public user2 = address(0x2);
    address public attacker = address(0xBAD);

    event CitizenVerified(address indexed wallet, bytes32 indexed ciHash);
    event ReclaimVerifierUpdated(address indexed oldAddress, address indexed newAddress);

    function setUp() public {
        admin = address(this);
        mockReclaim = new MockReclaimVerifier();
        verifier = new CitizenZkVerifier(address(mockReclaim));
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    function _createProof(string memory ciData) internal view returns (Reclaim.Proof memory) {
        Reclaim.ClaimInfo memory claimInfo = Reclaim.ClaimInfo({
            provider: "bolivian-citizenship",
            parameters: "{}",
            context: ciData
        });

        bytes[] memory signatures = new bytes[](1);
        signatures[0] = hex"deadbeef";

        Reclaim.SignedClaim memory signedClaim = Reclaim.SignedClaim({
            claim: Reclaim.Claim({
                identifier: keccak256(abi.encodePacked(ciData)),
                owner: address(0),
                timestampS: uint32(block.timestamp),
                epoch: 1
            }),
            signatures: signatures
        });

        return Reclaim.Proof({
            claimInfo: claimInfo,
            signedClaim: signedClaim
        });
    }

    // =========================================================================
    // CONSTRUCTOR
    // =========================================================================

    function test_constructor_setsVerifier() public view {
        assertEq(verifier.reclaimVerifierAddress(), address(mockReclaim));
    }

    function test_constructor_revert_zeroAddress() public {
        vm.expectRevert("Invalid verifier address");
        new CitizenZkVerifier(address(0));
    }

    // =========================================================================
    // VERIFY PROOF
    // =========================================================================

    function test_verifyProof_success() public {
        Reclaim.Proof memory proof = _createProof("CI:12345678");
        bytes32 expectedCiHash = keccak256(abi.encodePacked("CI:12345678"));

        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit CitizenVerified(user1, expectedCiHash);
        verifier.verifyProof(proof);

        assertTrue(verifier.isWalletVerified(user1));
        assertTrue(verifier.isCiVerified(expectedCiHash));
        assertEq(verifier.walletToCiHash(user1), expectedCiHash);
    }

    function test_verifyProof_differentUsers() public {
        Reclaim.Proof memory proof1 = _createProof("CI:11111111");
        Reclaim.Proof memory proof2 = _createProof("CI:22222222");

        vm.prank(user1);
        verifier.verifyProof(proof1);

        vm.prank(user2);
        verifier.verifyProof(proof2);

        assertTrue(verifier.isWalletVerified(user1));
        assertTrue(verifier.isWalletVerified(user2));
    }

    function test_verifyProof_revert_duplicateCI() public {
        Reclaim.Proof memory proof = _createProof("CI:12345678");

        vm.prank(user1);
        verifier.verifyProof(proof);

        // Same CI, different wallet
        vm.prank(user2);
        vm.expectRevert("CI already verified");
        verifier.verifyProof(proof);
    }

    function test_verifyProof_revert_walletAlreadyVerified() public {
        Reclaim.Proof memory proof1 = _createProof("CI:11111111");
        Reclaim.Proof memory proof2 = _createProof("CI:22222222");

        vm.prank(user1);
        verifier.verifyProof(proof1);

        // Same wallet, different CI
        vm.prank(user1);
        vm.expectRevert("Wallet already verified");
        verifier.verifyProof(proof2);
    }

    function test_verifyProof_revert_invalidProof() public {
        mockReclaim.setRevert(true);

        Reclaim.Proof memory proof = _createProof("CI:FAKE");

        vm.prank(user1);
        vm.expectRevert("Invalid proof");
        verifier.verifyProof(proof);

        assertFalse(verifier.isWalletVerified(user1));
    }

    // =========================================================================
    // QUERIES
    // =========================================================================

    function test_isWalletVerified_unverified() public view {
        assertFalse(verifier.isWalletVerified(address(0x999)));
    }

    function test_isCiVerified_unverified() public view {
        assertFalse(verifier.isCiVerified(keccak256("unknown")));
    }

    // =========================================================================
    // ADMIN FUNCTIONS
    // =========================================================================

    function test_setReclaimVerifier_success() public {
        address newVerifier = address(0x9999);

        vm.expectEmit(true, true, false, true);
        emit ReclaimVerifierUpdated(address(mockReclaim), newVerifier);
        verifier.setReclaimVerifier(newVerifier);

        assertEq(verifier.reclaimVerifierAddress(), newVerifier);
    }

    function test_setReclaimVerifier_revert_zeroAddress() public {
        vm.expectRevert("Invalid address");
        verifier.setReclaimVerifier(address(0));
    }

    function test_setReclaimVerifier_revert_notOwner() public {
        vm.prank(attacker);
        vm.expectRevert();
        verifier.setReclaimVerifier(address(0x9999));
    }

    // =========================================================================
    // ANTI-SYBIL
    // =========================================================================

    function test_antiSybil_oneWalletOneCI() public {
        // User1 verifies with CI:111
        vm.prank(user1);
        verifier.verifyProof(_createProof("CI:11111111"));

        // User1 cannot verify again with CI:222
        vm.prank(user1);
        vm.expectRevert("Wallet already verified");
        verifier.verifyProof(_createProof("CI:22222222"));

        // User2 cannot use CI:111 (already used by user1)
        vm.prank(user2);
        vm.expectRevert("CI already verified");
        verifier.verifyProof(_createProof("CI:11111111"));
    }
}
