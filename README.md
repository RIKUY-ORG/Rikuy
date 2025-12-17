# Rikuy - Sistema de Denuncias Ciudadanas Anónimas

Plataforma descentralizada para reportes ciudadanos anónimos con verificación de identidad y almacenamiento permanente en blockchain.

## Tabla de Contenidos

- [Visión General](#visión-general)
- [Smart Contracts (Scroll Sepolia)](#smart-contracts-scroll-sepolia)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Stack Tecnológico](#stack-tecnológico)
- [Estado del Desarrollo](#estado-del-desarrollo)
- [Instalación y Configuración](#instalación-y-configuración)

---

## Visión General

Rikuy es un sistema que permite a ciudadanos reportar incidentes de forma completamente anónima mientras mantiene verificación de identidad mediante Zero-Knowledge Proofs (ZKP). El sistema garantiza:

- **Anonimato total**: Los reportes no pueden vincularse a la identidad del reportante
- **Verificación de identidad**: Solo usuarios verificados pueden crear reportes
- **Inmutabilidad**: Evidencia almacenada permanentemente en IPFS y Arkiv
- **Transparencia**: Todas las transacciones registradas en blockchain público

### Flujo de Usuario

1. Usuario verifica su identidad (una sola vez)
2. Sistema genera identity commitment para Semaphore
3. Usuario captura evidencia fotográfica del incidente
4. Backend analiza la imagen con IA (moderación de contenido)
5. Imagen se sube a IPFS (Pinata) y Arkiv (almacenamiento permanente)
6. Usuario genera ZK proof de su identidad verificada
7. Reporte se registra en blockchain con proof anónimo
8. Comunidad valida la autenticidad del reporte
9. Gobierno aprueba y libera recompensas

---

## Smart Contracts (Scroll Sepolia)

Todos los contratos están deployados en **Scroll Sepolia Testnet** (Chain ID: 534351).

### Contratos Principales

#### RikuyCoreV2 (Proxy UUPS)
**Dirección**: `0xEaa6cB7Fa8BEBEa72c78fAd2170b103aC1C2F126`

Contrato principal que coordina toda la lógica de negocio. Implementa:

- **Relayer Pattern**: Backend firma transacciones en nombre del usuario (gasless)
- **ZK Proof Verification**: Verifica proofs de Semaphore para anonimato
- **Workflow de Validación**: Sistema de upvotes/downvotes comunitarios
- **Access Control**: Roles para admin, operadores, gobierno y relayer

\`\`\`solidity
// Funciones principales
function createReport(
    bytes32 arkivTxId,      // Hash de evidencia en Arkiv
    uint16 categoryId,      // Categoría del incidente
    uint256[8] zkProof,     // Groth16 proof
    uint256[4] pubSignals   // [nullifier, merkleRoot, message, scope]
) external onlyRole(RELAYER_ROLE) returns (bytes32 reportId)

function validateReport(
    bytes32 reportId,
    bool isValid
) external

function resolveReport(
    bytes32 reportId,
    bool approved
) external onlyRole(GOVERNMENT_ROLE)
\`\`\`

**Características**:
- UUPS Upgradeable (puede mejorarse sin cambiar dirección)
- Emite eventos para indexación off-chain
- Threshold de validación: 5 votos positivos
- Integrado con ReportRegistry y Treasury

---

#### ReportRegistry
**Dirección**: `0xdc3c4c07e4675cf1BBDEa627026e92170f9F5AE1`

Storage contract que mantiene el registro de todos los reportes.

\`\`\`solidity
struct Report {
    bytes32 reportId;
    bytes32 arkivTxId;       // Referencia a evidencia en Arkiv
    bytes32 nullifier;       // ZK nullifier (unique)
    uint16 categoryId;
    uint256 timestamp;
    uint256 validationScore;
    bool isResolved;
}
\`\`\`

**Categorías de Reportes**:
- `0`: Infraestructura (baches, alumbrado público, etc.)
- `1`: Inseguridad (robos, violencia)
- `2`: Basura y contaminación
- `3`: Corrupción
- `4`: Otros

---

#### Treasury
**Dirección**: `0xb53cd2E6a71E88C4Df5863CD8c257077cD8C1aa2`

Gestiona fondos y distribución de recompensas.

\`\`\`solidity
function releaseRewards(
    bytes32 reportId,
    uint16 categoryId,
    address reporter,     // null para reportes anónimos
    address[] validators
) external
\`\`\`

**Sistema de Recompensas**:
- Reportes de corrupción: 2x puntos
- Bonus por severidad (analizado por IA)
- Distribución entre reporter y validators
- ERC20 compatible (MockUSX para testnet)

---

#### GovernmentRegistry
**Dirección**: `0xD65C9aA84b78a2aDea2011CD992F2475a4CD01a0`

Registro de entidades gubernamentales autorizadas.

- Gestión de permisos para resolver reportes
- Whitelist de direcciones oficiales
- Auditoría de acciones gubernamentales

---

### Contratos de Soporte

#### MockUSX (ERC20)
**Dirección**: `0xD15ED9ea64B0a1d9535374F27de79111EbE872C1`

Token de prueba para recompensas en testnet. En producción se reemplazará por stablecoin real (USDC/USDT).

#### MockSemaphoreAdapter
**Dirección**: `0x098FF07f87C1AAec0dD5b16c2F0199aA2b60bB75`

**Nota**: Este es un contrato temporal para desarrollo. Acepta cualquier proof sin verificar.

**Estado**: En desarrollo - Se reemplazará por integración completa con Semaphore Protocol.

---

## Arquitectura del Sistema

### Componentes

\`\`\`
┌─────────────┐
│   Frontend  │  React + TypeScript + Vite
│   (Privy)   │  - Autenticación Web3
└──────┬──────┘  - Generación ZK Proofs
       │         - Captura de evidencia
       │
       ▼
┌─────────────┐
│   Backend   │  Node.js + Express + TypeScript
│  (Relayer)  │  - Firma transacciones (gasless)
└──────┬──────┘  - IA para análisis de imágenes
       │         - Moderación de contenido
       │
       ├──────────────┬────────────────┐
       ▼              ▼                ▼
┌──────────┐   ┌──────────┐    ┌──────────┐
│   IPFS   │   │  Arkiv   │    │  Scroll  │
│ (Pinata) │   │ Network  │    │ Sepolia  │
└──────────┘   └──────────┘    └──────────┘
\`\`\`

### Flujo de Datos

1. **Captura**: Usuario toma foto del incidente
2. **Geolocalización**: Coordenadas GPS con precisión difusa (~200m)
3. **Análisis IA**: Gemini Vision API valida contenido
4. **Storage Descentralizado**:
   - IPFS (Pinata): Acceso rápido
   - Arkiv: Almacenamiento permanente (10 años)
5. **ZK Proof**: Generación local con Semaphore Protocol
6. **Blockchain**: Registro inmutable en Scroll Sepolia

---

## Stack Tecnológico

### Frontend
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **UI Library**: Hero UI (Tailwind-based)
- **Web3 Auth**: Privy (wallet abstraction)
- **ZK Proofs**: `@semaphore-protocol/core`
- **Routing**: React Router v6

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Web3 Library**: ethers.js v6
- **Storage**:
  - IPFS: Pinata SDK
  - Arkiv: `@arkiv-network/sdk`
- **AI/ML**:
  - Vision: Google Gemini API
  - Content Moderation: OpenAI (opcional)
- **Logging**: Pino (structured logging)

### Smart Contracts
- **Language**: Solidity 0.8.20+
- **Framework**: Foundry
- **Upgrades**: OpenZeppelin UUPS
- **Access Control**: OpenZeppelin AccessControl
- **ZK**: Semaphore Protocol v4

### Blockchain & Storage
- **L2**: Scroll Sepolia (EVM-compatible)
- **IPFS**: Pinata (gateway + pinning)
- **Permanent Storage**: Arkiv Network (Mendoza Testnet)
- **RPC**: Scroll Public RPC

---

## Estado del Desarrollo

### Completado

**Smart Contracts**:
- [x] RikuyCoreV2 con Relayer Pattern
- [x] ReportRegistry para storage
- [x] Treasury con sistema de recompensas
- [x] GovernmentRegistry para permisos
- [x] Deploy completo en Scroll Sepolia

**Backend**:
- [x] Relayer service (gasless transactions)
- [x] IPFS integration (Pinata)
- [x] AI vision analysis (Gemini)
- [x] Content moderation
- [x] Structured logging
- [x] Error handling

**Frontend**:
- [x] Web3 authentication (Privy)
- [x] Wallet abstraction
- [x] Camera capture
- [x] Geolocation
- [x] Report submission UI

### En Desarrollo

**Semaphore Integration** (Prioridad Alta):
- [ ] Implementar generación de proofs reales en frontend
- [ ] Endpoint para registrar identities on-chain
- [ ] Obtener Merkle tree del grupo Semaphore
- [ ] Reemplazar MockSemaphoreAdapter por adapter real
- [ ] Verificación de nullifiers únicos

**Arkiv Integration** (Prioridad Media):
- [ ] Resolver error de compresión Brotli
- [ ] Actualizar SDK a última versión
- [ ] Implementar retry logic
- [ ] Optimizar payload size

**Features Pendientes**:
- [ ] Sistema de notificaciones
- [ ] Dashboard de reportes
- [ ] Visualización en mapa
- [ ] Sistema de apelaciones
- [ ] Métricas y analytics
- [ ] Tests end-to-end

---

## Instalación y Configuración

### Requisitos Previos

\`\`\`bash
# Node.js
node --version  # v20.0.0 o superior

# Foundry (para smart contracts)
forge --version

# Git
git --version
\`\`\`

### Instalación

\`\`\`bash
# Clonar repositorio
git clone https://github.com/tu-org/rikuy.git
cd rikuy

# Instalar dependencias del backend
cd backend
npm install

# Instalar dependencias del frontend
cd ../frontend
npm install
\`\`\`

### Configuración

#### Backend (.env)

\`\`\`bash
# Blockchain
SCROLL_RPC_URL=https://sepolia-rpc.scroll.io
SCROLL_CHAIN_ID=534351
RELAYER_PRIVATE_KEY=0x...  # Wallet privada del backend

# Smart Contracts
RIKUY_CORE_V2_ADDRESS=0xEaa6cB7Fa8BEBEa72c78fAd2170b103aC1C2F126
REPORT_REGISTRY_ADDRESS=0xdc3c4c07e4675cf1BBDEa627026e92170f9F5AE1
TREASURY_ADDRESS=0xb53cd2E6a71E88C4Df5863CD8c257077cD8C1aa2

# IPFS (Pinata)
PINATA_JWT=tu_jwt_de_pinata
PINATA_GATEWAY=https://gateway.pinata.cloud

# AI
GEMINI_API_KEY=tu_api_key_de_gemini

# Arkiv
ARKIV_RPC_URL=https://mendoza.hoodi.arkiv.network/rpc
ARKIV_PRIVATE_KEY=0x...

# Development
DEV_MODE=true  # Habilita bypass de verificaciones ZK
\`\`\`

#### Frontend (.env)

\`\`\`bash
VITE_PRIVY_APP_ID=tu_app_id_de_privy
VITE_BACKEND_API_URL=http://localhost:3001
\`\`\`

### Ejecución

\`\`\`bash
# Backend (puerto 3001)
cd backend
npm run dev

# Frontend (puerto 5173)
cd frontend
npm run dev
\`\`\`

Abrir navegador en `http://localhost:5173`

---

## Smart Contract Development

### Compilar contratos

\`\`\`bash
forge build
\`\`\`

### Ejecutar tests

\`\`\`bash
forge test -vvv
\`\`\`

### Deploy a Scroll Sepolia

\`\`\`bash
# MockSemaphoreAdapter
forge script script/DeployMockAdapter.s.sol:DeployMockAdapter \
  --rpc-url $SCROLL_RPC_URL \
  --broadcast

# RikuyCoreV2
forge script script/DeployRikuyCoreV2.s.sol:DeployRikuyCoreV2 \
  --rpc-url $SCROLL_RPC_URL \
  --broadcast
\`\`\`

---

## Roadmap

### Q1 2025
- Completar integración con Semaphore Protocol
- Resolver issues de Arkiv storage
- Deploy en Scroll Mainnet
- Auditoría de smart contracts

### Q2 2025
- Mobile app (React Native)
- Sistema de reputación avanzado
- Integración con múltiples L2s
- Partnerships con gobiernos locales

### Q3 2025
- DAO para gobernanza
- Tokenomics completa
- Programa de rewards
- Expansión internacional

---

## Seguridad

### Consideraciones Actuales

**Modo Desarrollo**:
- `DEV_MODE=true` bypasea verificación de ZK proofs en backend
- `MockSemaphoreAdapter` acepta cualquier proof sin verificar
- Solo para desarrollo/testing - NO usar en producción

**Antes de Producción**:
- [ ] Auditoría completa de smart contracts
- [ ] Penetration testing del backend
- [ ] Configurar `DEV_MODE=false`
- [ ] Reemplazar MockSemaphoreAdapter
- [ ] Implementar rate limiting robusto
- [ ] Configurar monitoring y alertas

---

## Licencia

MIT License - Ver archivo LICENSE para detalles

---

## Contacto y Contribuciones

- GitHub: [https://github.com/tu-org/rikuy](https://github.com/tu-org/rikuy)
- Documentación Técnica: [Ver DEVELOPMENT_NOTES.md](./DEVELOPMENT_NOTES.md)

Para contribuir, por favor lee CONTRIBUTING.md y abre un Pull Request.

---

**Nota**: Este proyecto está en desarrollo activo. El sistema de Zero-Knowledge Proofs está siendo implementado y actualmente usa un adapter mock para desarrollo. Ver [Estado del Desarrollo](#estado-del-desarrollo) para más detalles.
