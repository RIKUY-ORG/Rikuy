# 🏗️ RIKUY - Arquitectura Técnica v2.0 (Gobierno + Pagos)

## 🎯 Diagrama de Arquitectura Completo

```
┌─────────────────────────────────────────────────────────────────┐
│                        CAPA DE USUARIO                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐     │
│  │   Ana (60)   │    │ Carlos (35)  │    │  Gobierno    │     │
│  │   Reporter   │    │  Validator   │    │   Municipal  │     │
│  └──────┬───────┘    └──────┬───────┘    └──────┬───────┘     │
│         │                   │                    │              │
└─────────┼───────────────────┼────────────────────┼──────────────┘
          │                   │                    │
          ↓                   ↓                    ↓
┌─────────────────────────────────────────────────────────────────┐
│                     CAPA DE APLICACIÓN                          │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │           React Native App (Mobile-First)               │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │   │
│  │  │ Cámara   │  │   Mapa   │  │Dashboard │             │   │
│  │  │  + GPS   │  │ (Mapbox) │  │(Reportes)│             │   │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘             │   │
│  └───────┼─────────────┼─────────────┼────────────────────┘   │
│          │             │             │                         │
│          │    ┌────────┴────────┐    │                         │
│          │    │  Next.js Admin  │    │                         │
│          │    │  (Gobierno Web) │    │                         │
│          │    └────────┬────────┘    │                         │
└──────────┼─────────────┼─────────────┼─────────────────────────┘
           │             │             │
           ↓             ↓             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA DE BACKEND (API)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Node.js + Express + TypeScript              │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │  │
│  │  │  Auth    │  │  Upload  │  │   ZK     │  │  Relay  │ │  │
│  │  │ (Privy)  │  │  (IPFS)  │  │  Prover  │  │ (Gasless│ │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │  │
│  └───────┼─────────────┼─────────────┼─────────────┼───────┘  │
│          │             │             │             │           │
│  ┌───────┴─────────────┴─────────────┴─────────────┴───────┐  │
│  │                 Redis (Cache + Queue)                   │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────┼─────────────┼─────────────┼─────────────┼───────────┘
           │             │             │             │
           ↓             ↓             ↓             ↓
┌─────────────────────────────────────────────────────────────────┐
│                  CAPA DE BLOCKCHAIN (Scroll)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 Scroll Sepolia Testnet                   │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │  │
│  │  │  RikuyCore  │  │  Treasury   │  │  Paymaster  │     │  │
│  │  │   (Logic)   │  │   (Funds)   │  │  (Gasless)  │     │  │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │  │
│  │         │                │                │             │  │
│  │  ┌──────┴────────────────┴────────────────┴──────┐     │  │
│  │  │        Report Registry (Storage)              │     │  │
│  │  └───────────────────────────────────────────────┘     │  │
│  │                                                         │  │
│  │  ┌───────────────────────────────────────────────┐     │  │
│  │  │       ZKVerifier (Privacy Proofs)             │     │  │
│  │  └───────────────────────────────────────────────┘     │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────┼─────────────────────────────────────────────────────┘
           │
           ↓
┌─────────────────────────────────────────────────────────────────┐
│               CAPA DE DATA AVAILABILITY (Arkiv)                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Arkiv Mendoza Testnet (L2+L3)               │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │  Entity: Report                                 │    │  │
│  │  │  • Payload: Full JSON (foto, desc, location)    │    │  │
│  │  │  • Attributes: category, timestamp, verified    │    │  │
│  │  │  • Queryable: lat/long, date range, category    │    │  │
│  │  └─────────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
           │
           ↓
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA DE STORAGE (IPFS)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │            Pinata / NFT.Storage (Fotos)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Datos Completo

### 1️⃣ Crear Reporte

```
┌─────┐  1. Foto + GPS    ┌─────────┐  2. Auth +     ┌─────────┐
│ Ana │ ───────────────→ │ Backend │    Smart Wallet │  Privy  │
└─────┘                   └────┬────┘ ←──────────────└─────────┘
                               │
                               │ 3. Upload foto
                               ↓
                         ┌──────────┐
                         │   IPFS   │
                         └────┬─────┘
                              │ 4. ipfsHash
                              ↓
                         ┌──────────┐
                         │  Backend │
                         └────┬─────┘
                              │ 5. Generate ZK Proof
                              ↓
                    ┌─────────────────────┐
                    │  ZK Prover (Worker) │
                    └─────────┬───────────┘
                              │ 6. zkProof + nullifier
                              ↓
                         ┌──────────┐
                         │  Backend │
                         └────┬─────┘
                              │ 7. Store full data
                              ↓
                         ┌──────────┐
                         │  Arkiv   │ (immutable record)
                         └────┬─────┘
                              │ 8. arkivTxHash
                              ↓
                         ┌──────────┐
                         │  Backend │
                         └────┬─────┘
                              │ 9. createReport() [gasless]
                              ↓
                    ┌─────────────────────┐
                    │ Scroll (RikuyCore)  │
                    │  + Paymaster        │
                    └─────────┬───────────┘
                              │ 10. Event: NewReport
                              ↓
                         ┌──────────┐
                         │ Indexer  │ → Notify gobierno
                         └──────────┘
```

**Tiempo total: ~5 segundos**

---

### 2️⃣ Validación Comunitaria

```
┌────────┐  1. Ver reportes  ┌─────────┐  2. Query nearby  ┌──────┐
│ Carlos │ ─────────────────→│ Backend │ ─────────────────→│Arkiv │
└────────┘                    └────┬────┘                   └──────┘
                                   │ 3. Return reports
                                   ↓
┌────────┐  4. Swipe Sí/No   ┌─────────┐
│ Carlos │ ←─────────────────│ Backend │
└────┬───┘                   └─────────┘
     │ 5. validateReport() [gasless]
     ↓
┌─────────────────────┐
│ Scroll (RikuyCore)  │
│  + Paymaster        │
└─────────┬───────────┘
          │ 6. Check consensus (5+ votos)
          ↓
     ¿Verificado?
          │
    ┌─────┴─────┐
    YES         NO
    │           │
    ↓           ↓
Emit Event   Esperar más
Verified     validaciones
    │
    ↓
┌──────────┐
│ Backend  │ → Notificar gobierno
└──────────┘
```

**Tiempo: 2-5 días** (depende de actividad comunitaria)

---

### 3️⃣ Gobierno Aprueba y Paga

```
┌──────────┐  1. Login    ┌─────────────┐
│ Gobierno │ ────────────→│ Admin Panel │
└──────────┘              └──────┬──────┘
                                 │ 2. Fetch verified reports
                                 ↓
                            ┌─────────┐
                            │  Arkiv  │ (full data)
                            └────┬────┘
                                 │ 3. Display
                                 ↓
┌──────────┐  4. Aprobar   ┌─────────────┐
│ Gobierno │ ────────────→ │ Admin Panel │
└──────────┘               └──────┬──────┘
                                  │ 5. resolveReport() + releaseRewards()
                                  ↓
                        ┌──────────────────────┐
                        │ Scroll (Treasury)    │
                        └──────────┬───────────┘
                                   │ 6. Transfer ETH
                        ┌──────────┴───────────┐
                        │                      │
                        ↓                      ↓
                ┌───────────────┐      ┌──────────────┐
                │ Ana's Wallet  │      │ Validators   │
                │  (70% = 0.7Ξ) │      │ (30% = 0.3Ξ) │
                └───────┬───────┘      └──────────────┘
                        │
                        │ 7. Auto-convert (opcional)
                        ↓
                  ┌────────────┐
                  │ Lemon API  │ (crypto → fiat)
                  └──────┬─────┘
                         │ 8. Bank transfer
                         ↓
                  ┌────────────┐
                  │ Banco Ana  │ +$5000 ARS
                  └────────────┘
```

**Tiempo: 1-2 días** (depende de gobierno)

---

## 📊 Smart Contracts Actualizados

### Estructura Modular

```
contracts/
├── core/
│   ├── RikuyCore.sol           (Orquestador principal)
│   ├── ReportRegistry.sol      (Storage optimizado)
│   ├── ValidationDAO.sol        (Votación + consensus)
│   └── Treasury.sol            (🆕 Manejo de fondos)
│
├── zk/
│   ├── ZKVerifier.sol          (Verificación de proofs)
│   └── verifiers/
│       ├── ProximityVerifier.sol
│       └── UniquenessVerifier.sol
│
├── aa/
│   ├── RikuyPaymaster.sol      (🆕 Gasless UX)
│   └── SmartWalletFactory.sol  (🆕 Account Abstraction)
│
├── governance/
│   └── GovernmentRegistry.sol   (🆕 Whitelist de gobiernos)
│
└── interfaces/
    ├── IRikuyCore.sol
    ├── ITreasury.sol
    └── IPaymaster.sol
```

---

## 🆕 Nuevos Contratos (Treasury + Governance)

### Treasury.sol (Sistema de Pagos)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

/**
 * @title RikuyTreasury
 * @notice Maneja los fondos del gobierno y distribución de recompensas
 * @dev Usa AccessControl para múltiples gobiernos (municipal, provincial, nacional)
 */
contract RikuyTreasury is UUPSUpgradeable, AccessControlUpgradeable {

    // Roles
    bytes32 public constant GOVERNMENT_ROLE = keccak256("GOVERNMENT");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR");

    // Recompensas configurables (en wei)
    uint256 public reporterRewardPercentage = 70; // 70%
    uint256 public validatorRewardPercentage = 30; // 30%

    // Categorías → recompensas (pueden variar)
    mapping(uint8 => uint256) public categoryRewards;

    // Reportes pagados (anti-doble-pago)
    mapping(bytes32 => bool) public rewardsPaid;

    // Estadísticas
    uint256 public totalDeposited;
    uint256 public totalPaid;

    // Eventos
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
        __UUPSUpgradeable_init();
        __AccessControl_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(OPERATOR_ROLE, _admin);

        // Recompensas por defecto (1 ETH total)
        categoryRewards[0] = 0.5 ether;  // Infraestructura: 0.5 ETH
        categoryRewards[1] = 1.0 ether;  // Inseguridad/Drogas: 1 ETH (más importante)
        categoryRewards[2] = 0.3 ether;  // Basura: 0.3 ETH
    }

    /**
     * @notice Gobierno deposita fondos al pool
     */
    function depositFunds() external payable onlyRole(GOVERNMENT_ROLE) {
        require(msg.value > 0, "Amount must be > 0");

        totalDeposited += msg.value;
        emit FundsDeposited(msg.sender, msg.value, block.timestamp);
    }

    /**
     * @notice Liberar recompensas para un reporte verificado
     * @param _reportId ID del reporte
     * @param _category Categoría (determina monto)
     * @param _reporter Address del reporter (recibe 70%)
     * @param _validators Array de validadores (reciben 30% dividido)
     */
    function releaseRewards(
        bytes32 _reportId,
        uint8 _category,
        address _reporter,
        address[] calldata _validators
    ) external onlyRole(OPERATOR_ROLE) {

        require(!rewardsPaid[_reportId], "Rewards already paid");
        require(_reporter != address(0), "Invalid reporter");
        require(_validators.length > 0, "No validators");

        // Obtener recompensa total según categoría
        uint256 totalReward = categoryRewards[_category];
        require(address(this).balance >= totalReward, "Insufficient treasury balance");

        // Calcular distribución
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

        // Marcar como pagado
        rewardsPaid[_reportId] = true;
        totalPaid += totalReward;

        emit RewardReleased(_reportId, _reporter, _validators, totalReward);
    }

    /**
     * @notice Configurar recompensa por categoría
     */
    function setCategoryReward(uint8 _category, uint256 _amount)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
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
     * @notice Obtener balance del treasury
     */
    function getTreasuryBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @notice Retirar fondos de emergencia (solo admin)
     */
    function emergencyWithdraw(address _to, uint256 _amount)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        require(_amount <= address(this).balance, "Insufficient balance");
        (bool success, ) = _to.call{value: _amount}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @notice Upgrade authorization
     */
    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(DEFAULT_ADMIN_ROLE)
    {}

    /**
     * @notice Recibir ETH directamente
     */
    receive() external payable {
        totalDeposited += msg.value;
        emit FundsDeposited(msg.sender, msg.value, block.timestamp);
    }
}
```

---

### GovernmentRegistry.sol (Whitelist de Gobiernos)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title GovernmentRegistry
 * @notice Registro de gobiernos autorizados a aprobar reportes
 * @dev Solo admins pueden agregar/remover gobiernos
 */
contract GovernmentRegistry is Ownable {

    struct Government {
        string name;           // "Municipalidad de Buenos Aires"
        string jurisdiction;   // "CABA"
        address wallet;        // Address de la wallet del gobierno
        bool isActive;
        uint256 registeredAt;
    }

    mapping(address => Government) public governments;
    address[] public governmentList;

    event GovernmentRegistered(address indexed govAddress, string name, string jurisdiction);
    event GovernmentDeactivated(address indexed govAddress);
    event GovernmentActivated(address indexed govAddress);

    constructor() Ownable(msg.sender) {}

    /**
     * @notice Registrar nuevo gobierno
     */
    function registerGovernment(
        address _govAddress,
        string calldata _name,
        string calldata _jurisdiction
    ) external onlyOwner {
        require(_govAddress != address(0), "Invalid address");
        require(governments[_govAddress].wallet == address(0), "Already registered");

        governments[_govAddress] = Government({
            name: _name,
            jurisdiction: _jurisdiction,
            wallet: _govAddress,
            isActive: true,
            registeredAt: block.timestamp
        });

        governmentList.push(_govAddress);

        emit GovernmentRegistered(_govAddress, _name, _jurisdiction);
    }

    /**
     * @notice Desactivar gobierno (no eliminar, solo desactivar)
     */
    function deactivateGovernment(address _govAddress) external onlyOwner {
        require(governments[_govAddress].isActive, "Already inactive");
        governments[_govAddress].isActive = false;

        emit GovernmentDeactivated(_govAddress);
    }

    /**
     * @notice Reactivar gobierno
     */
    function activateGovernment(address _govAddress) external onlyOwner {
        require(!governments[_govAddress].isActive, "Already active");
        governments[_govAddress].isActive = true;

        emit GovernmentActivated(_govAddress);
    }

    /**
     * @notice Verificar si una address es gobierno activo
     */
    function isActiveGovernment(address _address) external view returns (bool) {
        return governments[_address].isActive;
    }

    /**
     * @notice Obtener lista completa de gobiernos
     */
    function getAllGovernments() external view returns (address[] memory) {
        return governmentList;
    }

    /**
     * @notice Obtener info de gobierno
     */
    function getGovernmentInfo(address _govAddress)
        external
        view
        returns (
            string memory name,
            string memory jurisdiction,
            bool isActive,
            uint256 registeredAt
        )
    {
        Government memory gov = governments[_govAddress];
        return (gov.name, gov.jurisdiction, gov.isActive, gov.registeredAt);
    }
}
```

---

## 🔐 Account Abstraction (Gasless UX)

### RikuyPaymaster.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@account-abstraction/contracts/core/BasePaymaster.sol";
import "@account-abstraction/contracts/interfaces/IEntryPoint.sol";

/**
 * @title RikuyPaymaster
 * @notice Patrocina gas para operaciones legítimas
 * @dev Integración con ERC-4337 Account Abstraction
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

    constructor(IEntryPoint _entryPoint) BasePaymaster(_entryPoint) {}

    /**
     * @notice Validar si debemos pagar gas por esta operación
     */
    function _validatePaymasterUserOp(
        UserOperation calldata userOp,
        bytes32 /*userOpHash*/,
        uint256 maxCost
    )
        internal
        override
        returns (bytes memory context, uint256 validationData)
    {
        // Decodificar función llamada
        bytes4 selector = bytes4(userOp.callData[0:4]);

        // Solo patrocinamos createReport y validateReport
        if (selector == bytes4(keccak256("createReport(bytes32,bytes32,uint8,uint256[8])"))) {

            // Verificar límites para reportes
            require(userOp.callGasLimit <= MAX_GAS_PER_REPORT, "Gas too high");

            // Rate limiting
            _checkRateLimit(userOp.sender);

            // Actualizar contadores
            _updateRateLimitCounters(userOp.sender);

        } else if (selector == bytes4(keccak256("validateReport(bytes32,bool)"))) {

            // Verificar límites para validaciones
            require(userOp.callGasLimit <= MAX_GAS_PER_VALIDATION, "Gas too high");

        } else {
            revert("Function not sponsored");
        }

        // Aprobar pago
        return ("", 0);
    }

    /**
     * @notice Verificar rate limits
     */
    function _checkRateLimit(address user) internal view {
        // Verificar tiempo mínimo entre reportes
        require(
            block.timestamp >= lastReportTime[user] + MIN_TIME_BETWEEN_REPORTS,
            "Too soon, wait 5 minutes"
        );

        // Verificar límite diario
        uint256 today = block.timestamp / 1 days;
        if (lastResetDay[user] == today) {
            require(dailyReportCount[user] < MAX_REPORTS_PER_DAY, "Daily limit reached");
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
     * @notice Post-operación (tracking opcional)
     */
    function _postOp(
        PostOpMode /*mode*/,
        bytes calldata /*context*/,
        uint256 actualGasCost
    ) internal override {
        // Opcional: registrar costos para estadísticas
        // emit GasSponsored(user, actualGasCost);
    }

    /**
     * @notice Fondear paymaster (solo owner)
     */
    function deposit() external payable onlyOwner {
        entryPoint.depositTo{value: msg.value}(address(this));
    }

    /**
     * @notice Retirar fondos (solo owner)
     */
    function withdrawTo(address payable _to, uint256 _amount) external onlyOwner {
        entryPoint.withdrawTo(_to, _amount);
    }
}
```

---

## 📊 Diagrama de Costos (para Gobierno)

```
┌────────────────────────────────────────────────────────┐
│              COSTOS POR REPORTE VERIFICADO             │
├────────────────────────────────────────────────────────┤
│                                                        │
│  💰 Recompensas:                                       │
│  ├─ Reporter (Ana): 0.7 ETH (~$2,100 USD)             │
│  └─ Validadores (5): 0.06 ETH c/u (~$180 USD)         │
│     TOTAL RECOMPENSAS: 1.0 ETH (~$3,000 USD)          │
│                                                        │
│  ⛽ Gas Costs (patrocinado por plataforma):            │
│  ├─ createReport(): ~$0.01                            │
│  ├─ validateReport() x5: ~$0.025                      │
│  └─ releaseRewards(): ~$0.015                         │
│     TOTAL GAS: ~$0.05                                  │
│                                                        │
│  🏦 COSTO TOTAL POR REPORTE: ~$3,000                   │
│                                                        │
│  📊 ROI para Gobierno:                                 │
│  • Transparencia inmutable                            │
│  • Reducción de corrupción                            │
│  • Participación ciudadana                            │
│  • Data analytics en tiempo real                      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## 🎯 Variables de Entorno Actualizadas

```env
# Blockchain (Scroll)
SCROLL_RPC_URL=https://sepolia-rpc.scroll.io
SCROLL_CHAIN_ID=534351
DEPLOYER_PRIVATE_KEY=0x...

# Contratos Desplegados
RIKUY_CORE_ADDRESS=0x...
TREASURY_ADDRESS=0x...
PAYMASTER_ADDRESS=0x...
GOVERNMENT_REGISTRY_ADDRESS=0x...

# Arkiv
ARKIV_RPC_URL=https://mendoza.hoodi.arkiv.network
ARKIV_PRIVATE_KEY=0x...

# IPFS
PINATA_API_KEY=...
PINATA_SECRET_KEY=...

# Account Abstraction
PRIVY_APP_ID=...
PRIVY_APP_SECRET=...

# Notificaciones
FIREBASE_PROJECT_ID=...
FIREBASE_PRIVATE_KEY=...

# Gobierno (para testing)
GOVERNMENT_WALLET_ADDRESS=0x...

# Backend
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://...

# Frontend
NEXT_PUBLIC_RIKUY_CONTRACT=0x...
NEXT_PUBLIC_MAPBOX_TOKEN=pk...
NEXT_PUBLIC_APP_URL=https://rikuy.app
```

---

## ✅ Checklist de Seguridad

### Smart Contracts
- [ ] Rate limiting en Paymaster (anti-spam)
- [ ] Access control en Treasury (solo gobiernos autorizados)
- [ ] Reentrancy guards en todas las funciones de pago
- [ ] Upgradeable contracts con UUPS (solo admin)
- [ ] Audit de Slither + Mythril antes de mainnet

### Backend
- [ ] Validación de ZK proofs antes de enviar a blockchain
- [ ] Rate limiting por IP + device ID
- [ ] Geofencing (solo Argentina)
- [ ] Sanitización de inputs (descripción, imágenes)
- [ ] Duplicate detection (perceptual hash)

### Privacy
- [ ] Strip EXIF de fotos (metadata)
- [ ] ZK nullifiers únicos por usuario
- [ ] Ubicación aproximada (±100m)
- [ ] No guardar IPs en blockchain

---

¿Ahora implementamos el código completo? 🚀

Opciones:
1. **Smart Contracts** (Treasury + Paymaster + actualizados)
2. **Backend API** (Node.js con Arkiv + ZK + IPFS)
3. **Setup del proyecto** (Foundry + Hardhat + estructura)
4. **ZK Circuits** (Circom proximity proof)

Dime por dónde empezamos 💪
