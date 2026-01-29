// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "../interfaces/IZKVerifier.sol";
import "@semaphore/interfaces/ISemaphore.sol";

/**
 * @title SemaphoreAdapter
 * @notice Adapta Semaphore protocol para trabajar con interfaz IZKVerifier de Rikuy
 * @dev Convierte el formato de proof de Rikuy al formato de Semaphore
 *
 * Rikuy proof format:
 * - _pA: uint256[2] - Groth16 proof point A
 * - _pB: uint256[2][2] - Groth16 proof point B
 * - _pC: uint256[2] - Groth16 proof point C
 * - _pubSignals[0]: nullifier
 * - _pubSignals[1]: merkleTreeRoot
 * - _pubSignals[2]: message (hash del reporte)
 * - _pubSignals[3]: scope (epoch o external nullifier)
 *
 * Semaphore proof format:
 * - merkleTreeDepth: profundidad del árbol
 * - merkleTreeRoot: raíz del merkle tree
 * - nullifier: nullifier único
 * - message: mensaje siendo firmado
 * - scope: alcance/contexto del proof
 * - points[8]: proof Groth16 aplanado [pA.x, pA.y, pB.x0, pB.x1, pB.y0, pB.y1, pC.x, pC.y]
 */
contract SemaphoreAdapter is IZKVerifier {

    /// @notice Referencia al contrato Semaphore
    ISemaphore public immutable semaphore;

    /// @notice ID del grupo Semaphore para ciudadanos bolivianos
    uint256 public immutable groupId;

    /// @notice Profundidad del Merkle tree (por defecto 20 en Semaphore)
    uint256 public constant MERKLE_TREE_DEPTH = 20;

    /// @notice Eventos
    event ProofVerified(uint256 indexed nullifier, uint256 indexed message);
    event ProofFailed(uint256 indexed nullifier, string reason);

    /**
     * @notice Constructor
     * @param _semaphore Dirección del contrato Semaphore
     * @param _groupId ID del grupo de ciudadanos bolivianos
     */
    constructor(address _semaphore, uint256 _groupId) {
        require(_semaphore != address(0), "Invalid Semaphore address");
        semaphore = ISemaphore(_semaphore);
        groupId = _groupId;
    }

    /**
     * @notice Verifica un ZK proof usando Semaphore
     * @dev Implementa la interfaz IZKVerifier y convierte al formato Semaphore
     * @param _pA Punto A del proof Groth16
     * @param _pB Punto B del proof Groth16
     * @param _pC Punto C del proof Groth16
     * @param _pubSignals Señales públicas [nullifier, merkleRoot, message, scope]
     * @return bool true si el proof es válido
     */
    function verifyProof(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[4] calldata _pubSignals
    ) external view override returns (bool) {

        // Extraer public signals
        uint256 nullifier = _pubSignals[0];
        uint256 merkleTreeRoot = _pubSignals[1];
        uint256 message = _pubSignals[2];
        uint256 scope = _pubSignals[3];

        // Convertir proof Groth16 a formato Semaphore points[8]
        // points = [pA.x, pA.y, pB.x[0], pB.x[1], pB.y[0], pB.y[1], pC.x, pC.y]
        uint256[8] memory points = [
            _pA[0],      // pA.x
            _pA[1],      // pA.y
            _pB[0][0],   // pB.x[0]
            _pB[0][1],   // pB.x[1]
            _pB[1][0],   // pB.y[0]
            _pB[1][1],   // pB.y[1]
            _pC[0],      // pC.x
            _pC[1]       // pC.y
        ];

        // Construir SemaphoreProof
        ISemaphore.SemaphoreProof memory semaphoreProof = ISemaphore.SemaphoreProof({
            merkleTreeDepth: MERKLE_TREE_DEPTH,
            merkleTreeRoot: merkleTreeRoot,
            nullifier: nullifier,
            message: message,
            scope: scope,
            points: points
        });

        // Verificar usando Semaphore (view function - no consume gas)
        try semaphore.verifyProof(groupId, semaphoreProof) returns (bool isValid) {
            return isValid;
        } catch {
            return false;
        }
    }

    /**
     * @notice Valida y registra un proof (state-changing)
     * @dev Esta función es llamada por RikuyCore para marcar el nullifier como usado
     * @param _pA Punto A del proof Groth16
     * @param _pB Punto B del proof Groth16
     * @param _pC Punto C del proof Groth16
     * @param _pubSignals Señales públicas [nullifier, merkleRoot, message, scope]
     */
    function validateProof(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[4] calldata _pubSignals
    ) external {

        // Extraer public signals
        uint256 nullifier = _pubSignals[0];
        uint256 merkleTreeRoot = _pubSignals[1];
        uint256 message = _pubSignals[2];
        uint256 scope = _pubSignals[3];

        // Convertir proof
        uint256[8] memory points = [
            _pA[0],
            _pA[1],
            _pB[0][0],
            _pB[0][1],
            _pB[1][0],
            _pB[1][1],
            _pC[0],
            _pC[1]
        ];

        // Construir SemaphoreProof
        ISemaphore.SemaphoreProof memory semaphoreProof = ISemaphore.SemaphoreProof({
            merkleTreeDepth: MERKLE_TREE_DEPTH,
            merkleTreeRoot: merkleTreeRoot,
            nullifier: nullifier,
            message: message,
            scope: scope,
            points: points
        });

        // Validar usando Semaphore (esto marca el nullifier como usado)
        try semaphore.validateProof(groupId, semaphoreProof) {
            emit ProofVerified(nullifier, message);
        } catch Error(string memory reason) {
            emit ProofFailed(nullifier, reason);
            revert(reason);
        } catch {
            emit ProofFailed(nullifier, "Unknown error");
            revert("Semaphore proof validation failed");
        }
    }

    /**
     * @notice Verifica si un nullifier ya fue usado
     * @param _nullifier El nullifier a verificar
     * @return bool true si ya fue usado
     */
    function isNullifierUsed(uint256 _nullifier) external view returns (bool) {
        // Semaphore almacena nullifiers en su mapping interno
        // Necesitamos acceder al storage del grupo
        // Como ISemaphore no expone esta función, la implementamos
        // verificando si un proof con ese nullifier es rechazado

        // Por ahora retornamos false ya que Semaphore maneja esto internamente
        // En la práctica, intentar usar el mismo nullifier en validateProof()
        // causará un revert automático
        return false;
    }

    /**
     * @notice Obtiene el merkle root actual del grupo
     * @return uint256 El merkle root actual
     */
    function getCurrentMerkleRoot() external view returns (uint256) {
        // Semaphore no expone directamente el merkle root actual
        // Necesitamos que el backend lo obtenga del evento MemberAdded
        // o del contrato SemaphoreGroups directamente
        return 0; // Placeholder
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
