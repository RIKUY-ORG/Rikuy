// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../interfaces/ITreasury.sol";

/**
 * @title RikuyTreasury
 * @notice Maneja fondos del gobierno y distribución de recompensas
 */
contract RikuyTreasury is
    UUPSUpgradeable,
    AccessControlUpgradeable,
    ITreasury
{
    bytes32 public constant GOVERNMENT_ROLE = keccak256("GOVERNMENT");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR");

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

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _admin) public initializer {
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(OPERATOR_ROLE, _admin);

        reporterRewardPercentage = 70;
        validatorRewardPercentage = 30;

        // Recompensas por defecto (0.01 ETH para testing, ajustar para mainnet)
        categoryRewards[0] = 0.01 ether;  // Infraestructura
        categoryRewards[1] = 0.02 ether;  // Inseguridad/Drogas (ALTA prioridad)
        categoryRewards[2] = 0.005 ether; // Basura
    }

    function depositFunds() external payable onlyRole(GOVERNMENT_ROLE) {
        require(msg.value > 0, "Amount must be > 0");
        totalDeposited += msg.value;
        emit FundsDeposited(msg.sender, msg.value, block.timestamp);
    }

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
        require(address(this).balance >= totalReward, "Insufficient treasury balance");

        uint256 reporterAmount = (totalReward * reporterRewardPercentage) / 100;
        uint256 validatorsAmount = totalReward - reporterAmount;
        uint256 amountPerValidator = validatorsAmount / _validators.length;

        // Pagar al reporter
        (bool success1, ) = _reporter.call{value: reporterAmount}("");
        require(success1, "Reporter transfer failed");

        // Pagar a validadores
        for (uint256 i = 0; i < _validators.length; i++) {
            (bool success2, ) = _validators[i].call{value: amountPerValidator}("");
            require(success2, "Validator transfer failed");
        }

        rewardsPaid[_reportId] = true;
        totalPaid += totalReward;

        emit RewardReleased(_reportId, _reporter, _validators, totalReward);
    }

    function setCategoryReward(uint16 _category, uint256 _amount)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(_category <= 2, "Invalid category");
        categoryRewards[_category] = _amount;
        emit ConfigUpdated("categoryReward", _amount);
    }

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

    function getCategoryReward(uint16 _category) external view returns (uint256) {
        return categoryRewards[_category];
    }

    function getTreasuryBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function emergencyWithdraw(address _to, uint256 _amount)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(_amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = _to.call{value: _amount}("");
        require(success, "Withdrawal failed");
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {}

    receive() external payable {
        totalDeposited += msg.value;
        emit FundsDeposited(msg.sender, msg.value, block.timestamp);
    }
}
