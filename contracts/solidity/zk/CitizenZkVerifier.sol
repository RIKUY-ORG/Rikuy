// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./lib/Reclaim.sol";

/**
 * @title CitizenZkVerifier
 * @notice Verifica ciudadania boliviana usando TLS-ZK (Reclaim Protocol)
 * @dev Usa Reclaim Protocol para verificar que el usuario tiene CI boliviano
 *      sin revelar los datos personales. Solo almacena hash del CI.
 *
 * Flujo:
 * 1. Frontend obtiene proof de Reclaim (ciudadaniadigital.bo)
 * 2. Backend o usuario llama verifyProof() con el proof
 * 3. Contrato verifica firma criptografica via Reclaim
 * 4. Almacena ciHash para evitar doble-registro
 * 5. Backend puede llamar registerCitizen() en RikuyCoreV2
 */
contract CitizenZkVerifier is Ownable {
    using Reclaim for Reclaim.Proof;

    /// @notice Direccion del verificador oficial de Reclaim en la red L3
    address public reclaimVerifierAddress;

    /// @notice Mapping: ciHash => verified
    mapping(bytes32 => bool) public isVerifiedCitizen;

    /// @notice Mapping: wallet => ciHash (para lookup inverso)
    mapping(address => bytes32) public walletToCiHash;

    event CitizenVerified(address indexed wallet, bytes32 indexed ciHash);
    event ReclaimVerifierUpdated(address indexed oldAddress, address indexed newAddress);

    constructor(address _reclaimVerifier) Ownable(msg.sender) {
        require(_reclaimVerifier != address(0), "Invalid verifier address");
        reclaimVerifierAddress = _reclaimVerifier;
    }

    /**
     * @notice Verificar proof de Reclaim y registrar ciudadano
     * @param proof Proof criptografico de Reclaim Protocol
     */
    function verifyProof(Reclaim.Proof memory proof) external {
        // Verificar firma criptografica de Reclaim
        IReclaimVerifier(reclaimVerifierAddress).verifyProof(proof);

        // Extraer CI del contexto y generar hash unico
        bytes32 ciHash = keccak256(abi.encodePacked(proof.claimInfo.context));

        // Evitar doble-registro del mismo CI
        require(!isVerifiedCitizen[ciHash], "CI already verified");

        // Evitar que un wallet se registre dos veces
        require(walletToCiHash[msg.sender] == bytes32(0), "Wallet already verified");

        isVerifiedCitizen[ciHash] = true;
        walletToCiHash[msg.sender] = ciHash;

        emit CitizenVerified(msg.sender, ciHash);
    }

    /**
     * @notice Verificar si un CI hash ya esta registrado
     */
    function isCiVerified(bytes32 ciHash) external view returns (bool) {
        return isVerifiedCitizen[ciHash];
    }

    /**
     * @notice Verificar si un wallet ya tiene CI verificado
     */
    function isWalletVerified(address wallet) external view returns (bool) {
        return walletToCiHash[wallet] != bytes32(0);
    }

    /**
     * @notice Actualizar direccion del verificador de Reclaim (solo owner)
     */
    function setReclaimVerifier(address _newAddress) external onlyOwner {
        require(_newAddress != address(0), "Invalid address");
        address oldAddress = reclaimVerifierAddress;
        reclaimVerifierAddress = _newAddress;
        emit ReclaimVerifierUpdated(oldAddress, _newAddress);
    }
}
