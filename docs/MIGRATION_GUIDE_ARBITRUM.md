# 🚀 Rikuy Network - Guía de Desarrollo

## La Visión: Una Appchain Soberana para la Justicia

Rikuy evolucionará de un smart contract en Scroll a su propia **L3 soberana** construida sobre Arbitrum, con contratos en **Rust/Stylus** para verificación ZK eficiente y **gas subsidiado** para que denunciar sea gratis.

---

## Arquitectura Objetivo Final

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           ARQUITECTURA RIKUY NETWORK                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    CAPA DE USUARIO (Frontend)                        │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │   │
│  │  │ App Móvil    │  │ Web App      │  │ ZK Tooling               │   │   │
│  │  │ (React Native)│  │ (React/Vite) │  │ (Genera proofs locales)  │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    CAPA DE SERVICIOS (Backend)                       │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐   │   │
│  │  │ AI Consensus │  │ IPFS/Arkiv   │  │ Relayer (opcional)       │   │   │
│  │  │ (Multi-LLM)  │  │ (Storage)    │  │ (Solo si no hay Orbit)   │   │   │
│  │  └──────────────┘  └──────────────┘  └──────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    RIKUY CHAIN (L3 - Arbitrum Orbit)                 │   │
│  │                                                                       │   │
│  │    ┌─────────────────────┐    ┌─────────────────────────────────┐   │   │
│  │    │   CONTRATOS RUST    │    │      CONTRATOS SOLIDITY         │   │   │
│  │    │     (Stylus)        │    │        (EVM Legacy)             │   │   │
│  │    │                     │    │                                 │   │   │
│  │    │  • ZK Verifier      │◄──►│  • RikuyCoreV2                  │   │   │
│  │    │  • AI Aggregator    │    │  • ReportRegistry               │   │   │
│  │    │  • Heavy Compute    │    │  • Treasury                     │   │   │
│  │    │                     │    │  • GovernmentRegistry           │   │   │
│  │    └─────────────────────┘    └─────────────────────────────────┘   │   │
│  │                                                                       │   │
│  │    Características:                                                   │   │
│  │    • Gas Token: ETH (subsidiado por Rikuy Foundation)                │   │
│  │    • Secuenciador: Caldera/AltLayer (hosted)                         │   │
│  │    • Data Availability: AnyTrust (bajo costo)                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    CAPA DE LIQUIDACIÓN                               │   │
│  │                                                                       │   │
│  │    Arbitrum One (L2) ──────► Ethereum Mainnet (L1)                   │   │
│  │    (Asegura Rikuy Chain)     (Seguridad final)                       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Índice de Fases

| Fase | Nombre | Tiempo Estimado | Estado |
|------|--------|-----------------|--------|
| 0 | Reorganización del Código Actual | 1-2 días | ✅ Completada |
| 1 | Levantamiento de Rikuy Chain (L3) | 2-3 días | 🔴 Pendiente |
| 2 | Primer Contrato Stylus | 3-5 días | 🔴 Pendiente |
| 3 | Migración de Contratos Core | 5-7 días | 🔴 Pendiente |
| 4 | Gas Subsidiado + AI Multi-Provider | 3-5 días | 🔴 Pendiente |
| 5 | ZK Verifier en Stylus | 2-4 semanas | 🔴 Pendiente |
| 6 | Descentralización Completa | Post-hackathon | 🔴 Futuro |

---

# FASE 0: Reorganización del Código Actual ✅ COMPLETADA

> **Fecha de completación:** 2026-01-29

## Resumen

Se reorganizó el proyecto para soportar múltiples redes (Scroll, Arbitrum, Rikuy Chain L3) sin romper la funcionalidad existente.

## Lo que se hizo

### 1. Nueva Estructura de Carpetas

```
Rikuy_ORG/
├── contracts/
│   ├── solidity/          ← Contratos principales reorganizados
│   │   ├── core/          (RikuyCoreV2, Treasury, ReportRegistry)
│   │   ├── governance/    (GovernmentRegistry)
│   │   ├── interfaces/    (IZKVerifier, ITreasury, etc)
│   │   └── zk/            (SemaphoreAdapter, MockAdapter)
│   └── stylus/            ← Preparado para Rust (Fase 2)
├── deployments/
│   ├── scroll-sepolia/    (direcciones actuales)
│   ├── arbitrum-sepolia/  (listo para deploy)
│   └── rikuy-chain/       (listo para L3)
├── archive/
│   ├── scroll-legacy/     (scripts viejos)
│   └── deprecated/        (MockUSX, Paymaster, etc)
└── scripts/               (DeployRikuy.s.sol nuevo)
```

### 2. Configuración Multi-Red

- **`foundry.toml`**: Actualizado con RPCs y explorers para Scroll, Arbitrum y Rikuy Chain. EVM version cambiado a `paris` (compatible con Arbitrum).
- **`backend/src/config/networks.ts`**: Nuevo archivo que define configuraciones para cada red.
- **`backend/src/config/index.ts`**: Usa selector dinámico basado en variable `NETWORK`.
- **`.env.example`**: Template completo con todas las redes y servicios.

### 3. Código Archivado

Movido a `archive/`:
- `MockUSX.sol` → Solo testnet viejo
- `RikuyPaymaster.sol` → Usamos Backend Relayer
- `spa.traineddata` → 3.4MB innecesarios
- `Deploy.s.sol` legacy → Reemplazado por `DeployRikuy.s.sol`

### 4. Verificación

- ✅ `forge build` compila sin errores
- ✅ `npm run build` (backend) compila sin errores

---

# FASE 1: Levantamiento de Rikuy Chain (L3)

## Objetivo
Crear tu propia L3 sobre Arbitrum usando Orbit. Esta será la red donde vivirá Rikuy en producción.

## Tiempo Estimado: 2-3 días

## Visión a Futuro
Una vez levantada la L3:
- Tendrás control total sobre gas costs
- Podrás implementar gas subsidiado nativo
- Es la base para todo lo demás
- Si falla algo, siempre puedes volver a Arbitrum Sepolia

---

### Paso 1.1: Elegir Proveedor de Orbit

**Opciones disponibles:**

| Proveedor | Pros | Contras | Costo Testnet |
|-----------|------|---------|---------------|
| **Caldera** | UI muy simple, deploy en minutos | Menos customización | Gratis |
| **AltLayer** | Más opciones, wizard + | Más complejo | Gratis |
| **Conduit** | Muy profesional | Requiere contacto | Gratis (tier) |
| **Self-hosted** | Control total | Muy complejo | Solo infra |

**Recomendación para hackathon**: Caldera o AltLayer (wizard web)

---

### Paso 1.2: Configurar Parámetros de Rikuy Chain

**Parámetros a definir:**

| Parámetro | Valor Recomendado | Justificación |
|-----------|-------------------|---------------|
| **Nombre** | Rikuy Chain | Branding |
| **Chain ID** | 31337XX (custom) | Evitar colisiones |
| **Tipo** | Rollup | Más seguro que AnyTrust |
| **Gas Token** | ETH | Simplicidad |
| **Block Time** | 250ms | Default Arbitrum |
| **DA Layer** | Arbitrum One | Heredar seguridad |

**Para producción futura (post-hackathon):**
- Token de gas custom ($RIKUY)
- AnyTrust para datos del mapa de calor
- Secuenciador descentralizado

---

### Paso 1.3: Deploy de la L3

**Con Caldera (recomendado):**

1. Ir a https://caldera.xyz
2. Conectar wallet con ETH en Arbitrum Sepolia
3. Seguir wizard de "Create Rollup"
4. Configurar parámetros del Paso 1.2
5. Esperar deploy (~10 minutos)
6. Obtener:
   - RPC URL de tu chain
   - Chain ID asignado
   - Explorer URL
   - Bridge URL

**Guardar esta información en:**
- `deployments/rikuy-chain/chain-info.json`
- `.env` (actualizar variables RIKUY_CHAIN_*)

---

### Paso 1.4: Fondear la L3

**Qué necesitas:**
1. ETH en Arbitrum Sepolia (faucet: https://faucet.arbitrum.io)
2. Bridge ETH a tu L3 usando el bridge que te dio Caldera

**Cantidad recomendada:**
- 0.1 ETH para testing inicial
- Más si planeas hacer muchos deploys

---

### Paso 1.5: Verificar la L3

**Tests básicos:**

1. Conectar Metamask a tu RPC
2. Verificar que ves tu balance
3. Enviar una TX simple (transfer ETH a ti mismo)
4. Verificar en el explorer de tu chain

---

### Entregable de Fase 1

✅ Rikuy Chain (L3) levantada y funcionando
✅ RPC URL y Chain ID documentados
✅ Explorer funcionando
✅ Bridge operativo
✅ Wallet fondeada para deploys

---

# FASE 2: Primer Contrato Stylus

## Objetivo
Escribir y desplegar un contrato Stylus básico en tu L3 para demostrar dominio del stack.

## Tiempo Estimado: 3-5 días

## Visión a Futuro
Este contrato será la base para:
- Migrar lógica computacionalmente pesada a Rust
- Verificador ZK en Fase 5
- Demostrar interoperabilidad EVM ↔ WASM

---

### Paso 2.1: Instalar Toolchain Rust + Stylus

**Requisitos:**

1. Instalar Rust:
   ```
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. Agregar target WASM:
   ```
   rustup target add wasm32-unknown-unknown
   ```

3. Instalar cargo-stylus:
   ```
   cargo install cargo-stylus
   ```

4. Verificar instalación:
   ```
   cargo stylus --version
   ```

---

### Paso 2.2: Inicializar Proyecto Stylus

**Crear estructura en `contracts/stylus/`:**

1. Inicializar con template:
   ```
   cd contracts/stylus
   cargo stylus new rikuy-contracts
   ```

2. Estructura resultante:
   ```
   contracts/stylus/
   ├── Cargo.toml
   ├── src/
   │   └── lib.rs         # Entry point
   └── .cargo/
       └── config.toml    # Config para WASM
   ```

---

### Paso 2.3: Escribir Contrato "Hello Rikuy"

**Funcionalidad básica:**
- Almacenar un contador de reportes (uint256)
- Función para incrementar contador
- Función para leer contador
- Emitir evento cuando se incrementa

**Por qué este contrato:**
- Simple pero demuestra storage
- Demuestra eventos
- Base para ReportRegistry en Rust

---

### Paso 2.4: Compilar y Verificar Localmente

**Comandos:**

1. Compilar a WASM:
   ```
   cargo stylus check
   ```

2. Verificar que es deployable:
   ```
   cargo stylus check --wasm-file-path ./target/wasm32-unknown-unknown/release/rikuy_contracts.wasm
   ```

**Errores comunes:**
- WASM demasiado grande → optimizar con `wasm-opt`
- Dependencias no compatibles → usar solo crates `no_std`

---

### Paso 2.5: Deploy a Rikuy Chain

**Comando de deploy:**
```
cargo stylus deploy \
  --private-key=$PRIVATE_KEY \
  --endpoint=$RIKUY_CHAIN_RPC_URL
```

**Guardar:**
- Dirección del contrato Stylus
- TX hash del deploy
- En `deployments/rikuy-chain/addresses.json`

---

### Paso 2.6: Interactuar desde Frontend/Backend

**Verificar interoperabilidad:**
1. Llamar al contrato Stylus desde ethers.js
2. Verificar que los eventos se emiten correctamente
3. Verificar que el storage funciona

**Esto demuestra:**
- Stylus es compatible con tooling EVM existente
- No necesitas cambiar frontend para usar Rust

---

### Entregable de Fase 2

✅ Toolchain Rust + Stylus instalado
✅ Contrato "Hello Rikuy" compilado
✅ Contrato deployado en Rikuy Chain
✅ Interacción verificada desde JS
✅ Documentación de proceso

---

# FASE 3: Migración de Contratos Core

## Objetivo
Desplegar los contratos Solidity existentes en tu L3, manteniendo compatibilidad con el backend actual.

## Tiempo Estimado: 5-7 días

## Visión a Futuro
Esta fase establece:
- Rikuy funcionando 100% en tu propia chain
- Base para reemplazar componentes con Stylus gradualmente
- Backend multi-red operativo

---

### Paso 3.1: Preparar Scripts de Deploy para Rikuy Chain

**Crear: `scripts/deploy-rikuy-chain.sh`**

El script debe:
1. Compilar contratos con Foundry
2. Desplegar en orden correcto:
   - MockUSX (o token real)
   - ReportRegistry
   - GovernmentRegistry
   - Treasury
   - SemaphoreAdapter (o Mock)
   - RikuyCoreV2
3. Configurar permisos (roles)
4. Guardar direcciones en JSON

---

### Paso 3.2: Deploy de Contratos

**Orden de deploy (importante):**

1. **MockUSX** → Token de recompensas
2. **ReportRegistry** → Storage de reportes
3. **GovernmentRegistry** → Registro de gobierno
4. **Treasury** → Manejo de fondos (necesita MockUSX)
5. **MockSemaphoreAdapter** → Verificación ZK (mock por ahora)
6. **RikuyCoreV2** → Core (necesita todos los anteriores)

**Post-deploy:**
1. Configurar RikuyCoreV2 como CORE_ROLE en ReportRegistry
2. Configurar wallet de gobierno con GOVERNMENT_ROLE
3. Configurar relayer con RELAYER_ROLE
4. Fondear Treasury con tokens

---

### Paso 3.3: Actualizar Backend para Rikuy Chain

**Archivos a modificar:**

1. **`backend/src/config/rikuy-chain.config.ts`**
   - RPC URL de tu L3
   - Chain ID
   - Todas las direcciones de contratos

2. **`backend/.env`**
   - Cambiar `NETWORK=rikuy`
   - Agregar nuevas direcciones

3. **`backend/src/contracts/abis/`**
   - Copiar ABIs actualizados desde `out/`

---

### Paso 3.4: Testing E2E en Rikuy Chain

**Flujo a probar:**

1. Crear reporte desde frontend
2. Backend procesa y envía a L3
3. Verificar TX en explorer de tu chain
4. Verificar que el reporte se guardó en ReportRegistry
5. Verificar validación de reportes
6. Verificar resolución por gobierno

---

### Paso 3.5: Documentar Direcciones

**Actualizar: `deployments/rikuy-chain/addresses.json`**

Formato:
```json
{
  "network": "rikuy-chain",
  "chainId": 31337XX,
  "deployedAt": "2026-01-XX",
  "contracts": {
    "MockUSX": "0x...",
    "ReportRegistry": "0x...",
    "Treasury": "0x...",
    "GovernmentRegistry": "0x...",
    "SemaphoreAdapter": "0x...",
    "RikuyCoreV2": "0x...",
    "HelloRikuyStylus": "0x..."
  }
}
```

---

### Entregable de Fase 3

✅ Todos los contratos Solidity deployados en Rikuy Chain
✅ Backend configurado y conectando a L3
✅ Testing E2E pasando
✅ Direcciones documentadas
✅ Frontend funcional (opcional ajustes)

---

# FASE 4: Gas Subsidiado + AI Multi-Provider

## Objetivo
Implementar gas gratuito para usuarios y validación con múltiples IAs.

## Tiempo Estimado: 3-5 días

## Visión a Futuro
- Usuarios nunca pagan gas (UX perfecta)
- Validación más robusta y menos censurable
- Base para "Proof of AI Consensus" futuro

---

### Paso 4.1: Configurar Gas Subsidiado en Orbit

**Opciones:**

**Opción A: Paymaster nativo de Orbit**
- Caldera permite configurar "sponsored gas"
- En dashboard → Gas Settings → Enable Sponsorship
- Fondear el paymaster con ETH

**Opción B: Paymaster personalizado**
- Desplegar contrato Paymaster ERC-4337
- Más control pero más complejo
- Mejor para post-hackathon

**Recomendación**: Opción A para hackathon

---

### Paso 4.2: Implementar AI Multi-Provider en Backend

**Nuevo servicio: `backend/src/services/ai-consensus.service.ts`**

**Flujo:**
1. Recibir imagen de denuncia
2. Enviar a múltiples IAs en paralelo:
   - Gemini (actual)
   - Claude API
   - OpenAI Vision (opcional)
3. Recopilar respuestas
4. Aplicar lógica de consenso:
   - Si 2/3 dicen "válido" → aprobar
   - Si 2/3 dicen "inválido" → rechazar
   - Si no hay consenso → revisión manual

**Guardar en blockchain:**
- Qué IAs validaron
- Resultado de cada una
- Decisión final

---

### Paso 4.3: Modificar Flujo de Creación de Reportes

**Cambios en `report.service.ts`:**

1. Reemplazar llamada a AI individual por AI Consensus
2. Incluir metadata de validación en el reporte
3. Emitir evento con detalles de validación

---

### Paso 4.4: Actualizar Contrato para Metadata de AI

**Modificar ReportRegistry o crear nuevo contrato:**

Agregar campo:
```
struct AIValidation {
    string[] providers;     // ["gemini", "claude"]
    bool[] results;         // [true, true]
    bool finalDecision;     // true
    uint256 timestamp;
}
```

---

### Entregable de Fase 4

✅ Gas subsidiado funcionando (usuarios no pagan)
✅ AI Multi-Provider validando reportes
✅ Metadata de validación on-chain
✅ Fallback si una IA falla

---

# FASE 5: ZK Verifier en Stylus

## Objetivo
Reemplazar MockSemaphoreAdapter con un verificador ZK real escrito en Rust.

## Tiempo Estimado: 2-4 semanas

## Visión a Futuro
- Verificación ZK 10x más eficiente
- Esquemas criptográficos más avanzados posibles
- Diferenciador técnico fuerte

---

### Paso 5.1: Entender Groth16 Verification

**Conceptos clave:**
- Curva elíptica BN254 (alt_bn128)
- Pairing check
- Verification key vs Proving key
- Public inputs

**Recursos:**
- https://docs.circom.io
- https://github.com/arkworks-rs

---

### Paso 5.2: Elegir Librería Rust para ZK

**Opciones:**

| Librería | Pros | Contras |
|----------|------|---------|
| **arkworks** | Completa, bien mantenida | Compleja |
| **bellman** | Usada por Zcash | Menos docs |
| **halo2** | Moderna, sin trusted setup | Diferente esquema |

**Recomendación**: arkworks (más documentación)

---

### Paso 5.3: Implementar Verificador

**Archivo: `contracts/stylus/src/zk_verifier.rs`**

**Funciones:**
1. `verify_proof(proof, public_inputs) -> bool`
2. `set_verification_key(vk)`
3. `is_nullifier_used(nullifier) -> bool`
4. `mark_nullifier_used(nullifier)`

**Consideraciones:**
- El verification key puede ser hardcoded o configurable
- Nullifiers se guardan en storage para evitar double-spend
- Interoperabilidad con RikuyCoreV2 (Solidity)

---

### Paso 5.4: Testing del Verificador

**Tests necesarios:**
1. Proof válido → retorna true
2. Proof inválido → retorna false
3. Nullifier usado → reverts
4. Gas consumption < verificador Solidity

---

### Paso 5.5: Actualizar RikuyCoreV2

**Cambios:**
1. Cambiar `semaphoreAdapter` de Solidity a Stylus
2. Llamada cross-contract EVM → WASM
3. Mantener interfaz igual (IZKVerifier)

---

### Entregable de Fase 5

✅ Verificador ZK en Rust/Stylus
✅ Gas 10x menor que Solidity
✅ Integrado con RikuyCoreV2
✅ Tests passing
✅ Documentación de la criptografía

---

# FASE 6: Descentralización Completa (Post-Hackathon)

## Objetivos Futuros

### 6.1: Secuenciador Descentralizado
- Múltiples operadores de secuenciador
- Staking para participar
- Rotación de líder

### 6.2: Token $RIKUY
- Governance token
- Gas token (reemplazar ETH)
- Staking para validadores

### 6.3: Data Availability Committee (DAC)
- AnyTrust para datos del mapa de calor
- Reducción de costos 10-100x
- Comité de disponibilidad

### 6.4: DAO para Gobernanza
- Votación on-chain
- Propuestas de mejora
- Distribución de rewards

### 6.5: Proof of AI Consensus Real
- Operadores de IA descentralizados
- Staking para operadores
- Slashing por mal comportamiento

---

# Cronograma Sugerido (Hackathon 3 Semanas)

```
Semana 1:
├── Día 1-2: Fase 0 (Reorganización)
├── Día 3-4: Fase 1 (Levantar L3)
└── Día 5-7: Fase 2 (Primer Stylus)

Semana 2:
├── Día 1-4: Fase 3 (Migrar Contratos)
└── Día 5-7: Fase 4 (Gas Sub + AI)

Semana 3:
├── Día 1-4: Fase 5 (ZK Stylus) - versión simplificada
├── Día 5-6: Polish + Testing
└── Día 7: Preparar Demo + Pitch
```

---

# Checklist para Demo/Pitch

## Mínimo Viable (Debe tener):
- [ ] L3 propia funcionando (Rikuy Chain)
- [ ] Contratos Solidity deployados en L3
- [ ] Al menos 1 contrato Stylus funcionando
- [ ] Gas subsidiado para usuarios
- [ ] Flujo completo de crear reporte

## Diferenciadores (Debería tener):
- [ ] AI Multi-Provider validando
- [ ] ZK Verifier básico en Stylus
- [ ] Métricas de gas comparando EVM vs WASM

## Wow Factor (Ideal tener):
- [ ] Mapa de calor en tiempo real
- [ ] ZK Verifier completo en Rust
- [ ] Dashboard de monitoreo de la L3

---

**Última actualización**: Enero 2026
**Versión**: 2.0
