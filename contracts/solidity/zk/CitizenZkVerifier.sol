// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./lib/Reclaim.sol"; // Import local

/**
 * @title CitizenZkVerifier
 * @notice Verifica ciudadanía boliviana usando TLS-ZK (Reclaim Protocol)
 */
contract CitizenZkVerifier {
    using Reclaim for Reclaim.Proof;
    
    // Dirección del verificador oficial de Reclaim en la red L2/L3
    // En Arbitrum Sepolia: 0xF90085f5Fa697C1868D5578e3FA359461fdA2ED5
    // En local, podemos mockearlo o desplegar uno propio
    address public reclaimVerifierAddress;
    
    mapping(bytes32 => bool) public isVerifiedCitizen;
    
    event CitizenVerified(address indexed wallet, bytes32 indexed ciHash);

    constructor() {
        // Placeholder. Debe setearse post-deploy o en constructor si existe en L3.
        reclaimVerifierAddress = 0xf90085F5FA697C1868D5578E3FA359461fDa2eD5; 
    }

    function verifyProof(Reclaim.Proof memory proof) public {
        // Verificar firma criptográfica de Reclaim
        // Casteamos msg.sender al contrato verificador
        IReclaimVerifier(reclaimVerifierAddress).verifyProof(proof);

        // Extraer CI del contexto (simplificado: hash del contexto entero)
        // En prod: parsear JSON del proof.claimInfo.context
        bytes32 ciHash = keccak256(abi.encodePacked(proof.claimInfo.context));
        
        isVerifiedCitizen[ciHash] = true;
        
        emit CitizenVerified(msg.sender, ciHash);
    }
    
    function setReclaimVerifier(address _newAddress) public {
        reclaimVerifierAddress = _newAddress;
    }
}
