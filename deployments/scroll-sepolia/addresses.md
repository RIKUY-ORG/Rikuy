# 🚀 RIKUY - DEPLOYMENT EN SCROLL SEPOLIA

**Fecha:** 14 Diciembre 2024
**Network:** Scroll Sepolia Testnet
**Chain ID:** 534351
**Deployer:** 0x8A387ef9acC800eea39E3E6A2d92694dB6c813Ac

---

## 📋 CONTRATOS DEPLOYADOS

### Core Contracts

| Contrato | Dirección | Transaction Hash |
|----------|-----------|------------------|
| **MockUSX** | `0xD15ED9ea64B0a1d9535374F27de79111EbE872C1` | `0xbde861ef51c59ad80b02e51ae5f749054a8024801689b7779be2dfd39067fa77` |
| **ReportRegistry (Proxy)** | `0xdc3c4c07e4675cf1BBDEa627026e92170f9F5AE1` | `0x8d288856877851b06d12afbe1fdb3bc8c63e531481ac8e0b55c2b301413cf85f` |
| **ReportRegistry (Implementation)** | `0xA77DB3BDAF8258F2af72d606948FFfd898a1F5D1` | `0xb0d510d2dc31527d3cd4f53ae99ddd45d48d8dcfef946fb894de2d0a5757241b` |
| **SemaphoreAdapter** | `0x6536ee56e3f30A427bc83c208D829d059E8eEDA4` | `0xc8f6ac4653dd7151ae5a3f030754a5a0a2c769f247b4a08f70cfe24db566dc17` |
| **Treasury (Implementation)** | `0x9890872bbf4B2DC3fBcA848ECa94799676E6F37e` | `0xcda882047733cf722dffe9c35d18c23450561d353220e50e194d1778d2dd37df` |
| **Treasury (Proxy)** | `0xb53cd2E6a71E88C4Df5863CD8c257077cD8C1aa2` | `0xe78d4d1782989bb602d1365574734c21d2d63cfa4d463765d88d1a689d065f80` |
| **RikuyCoreV2 (Implementation)** | `0x5483B6C35b975F24Ca21647650b1a93f8341B26a` | `0x864432da7b5d27220962bc293fd1ddca978d6b74fa0a2bbba6c6dc65a4f7b49e` |
| **RikuyCoreV2 (Proxy)** | `0x2b514e6ebaa9a7dEd3f7c6c668708ae92791f478` | `0xd3e5ad36b09b17c3620fbd1e96330fd07d7c6afc728cc20bc975ed6758f8692f` |
| **GovernmentRegistry** | `0xD65C9aA84b78a2aDea2011CD992F2475a4CD01a0` | `0xd36ca8303c9311d5732ea6194d14fc3671e8c5cf5f051465f37a7eb14db338fa` |

### External Dependencies

| Servicio | Dirección | Notas |
|----------|-----------|-------|
| **Semaphore Protocol** | `0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D` | Ya deployado en Scroll Sepolia |
| **Semaphore Group ID** | `30` | Creado para Rikuy |

---

## 💰 COSTOS DE DEPLOYMENT

| Métrica | Valor |
|---------|-------|
| **Total Gas Used** | 7,388,355 gas |
| **Total ETH Spent** | 0.00011585 ETH |
| **USD Cost** | ~$0.40 USD (aprox) |
| **Transactions** | 16 |

---

## 🔗 LINKS ÚTILES

### Scrollscan (Block Explorer)

**Contratos Principales:**
- [RikuyCoreV2 (Proxy)](https://sepolia.scrollscan.com/address/0x2b514e6ebaa9a7dEd3f7c6c668708ae92791f478)
- [Treasury (Proxy)](https://sepolia.scrollscan.com/address/0xb53cd2E6a71E88C4Df5863CD8c257077cD8C1aa2)
- [ReportRegistry](https://sepolia.scrollscan.com/address/0xdc3c4c07e4675cf1BBDEa627026e92170f9F5AE1)
- [MockUSX](https://sepolia.scrollscan.com/address/0xD15ED9ea64B0a1d9535374F27de79111EbE872C1)
- [SemaphoreAdapter](https://sepolia.scrollscan.com/address/0x6536ee56e3f30A427bc83c208D829d059E8eEDA4)

**Deployer Wallet:**
- [0x8A387ef9acC800eea39E3E6A2d92694dB6c813Ac](https://sepolia.scrollscan.com/address/0x8A387ef9acC800eea39E3E6A2d92694dB6c813Ac)

---

## ⚙️ CONFIGURACIÓN POST-DEPLOYMENT

### Variables para Backend (.env)

```bash
# Scroll Sepolia Network
SCROLL_RPC_URL=https://sepolia-rpc.scroll.io
SCROLL_CHAIN_ID=534351

# Contratos Deployados
RIKUY_CORE_V2_ADDRESS=0x2b514e6ebaa9a7dEd3f7c6c668708ae92791f478
TREASURY_ADDRESS=0xb53cd2E6a71E88C4Df5863CD8c257077cD8C1aa2
REPORT_REGISTRY_ADDRESS=0xdc3c4c07e4675cf1BBDEa627026e92170f9F5AE1
SEMAPHORE_ADAPTER_ADDRESS=0x6536ee56e3f30A427bc83c208D829d059E8eEDA4
MOCK_USX_ADDRESS=0xD15ED9ea64B0a1d9535374F27de79111EbE872C1
GOVERNMENT_REGISTRY_ADDRESS=0xD65C9aA84b78a2aDea2011CD992F2475a4CD01a0

# Semaphore Protocol
SEMAPHORE_ADDRESS=0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D
SEMAPHORE_GROUP_ID=30

# Relayer Wallet (configurar con tu backend wallet)
RELAYER_PRIVATE_KEY=your_backend_relayer_private_key_here
```

### Variables para Frontend (.env)

```bash
# Contratos
VITE_RIKUY_CORE_ADDRESS=0x2b514e6ebaa9a7dEd3f7c6c668708ae92791f478
VITE_TREASURY_ADDRESS=0xb53cd2E6a71E88C4Df5863CD8c257077cD8C1aa2
VITE_MOCK_USX_ADDRESS=0xD15ED9ea64B0a1d9535374F27de79111EbE872C1

# Semaphore
VITE_SEMAPHORE_ADDRESS=0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D
VITE_SEMAPHORE_GROUP_ID=30

# Network
VITE_SCROLL_RPC_URL=https://sepolia-rpc.scroll.io
VITE_SCROLL_CHAIN_ID=534351

# Backend API
VITE_BACKEND_API_URL=http://localhost:3001
```

---

## 📝 PRÓXIMOS PASOS

### 1. Configurar Permisos y Roles

```bash
# Cargar variables
export RIKUY_CORE=0x2b514e6ebaa9a7dEd3f7c6c668708ae92791f478
export TREASURY=0xb53cd2E6a71E88C4Df5863CD8c257077cD8C1aa2
export MOCK_USX=0xD15ED9ea64B0a1d9535374F27de79111EbE872C1

# 1. Configurar recompensas (100% a validadores)
cast send $TREASURY \
  "setRewardPercentages(uint256,uint256)" \
  0 100 \
  --rpc-url $SCROLL_RPC_URL \
  --private-key $PRIVATE_KEY

# 2. Agregar backend wallet como RELAYER
RELAYER_ADDRESS=0xYourBackendWalletAddress
cast send $RIKUY_CORE \
  "addRelayer(address)" \
  $RELAYER_ADDRESS \
  --rpc-url $SCROLL_RPC_URL \
  --private-key $PRIVATE_KEY

# 3. Fondear Treasury con MockUSX (100,000 USX)
cast send $MOCK_USX \
  "approve(address,uint256)" \
  $TREASURY \
  100000000000000000000000 \
  --rpc-url $SCROLL_RPC_URL \
  --private-key $PRIVATE_KEY

cast send $TREASURY \
  "depositFunds(uint256)" \
  100000000000000000000000 \
  --rpc-url $SCROLL_RPC_URL \
  --private-key $PRIVATE_KEY
```

### 2. Actualizar Backend

```bash
cd backend

# Copiar ABIs
cp ../out/RikuyCoreV2.sol/RikuyCoreV2.json src/contracts/abis/
cp ../out/ReportRegistry.sol/ReportRegistry.json src/contracts/abis/
cp ../out/Treasury.sol/RikuyTreasury.json src/contracts/abis/
cp ../out/SemaphoreAdapter.sol/SemaphoreAdapter.json src/contracts/abis/

# Actualizar .env con las direcciones de arriba
nano .env

# Instalar y correr
npm install
npm run dev
```

### 3. Testing E2E

```bash
# Test 1: Verificar que RikuyCore está activo
cast call $RIKUY_CORE "VERIFICATION_THRESHOLD()" --rpc-url $SCROLL_RPC_URL

# Test 2: Verificar balance del Treasury
cast call $TREASURY "getTreasuryBalance()" --rpc-url $SCROLL_RPC_URL

# Test 3: Verificar SemaphoreAdapter
cast call 0x6536ee56e3f30A427bc83c208D829d059E8eEDA4 "groupId()" --rpc-url $SCROLL_RPC_URL
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [x] ✅ Todos los contratos deployados
- [ ] ⏳ Configurar distribución de recompensas
- [ ] ⏳ Agregar backend wallet como RELAYER
- [ ] ⏳ Fondear Treasury con MockUSX
- [ ] ⏳ Actualizar backend/.env
- [ ] ⏳ Actualizar frontend/.env
- [ ] ⏳ Copiar ABIs al backend
- [ ] ⏳ Testing E2E

---

## 🎯 ESTADO ACTUAL

**Deployment:** ✅ COMPLETADO
**Configuración:** ⏳ PENDIENTE
**Testing:** ⏳ PENDIENTE
**Producción:** ❌ NO (testnet solamente)

---

**Última actualización:** 14 Diciembre 2024
