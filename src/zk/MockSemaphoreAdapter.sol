// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IZKVerifier.sol";

/**
 * @title MockSemaphoreAdapter
 * @notice ⚠️ MOCK CONTRACT FOR DEVELOPMENT ONLY ⚠️
 *
 * Este contrato bypasea completamente la verificación de ZK proofs
 * durante el desarrollo. Permite probar el flujo sin necesidad de
 * generar proofs reales de Semaphore.
 *
 * 🚨 NUNCA usar en producción
 * 🚨 Este contrato acepta CUALQUIER proof sin verificar
 *
 * Para producción, usar SemaphoreAdapter.sol con proofs reales.
 */
contract MockSemaphoreAdapter is IZKVerifier {

    /// @notice Flag para indicar que este es un mock
    bool public constant IS_MOCK = true;

    /// @notice Contador de proofs "verificados" (para testing)
    uint256 public proofsProcessed = 0;

    /// @notice Mapeo de nullifiers "usados" (simulado)
    mapping(uint256 => bool) public usedNullifiers;

    /// @notice Eventos
    event MockProofAccepted(uint256 indexed nullifier, uint256 indexed message);
    event MockProofValidated(uint256 indexed nullifier);

    /**
     * @notice Constructor vacío (no necesita parámetros)
     */
    constructor() {
        // Mock contract - no initialization needed
    }

    /**
     * @notice ⚠️ MOCK: Siempre retorna true sin verificar
     * @dev Esta función NO verifica nada, solo retorna true
     * @param _pA Punto A del proof (ignorado)
     * @param _pB Punto B del proof (ignorado)
     * @param _pC Punto C del proof (ignorado)
     * @param _pubSignals Señales públicas [nullifier, merkleRoot, message, scope]
     * @return bool siempre true (MOCK)
     */
    function verifyProof(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[4] calldata _pubSignals
    ) external view override returns (bool) {
        // MOCK: No verificamos nada, solo retornamos true
        // En producción, esto debe llamar a Semaphore real

        // Silenciar warnings de variables no usadas
        _pA;
        _pB;
        _pC;

        // Extraer nullifier solo para el evento
        uint256 nullifier = _pubSignals[0];
        uint256 message = _pubSignals[2];

        // Emitir evento (aunque sea view, para debugging)
        // emit MockProofAccepted(nullifier, message);

        return true; // ⚠️ SIEMPRE TRUE - MOCK
    }

    /**
     * @notice ⚠️ MOCK: Marca nullifier como usado (simulado)
     * @dev Esta función NO verifica el proof, solo marca el nullifier
     * @param _pA Punto A del proof (ignorado)
     * @param _pB Punto B del proof (ignorado)
     * @param _pC Punto C del proof (ignorado)
     * @param _pubSignals Señales públicas [nullifier, merkleRoot, message, scope]
     */
    function validateProof(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[4] calldata _pubSignals
    ) external {
        // MOCK: No verificamos nada
        _pA;
        _pB;
        _pC;

        uint256 nullifier = _pubSignals[0];

        // Marcar nullifier como usado (simulado)
        usedNullifiers[nullifier] = true;
        proofsProcessed++;

        emit MockProofValidated(nullifier);
    }

    /**
     * @notice Verificar si un nullifier ya fue usado
     * @param _nullifier El nullifier a verificar
     * @return bool true si ya fue usado
     */
    function isNullifierUsed(uint256 _nullifier) external view returns (bool) {
        return usedNullifiers[_nullifier];
    }

    /**
     * @notice Helper para debugging - obtiene contador de proofs
     */
    function getProofsProcessed() external view returns (uint256) {
        return proofsProcessed;
    }

    /**
     * @notice Helper para convertir proof plano a formato estructurado
     * @dev Útil para el backend
     * @param flatProof Array de 8 elementos con el proof aplanado
     * @return pA Punto A del proof
     * @return pB Punto B del proof
     * @return pC Punto C del proof
     */
    function unflattenProof(uint256[8] calldata flatProof)
        external
        pure
        returns (
            uint256[2] memory pA,
            uint256[2][2] memory pB,
            uint256[2] memory pC
        )
    {
        pA = [flatProof[0], flatProof[1]];
        pB = [[flatProof[2], flatProof[3]], [flatProof[4], flatProof[5]]];
        pC = [flatProof[6], flatProof[7]];

        return (pA, pB, pC);
    }
}
