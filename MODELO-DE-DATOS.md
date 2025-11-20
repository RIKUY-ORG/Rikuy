# 📊 RIKUY - MODELO DE DATOS COMPLETO

**Proyecto**: RIKUY - Plataforma de denuncias ciudadanas anónimas
**Fecha**: 20 Noviembre 2025
**Versión**: 1.0

---

## 🎯 Arquitectura de Datos

RIKUY utiliza una **arquitectura híbrida descentralizada** con 3 capas de storage:

```
┌─────────────────────────────────────────────────┐
│         1. BLOCKCHAIN (Scroll Sepolia)          │
│              Smart Contracts                    │
│         - Inmutable                             │
│         - On-chain verification                 │
│         - Registros críticos                    │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│         2. ARKIV (Mendoza Testnet)              │
│           Decentralized Storage                 │
│         - Metadata completa                     │
│         - Queryable attributes                  │
│         - 10 años de retención                  │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│         3. IPFS (Pinata)                        │
│           Content-Addressed Storage             │
│         - Imágenes/evidencia                    │
│         - Permanente                            │
│         - Content ID (CID)                      │
└─────────────────────────────────────────────────┘
```

---

## 📋 CAPA 1: SMART CONTRACTS (On-Chain)

### 1.1 ReportRegistry.sol

**Propósito**: Storage inmutable de reportes verificados

**Estructura de Datos**:

```solidity
struct Report {
    bytes32 reportId;           // ID único (keccak256)
    bytes32 arkivTxId;          // Hash de TX en Arkiv
    bytes32 nullifier;          // ZK nullifier (anonimato)
    uint16 categoryId;          // 0=Infraestructura, 1=Droga, 2=Corrupción
    uint256 timestamp;          // Unix timestamp
    bool isResolved;            // Estado de resolución
    address reporter;           // Wallet del reporter (anónimo vía ZK)
}

// Mappings
mapping(bytes32 => Report) private reports;
mapping(bytes32 => mapping(address => bool)) private validations;
mapping(bytes32 => uint256) public reportValidationCount;
```

**Índices**:
- `reportId` → Report (primario)
- `(reportId, validator)` → bool (validaciones)
- `reportId` → uint256 (contador de validaciones)

---

### 1.2 RikuyCore.sol

**Propósito**: Orquestador principal del sistema

**Estructura de Datos**:

```solidity
// Tracking de validaciones
mapping(bytes32 => address[]) private reportValidators;
mapping(bytes32 => uint256) private reportUpvotes;
mapping(bytes32 => uint256) private reportDownvotes;

// Tracking de reportes por usuario (analytics)
mapping(address => bytes32[]) private userReports;

// Estados de reportes
enum ReportStatus {
    Pending,      // 0 - Esperando validación
    Verified,     // 1 - 5+ upvotes
    Disputed,     // 2 - Muchos downvotes
    Resolved      // 3 - Gobierno aprobó/rechazó
}
```

**Eventos (Event Log)**:

```solidity
event ReportCreated(
    bytes32 indexed reportId,
    bytes32 indexed nullifier,
    bytes32 arkivTxId,
    uint16 category,
    uint256 timestamp
);

event ReportValidated(
    bytes32 indexed reportId,
    address indexed validator,
    bool isValid
);

event ReportVerified(
    bytes32 indexed reportId,
    uint256 totalValidations
);

event ReportResolved(
    bytes32 indexed reportId,
    ReportStatus finalStatus,
    address indexed governmentApprover
);
```

---

### 1.3 Treasury.sol

**Propósito**: Gestión de recompensas en USX

**Estructura de Datos**:

```solidity
struct RewardRecord {
    bytes32 reportId;
    address recipient;
    uint256 amount;
    uint256 timestamp;
    bool claimed;
}

// Mappings
mapping(bytes32 => RewardRecord) public rewards;
mapping(address => uint256) public totalEarned;

// Balance tracking
uint256 public totalRewardsDistributed;
uint256 public treasuryBalance;
```

**Eventos**:

```solidity
event RewardReleased(
    bytes32 indexed reportId,
    address indexed recipient,
    uint256 amount
);

event RewardClaimed(
    bytes32 indexed reportId,
    address indexed claimer,
    uint256 amount
);

event TreasuryFunded(
    address indexed funder,
    uint256 amount
);
```

---

### 1.4 GovernmentRegistry.sol

**Propósito**: Whitelist de entidades gubernamentales

**Estructura de Datos**:

```solidity
struct GovernmentEntity {
    address wallet;
    string name;              // "Municipio de La Paz"
    string jurisdiction;      // "La Paz, Bolivia"
    bool isActive;
    uint256 registeredAt;
}

mapping(address => GovernmentEntity) public governments;
mapping(address => bool) public isGovernment;
```

---

## 📋 CAPA 2: ARKIV NETWORK (Decentralized Storage)

### 2.1 Report Metadata Schema

**Propósito**: Almacenar metadata completa del reporte (queryable)

**Estructura JSON**:

```json
{
  "reportId": "0x1234...abcd",
  "version": "1.0",
  "protocol": "rikuy-v1",

  "content": {
    "description": "Actividad sospechosa. Grupo de personas intercambiando objetos pequeños...",
    "category": {
      "id": 1,
      "name": "Narcotráfico",
      "severity": 9
    },
    "tags": ["drogas", "menores", "venta", "noche"],
    "aiAnalysis": {
      "confidence": 0.87,
      "detected": ["group", "exchange", "suspicious_behavior"],
      "moderation": {
        "inappropriate": false,
        "violence": false,
        "nsfw": false
      }
    }
  },

  "evidence": {
    "ipfsHash": "Qm...",
    "imageUrl": "https://gateway.pinata.cloud/ipfs/Qm...",
    "format": "image/jpeg",
    "size": 245678,
    "dimensions": {
      "width": 1920,
      "height": 1080
    },
    "hash": {
      "sha256": "abc123...",
      "algorithm": "sha256"
    }
  },

  "location": {
    "approximate": {
      "lat": -16.5000,
      "long": -68.1500,
      "radius": 200
    },
    "city": "El Alto",
    "state": "La Paz",
    "country": "Bolivia",
    "countryCode": "BO",
    "geohash": "6mdv9q"
  },

  "privacy": {
    "nullifier": "0xabc...",
    "zkProofHash": "0xdef...",
    "anonymized": true,
    "exifStripped": true
  },

  "validation": {
    "community": {
      "upvotes": 6,
      "downvotes": 1,
      "validators": 7,
      "verifiedAt": 1700000000,
      "threshold": 5
    },
    "government": {
      "approved": true,
      "approvedBy": "0x123...",
      "approvedAt": 1700001000,
      "resolution": "Operativo realizado exitosamente"
    }
  },

  "rewards": {
    "total": 200,
    "reporter": 140,
    "validators": 60,
    "currency": "USX",
    "claimed": true,
    "claimedAt": 1700002000
  },

  "blockchain": {
    "network": "scroll-sepolia",
    "chainId": 534351,
    "txHash": "0x789...",
    "blockNumber": 12345678,
    "contractAddress": "0x2b514e6ebaa9a7dEd3f7c6c668708ae92791f478"
  },

  "timestamps": {
    "created": 1700000000,
    "uploaded": 1700000005,
    "verified": 1700000100,
    "resolved": 1700001000
  },

  "metadata": {
    "version": "1.0",
    "expiresAt": 2015000000,
    "retentionYears": 10
  }
}
```

**Attributes Queryables** (Arkiv SDK):

```typescript
attributes: [
  { key: 'reportId', value: '0x1234...abcd' },
  { key: 'category', value: '1' },           // Droga
  { key: 'severity', value: '9' },           // Alta
  { key: 'timestamp', value: '1700000000' },
  { key: 'lat', value: '-16.5000' },
  { key: 'long', value: '-68.1500' },
  { key: 'city', value: 'El Alto' },
  { key: 'country', value: 'BO' },
  { key: 'verified', value: 'true' },
  { key: 'resolved', value: 'true' },
  { key: 'protocol', value: 'rikuy-v1' }
]
```

**Queries Soportadas**:

```typescript
// Por categoría
arkiv.query({
  where: eq('category', '1'),  // Narcotráfico
  limit: 100
});

// Por ubicación (aproximada)
arkiv.query({
  where: eq('city', 'El Alto'),
  limit: 100
});

// Por fecha
arkiv.query({
  where: gte('timestamp', '1700000000'),
  orderBy: 'timestamp DESC'
});

// Por estado
arkiv.query({
  where: and(
    eq('verified', 'true'),
    eq('resolved', 'false')
  )
});
```

---

## 📋 CAPA 3: IPFS (Content-Addressed Storage)

### 3.1 Imagen/Evidencia

**Formato**: JPEG optimizado
**Procesamiento**:
```
Original Image
    ↓
[1] Strip EXIF metadata (privacidad)
    ↓
[2] Compress (85% quality, Sharp)
    ↓
[3] Resize (max 1920x1080)
    ↓
[4] Upload to Pinata IPFS
    ↓
CID: Qm... (hash único)
```

**Metadata IPFS**:
```json
{
  "name": "report-evidence-0x1234.jpg",
  "size": 245678,
  "type": "image/jpeg",
  "cid": "QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG",
  "pinataMetadata": {
    "name": "rikuy-report-0x1234",
    "keyvalues": {
      "reportId": "0x1234...abcd",
      "category": "drug_trafficking",
      "uploaded": "2024-11-15T10:30:00Z"
    }
  }
}
```

**URLs de Acceso**:
```
IPFS Gateway: https://gateway.pinata.cloud/ipfs/Qm...
Direct: ipfs://Qm...
```

---

## 🔗 RELACIONES ENTRE DATOS

### Diagrama de Entidad-Relación

```
┌─────────────────────────────────────┐
│         BLOCKCHAIN                  │
│                                     │
│  ┌─────────────────┐                │
│  │  ReportRegistry │                │
│  │  - reportId (PK)│────┐           │
│  │  - arkivTxId    │    │           │
│  │  - nullifier    │    │           │
│  │  - categoryId   │    │           │
│  │  - timestamp    │    │           │
│  └─────────────────┘    │           │
│           │              │           │
│           │              │           │
│  ┌─────────────────┐    │           │
│  │   RikuyCore     │    │           │
│  │  - upvotes      │    │           │
│  │  - downvotes    │    │           │
│  │  - validators[] │    │           │
│  └─────────────────┘    │           │
│           │              │           │
│           │              │           │
│  ┌─────────────────┐    │           │
│  │    Treasury     │    │           │
│  │  - rewards      │    │           │
│  │  - claimed      │    │           │
│  └─────────────────┘    │           │
└─────────────────────────│───────────┘
                          │
                          │ arkivTxId
                          ↓
┌─────────────────────────────────────┐
│           ARKIV                     │
│                                     │
│  ┌─────────────────┐                │
│  │ Report Metadata │                │
│  │ - reportId      │────┐           │
│  │ - description   │    │           │
│  │ - category      │    │           │
│  │ - location      │    │           │
│  │ - ipfsHash      │────┼──┐        │
│  │ - validation    │    │  │        │
│  │ - rewards       │    │  │        │
│  └─────────────────┘    │  │        │
└─────────────────────────│──│────────┘
                          │  │
                reportId  │  │ ipfsHash
                          │  │
                          │  ↓
                          │  ┌───────────────┐
                          │  │     IPFS      │
                          │  │               │
                          │  │ - Image File  │
                          │  │ - CID: Qm...  │
                          │  └───────────────┘
                          │
                          ↓
┌─────────────────────────────────────┐
│      BACKEND CACHE (Redis)          │
│                                     │
│  ┌─────────────────┐                │
│  │  Rate Limiting  │                │
│  │  - IP:count     │                │
│  │  - TTL: 60s     │                │
│  └─────────────────┘                │
│                                     │
│  ┌─────────────────┐                │
│  │  Report Cache   │                │
│  │  - reportId:data│                │
│  │  - TTL: 300s    │                │
│  └─────────────────┘                │
└─────────────────────────────────────┘
```

---

## 📊 FLUJO DE DATOS (End-to-End)

### Creación de Reporte

```
[1] Usuario sube imagen + metadata
         ↓
[2] Backend procesa
    • Strip EXIF
    • Hash SHA-256
    • Compress imagen
         ↓
[3] Upload a IPFS
    • Retorna: CID (Qm...)
         ↓
[4] GPT-4 Vision analiza
    • Retorna: descripción, tags, severity
         ↓
[5] Crea payload Arkiv
    {
      reportId, description, category,
      location, ipfsHash, aiAnalysis, ...
    }
         ↓
[6] Arkiv.mutateEntities()
    • Retorna: arkivTxId
         ↓
[7] Genera ZK Proof
    • Retorna: nullifier, proof
         ↓
[8] Blockchain: RikuyCore.createReport()
    • Parámetros: arkivTxId, categoryId, zkProof
    • Emite: ReportCreated event
    • Retorna: reportId (bytes32)
         ↓
[9] Retorna al usuario
    {
      reportId: "0x...",
      ipfsHash: "Qm...",
      arkivTxId: "0x...",
      txHash: "0x..."
    }
```

### Validación Comunitaria

```
[1] Vecino ve reporte (query Arkiv por geolocation)
         ↓
[2] Vota: RikuyCore.validateReport(reportId, true/false)
         ↓
[3] Smart contract verifica:
    • No ha votado antes (mapping)
    • Incrementa upvotes/downvotes
         ↓
[4] Si upvotes >= 5:
    • Marca como VERIFIED
    • Emite: ReportVerified event
         ↓
[5] Gobierno recibe alerta (via webhook/API)
```

### Resolución y Recompensa

```
[1] Gobierno aprueba: RikuyCore.resolveReport(reportId, true, rewardAmount)
         ↓
[2] Smart contract:
    • Marca isResolved = true
    • Treasury.releaseReward()
         ↓
[3] Treasury transfiere USX:
    • 70% → Reporter wallet
    • 30% → Validators (distribuido)
         ↓
[4] Usuario reclama: RikuyCore.claimReward(reportId)
         ↓
[5] Recibe USX en wallet
    • Puede: gastar (ether.fi Cash), stake (10-15% APY), transferir
```

---

## 🔍 QUERIES Y ANALYTICS

### Queries Principales (Backend API)

```typescript
// 1. Reportes cercanos (geoespacial)
GET /api/reports/nearby?lat=-16.5&long=-68.1&radius=500

// 2. Reportes por categoría
GET /api/reports?category=1&verified=true

// 3. Reporte específico
GET /api/reports/:reportId

// 4. Analytics (solo gobiernos - API key)
GET /api/analytics/heatmap?city=El%20Alto&days=30

// 5. Tendencias de crimen
GET /api/analytics/trends?category=1&timeRange=7d
```

### Queries Blockchain (RPC)

```typescript
// 1. Obtener reporte
const report = await reportRegistry.getReport(reportId);

// 2. Contar validaciones
const upvotes = await rikuyCore.reportUpvotes(reportId);
const downvotes = await rikuyCore.reportDownvotes(reportId);

// 3. Ver recompensa
const reward = await treasury.rewards(reportId);

// 4. Eventos históricos
const events = await rikuyCore.queryFilter(
  rikuyCore.filters.ReportCreated(null, null, null)
);
```

### Queries Arkiv (SDK)

```typescript
// 1. Reportes por ciudad
const reports = await arkivService.buildQuery({
  attributes: [{ key: 'city', value: 'El Alto' }],
  limit: 50
});

// 2. Reportes de droga verificados
const drugReports = await arkivService.buildQuery({
  attributes: [
    { key: 'category', value: '1' },
    { key: 'verified', value: 'true' }
  ],
  orderBy: 'timestamp DESC'
});

// 3. Reportes recientes (últimos 7 días)
const recent = await arkivService.getRecentReports(7);

// 4. Hotspots (geoespacial)
const nearby = await arkivService.getNearbyReports(
  -16.5, -68.1, 1000  // lat, long, radius (m)
);
```

---

## 📈 ANALYTICS Y AGREGACIONES

### Métricas del Sistema

```typescript
// Dashboard Gobierno
interface SystemMetrics {
  totalReports: number;              // 234
  reportsByCategory: {
    infrastructure: number;          // 45
    drugTrafficking: number;         // 178
    corruption: number;              // 11
  };
  verifiedReports: number;           // 207 (89%)
  resolvedReports: number;           // 156 (67%)
  totalRewardsDistributed: number;   // 31,200 USX
  activeValidators: number;          // 1,234
  avgValidationTime: number;         // 6 hours
  avgResolutionTime: number;         // 48 hours
}

// Heatmap Data
interface HeatmapPoint {
  lat: number;
  long: number;
  weight: number;                    // # reportes
  severity: number;                  // avg severity
  category: number;
}

// Temporal Trends
interface Trend {
  date: string;                      // "2024-11-15"
  count: number;
  category: number;
  avgSeverity: number;
}
```

---

## 🔐 SEGURIDAD Y PRIVACIDAD

### Datos Sensibles (NUNCA almacenados)

```typescript
// ❌ NUNCA GUARDAMOS:
interface SensitiveData {
  exactLocation: { lat, long };     // Solo ±200m
  userId: string;                    // Solo nullifier ZK
  ipAddress: string;                 // No logging
  deviceInfo: string;                // Stripped de EXIF
  phoneNumber: string;               // N/A
  email: string;                     // Solo en Privy (off-chain)
}
```

### Datos Anonimizados

```typescript
// ✅ SÍ GUARDAMOS:
interface AnonymizedData {
  nullifier: string;                 // ZK hash único
  approximateLocation: {
    lat: number,                     // ±200m fuzzing
    long: number,
    radius: 200
  };
  zkProofHash: string;               // Verificable pero anónimo
  reporterWallet: string;            // Wallet anónimo (puede ser nuevo)
}
```

---

## 📏 LÍMITES Y CONSTRAINTS

### Smart Contracts

```solidity
// RikuyCore
uint8 public constant VERIFICATION_THRESHOLD = 5;
uint8 public constant MAX_CATEGORIES = 3;

// Treasury
uint256 public constant MIN_REWARD = 50 * 10**18;   // 50 USX
uint256 public constant MAX_REWARD = 500 * 10**18;  // 500 USX

// ReportRegistry
uint256 public constant MAX_DESCRIPTION_LENGTH = 1000;
```

### Backend

```typescript
// Rate Limiting
const RATE_LIMITS = {
  globalRequestsPerMin: 5,
  reportsPerDay: 5,
  reportsPerHour: 2,
  validationsPerDay: 50
};

// File Upload
const FILE_LIMITS = {
  maxSize: 10 * 1024 * 1024,        // 10MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  maxDimensions: { width: 4096, height: 4096 }
};

// Geofencing
const GEO_LIMITS = {
  countries: ['AR', 'BO', 'PE', 'CO', 'CL'],
  minRadius: 100,                    // meters
  maxRadius: 1000
};
```

### Arkiv

```typescript
// Storage
const ARKIV_LIMITS = {
  maxPayloadSize: 5 * 1024 * 1024,   // 5MB
  expirationYears: 10,
  maxAttributes: 15
};
```

---

## 🔄 CICLO DE VIDA DE UN REPORTE

```
┌────────────────────────────────────────────────────┐
│  Estado: PENDING                                   │
│  • Recién creado                                   │
│  • Esperando validaciones                          │
│  • Upvotes: 0, Downvotes: 0                       │
│  • Blockchain: ✅                                  │
│  • Arkiv: ✅                                       │
│  • IPFS: ✅                                        │
└───────────────────┬────────────────────────────────┘
                    │
                    │ (5+ upvotes)
                    ↓
┌────────────────────────────────────────────────────┐
│  Estado: VERIFIED                                  │
│  • Comunidad confirmó (≥5 votos)                  │
│  • Upvotes: 6, Downvotes: 1                       │
│  • Alerta enviada a gobierno                       │
│  • Esperando resolución oficial                    │
└───────────────────┬────────────────────────────────┘
                    │
                    │ (Gobierno aprueba/rechaza)
                    ↓
┌────────────────────────────────────────────────────┐
│  Estado: RESOLVED                                  │
│  • Gobierno aprobó: ✅                            │
│  • Recompensa: 200 USX                            │
│  • Claimed: false                                  │
│  • Esperando claim del reporter                    │
└───────────────────┬────────────────────────────────┘
                    │
                    │ (Reporter reclama)
                    ↓
┌────────────────────────────────────────────────────┐
│  Estado: COMPLETED                                 │
│  • Recompensa reclamada: ✅                       │
│  • Reporter recibió: 140 USX                      │
│  • Validators recibieron: 60 USX total            │
│  • Caso cerrado                                    │
└────────────────────────────────────────────────────┘
```

---

## 📦 BACKUP Y RECUPERACIÓN

### Estrategia de Backups

```
[1] BLOCKCHAIN (Scroll)
    • Inmutable por naturaleza
    • No requiere backup
    • Nodos públicos mantienen datos

[2] ARKIV
    • Replicación automática en red
    • Expiración: 10 años
    • No requiere backup manual

[3] IPFS (Pinata)
    • Pinning garantizado por Pinata
    • Backup automático en CDN
    • CID permanente

[4] BACKEND CACHE (Redis)
    • Volátil (solo cache)
    • No crítico para recuperación
    • Se regenera desde blockchain/arkiv
```

### Recuperación de Datos

```typescript
// Si backend se pierde, recuperar desde:

// 1. Blockchain → IDs de reportes
const reportIds = await getReportIdsFromEvents();

// 2. Arkiv → Metadata completa
const metadata = await arkiv.query({
  where: eq('reportId', reportId)
});

// 3. IPFS → Imágenes
const imageUrl = `https://gateway.pinata.cloud/ipfs/${metadata.ipfsHash}`;

// 4. Reconstruir cache
await rebuildCache(reportIds, metadata);
```

---

## 📊 RESUMEN EJECUTIVO

### Comparativa de Storage

| Aspecto | Blockchain | Arkiv | IPFS |
|---------|-----------|-------|------|
| **Datos** | IDs, estado, recompensas | Metadata completa | Imágenes |
| **Tamaño** | Minimal (bytes32, uint) | Medio (JSON, 5MB) | Grande (imágenes) |
| **Costo** | Alto (gas) | Medio | Bajo |
| **Query** | Por ID, eventos | Attributes, full-text | Por CID |
| **Velocidad** | RPC (~1s) | SDK (~500ms) | Gateway (~200ms) |
| **Inmutabilidad** | ✅ Total | ✅ Total | ✅ Total |
| **Privacidad** | ⚠️ Público | ⚠️ Público | ⚠️ Público |
| **Retención** | ♾️ Permanente | 10 años | ♾️ Permanente |

### Total de Datos (estimado)

```
Por Reporte:
├── Blockchain: ~500 bytes
├── Arkiv: ~5 KB (metadata JSON)
├── IPFS: ~250 KB (imagen comprimida)
└── Total: ~255 KB por reporte

1,000 reportes = ~255 MB
10,000 reportes = ~2.5 GB
100,000 reportes = ~25 GB
```

---

## 🎯 CONCLUSIÓN

El modelo de datos de RIKUY está diseñado para:

✅ **Inmutabilidad**: Una vez subido, nadie puede borrar
✅ **Privacidad**: ZK proofs + anonimización + fuzzing geográfico
✅ **Escalabilidad**: Hybrid storage (barato + rápido)
✅ **Queryable**: Arkiv attributes permiten búsquedas complejas
✅ **Verificable**: Todo en blockchain es auditable
✅ **Permanente**: 10 años mínimo, blockchain para siempre

**La arquitectura híbrida permite lo mejor de ambos mundos**:
- Seguridad y verificación de blockchain
- Capacidad de storage y queries de sistemas descentralizados
- Performance y UX de sistemas tradicionales

---

**Documento generado**: 2025-11-20
**Versión**: 1.0
**Autor**: RIKUY Team
**Contacto**: contact@rikuy.io
