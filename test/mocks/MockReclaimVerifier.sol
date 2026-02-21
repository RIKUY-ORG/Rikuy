// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../../contracts/solidity/zk/lib/Reclaim.sol";

/**
 * @title MockReclaimVerifier
 * @notice Mock del verificador de Reclaim Protocol para testing
 */
contract MockReclaimVerifier {
    bool public shouldRevert;

    function setRevert(bool _shouldRevert) external {
        shouldRevert = _shouldRevert;
    }

    function verifyProof(Reclaim.Proof memory) external view {
        if (shouldRevert) {
            revert("Invalid proof");
        }
        // Accept all proofs in mock mode
    }
}
