// SPDX-License-Identifier: MIT
pragma solidity ^0.8.23;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/ITreasury.sol";

/**
 * @title RikuyTreasury
 * @notice Maneja fondos del gobierno y distribución de recompensas en USX
 * @dev Integrado con Scroll USX para recompensas + puntos automáticos
 *
 * FLUJO DE RECOMPENSAS:
 * 1. Gobierno deposita USX en el Treasury
 * 2. Cuando un reporte es aprobado, se liberan USX automáticamente
 * 3. Usuarios reciben USX y automáticamente ganan puntos de Scroll (0.1 pts/día por USX)
 * 4. NO hay gas fees (gracias al Paymaster gasless)
 */
contract RikuyTreasury is
    UUPSUpgradeable,
    AccessControlUpgradeable,
    ITreasury
{
    using SafeERC20 for IERC20;

    bytes32 public constant GOVERNMENT_ROLE = keccak256("GOVERNMENT");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR");

    // USX token address (Scroll stablecoin con programa de puntos)
    IERC20 public usxToken;

    uint256 public reporterRewardPercentage;
    uint256 public validatorRewardPercentage;

    mapping(uint16 => uint256) public categoryRewards;
    mapping(bytes32 => bool) public rewardsPaid;

    uint256 public totalDeposited;
    uint256 public totalPaid;

    event FundsDeposited(address indexed government, uint256 amount, uint256 timestamp);
    event RewardReleased(
        bytes32 indexed reportId,
        address indexed reporter,
        address[] validators,
        uint256 totalAmount
    );
    event ConfigUpdated(string param, uint256 newValue);
    event USXTokenUpdated(address indexed oldToken, address indexed newToken);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @notice Inicializar Treasury con USX token
     * @param _admin Administrador del contrato
     * @param _usxToken Address del token USX en Scroll
     */
    function initialize(address _admin, address _usxToken) public initializer {
        __AccessControl_init();

        require(_usxToken != address(0), "Invalid USX token address");

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(OPERATOR_ROLE, _admin);

        usxToken = IERC20(_usxToken);

        reporterRewardPercentage = 70;
        validatorRewardPercentage = 30;

        // Recompensas en USX (stablecoin ~= USD)
        // USX es 1:1 con USD, entonces 50 USX = $50 USD
        categoryRewards[0] = 50 * 1e18;    // Infraestructura: $50 USX
        categoryRewards[1] = 100 * 1e18;   // Inseguridad/Drogas: $100 USX (prioridad alta)
        categoryRewards[2] = 25 * 1e18;    // Basura: $25 USX
    }

    /**
     * @notice Gobierno deposita USX en el Treasury
     * @param _amount Cantidad de USX a depositar (en wei, ej: 1000 * 1e18 = 1000 USX)
     * @dev Gobierno debe aprobar este contrato primero: usxToken.approve(treasury, amount)
     */
    function depositFunds(uint256 _amount) external onlyRole(GOVERNMENT_ROLE) {
        require(_amount > 0, "Amount must be > 0");

        // Transfer USX desde gobierno al Treasury
        usxToken.safeTransferFrom(msg.sender, address(this), _amount);

        totalDeposited += _amount;
        emit FundsDeposited(msg.sender, _amount, block.timestamp);
    }

    /**
     * @notice Liberar recompensas en USX cuando un reporte es aprobado
     * @dev USX genera puntos automáticamente para los receptores (0.1 pts/día por USX)
     */
    function releaseRewards(
        bytes32 _reportId,
        uint16 _category,
        address _reporter,
        address[] calldata _validators
    ) external onlyRole(OPERATOR_ROLE) {
        require(!rewardsPaid[_reportId], "Rewards already paid");
        require(_reporter != address(0), "Invalid reporter");
        require(_validators.length > 0, "No validators");
        require(_category <= 2, "Invalid category");

        uint256 totalReward = categoryRewards[_category];
        require(usxToken.balanceOf(address(this)) >= totalReward, "Insufficient USX balance");

        uint256 reporterAmount = (totalReward * reporterRewardPercentage) / 100;
        uint256 validatorsAmount = totalReward - reporterAmount;
        uint256 amountPerValidator = validatorsAmount / _validators.length;

        // Pagar al reporter en USX
        usxToken.safeTransfer(_reporter, reporterAmount);

        // Pagar a validadores en USX
        for (uint256 i = 0; i < _validators.length; i++) {
            usxToken.safeTransfer(_validators[i], amountPerValidator);
        }

        rewardsPaid[_reportId] = true;
        totalPaid += totalReward;

        emit RewardReleased(_reportId, _reporter, _validators, totalReward);
    }

    /**
     * @notice Configurar recompensa por categoría (en USX)
     * @param _category 0=Infraestructura, 1=Inseguridad, 2=Basura
     * @param _amount Cantidad en wei (ej: 100 * 1e18 = 100 USX)
     */
    function setCategoryReward(uint16 _category, uint256 _amount)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(_category <= 2, "Invalid category");
        categoryRewards[_category] = _amount;
        emit ConfigUpdated("categoryReward", _amount);
    }

    /**
     * @notice Configurar porcentajes de distribución
     */
    function setRewardPercentages(uint256 _reporterPct, uint256 _validatorPct)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(_reporterPct + _validatorPct == 100, "Must sum 100%");
        reporterRewardPercentage = _reporterPct;
        validatorRewardPercentage = _validatorPct;
        emit ConfigUpdated("reporterPct", _reporterPct);
        emit ConfigUpdated("validatorPct", _validatorPct);
    }

    /**
     * @notice Actualizar dirección del token USX (emergencia)
     */
    function setUSXToken(address _newUSXToken) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newUSXToken != address(0), "Invalid address");
        address oldToken = address(usxToken);
        usxToken = IERC20(_newUSXToken);
        emit USXTokenUpdated(oldToken, _newUSXToken);
    }

    /**
     * @notice Obtener recompensa por categoría
     */
    function getCategoryReward(uint16 _category) external view returns (uint256) {
        return categoryRewards[_category];
    }

    /**
     * @notice Obtener balance de USX en el Treasury
     */
    function getTreasuryBalance() external view returns (uint256) {
        return usxToken.balanceOf(address(this));
    }

    /**
     * @notice Retiro de emergencia de USX
     */
    function emergencyWithdraw(address _to, uint256 _amount)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(_amount <= usxToken.balanceOf(address(this)), "Insufficient balance");
        usxToken.safeTransfer(_to, _amount);
    }

    /**
     * @notice Authorization para upgrades
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {}
}
