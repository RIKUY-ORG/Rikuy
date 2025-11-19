# 👵 RIKUY - Flujo de Usuario Ultra-Simple (Abuela-Friendly)

## 🎯 Filosofía de Diseño

> **"Si tu abuela no puede usarlo, está mal diseñado"**

- ❌ NO mencionar: wallet, gas, blockchain, crypto, tokens
- ✅ SÍ mencionar: reportar, verificar, cobrar, seguridad
- 🎨 UX: Instagram + Waze (familiar para todos)

---

## 📱 FLUJO COMPLETO: Historia de Ana

### 🌟 Escenario
**Ana (60 años)** ve tráfico de drogas en su calle. Quiere reportarlo ANÓNIMAMENTE para evitar represalias, pero también quiere que se solucione.

---

## PASO 1: Primera Vez (Onboarding - 30 segundos)

### Pantalla 1.1: Descarga la App
```
┌─────────────────────────────┐
│  🦅 RIKUY                   │
│  Reportá problemas          │
│  en tu barrio              │
│                            │
│  [Continuar con Google]    │
│  [Continuar con Facebook]  │
│  [Continuar con Email]     │
│                            │
│  📱 O ingresá sin cuenta   │
└─────────────────────────────┘
```

**Backend (invisible para Ana):**
```typescript
// Cuando Ana toca "Continuar con Google"
async function handleGoogleLogin() {
  // 1. Login con Privy (Account Abstraction)
  const user = await privy.login({ provider: 'google' });

  // 2. Crear Smart Wallet (invisible)
  const wallet = await createSmartWallet(user.id);

  // 3. Generar ZK secret (guardado en device)
  const zkSecret = generateSecureRandom();
  await secureStorage.set('zk_secret', zkSecret);

  // 4. Registrar en backend
  await api.post('/users/register', {
    userId: user.id,
    walletAddress: wallet.address, // Ana NUNCA lo ve
    emailHash: hash(user.email) // Para notificaciones
  });

  // Ana ve: "¡Listo! Ya podés reportar problemas"
}
```

---

## PASO 2: Reportar Problema (15 segundos)

### Pantalla 2.1: Mapa Principal (Home)
```
┌─────────────────────────────┐
│ 🔍 [Buscar dirección...]   │
├─────────────────────────────┤
│                            │
│    🗺️  MAPA COMPLETO       │
│                            │
│  📍 (marcadores de otros)  │
│  📍                        │
│      📍                    │
│                            │
│          👤 (Ana está acá) │
│                            │
├─────────────────────────────┤
│  [  📸 REPORTAR  ]         │  <- BOTÓN GIGANTE
└─────────────────────────────┘
```

### Pantalla 2.2: Tomar Foto
```
┌─────────────────────────────┐
│  [×]              [Flash ⚡] │
│                            │
│                            │
│   📷  ENCUADRE DE CÁMARA   │
│                            │
│                            │
│  "Sacá una foto del        │
│   problema"                │
│                            │
│  [ 📸 Tomar Foto ]         │
│  [ 📁 Subir desde galería] │
└─────────────────────────────┘
```

**Backend (automático):**
```typescript
async function handlePhotoCapture(photo: File, location: GeolocationPosition) {

  // 1. GEOLOCALIZACIÓN (automática)
  const gpsCoords = {
    lat: location.coords.latitude,
    long: location.coords.longitude,
    accuracy: location.coords.accuracy // en metros
  };

  // 2. Verificar que está en Argentina (anti-fraude básico)
  if (!isInArgentina(gpsCoords)) {
    throw new Error('Solo disponible en Argentina');
  }

  // 3. Limpiar metadata EXIF (privacidad)
  const cleanPhoto = await stripEXIF(photo);

  // Ana ve: "Procesando..."
  return { photo: cleanPhoto, location: gpsCoords };
}
```

### Pantalla 2.3: Categoría (selección rápida)
```
┌─────────────────────────────┐
│  ¿Qué querés reportar?     │
│                            │
│  ┌───────┐  ┌───────┐     │
│  │  🕳️   │  │  💊   │     │
│  │Baches │  │Drogas │     │
│  └───────┘  └───────┘     │
│                            │
│  ┌───────┐  ┌───────┐     │
│  │  🗑️   │  │  💡   │     │
│  │Basura │  │Sin Luz│     │
│  └───────┘  └───────┘     │
│                            │
│  ┌───────┐  ┌───────┐     │
│  │  🚧   │  │  🔊   │     │
│  │ Obra  │  │ Ruido │     │
│  └───────┘  └───────┘     │
│                            │
│  [Siguiente →]             │
└─────────────────────────────┘
```

**Ana toca "Drogas"** 💊

### Pantalla 2.4: Descripción Opcional
```
┌─────────────────────────────┐
│  Contanos más (opcional)   │
│                            │
│  ┌─────────────────────┐  │
│  │ Se venden drogas    │  │
│  │ en la esquina       │  │
│  │ todas las noches    │  │
│  │                     │  │
│  └─────────────────────┘  │
│                            │
│  🎤 [Dictar]               │
│                            │
│  [Omitir]    [Enviar →]   │
└─────────────────────────────┘
```

### Pantalla 2.5: Confirmación
```
┌─────────────────────────────┐
│  Tu reporte está listo     │
│                            │
│  📸 1 foto                 │
│  📍 Av. Corrientes 5000    │
│  💊 Drogas                 │
│                            │
│  ✅ Anónimo                │
│  ✅ Seguro                 │
│                            │
│  Ganás hasta $5000 si      │
│  se verifica ✨            │
│                            │
│  [🚀 ENVIAR REPORTE]       │
└─────────────────────────────┘
```

**Backend (la MAGIA ocurre aquí):**
```typescript
async function submitReport(data: {
  photo: File,
  category: string,
  description: string,
  location: { lat: number, long: number }
}) {

  // ⏱️ Ana ve: "Enviando..." (tarda ~3 segundos)

  // PASO 1: Subir foto a IPFS (descentralizado)
  const ipfsHash = await uploadToIPFS(data.photo);

  // PASO 2: Generar ZK Proof (privacidad)
  const zkProof = await generateZKProof({
    userSecret: await secureStorage.get('zk_secret'),
    latitude: data.location.lat,
    longitude: data.location.long,
    category: data.category,
    timestamp: Date.now()
  });

  // PASO 3: Subir todo a Arkiv (inmutable)
  const arkivDocument = {
    protocol: 'rikuy-v1',
    evidence: {
      imageIPFS: ipfsHash,
      description: data.description,
      timestamp: Date.now()
    },
    location: {
      approximate: {
        lat: Math.round(data.location.lat * 100) / 100, // ~1km precisión
        long: Math.round(data.location.long * 100) / 100
      },
      zkProof: zkProof.nullifier
    },
    category: data.category
  };

  const arkivTxHash = await arkivClient.store({
    entity: 'Report',
    payload: arkivDocument
  });

  // PASO 4: Registrar en Scroll (blockchain)
  const reportId = ethers.utils.id(
    `${zkProof.nullifier}-${Date.now()}`
  );

  // Usar Smart Wallet + Paymaster (Ana NO paga gas)
  const tx = await smartWallet.sendTransaction({
    to: RIKUY_CONTRACT,
    data: rikuyContract.interface.encodeFunctionData('createReport', [
      reportId,
      arkivTxHash,
      data.category,
      zkProof.proof
    ]),
    // Paymaster paga el gas ✨
    paymasterAndData: PAYMASTER_ADDRESS
  });

  await tx.wait();

  // PASO 5: Notificar a gobierno local
  await notifyGovernment({
    reportId,
    category: data.category,
    location: data.location,
    urgency: calculateUrgency(data.category) // Drogas = ALTA
  });

  // Ana ve: "✅ Reporte enviado!"
  return { reportId, estimatedReward: 5000 };
}
```

### Pantalla 2.6: ¡Éxito!
```
┌─────────────────────────────┐
│                            │
│      ✅                     │
│                            │
│  ¡Reporte enviado!         │
│                            │
│  📋 Código: #RK-4827       │
│                            │
│  Vas a recibir hasta       │
│  $5000 cuando se verifique │
│                            │
│  ⏱️ Tiempo estimado:       │
│     2-5 días               │
│                            │
│  [Ver mis reportes]        │
│  [Volver al inicio]        │
└─────────────────────────────┘
```

**Tiempo total: 15 segundos** ⚡

---

## PASO 3: Entre Bastidores (Validación Comunitaria)

Mientras Ana espera, **otros usuarios validan su reporte**.

### ¿Quiénes validan?
1. **Vecinos cercanos** (máx 2km del reporte)
2. **Validadores con buena reputación** (historial de votos correctos)
3. **Gobierno local** (verificación manual)

### Pantalla para Validadores:
```
┌─────────────────────────────┐
│  📍 Reporte cerca tuyo     │
├─────────────────────────────┤
│  📸 [Foto del problema]    │
│                            │
│  📍 A 300m de tu ubicación │
│  💊 Categoría: Drogas      │
│  🕐 Reportado hace 2 hs    │
│                            │
│  ¿Este reporte es real?    │
│                            │
│  [👎 No]      [👍 Sí]     │
│                            │
│  Ganás $100 si acertás ✨  │
└─────────────────────────────┘
```

**Backend (sistema de consenso):**
```typescript
async function handleValidation(reportId: string, isValid: boolean, validatorAddress: string) {

  // 1. Verificar que validador está cerca (ZK proof)
  const validatorProximity = await verifyProximityProof(validatorAddress, reportId);
  if (!validatorProximity) {
    throw new Error('Muy lejos del reporte');
  }

  // 2. Registrar voto (gasless también)
  await smartWallet.sendTransaction({
    to: RIKUY_CONTRACT,
    data: rikuyContract.interface.encodeFunctionData('validateReport', [
      reportId,
      isValid
    ]),
    paymasterAndData: PAYMASTER_ADDRESS
  });

  // 3. Verificar si alcanzó consenso
  const validations = await rikuyContract.getValidationState(reportId);

  if (validations.upvotes >= THRESHOLD_VERIFIED) {
    // ✅ REPORTE VERIFICADO
    await markReportAsVerified(reportId);

    // Notificar a gobierno para acción
    await notifyGovernmentAction(reportId);

    // Pagar a Ana y validadores
    await processRewards(reportId);
  }
}
```

---

## PASO 4: Gobierno Recibe Notificación

### Dashboard del Gobierno (Web)
```
┌──────────────────────────────────────────┐
│  🏛️ RIKUY - Panel de Gobierno          │
├──────────────────────────────────────────┤
│  📊 Resumen Hoy                          │
│  ┌────────┬────────┬────────┐           │
│  │ 47 new │ 12 URG │ 203 OK │           │
│  └────────┴────────┴────────┘           │
│                                          │
│  🚨 URGENTES (requieren acción inmediata)│
│  ┌──────────────────────────────┐       │
│  │ #RK-4827 💊 Drogas           │       │
│  │ 📍 Av. Corrientes 5000       │       │
│  │ ✅ 7 validaciones            │       │
│  │ 🕐 Hace 3 días               │       │
│  │ [Ver detalles] [Resolver]   │       │
│  └──────────────────────────────┘       │
│                                          │
│  [Filtrar por zona] [Exportar PDF]      │
└──────────────────────────────────────────┘
```

### Detalle del Reporte (para gobierno)
```
┌──────────────────────────────────────────┐
│  Reporte #RK-4827                        │
├──────────────────────────────────────────┤
│  📸 Evidencia:                           │
│  [Imagen del reporte]                    │
│                                          │
│  📋 Información:                         │
│  • Categoría: Drogas                     │
│  • Ubicación: Av. Corrientes 5000        │
│  • Precisión: ±100m                      │
│  • Timestamp: 15/11/2025 18:30hs        │
│                                          │
│  ✅ Validaciones: 7 positivas, 0 negativas│
│  🔗 Blockchain: 0xabc123... (inmutable)  │
│  📁 Arkiv: tx/4827 (permanente)          │
│                                          │
│  💰 Recompensa pendiente: $5000          │
│                                          │
│  ┌────────────────────────────┐         │
│  │ ¿Qué acción tomaron?       │         │
│  │ [Operativo realizado]      │         │
│  │ [En proceso]               │         │
│  │ [Falsa alarma]             │         │
│  └────────────────────────────┘         │
│                                          │
│  [💸 PAGAR RECOMPENSA]                  │
└──────────────────────────────────────────┘
```

**Backend (gobierno aprueba pago):**
```typescript
async function governmentApprovePayment(reportId: string, action: string) {

  // 1. Verificar que es una cuenta de gobierno autorizada
  const isAuthorized = await checkGovernmentAuth(msg.sender);
  require(isAuthorized, "No autorizado");

  // 2. Marcar reporte como resuelto
  await rikuyContract.resolveReport(reportId, action);

  // 3. Liberar pagos automáticamente
  await treasuryContract.releaseRewards(reportId);

  // Ana recibe notificación ✨
}
```

---

## PASO 5: Ana Recibe su Pago (Automático)

### Notificación Push
```
┌─────────────────────────────┐
│  🎉 RIKUY                   │
│                            │
│  ¡Tu reporte fue verificado!│
│                            │
│  Recibiste $5000           │
│                            │
│  [Ver detalles]            │
└─────────────────────────────┘
```

### Pantalla "Mis Reportes"
```
┌─────────────────────────────┐
│  📋 Mis Reportes           │
├─────────────────────────────┤
│                            │
│  ✅ #RK-4827               │
│  💊 Drogas                 │
│  📍 Av. Corrientes 5000    │
│  💰 +$5000                 │
│  🕐 Resuelto hace 1 día    │
│                            │
│  ⏳ #RK-4935               │
│  🕳️ Bache                  │
│  📍 Av. Santa Fe 2000      │
│  💰 $3000 (pendiente)      │
│  🕐 En revisión (2 días)   │
│                            │
├─────────────────────────────┤
│  💵 Balance: $5000         │
│  [Transferir a mi banco]   │
│  [Donar a mi barrio]       │
└─────────────────────────────┘
```

**Backend (opciones de retiro):**
```typescript
async function handleWithdrawal(userId: string, method: 'bank' | 'crypto' | 'donate') {

  const balance = await getUserBalance(userId);

  if (method === 'bank') {
    // 1. Convertir crypto a fiat (usando Lemon o similar)
    const fiatAmount = await cryptoToFiat(balance, 'ARS');

    // 2. Transferir a cuenta bancaria
    await lemonAPI.transfer({
      amount: fiatAmount,
      cbu: user.bankAccount,
      concept: 'Recompensa RIKUY'
    });

    // Ana ve: "¡Transferencia exitosa! Llegará en 24-48hs"
  }

  if (method === 'crypto') {
    // Transferir directo a su smart wallet
    await smartWallet.transfer(balance);

    // Ana ve: "Fondos disponibles en tu billetera"
  }

  if (method === 'donate') {
    // Donar a pool comunitario de su barrio
    await donateToNeighborhood(userId, balance);

    // Ana ve: "¡Gracias por ayudar a tu comunidad! ❤️"
  }
}
```

---

## 🛡️ Anti-Fraude (para prevenir trolls)

### Mecanismos Implementados:

#### 1. **Proof of Proximity (ZK)**
```typescript
// El usuario DEBE estar físicamente cerca del problema
async function verifyProximityProof(zkProof: any, reportLocation: Location) {

  // ZK circuit verifica que:
  // 1. Conoces un "secret" válido
  // 2. Estabas dentro de 500m del punto reportado
  // 3. SIN revelar tu ubicación exacta

  const isValid = await zkVerifier.verifyProof(zkProof);
  return isValid;
}
```

#### 2. **Rate Limiting (por device)**
```typescript
// Máximo 5 reportes por día
const DAILY_LIMIT = 5;

async function checkRateLimit(deviceId: string) {
  const today = new Date().toISOString().split('T')[0];
  const key = `reports:${deviceId}:${today}`;

  const count = await redis.incr(key);
  await redis.expire(key, 86400); // 24 horas

  if (count > DAILY_LIMIT) {
    throw new Error('Límite diario alcanzado');
  }
}
```

#### 3. **Geofencing (solo Argentina)**
```typescript
const ARGENTINA_BOUNDS = {
  latMin: -55.0,
  latMax: -21.0,
  longMin: -73.5,
  longMax: -53.0
};

function isInArgentina(lat: number, long: number): boolean {
  return (
    lat >= ARGENTINA_BOUNDS.latMin &&
    lat <= ARGENTINA_BOUNDS.latMax &&
    long >= ARGENTINA_BOUNDS.longMin &&
    long <= ARGENTINA_BOUNDS.longMax
  );
}
```

#### 4. **Duplicate Photo Detection (perceptual hash)**
```typescript
// Detectar si la misma foto ya fue subida
async function checkDuplicatePhoto(photo: File): Promise<boolean> {

  // Calcular hash perceptual (similar a pHash)
  const hash = await calculatePerceptualHash(photo);

  // Buscar en Arkiv si existe hash similar (±5% diferencia)
  const existing = await arkivClient.query()
    .entity('Report')
    .where('photoHash', 'similar', hash, 0.95)
    .execute();

  return existing.length > 0;
}
```

#### 5. **Reputation Score**
```typescript
// Usuarios con historial de reportes falsos pierden privilegios
interface UserReputation {
  reportesVerificados: number;
  reportesRechazados: number;
  score: number; // 0-100
}

async function updateReputation(userId: string, reportWasValid: boolean) {
  const rep = await getReputation(userId);

  if (reportWasValid) {
    rep.reportesVerificados++;
    rep.score = Math.min(100, rep.score + 5);
  } else {
    rep.reportesRechazados++;
    rep.score = Math.max(0, rep.score - 10);
  }

  // Si score < 20, no puede reportar por 7 días
  if (rep.score < 20) {
    await banUser(userId, 7); // días
  }

  await saveReputation(userId, rep);
}
```

---

## 💰 Sistema de Pagos (Treasury)

### Arquitectura de Pagos

```
Gobierno deposita fondos
        ↓
   Treasury Pool
        ↓
   ┌────┴────┐
   ↓         ↓
Reporter   Validadores
(70%)      (30%)
```

### Smart Contract: Treasury.sol

```solidity
contract RikuyTreasury {

    uint256 public constant REPORTER_REWARD = 0.7 ether; // 70% del total
    uint256 public constant VALIDATOR_REWARD = 0.3 ether; // 30% dividido entre validadores

    mapping(address => bool) public isGovernment;
    mapping(bytes32 => bool) public rewardsPaid;

    /**
     * @notice Gobierno deposita fondos
     */
    function depositFunds() external payable onlyGovernment {
        emit FundsDeposited(msg.sender, msg.value);
    }

    /**
     * @notice Liberar recompensas cuando reporte es verificado
     */
    function releaseRewards(
        bytes32 reportId,
        address reporter,
        address[] calldata validators
    ) external onlyGovernment {

        require(!rewardsPaid[reportId], "Already paid");
        require(address(this).balance >= 1 ether, "Insufficient funds");

        // Pagar al reporter (70%)
        (bool success1, ) = reporter.call{value: REPORTER_REWARD}("");
        require(success1, "Transfer failed");

        // Pagar a validadores (30% dividido)
        uint256 rewardPerValidator = VALIDATOR_REWARD / validators.length;
        for (uint i = 0; i < validators.length; i++) {
            (bool success2, ) = validators[i].call{value: rewardPerValidator}("");
            require(success2, "Transfer failed");
        }

        rewardsPaid[reportId] = true;
        emit RewardsPaid(reportId, reporter, validators);
    }
}
```

---

## 📊 Dashboard de Ana (Transparencia Total)

```
┌─────────────────────────────┐
│  👤 Ana Rodriguez          │
│  📧 ana@gmail.com          │
├─────────────────────────────┤
│                            │
│  📊 Tu Impacto             │
│  ┌─────────────────────┐  │
│  │ 12 reportes         │  │
│  │ 9 verificados       │  │
│  │ 2 en proceso        │  │
│  │ 1 rechazado         │  │
│  └─────────────────────┘  │
│                            │
│  💰 Ganancias              │
│  ┌─────────────────────┐  │
│  │ Total: $47,000      │  │
│  │ Disponible: $5,000  │  │
│  │ Retirado: $42,000   │  │
│  └─────────────────────┘  │
│                            │
│  🏆 Reputación: ⭐⭐⭐⭐⭐ │
│  (95/100)                  │
│                            │
│  🎖️ Insignias              │
│  🥇 Vecino del Mes         │
│  🔍 Ojo de Halcón          │
│  💪 Agente de Cambio       │
│                            │
│  [Ver estadísticas full]   │
└─────────────────────────────┘
```

---

## 🔄 Resumen del Flujo Técnico

### 1. Ana reporta (15 seg)
```
Foto → IPFS → Arkiv → ZK Proof → Scroll → ✅
```

### 2. Validación comunitaria (2-5 días)
```
Vecinos validan → Smart Contract cuenta votos → Consenso alcanzado
```

### 3. Gobierno aprueba (1 día)
```
Dashboard → Verificar acción → Aprobar pago
```

### 4. Ana recibe dinero (automático)
```
Treasury → Smart Wallet → Conversión fiat → Banco Ana
```

**Total end-to-end: ~3-7 días**

---

## 🎯 Checklist de Implementación

### Frontend (React Native + Expo)
- [ ] Onboarding con Privy (Google/Facebook login)
- [ ] Cámara nativa + upload desde galería
- [ ] Mapa con Mapbox + pines de reportes
- [ ] UI de categorías (iconos grandes)
- [ ] Dashboard de reportes del usuario
- [ ] Sistema de notificaciones push
- [ ] Pantalla de retiro de fondos

### Backend (Node.js + TypeScript)
- [ ] API REST para crear reportes
- [ ] Integración con Arkiv SDK
- [ ] Generación de ZK proofs (worker separado)
- [ ] Upload a IPFS (Pinata o NFT.Storage)
- [ ] Relayer para transacciones gasless
- [ ] Sistema de notificaciones (gobierno + usuarios)
- [ ] Rate limiting + anti-fraude
- [ ] Conversión crypto → fiat (Lemon API)

### Smart Contracts (Solidity)
- [ ] RikuyCore.sol (lógica principal)
- [ ] Treasury.sol (manejo de fondos)
- [ ] ZKVerifier.sol (verificación de proofs)
- [ ] ValidationDAO.sol (votación)
- [ ] Paymaster.sol (gasless UX)

### ZK Circuits (Circom)
- [ ] proximity.circom (proof of proximity)
- [ ] uniqueness.circom (anti-spam)
- [ ] Compilar a verifier.sol

### Gobierno Dashboard (Next.js)
- [ ] Login con wallet gobierno
- [ ] Vista de reportes urgentes
- [ ] Filtros por zona/categoría
- [ ] Botón de aprobar pagos
- [ ] Exportar reportes a PDF

---

¿Empezamos a implementar? ¿Por dónde arrancamos?

1. **Smart Contracts** (base del sistema)
2. **Backend + Arkiv** (middleware)
3. **Frontend básico** (MVP mobile)
4. **ZK Circuits** (privacidad)

Decime y arrancamos 🚀
