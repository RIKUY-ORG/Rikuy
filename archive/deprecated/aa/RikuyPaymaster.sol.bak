// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@account-abstraction/contracts/core/BasePaymaster.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";
import "@account-abstraction/contracts/interfaces/PackedUserOperation.sol";
import "@account-abstraction/contracts/core/UserOperationLib.sol";

/**
 * @title RikuyPaymaster
 * @notice Patrocina gas para operaciones legítimas en RIKUY
 * @dev Integración con ERC-4337 Account Abstraction
 *
 * Funcionalidades:
 * - Paga gas por createReport() y validateReport()
 * - Rate limiting por usuario (anti-spam)
 * - Límites de gas máximo por operación
 */
contract RikuyPaymaster is BasePaymaster {

    // Límites de gas patrocinado
    uint256 public constant MAX_GAS_PER_REPORT = 150000;
    uint256 public constant MAX_GAS_PER_VALIDATION = 80000;

    // Rate limiting (por usuario)
    mapping(address => uint256) public lastReportTime;
    mapping(address => uint256) public dailyReportCount;
    mapping(address => uint256) public lastResetDay;

    uint256 public constant MAX_REPORTS_PER_DAY = 5;
    uint256 public constant MIN_TIME_BETWEEN_REPORTS = 5 minutes;

    // Eventos
    event GasSponsored(address indexed user, uint256 actualGasCost, bytes4 functionSelector);
    event RateLimitHit(address indexed user, string reason);

    constructor(IEntryPoint _entryPoint, address _owner) BasePaymaster(_entryPoint, _owner) {}

    /**
     * @notice Validar si debemos pagar gas por esta operación
     * @dev Solo patrocinamos createReport y validateReport
     */
    function _validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 /*userOpHash*/,
        uint256 maxCost
    )
        internal
        override
        returns (bytes memory context, uint256 validationData)
    {
        // Decodificar función llamada (primeros 4 bytes del callData)
        require(userOp.callData.length >= 4, "Invalid callData");
        bytes4 selector = bytes4(userOp.callData[0:4]);

        // Extraer callGasLimit del packed userOp
        uint256 callGasLimit = UserOperationLib.unpackCallGasLimit(userOp);

        // Solo patrocinamos createReport y validateReport
        // IMPORTANTE: Incluir TODOS los parámetros en el selector
        if (selector == bytes4(keccak256("createReport(bytes32,uint16,uint256[8],uint256[4])"))) {

            // Verificar límites para reportes
            require(callGasLimit <= MAX_GAS_PER_REPORT, "Gas too high for report");

            // Rate limiting
            _checkRateLimit(userOp.sender);

            // Actualizar contadores
            _updateRateLimitCounters(userOp.sender);

            // Encode user address en context para post-op
            context = abi.encode(userOp.sender, selector);

        } else if (selector == bytes4(keccak256("validateReport(bytes32,bool)"))) {

            // Verificar límites para validaciones
            require(callGasLimit <= MAX_GAS_PER_VALIDATION, "Gas too high for validation");

            // Encode user address en context
            context = abi.encode(userOp.sender, selector);

        } else {
            revert("Function not sponsored");
        }

        // Aprobar pago (validationData = 0 significa aprobado)
        return (context, 0);
    }

    /**
     * @notice Verificar rate limits para reportes
     */
    function _checkRateLimit(address user) internal view {
        // Verificar tiempo mínimo entre reportes
        if (block.timestamp < lastReportTime[user] + MIN_TIME_BETWEEN_REPORTS) {
            revert("Wait 5 minutes between reports");
        }

        // Verificar límite diario
        uint256 today = block.timestamp / 1 days;
        if (lastResetDay[user] == today && dailyReportCount[user] >= MAX_REPORTS_PER_DAY) {
            revert("Daily limit reached");
        }
    }

    /**
     * @notice Actualizar contadores de rate limit
     */
    function _updateRateLimitCounters(address user) internal {
        uint256 today = block.timestamp / 1 days;

        // Reset diario
        if (lastResetDay[user] != today) {
            dailyReportCount[user] = 0;
            lastResetDay[user] = today;
        }

        // Incrementar contadores
        dailyReportCount[user]++;
        lastReportTime[user] = block.timestamp;
    }

    /**
     * @notice Post-operación (tracking de gas consumido)
     */
    function _postOp(
        PostOpMode /*mode*/,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 /*actualUserOpFeePerGas*/
    ) internal override {
        // Decodificar context
        (address user, bytes4 selector) = abi.decode(context, (address, bytes4));

        // Emitir evento para estadísticas
        emit GasSponsored(user, actualGasCost, selector);
    }

    /**
     * @notice Fondear paymaster depositando en EntryPoint
     * @dev Owner puede llamar deposit() heredada de BasePaymaster
     */
}
