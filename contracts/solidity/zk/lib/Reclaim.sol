// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Reclaim Interface
 * @dev Interfaz mínima necesaria para verificar pruebas de Reclaim Protocol
 */

library Reclaim {
    struct Proof {
        ClaimInfo claimInfo;
        SignedClaim signedClaim;
    }

    struct ClaimInfo {
        string provider;
        string parameters;
        string context;
    }

    struct SignedClaim {
        Claim claim;
        bytes[] signatures;
    }

    struct Claim {
        bytes32 identifier;
        address owner;
        uint32 timestampS;
        uint32 epoch;
    }
}

// Interfaz para llamar al contrato externo
interface IReclaimVerifier {
    function verifyProof(Reclaim.Proof memory proof) external view;
}
