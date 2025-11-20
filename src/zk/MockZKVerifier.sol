// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IZKVerifier.sol";

/**
 * @title MockZKVerifier
 * @notice Mock ZK verifier para testing (REEMPLAZAR con verifier.sol de Circom en producción)
 * @dev Este contrato SIEMPRE retorna true. Solo para hackathon/testing.
 */
contract MockZKVerifier is IZKVerifier {

    mapping(bytes32 => bool) public nullifierUsed;

    event ProofVerified(bytes32 indexed nullifier);

    /**
     * @notice Mock verification (siempre retorna true)
     * @dev En producción, esto será reemplazado por el verifier generado por Circom
     */
    function verifyProof(
        uint256[2] calldata /*_pA*/,
        uint256[2][2] calldata /*_pB*/,
        uint256[2] calldata /*_pC*/,
        uint256[4] calldata _pubSignals
    ) external view returns (bool) {
        // _pubSignals[0] = nullifier
        // _pubSignals[1] = merkleRoot (opcional)
        // _pubSignals[2] = categoryHash
        // _pubSignals[3] = proximityHash

        bytes32 nullifier = bytes32(_pubSignals[0]);

        // Verificar que nullifier no fue usado
        require(!nullifierUsed[nullifier], "Nullifier already used");

        // En producción, aquí iría la verificación real de Groth16
        // usando pairing checks con las constantes del trusted setup

        return true;
    }

    /**
     * @notice Marcar nullifier como usado (llamado por RikuyCore)
     */
    function markNullifierUsed(bytes32 _nullifier) external {
        nullifierUsed[_nullifier] = true;
        emit ProofVerified(_nullifier);
    }

    /**
     * @notice Verificar si nullifier fue usado
     */
    function isNullifierUsed(bytes32 _nullifier) external view returns (bool) {
        return nullifierUsed[_nullifier];
    }
}
