# 📚 RIKUY - Especificación Técnica Completa

> Documentación exhaustiva del sistema. Una IA puede leer esto y entender completamente el proyecto sin ver una línea de código.

---

## 🎯 RESUMEN EJECUTIVO

RIKUY es una plataforma descentralizada que permite a ciudadanos reportar problemas urbanos (baches, drogas, basura) de forma ANÓNIMA, con evidencia INMUTABLE, y recibiendo RECOMPENSAS económicas cuando sus reportes son verificados.

**Problema que resuelve**: Los ciudadanos temen represalias al denunciar problemas, y no confían en que sus reportes serán tomados en serio o que la evidencia no será manipulada.

**Solución**: Blockchain (Scroll) garantiza lógica inmutable + Arkiv garantiza data inmutable + ZK-proofs garantizan anonimato + Incentivos económicos garantizan participación.

---

## 🏗️ ARQUITECTURA DE ALTO NIVEL

El sistema tiene 3 capas independientes pero interconectadas:

```
┌─────────────────────────────────────────────────────────────┐
│ CAPA 1: SMART CONTRACTS (Scroll - Lógica & Settlement)     │
│ - RikuyCore: Orquestador principal                         │
│ - ReportRegistry: Storage optimizado                       │
│ - Treasury: Manejo de fondos y pagos                       │
│ - ZKVerifier: Verificación de privacidad                   │
│ - GovernmentRegistry: Whitelist de gobiernos               │
└─────────────────────────────────────────────────────────────┘
                           ↕️
┌─────────────────────────────────────────────────────────────┐
│ CAPA 2: BACKEND API (Node.js - Orquestación)               │
│ - ReportService: Flujo end-to-end                          │
│ - ArkivService: Integración con data layer                 │
│ - IPFSService: Upload de imágenes                          │
│ - AIService: Análisis automático de fotos                  │
│ - ScrollService: Interacción con blockchain                │
└─────────────────────────────────────────────────────────────┘
                           ↕️
┌─────────────────────────────────────────────────────────────┐
│ CAPA 3: DATA STORAGE (Distributed)                         │
│ - Arkiv: Metadata + evidencia (inmutable, queryable)       │
│ - IPFS: Imágenes (descentralizado)                         │
│ - Scroll: Transacciones y estado (blockchain)              │
└─────────────────────────────────────────────────────────────┘
```

**Principio fundamental**:
- Scroll guarda LÓGICA (quién reportó, quién validó, estado, pagos)
- Arkiv guarda DATA (fotos, descripciones, metadata completa)
- IPFS guarda ARCHIVOS (imágenes optimizadas)

---

# 🔷 PARTE 1: SMART CONTRACTS (Scroll Blockchain)

## 1.1 - RikuyCore.sol (El Cerebro)

### ¿Qué es?
El contrato principal que ORQUESTA todo el sistema. Es el punto de entrada para todas las operaciones críticas.

### ¿Por qué existe?
Necesitamos un único contrato "maestro" que coordine todos los demás módulos y sea el único que los usuarios/frontend llamen directamente. Esto simplifica la arquitectura y reduce superficie de ataque.

### ¿Qué hace específicamente?

#### Función: `createReport()`
**Propósito**: Registrar un nuevo reporte en blockchain

**Input que recibe**:
- `arkivTxId` (bytes32): El hash de la transacción de Arkiv donde se guardó la evidencia completa
- `categoryId` (uint16): 0=Infraestructura, 1=Inseguridad, 2=Basura
- `zkProof` (uint256[8]): Array de 8 números que forman el proof Groth16 de privacidad

**Qué hace internamente**:
1. Verifica el ZK proof llamando a `ZKVerifier.verifyProof()`
   - Esto garantiza que el usuario demostró estar cerca del problema sin revelar su ubicación exacta
   - Verifica que el nullifier (identificador anónimo) no fue usado antes
2. Genera un `reportId` único hasheando (nullifier + timestamp + arkivTxId)
3. Llama a `ReportRegistry.storeReport()` para guardar metadata mínima on-chain
4. Emite evento `ReportCreated` con todos los datos relevantes
5. Retorna el `reportId` al caller

**Por qué esta función es crítica**:
- Es el único punto de entrada para crear reportes
- Valida privacidad ANTES de aceptar el reporte
- Conecta la evidencia de Arkiv con el estado on-chain

---

#### Función: `validateReport()`
**Propósito**: Permitir que vecinos voten si un reporte es real o falso

**Input que recibe**:
- `reportId` (bytes32): ID del reporte a validar
- `isValid` (bool): true=es real, false=es falso

**Qué hace internamente**:
1. Verifica que el reporte exista llamando a `ReportRegistry.getReport()`
2. Verifica que el usuario NO haya validado este reporte antes
3. Registra la validación en `ReportRegistry.recordValidation()`
4. Si `isValid=true`: incrementa contador de upvotes
5. Si `isValid=false`: incrementa contador de downvotes
6. Verifica si alcanzó THRESHOLD (5 validaciones positivas)
7. Si alcanzó threshold: marca el reporte como "Verified"
8. Emite evento `ReportValidated`

**Por qué esta función es crítica**:
- Implementa el mecanismo de "consensus comunitario"
- Previene que un solo actor malicioso valide todos los reportes
- Auto-verifica reportes cuando hay suficiente consenso

---

#### Función: `resolveReport()`
**Propósito**: Permitir que el gobierno apruebe un reporte y libere fondos

**Input que recibe**:
- `reportId` (bytes32): ID del reporte
- `approved` (bool): true=aprobar y pagar, false=rechazar

**Restricción**: Solo cuentas con rol `GOVERNMENT_ROLE` pueden llamar esta función

**Qué hace internamente**:
1. Verifica que el reporte esté verificado (upvotes >= 5)
2. Verifica que el reporte NO esté resuelto ya
3. Marca el reporte como resuelto en `ReportRegistry`
4. Si `approved=true`:
   - Obtiene la lista de validadores del reporte
   - Calcula recompensas: 70% reporter, 30% validadores
   - Llama a `Treasury.releaseRewards()` para liberar fondos
5. Emite evento `ReportResolved`

**Por qué esta función es crítica**:
- Es el único punto donde se liberan fondos
- Requiere autenticación gubernamental
- Conecta verificación comunitaria con aprobación oficial

---

### Roles y Permisos en RikuyCore:

**DEFAULT_ADMIN_ROLE**:
- Puede actualizar el contrato (UUPS upgradeable)
- Puede cambiar direcciones de otros contratos
- Puede otorgar/revocar roles

**GOVERNMENT_ROLE**:
- Puede llamar `resolveReport()`
- Puede aprobar pagos
- Asignado a cuentas de gobiernos municipales registrados

**OPERATOR_ROLE**:
- Puede actualizar configuraciones menores
- Puede pausar operaciones en emergencias

**PUBLIC (cualquiera)**:
- Puede llamar `createReport()`
- Puede llamar `validateReport()`
- Puede leer estado con `getReportStatus()`

---

## 1.2 - ReportRegistry.sol (La Memoria)

### ¿Qué es?
Un contrato de "eternal storage" que guarda ÚNICAMENTE la metadata CRÍTICA de reportes. Está separado de la lógica para permitir upgrades sin perder data.

### ¿Por qué existe?
Si guardáramos todo en RikuyCore y necesitamos actualizar lógica, perderíamos los datos. Con este patrón, la data persiste eternamente incluso si RikuyCore cambia.

### ¿Qué datos guarda?

**Struct Report** (optimizado para gas):
```
- arkivTxId (bytes32): Puntero a la data completa en Arkiv
- nullifierHash (bytes32): Identificador anónimo del reporter
- timestamp (uint32): Cuándo se creó (comprimido a 4 bytes)
- categoryId (uint16): Categoría del reporte (2 bytes)
- validationScore (uint8): Cuántas validaciones positivas tiene (1 byte)
- isResolved (bool): Si fue resuelto por gobierno (1 byte)
```

**TOTAL**: 72 bytes (3 slots de 32 bytes)

**Por qué este tamaño importa**:
En Ethereum/Scroll, cada slot cuesta gas. Al comprimir el struct de 256+ bytes a 72 bytes, ahorramos ~60% de gas en cada operación.

### Funciones principales:

#### `storeReport()`
**Propósito**: Guardar nuevo reporte (solo llamable por RikuyCore)

**Validaciones**:
- Verifica que el nullifier NO fue usado antes (previene duplicados)
- Verifica que la categoría sea válida (0-2)

**Qué guarda**:
- Crea el struct Report con todos los datos
- Marca el nullifier como usado
- Añade el reportId al array de IDs (para iteración)

**Por qué está separado de RikuyCore**:
Permite que la lógica de validación cambie sin migrar datos.

---

#### `recordValidation()`
**Propósito**: Registrar que un usuario validó un reporte

**Qué hace**:
- Verifica que el usuario NO validó este reporte antes
- Marca en mapping `hasValidated[reportId][user] = true`

**Por qué es importante**:
Previene que un usuario vote múltiples veces en el mismo reporte (anti-sybil básico).

---

#### `incrementValidationScore()`
**Propósito**: Incrementar el contador de validaciones positivas

**Restricción**: Solo RikuyCore puede llamarlo

**Qué hace**:
- Incrementa `report.validationScore` en 1
- Máximo 255 (por ser uint8)

---

#### `markAsResolved()`
**Propósito**: Marcar reporte como resuelto por gobierno

**Restricción**: Solo RikuyCore puede llamarlo

**Qué hace**:
- Setea `report.isResolved = true`
- No puede revertirse (inmutable)

---

### ¿Por qué NO guardamos la descripción/foto aquí?

Porque sería EXTREMADAMENTE caro en gas. Una descripción de 200 caracteres costaría ~$50-100 en gas fees en L1. En su lugar:
- Guardamos solo el `arkivTxId` (32 bytes)
- El frontend/backend consulta Arkiv con ese ID para obtener la data completa

**Ventaja**: Gas fees reducidos en 95%
**Tradeoff**: Necesitamos un servicio externo (Arkiv) para reconstruir la data completa

---

## 1.3 - Treasury.sol (El Banco)

### ¿Qué es?
El contrato que maneja los FONDOS del sistema y ejecuta PAGOS a reporters y validadores.

### ¿Por qué existe?
Necesitamos un lugar centralizado y auditable donde:
1. Los gobiernos depositen fondos
2. Se calculen recompensas
3. Se ejecuten pagos automáticamente
4. Se prevenga robo/malversación

### ¿Cómo funciona el flujo de dinero?

```
Gobierno deposita 10 ETH
     ↓
Treasury Pool: 10 ETH
     ↓
Reporte verificado → releaseRewards()
     ↓
┌─────────────────┐
│ 70% al reporter │ → 0.7 ETH a Ana
│ 30% validadores │ → 0.06 ETH a cada uno (5 validadores)
└─────────────────┘
```

### Funciones principales:

#### `depositFunds()`
**Propósito**: Gobierno deposita fondos al pool

**Quién puede llamarlo**: Solo cuentas con rol `GOVERNMENT_ROLE`

**Qué hace**:
- Recibe ETH vía `msg.value`
- Incrementa contador `totalDeposited`
- Emite evento `FundsDeposited`

**Por qué es payable**:
Permite que los gobiernos envíen ETH directamente al contrato.

---

#### `releaseRewards()`
**Propósito**: Liberar recompensas para un reporte verificado

**Quién puede llamarlo**: Solo RikuyCore (rol `OPERATOR_ROLE`)

**Input**:
- `reportId` (bytes32): ID del reporte
- `category` (uint8): Categoría (determina el monto)
- `reporter` (address): Dirección del reporter
- `validators` (address[]): Array de validadores

**Qué hace paso a paso**:
1. Verifica que este reportId NO fue pagado antes
2. Obtiene el monto total según categoría:
   - Infraestructura: 0.01 ETH (~$25)
   - Inseguridad: 0.02 ETH (~$50)
   - Basura: 0.005 ETH (~$12)
3. Calcula distribución:
   - Reporter: 70% del total
   - Validadores: 30% dividido equitativamente
4. Ejecuta transfers:
   - Envía ETH al reporter
   - Envía ETH a cada validador
5. Marca reportId como pagado
6. Incrementa contador `totalPaid`
7. Emite evento `RewardReleased`

**Validaciones críticas**:
- `require(!rewardsPaid[reportId])` - Previene doble pago
- `require(balance >= totalReward)` - Previene pagar sin fondos
- `require(success)` - Verifica que cada transfer funcionó

**Por qué esta función es sensible**:
- Mueve fondos reales
- No puede revertirse una vez pagado
- Debe prevenir ataques de re-entrancy (aunque usa checks-effects-interactions pattern)

---

#### `setCategoryReward()`
**Propósito**: Ajustar recompensas por categoría

**Quién**: Solo admin

**Por qué existe**:
Permite ajustar recompensas sin redesplegar contratos. Ejemplo:
- Si hay muchos reportes de basura, puede reducir recompensa de 0.005 a 0.003 ETH
- Si nadie reporta inseguridad, puede subir de 0.02 a 0.05 ETH

---

#### `emergencyWithdraw()`
**Propósito**: Extraer fondos en caso de emergencia

**Quién**: Solo admin

**Por qué existe**:
Si hay un bug crítico o hack, el admin puede rescatar los fondos antes de que sean robados.

**Restricción**: Solo debe usarse en emergencias reales, es auditado públicamente.

---

### Configuración de porcentajes:

**Variables**:
- `reporterRewardPercentage` = 70
- `validatorRewardPercentage` = 30

**Por qué 70/30**:
- El reporter tomó el riesgo de reportar (potenciales represalias)
- Los validadores solo confirman (menor riesgo)
- 70/30 incentiviza reportar más que solo validar

**Puede ajustarse**: `setRewardPercentages(80, 20)` si se necesita más incentivo a reporters

---

## 1.4 - MockZKVerifier.sol (La Privacidad)

### ¿Qué es?
Un contrato que SIMULA verificación de ZK proofs. En producción, será reemplazado por un verifier real generado por Circom.

### ¿Por qué existe un MOCK?
Porque implementar ZK proofs reales requiere:
1. Escribir circuits en Circom (~2-3 días)
2. Hacer trusted setup (~1 día)
3. Generar verifier.sol (~2 horas)
4. Integrar prover en backend (~4 horas)

Para el MVP de la hackathon, usamos un mock que SIEMPRE retorna `true` pero mantiene la interfaz correcta.

### ¿Qué debería hacer el verifier REAL?

**Input del proof (formato Groth16)**:
```
pA: [uint256, uint256]           // Punto A del proof
pB: [[uint256, uint256], [uint256, uint256]]  // Punto B
pC: [uint256, uint256]           // Punto C
publicSignals: [uint256, uint256, uint256, uint256]  // Señales públicas
```

**¿Qué representan las public signals?**
1. `publicSignals[0]` = nullifier (hash del secret del usuario)
2. `publicSignals[1]` = merkleRoot (opcional, para membership proofs)
3. `publicSignals[2]` = categoryHash (hash de la categoría)
4. `publicSignals[3]` = proximityHash (hash de ubicación aproximada)

**Qué verificaría el proof**:
1. El usuario CONOCE un secret que hashea a ese nullifier
2. El usuario ESTUVO dentro de 500m del punto reportado
3. El usuario NO reveló su ubicación exacta
4. El nullifier NO fue usado antes

**Cómo lo verifica**:
Usa matemática de "pairing" en curvas elípticas (BN254) para validar que:
```
e(pA, pB) == e(pC, delta) * e(alpha, beta) * ...
```
Si la ecuación es verdadera, el proof es válido.

---

### En el mock actual:

#### `verifyProof()`
**Qué hace**: Siempre retorna `true`

**Validaciones que SÍ hace**:
- Verifica que el nullifier NO fue usado antes

**Qué falta**:
- Verificación criptográfica real del proof
- Validación de las public signals

**Por qué está OK para el MVP**:
- Permite testear el flujo completo
- Frontend/backend pueden enviar proofs dummy
- La interfaz ya está correcta para cuando se implemente el real

---

### ¿Cómo se reemplazará?

1. Circom genera `verifier.sol` automáticamente
2. Se deploya el nuevo verifier
3. RikuyCore llama al nuevo contrato
4. Los proofs ahora son reales

**NO se pierde data**: Los reportes antiguos siguen válidos, solo los nuevos usan verificación real.

---

## 1.5 - GovernmentRegistry.sol (La Whitelist)

### ¿Qué es?
Un registro de gobiernos AUTORIZADOS a aprobar reportes y depositar fondos.

### ¿Por qué existe?
Sin esto, CUALQUIERA podría aprobar reportes y robar fondos. Necesitamos:
1. Verificar que solo gobiernos legítimos puedan aprobar
2. Poder revocar acceso si un gobierno se compromete
3. Auditabilidad de quién aprobó qué

### ¿Qué datos guarda de cada gobierno?

**Struct Government**:
```
- name: "Municipalidad de Buenos Aires"
- jurisdiction: "CABA"
- wallet: 0xabc... (su address)
- isActive: true/false
- registeredAt: timestamp
```

### Funciones principales:

#### `registerGovernment()`
**Propósito**: Agregar nuevo gobierno

**Input**:
- `govAddress`: Address de la wallet del gobierno
- `name`: Nombre oficial
- `jurisdiction`: Zona que administra

**Quién puede llamarlo**: Solo el owner (admin principal)

**Qué hace**:
- Verifica que la address NO esté registrada
- Crea el struct Government
- Lo marca como activo
- Añade a la lista de gobiernos
- Emite evento `GovernmentRegistered`

**Por qué es importante**:
Solo gobiernos registrados pueden llamar funciones sensibles.

---

#### `deactivateGovernment()`
**Propósito**: Revocar acceso a un gobierno

**Casos de uso**:
- La cuenta fue hackeada
- El gobierno ya no es legítimo
- Cambio de administración

**Qué hace**:
- Setea `isActive = false`
- NO elimina el registro (mantiene historia)
- Emite evento `GovernmentDeactivated`

---

#### `isActiveGovernment()`
**Propósito**: Verificar si una address es gobierno activo

**Quién lo llama**: RikuyCore antes de permitir `resolveReport()`

**Retorna**: `true` si la address está registrada Y activa

---

### Integración con otros contratos:

**RikuyCore**:
```
modifier onlyActiveGovernment() {
    require(
        governmentRegistry.isActiveGovernment(msg.sender),
        "Not authorized government"
    );
    _;
}
```

**Treasury**:
```
Solo direcciones con GOVERNMENT_ROLE (otorgado a gobiernos registrados)
pueden depositar fondos.
```

---

# 🔶 PARTE 2: BACKEND API (Node.js + TypeScript)

El backend actúa como "pegamento" entre el usuario y blockchain/storage. Orquesta TODO el flujo.

---

## 2.1 - ReportService (El Director de Orquesta)

### ¿Qué es?
El servicio PRINCIPAL que coordina la creación de reportes end-to-end.

### ¿Por qué existe?
Crear un reporte requiere interactuar con 4 sistemas diferentes:
1. IPFS (subir foto)
2. OpenAI (analizar foto)
3. Arkiv (guardar metadata)
4. Scroll (registrar en blockchain)

Si el frontend hiciera esto, sería complejísimo. ReportService lo hace TODO automáticamente.

---

### Función: `createReport()`

**Input que recibe**:
```
{
  photo: File (imagen del problema),
  category: 0 | 1 | 2,
  description: "..." (opcional),
  location: { lat, long, accuracy },
  userSecret: "..." (opcional, para ZK)
}
```

**Output que retorna**:
```
{
  success: true,
  reportId: "0xabc...",
  arkivTxId: "0xdef...",
  scrollTxHash: "0x123...",
  estimatedReward: "$5000",
  message: "Reporte creado exitosamente..."
}
```

### ¿Qué hace paso a paso? (THE MAGIC)

**PASO 1: Validar ubicación**
- Verifica que lat/long estén dentro de Argentina
- Bounds: lat [-55, -21], long [-73.5, -53]
- Si está fuera: `throw Error("Ubicación fuera de Argentina")`

**Por qué**: Solo funciona en Argentina para esta hackathon.

---

**PASO 2: Subir foto a IPFS**
- Llama a `IPFSService.uploadImage(photo)`
- Internamente:
  1. Limpia EXIF (privacidad)
  2. Optimiza imagen (quality 85%)
  3. Calcula hash SHA256 del archivo
  4. Sube a Pinata
  5. Retorna: `{ ipfsHash, url, fileHash }`

- Verifica si el `fileHash` ya existe (duplicate detection)
- Si existe: `throw Error("Esta foto ya fue reportada")`

**Por qué**: Previene que alguien reporte la misma foto 10 veces para ganar $50,000.

---

**PASO 3: IA analiza la imagen**
- Llama a `AIService.analyzeImage(imageUrl, category)`
- Internamente:
  1. Envía imagen a GPT-4 Vision
  2. Prompt: "Analiza esta imagen de [categoría]. Genera descripción + tags + severidad"
  3. Recibe JSON: `{ description, tags, severity }`
  4. Si falla: usa fallback genérico

- También llama a `AIService.moderateImage()` para content moderation
- Si detecta contenido inapropiado: `throw Error("Imagen no apropiada")`

**Por qué**:
- Usuarios pueden NO escribir descripción → IA la genera
- Content moderation previene fotos inapropiadas

---

**PASO 4: Generar ID del reporte**
- Combina: `fileHash + location + timestamp`
- Hashea con SHA256
- Resultado: ID único e irrepetible

**Por qué**:
- Dos fotos idénticas en el mismo lugar → mismo hash → detecta duplicado
- Foto idéntica en otro lugar → hash diferente → permite reporte

---

**PASO 5: Crear documento para Arkiv**
- Arma el JSON completo:
```json
{
  "protocol": "rikuy-v1",
  "timestamp": 1731945600,
  "reportId": "0xabc...",
  "category": {
    "id": 1,
    "name": "Inseguridad"
  },
  "evidence": {
    "imageIPFS": "Qm...",
    "imageHash": "sha256:...",
    "description": "Venta de drogas...",
    "aiGenerated": false,
    "aiTags": ["drogas", "peligro"]
  },
  "location": {
    "approximate": {
      "lat": -34.60,  // Redondeado a 2 decimales
      "long": -58.38,
      "precision": "~100m"
    },
    "zkProof": {
      "nullifier": "0xdef...",
      "verified": true
    }
  },
  "metadata": {
    "deviceHash": "abc123",
    "timestamp": 1731945600
  }
}
```

- Llama a `ArkivService.storeReport(arkivData)`
- Retorna: `arkivTxId` (hash de la transacción en Arkiv)

**Por qué este JSON**:
- `protocol: "rikuy-v1"` → identifica que es de RIKUY (puede haber otros protocolos)
- `approximate location` → privacidad (±100m de precisión)
- `aiGenerated` → transparencia (usuario sabe si IA escribió la descripción)
- `deviceHash` → anti-spam (detecta si mismo device hace muchos reportes)

---

**PASO 6: Registrar en blockchain (Scroll)**
- Genera ZK proof dummy: `[0, 0, 0, 0, 0, 0, 0, 0]`
  - TODO: En producción, aquí llamaría al ZK prover real

- Llama a `ScrollService.createReport(arkivTxId, category, zkProof)`
- Internamente:
  1. Convierte arkivTxId a bytes32
  2. Estima gas
  3. Envía transacción a RikuyCore
  4. Espera confirmación
  5. Extrae `reportId` del evento
  6. Retorna `{ txHash, reportId }`

**Por qué esperar confirmación**:
- Garantiza que la transacción fue exitosa
- Si falla, podemos reintentar o reportar error al usuario

---

**PASO 7: Calcular recompensa estimada**
- Base rewards:
  - Infraestructura: $3000
  - Inseguridad: $5000
  - Basura: $2000

- Multiplier basado en severidad (1-10):
  - Si severidad = 5: 75% del base
  - Si severidad = 10: 100% del base

- Fórmula: `baseReward * (0.5 + (severity/10) * 0.5)`

**Por qué esto**:
- Incentiva reportar problemas más severos
- Da expectativa realista al usuario

---

**PASO 8: Retornar resultado**
- Retorna JSON con todos los IDs y hashes
- Usuario ve: "✅ Reporte creado! Recibirás $5000 cuando sea verificado"

### ¿Qué pasa si algo falla?

**Error en IPFS**:
- Se captura el error
- Se retorna: `throw Error("Failed to upload image")`
- Usuario ve: "Error subiendo imagen, intenta de nuevo"

**Error en IA**:
- Usa descripción fallback
- Continúa el flujo
- No bloquea el reporte

**Error en Arkiv**:
- Se captura el error
- Se retorna: `throw Error("Failed to store in Arkiv")`
- Importante: NO se ejecuta el paso de Scroll

**Error en Scroll**:
- Se captura el error
- Se retorna: `throw Error("Blockchain transaction failed")`
- Problema: Ya se subió a IPFS y Arkiv (data huérfana)
- TODO: Implementar rollback o retry logic

---

## 2.2 - ArkivService (El Historiador)

### ¿Qué es?
Servicio que interactúa con Arkiv (el data layer inmutable).

### ¿Por qué existe?
Arkiv tiene su propia SDK y API. Este servicio encapsula toda esa complejidad.

### Componentes:

**PublicClient**:
- Para LEER datos (queries)
- No requiere firma
- Ejemplo: buscar reportes cercanos

**WalletClient**:
- Para ESCRIBIR datos
- Requiere firma con private key
- Ejemplo: guardar nuevo reporte

---

### Función: `storeReport()`

**Input**: `ArkivReportData` (el JSON completo del reporte)

**Qué hace**:
1. Arma el payload para Arkiv:
```
{
  entity: 'Report',
  key: reportId,
  data: { todo el JSON },
  attributes: {
    category: 1,
    timestamp: 1731945600,
    lat: -34.60,
    long: -58.38
  }
}
```

2. Firma la transacción con el walletClient
3. Escribe a Arkiv (similar a escribir en un smart contract)
4. Retorna el transaction hash

**Por qué los attributes**:
- Permiten INDEXAR por categoria, timestamp, ubicación
- Necesarios para queries rápidos (ej: "reportes de drogas en los últimos 7 días")

---

### Función: `getReport()`

**Input**: `reportId`

**Qué hace**:
1. Hace query al publicClient:
```
query('Report').key(reportId).includePayload()
```

2. Arkiv retorna el JSON completo
3. Parsea y retorna como `ArkivReportData`

**Si no existe**: Retorna `null`

---

### Función: `getNearbyReports()`

**Input**: `{ lat, long, radiusKm }`

**Qué hace**:
1. Calcula bounding box:
   - latMin = lat - (radiusKm / 111)
   - latMax = lat + (radiusKm / 111)
   - Similar para long

2. Hace query a Arkiv:
```
query('Report')
  .where('lat', '>=', latMin)
  .where('lat', '<=', latMax)
  .where('long', '>=', longMin)
  .where('long', '<=', longMax)
  .limit(50)
```

3. Arkiv retorna array de reportes
4. (Opcional) Filtra por distancia exacta usando Haversine formula

**Por qué es rápido**:
- Arkiv indexa los attributes
- Query tarda <100ms incluso con miles de reportes

---

### ¿Cómo Arkiv garantiza inmutabilidad?

1. **Blockchain-backed**: Cada write genera un hash que va a la blockchain de Arkiv
2. **Merkle proofs**: Puedes probar que un dato existió en cierto momento
3. **Append-only**: No se puede modificar data antigua, solo agregar nueva

**Ventaja vs guardar todo en Scroll**:
- Scroll: $10-50 por reporte (guardando todo)
- Arkiv: $0.01 por reporte (solo el pointer va a Scroll)

---

## 2.3 - IPFSService (El Archivero de Fotos)

### ¿Qué es?
Servicio que sube imágenes a IPFS usando Pinata como gateway.

### ¿Por qué IPFS?
- Descentralizado (no depende de un servidor)
- Content-addressed (el hash ES la foto)
- Inmutable (no se puede modificar sin cambiar el hash)
- Permanente (mientras alguien lo "pinee")

### ¿Por qué Pinata?
- Gestiona el "pinning" automáticamente
- Garantiza que las fotos nunca se pierdan
- Tiene CDN global (fotos se cargan rápido)

---

### Función: `uploadImage()`

**Input**: `File` (buffer de la imagen)

**Proceso step-by-step**:

**1. Limpiar EXIF**
```
Foto original:
- Tamaño: 3MB
- EXIF: GPS, cámara, hora exacta, etc.

Foto procesada:
- Tamaño: 800KB (optimizada)
- EXIF: VACÍO (privacidad)
```

**Por qué**:
- EXIF puede contener ubicación EXACTA (queremos aproximada)
- EXIF puede identificar el dispositivo

**Cómo se hace**:
- Usa librería `sharp`
- `.withMetadata({ exif: {} })` → borra EXIF
- `.jpeg({ quality: 85 })` → optimiza tamaño

---

**2. Calcular hash**
```
SHA256(imagen) = "abc123..."
```

**Por qué**:
- Detectar duplicados
- Verificar integridad

---

**3. Subir a IPFS via Pinata**
```
pinata.upload.file(imagen)
  .addMetadata({
    name: "rikuy-evidence-1731945600",
    keyvalues: {
      fileHash: "abc123...",
      uploadedAt: "1731945600"
    }
  })
```

**Retorna**:
- `ipfsHash`: "QmXyz..." (el CID de IPFS)
- `url`: "https://gateway.pinata.cloud/ipfs/QmXyz..."

---

**4. Verificar**
- Hace request a la URL
- Si retorna 200: éxito
- Si retorna 404: reintentar

---

### Función: `checkDuplicate()`

**Input**: `fileHash`

**Qué hace**:
1. Query Pinata: "buscar archivos con metadata.fileHash = 'abc123...'"
2. Si encuentra alguno: retorna `true` (es duplicado)
3. Si no encuentra: retorna `false` (es único)

**Por qué esto es importante**:
- Usuario no puede subir la misma foto 10 veces
- Ahorra costos de storage

---

### Función: `getIPFSUrl()`

**Input**: `ipfsHash`

**Output**: `https://gateway.pinata.cloud/ipfs/${hash}`

**Por qué una función para esto**:
- Centraliza la configuración del gateway
- Si cambiamos de Pinata a otro provider, solo cambiamos aquí

---

## 2.4 - AIService (El Analista)

### ¿Qué es?
Servicio que usa GPT-4 Vision para analizar fotos automáticamente.

### ¿Por qué existe?
- Usuarios pueden NO escribir descripción
- IA puede detectar severidad automáticamente
- Content moderation (prevenir fotos inapropiadas)

---

### Función: `analyzeImage()`

**Input**: `{ imageUrl, category }`

**Proceso**:

**1. Construir prompt contextual**
```
Si category = INSEGURIDAD:
"Analiza esta imagen de un reporte sobre problemas de inseguridad
(drogas, vandalismo, etc). Genera:
1. Descripción objetiva (máx 2 oraciones)
2. Tags relevantes (3-5 palabras en español)
3. Severidad 1-10"
```

**Por qué contextual**:
- GPT-4 da mejores resultados si sabe QUÉ buscar
- Tags son más relevantes

---

**2. Enviar a OpenAI**
```
POST https://api.openai.com/v1/chat/completions
{
  "model": "gpt-4-vision-preview",
  "messages": [{
    "role": "user",
    "content": [
      { "type": "text", "text": prompt },
      { "type": "image_url", "image_url": { "url": imageUrl }}
    ]
  }],
  "max_tokens": 300,
  "temperature": 0.3
}
```

**Por qué temperature=0.3**:
- Más determinístico (menos creatividad)
- Respuestas más consistentes

---

**3. Parsear respuesta**
```
Response de OpenAI:
"{
  \"description\": \"Bache profundo de aprox 1m...\",
  \"tags\": [\"bache\", \"asfalto\", \"peligro\"],
  \"severity\": 8
}"
```

**4. Fallback si falla**
```
Si OpenAI retorna error o JSON inválido:
return {
  description: "Reporte ciudadano pendiente de revisión",
  tags: ["pendiente"],
  severity: 5
}
```

**Por qué fallback**:
- No queremos bloquear el reporte si IA falla
- Usuario puede agregar descripción manual después

---

### Función: `moderateImage()`

**Input**: `imageUrl`

**Qué hace**:
1. Envía a OpenAI Moderation API
2. Retorna si la imagen está "flagged"

**Qué detecta**:
- Contenido sexual
- Violencia gráfica
- Odio/discriminación

**Si está flagged**: `return false` (no apropiada)

**Por qué esto es crítico**:
- Previene abuso de la plataforma
- Protege a usuarios de ver contenido inapropiado

---

## 2.5 - ScrollService (El Notario Blockchain)

### ¿Qué es?
Servicio que interactúa con los smart contracts de Scroll.

### ¿Por qué existe?
- Encapsula la complejidad de ethers.js
- Maneja gas estimation
- Parsea eventos
- Maneja errores de transacciones

---

### Componentes:

**Provider**:
- Conexión RPC a Scroll
- Solo lectura (queries)

**Wallet**:
- Provider + private key
- Puede firmar y enviar transacciones

**Contract**:
- Instancia de RikuyCore
- Tiene el ABI (sabe qué funciones llamar)

---

### Función: `createReport()`

**Input**: `{ arkivTxId, categoryId, zkProof }`

**Proceso**:

**1. Preparar datos**
```
- Convertir arkivTxId (string) a bytes32
- Verificar que zkProof tenga 8 elementos
- Si no tiene: usar mock [0,0,0,0,0,0,0,0]
```

---

**2. Estimar gas**
```
const gasEstimate = await contract.createReport.estimateGas(...)
```

**Por qué**:
- Evitar transacciones que fallen por falta de gas
- Calcular costo exacto

**Buffer**: Añadimos +20% por si acaso
```
gasLimit = gasEstimate * 1.2
```

---

**3. Enviar transacción**
```
const tx = await contract.createReport(
  arkivTxIdBytes,
  categoryId,
  zkProof,
  { gasLimit }
)
```

**Qué retorna**: Transaction object (NO el receipt todavía)

---

**4. Esperar confirmación**
```
const receipt = await tx.wait()
```

**Qué hace internamente**:
- Espera que la transacción sea minada
- Espera 1 confirmación (en Scroll es rápido, ~3 segundos)
- Si falla: throws error con el revert reason

---

**5. Parsear evento**
```
const event = receipt.logs
  .map(log => contract.interface.parseLog(log))
  .find(e => e.name === 'ReportCreated')

const reportId = event.args.reportId
```

**Por qué parsear evento**:
- El reportId se genera on-chain
- Necesitamos ese ID para futuras queries

---

**6. Retornar**
```
return {
  txHash: receipt.hash,
  reportId: reportId
}
```

---

### Función: `validateReport()`

**Input**: `{ reportId, isValid }`

**Proceso**:
1. Convierte reportId a bytes32
2. Llama a `contract.validateReport(reportIdBytes, isValid)`
3. Espera confirmación
4. Retorna txHash

**Más simple que createReport** porque no necesita parsear eventos.

---

### Función: `getReportStatus()`

**Input**: `reportId`

**Proceso**:
1. Convierte reportId a bytes32
2. Llama a `contract.getReportStatus(reportIdBytes)`
3. Retorna: `{ status, upvotes, downvotes, isVerified, isResolved }`

**Es una view function**: No cuesta gas, es lectura.

---

### Manejo de errores:

**Error: "Insufficient funds"**
→ Wallet no tiene ETH
→ Solución: Fondear wallet

**Error: "Transaction reverted"**
→ Alguna validación en el smart contract falló
→ Parsear el revert reason para saber qué pasó

**Error: "Nonce too low"**
→ Transacción duplicada
→ Solución: Reintentar con nonce correcto

---

## 2.6 - Middleware y Rutas

### RateLimiter (middleware/rateLimit.ts)

**¿Qué es?**
Middleware que previene spam usando Redis.

**¿Cómo funciona?**

**Rate limit global** (para todas las rutas):
```
- Identificador: IP del usuario
- Límite: 5 requests por minuto
- Si excede: retorna 429 "Too many requests"
```

**Rate limit para reportes** (más estricto):
```
- Límite diario: 5 reportes
- Límite horario: 2 reportes
- Mínimo entre reportes: 30 minutos

Ejemplo:
- Usuario reporta a las 10:00 → OK
- Usuario reporta a las 10:15 → ERROR "Espera 30min"
- Usuario reporta a las 10:35 → OK
- Usuario reporta a las 11:00 → OK (solo 2 en esta hora)
```

**Por qué Redis**:
- Contador distribuido (funciona con múltiples servidores)
- Auto-expira (no necesita limpieza manual)
- Rápido (<1ms)

---

### Upload (middleware/upload.ts)

**¿Qué es?**
Configuración de multer para manejar uploads de fotos.

**Configuración**:
```
- Storage: memoria (no guarda en disco)
- Max size: 10MB
- Solo imágenes: jpg, png, webp
```

**Por qué memoria**:
- No queremos guardar archivos temporales en disco
- Más rápido (todo en RAM)
- Se limpia automáticamente después del request

---

### Validation (middleware/validation.ts)

**¿Qué es?**
Middleware que valida el body de requests usando Zod.

**Ejemplo schema**:
```typescript
createReport: z.object({
  category: z.number().int().min(0).max(2),
  description: z.string().max(500).optional(),
  location: z.object({
    lat: z.number().min(-55).max(-21),
    long: z.number().min(-73.5).max(-53),
    accuracy: z.number().positive()
  }),
  userSecret: z.string().optional()
})
```

**Qué valida**:
- Tipos correctos (number, string, etc)
- Rangos (lat entre -55 y -21)
- Opcionalidad (description es opcional)
- Formato (accuracy debe ser positivo)

**Si falla**:
```
Retorna 400 Bad Request:
{
  "success": false,
  "error": "Datos inválidos",
  "details": [
    {
      "path": ["location", "lat"],
      "message": "Number must be greater than or equal to -55"
    }
  ]
}
```

**Por qué usar Zod**:
- Type-safe (TypeScript infiere tipos automáticamente)
- Mensajes de error claros
- Composable (puedes reusar schemas)

---

### Routes (routes/reports.ts)

**POST /api/reports**
→ Crear nuevo reporte
→ Usa: upload, reportRateLimiter
→ Llama: ReportService.createReport()

**GET /api/reports/:id**
→ Obtener reporte por ID
→ Llama: ReportService.getReport()

**POST /api/reports/:id/validate**
→ Validar reporte
→ Usa: validation middleware
→ Llama: ScrollService.validateReport()

**GET /api/reports/nearby**
→ Buscar reportes cercanos
→ Query params: lat, long, radiusKm
→ Llama: ArkivService.getNearbyReports()

---

## 2.7 - Server Principal (index.ts)

**¿Qué hace?**

1. **Setup de Express**
```
- CORS (permite requests desde cualquier origen)
- JSON parsing
- URL encoding
```

2. **Rate limiting global**
```
- Aplica a TODAS las rutas
- 5 requests/min por IP
```

3. **Routes**
```
- /health → Health check
- /api/reports → Todas las rutas de reportes
```

4. **Error handler**
```
- Captura errores no manejados
- Retorna JSON consistente
```

5. **Start server**
```
- Escucha en puerto 3001
- Logea configuración al iniciar
```

---

## 🔄 FLUJO COMPLETO END-TO-END

Veamos cómo TODA la arquitectura trabaja junta cuando Ana crea un reporte:

**1. Ana abre la app móvil**
- App pide permiso de cámara y ubicación
- Ana toca "REPORTAR"

**2. Ana toma foto**
- Selecciona categoría: "Drogas"
- (Opcional) Escribe: "Venta en la esquina"
- Toca "ENVIAR"

**3. Frontend hace request**
```
POST http://backend:3001/api/reports

FormData:
- photo: [archivo binario]
- category: "1"
- description: "Venta en la esquina"
- location: '{"lat":-34.6037,"long":-58.3816,"accuracy":10}'
```

**4. Backend recibe request**
→ Rate limiter verifica (OK, primer reporte del día)
→ Multer parsea el archivo
→ Validation verifica datos
→ Llega a `ReportService.createReport()`

**5. ReportService orquesta**
- ✅ Valida ubicación (está en Argentina)
- ✅ Sube a IPFS → `Qm123...`
- ✅ IA analiza → "Posible punto de venta de drogas en vía pública"
- ✅ Guarda en Arkiv → `0xabc...` (arkivTxId)
- ✅ Crea en Scroll → `0xdef...` (scrollTxHash)
- ✅ Calcula reward → "$5000"

**6. Backend retorna**
```json
{
  "success": true,
  "reportId": "0x789...",
  "arkivTxId": "0xabc...",
  "scrollTxHash": "0xdef...",
  "estimatedReward": "$5000",
  "message": "Reporte creado exitosamente..."
}
```

**7. Frontend muestra**
```
✅ ¡Reporte enviado!

Código: #RK-4827
Recompensa estimada: $5000
Tiempo estimado: 2-5 días

[Ver mis reportes]
```

**8. Validación comunitaria**
- Carlos (vecino) abre app
- Ve: "Reporte a 300m de ti"
- Toca "SÍ, es real"
- Backend llama: `ScrollService.validateReport()`
- Smart contract incrementa upvotes

**9. Después de 5 validaciones**
- Smart contract emite evento `ReportVerified`
- Backend lo detecta (via websocket o polling)
- Envía notificación push a Ana: "Tu reporte fue verificado!"

**10. Gobierno aprueba**
- Gobierno ve dashboard
- Abre reporte #RK-4827
- Ve las 7 validaciones + foto + descripción
- Realiza operativo policial
- En dashboard: Toca "RESOLVER" → "Operativo realizado"
- Backend llama: `ScrollService.resolveReport(approved=true)`

**11. Smart contract libera fondos**
- `RikuyCore.resolveReport()` llama `Treasury.releaseRewards()`
- Treasury calcula: 70% Ana, 30% validadores
- Ejecuta transfers
- Emite evento `RewardReleased`

**12. Ana recibe pago**
- Push notification: "¡Recibiste $5000!"
- Puede:
  - Transferir a su banco (via Lemon)
  - Mantener en wallet
  - Donar a su barrio

**13. Data permanente**
- Evidencia en IPFS: permanente (mientras esté pineada)
- Metadata en Arkiv: inmutable (no se puede modificar)
- Estado en Scroll: inmutable (registro blockchain)

**Resultado**:
- Ana ayudó a su barrio Y ganó dinero
- Gobierno tiene data verificada y trazable
- Comunidad colaboró en la verificación
- TODO está registrado y es auditable

---

FIN DE LA ESPECIFICACIÓN TÉCNICA
