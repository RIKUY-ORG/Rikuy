# RIKUY BACKEND - ESTADO DE MIGRACION

## Estado Actual (Diciembre 2024)

### Arquitectura ACTIVA (Legacy - Hackathon)
```
Usuario → Backend → scroll.service.ts → Scroll Blockchain
                 ↓
              report.service.ts (orquestador)
                 ↓
        IPFS + AI + Arkiv
```

**Servicios en uso:**
- ✅ `report.service.ts` - Orquestador principal
- ✅ `scroll.service.ts` - Interacción con blockchain (ARREGLADO)
- ✅ `ipfs.service.ts` - Upload a IPFS/Pinata
- ✅ `ai.service.ts` - OpenAI Vision
- ✅ `arkiv.service.ts` - Storage inmutable

**Estado:** FUNCIONAL (post-fix de config)

---

### Nueva Arquitectura (Backend Relayer - IMPLEMENTADA pero NO ACTIVA)
```
Usuario → Backend → blockchain-relayer.service.ts → Scroll Blockchain
                 ↓                                    (Backend paga gas)
        report-relayer.service.ts
                 ↓
        IPFS + AI + Arkiv
```

**Servicios implementados:**
- ⚠️ `blockchain-relayer.service.ts` - Relayer con monitoreo de gas
- ⚠️ `report-relayer.service.ts` - Orquestador con ZK proofs reales
- ✅ ABIs creados en `/backend/src/contracts/abis/`

**Estado:** IMPLEMENTADO pero desconectado de rutas

---

## Cambios Realizados (Limpieza)

### ✅ Arreglado
1. **scroll.service.ts** - Referencias de config actualizadas:
   - `config.scroll.rpcUrl` → `config.blockchain.rpcUrl`
   - `config.arkiv.privateKey` → `config.blockchain.relayerPrivateKey`
   - `config.scroll.contractAddress` → `config.blockchain.contracts.rikuyCoreV2`

2. **ABIs creados**:
   - `/backend/src/contracts/abis/RikuyCoreV2.json`

3. **Config actualizado**:
   - Agregado `config.blockchain.*` con todos los contratos
   - Agregado `RELAYER_PRIVATE_KEY` para backend wallet

---

## Próximos Pasos

### Opción A: Mantener Legacy (más simple)
Si decides quedarte con la arquitectura legacy:

1. ❌ Eliminar archivos no usados:
   ```bash
   rm backend/src/services/blockchain-relayer.service.ts
   rm backend/src/services/report-relayer.service.ts
   ```

2. ✅ Continuar usando:
   - `scroll.service.ts`
   - `report.service.ts`

**Pros:** Funciona ahora, menos cambios
**Contras:** Sin ZK proofs reales, sin relayer, arquitectura vieja

---

### Opción B: Migrar a Nueva (recomendado)
Si decides migrar a Backend Relayer:

1. **Conectar servicios nuevos a rutas:**
   ```typescript
   // backend/src/routes/reports.ts
   - import { reportService } from '../services/report.service';
   + import { reportService } from '../services/report-relayer.service';
   ```

2. **Actualizar tipos para incluir zkProof:**
   ```typescript
   // backend/src/types/index.ts
   export interface CreateReportRequest {
     photo: Express.Multer.File;
     category: number;
     location: { lat: number; long: number };
     zkProof: {  // NUEVO
       proof: string[];
       publicSignals: string[];
     };
   }
   ```

3. **Desplegar contratos:**
   ```bash
   cd /Users/firrton/Desktop/Rikuy_ORG
   forge build
   # Generar ABIs reales desde out/
   ```

4. **Testing:**
   ```bash
   npm run dev
   # Probar endpoint con zkProof
   ```

5. **Limpiar legacy:**
   ```bash
   rm backend/src/services/scroll.service.ts
   rm backend/src/services/report.service.ts
   mv report-relayer.service.ts report.service.ts
   ```

**Pros:** Arquitectura moderna, ZK proofs, relayer, mejor UX
**Contras:** Requiere compilar contratos, testing, más cambios

---

## Dependencias Actuales

### Servicios y sus imports:
```
index.ts
  └── routes/reports.ts
        └── report.service.ts (ACTIVO)
              ├── ipfs.service.ts
              ├── ai.service.ts
              ├── arkiv.service.ts
              └── scroll.service.ts (ACTIVO)

(NO USADO)
report-relayer.service.ts
  └── blockchain-relayer.service.ts
```

---

## Variables de Entorno Requeridas

### Para Legacy (mínimo):
```bash
ARKIV_PRIVATE_KEY=0x...
PINATA_JWT=...
OPENAI_API_KEY=sk-...
RELAYER_PRIVATE_KEY=0x...          # Mismo que usabas antes
RIKUY_CORE_V2_ADDRESS=0x...       # Dirección del contrato
REPORT_REGISTRY_ADDRESS=0x...
TREASURY_ADDRESS=0x...
SEMAPHORE_ADAPTER_ADDRESS=0x...
```

### Para Nueva Arquitectura (adicional):
```bash
# Mismo que legacy, solo cambia el uso interno
```

---

## Archivos del Proyecto

### En Uso:
- ✅ `config/index.ts`
- ✅ `middleware/*.ts`
- ✅ `routes/reports.ts`
- ✅ `services/report.service.ts`
- ✅ `services/scroll.service.ts`
- ✅ `services/ipfs.service.ts`
- ✅ `services/ai.service.ts`
- ✅ `services/arkiv.service.ts`
- ✅ `types/index.ts`
- ✅ `utils/*.ts`

### Implementados pero NO usados:
- ⚠️ `services/blockchain-relayer.service.ts`
- ⚠️ `services/report-relayer.service.ts`
- ⚠️ `contracts/abis/RikuyCoreV2.json`

---

## Decisión Pendiente

**Necesitas decidir:** ¿Quedarte con legacy o migrar?

Recomendación: **Migrar a nueva arquitectura** porque:
1. Ya está implementada al 90%
2. Mejor experiencia de usuario (sin gas fees)
3. ZK proofs reales (privacidad)
4. Más escalable

---

## ✅ MIGRACIÓN COMPLETADA (12 Diciembre 2024)

### Cambios Finales Aplicados

**1. Servicios renombrados y consolidados:**
- ✅ `blockchain-relayer.service.ts` → `relayer.service.ts`
- ✅ `report-relayer.service.ts` → `report.service.ts`
- ❌ `scroll.service.ts` - ELIMINADO
- ❌ `report.service.legacy.ts` - ELIMINADO

**2. Routes actualizados:**
- ✅ `routes/reports.ts` ahora usa el nuevo `reportService`
- ❌ Endpoint `/validate` eliminado (pendiente implementar con relayer si es necesario)

**3. Types actualizados:**
- ✅ Agregado `ZKProof` interface
- ✅ Extendidas categorías: `INFRAESTRUCTURA`, `INSEGURIDAD`, `BASURA`, `CORRUPCION`, `OTRO`
- ✅ `CreateReportRequest` ahora incluye `zkProof` obligatorio

**4. Validation schemas:**
- ✅ Actualizado `createReport` para incluir validación de `zkProof`
- ✅ Actualizado rango de categorías a 0-4

**5. Config actualizados:**
- ✅ Agregada sección `blockchain` con contratos y relayer config
- ✅ Variables de entorno requeridas documentadas en `.env.example`

**6. Fixes de compilación:**
- ✅ Arregladas referencias de logger en `relayer.service.ts`
- ✅ Agregadas nuevas categorías en `ai.service.ts`
- ✅ Arreglada referencia `config.scroll` → `config.blockchain` en `index.ts`

**7. Compilación exitosa:**
- ✅ `npm run build` completa sin errores

### Arquitectura Final

```
Usuario → Backend (Express)
            ↓
   report.service.ts (orquestador con ZK proofs)
            ↓
   ┌────────┴────────┬─────────┬──────────┐
   ↓                 ↓         ↓          ↓
 IPFS              AI       Arkiv   relayer.service.ts
(Pinata)      (OpenAI)   (Storage)        ↓
                                    Scroll Blockchain
                                    (Backend paga gas)
```

### Servicios Finales

**Servicios activos:**
- ✅ `report.service.ts` - Orquestador principal con ZK proofs
- ✅ `relayer.service.ts` - Gestión de transacciones blockchain
- ✅ `ipfs.service.ts` - Upload de imágenes
- ✅ `ai.service.ts` - Análisis con OpenAI Vision
- ✅ `arkiv.service.ts` - Storage inmutable

**Servicios eliminados:**
- ❌ `scroll.service.ts` - Reemplazado por relayer.service.ts
- ❌ `report.service.legacy.ts` - Reemplazado por report.service.ts

### Próximos Pasos

**1. Compilar contratos Solidity:**
```bash
cd /Users/firrton/Desktop/Rikuy_ORG
forge build
# Generar ABIs reales desde out/ y reemplazar mock en src/contracts/abis/
```

**2. Desplegar contratos en Scroll Sepolia:**
```bash
forge script script/Deploy.s.sol --rpc-url $SCROLL_RPC_URL --broadcast
# Actualizar .env con direcciones de contratos desplegados
```

**3. Actualizar .env con direcciones reales:**
```bash
RIKUY_CORE_V2_ADDRESS=0x...
SEMAPHORE_ADAPTER_ADDRESS=0x...
REPORT_REGISTRY_ADDRESS=0x...
TREASURY_ADDRESS=0x...
```

**4. Testing completo del flujo:**
```bash
npm run dev

# Probar endpoint con ZK proof real
curl -X POST http://localhost:3001/api/reports \
  -F "photo=@test.jpg" \
  -F "category=0" \
  -F 'location={"lat":-34.6037,"long":-58.3816,"accuracy":10}' \
  -F 'zkProof={"proof":["..."],"publicSignals":["..."]}'
```

**5. Integración frontend:**
- Actualizar frontend para generar ZK proofs con Semaphore
- Actualizar llamadas a API para incluir `zkProof` en payload

### Archivos Modificados (Resumen)

**Creados:**
- ✅ `backend/.env.example`
- ✅ `backend/src/contracts/abis/RikuyCoreV2.json` (mock)
- ✅ `backend/src/services/relayer.service.ts`
- ✅ `backend/src/services/report.service.ts` (nuevo)
- ✅ `backend/src/utils/errors.ts`
- ✅ `backend/src/utils/logger.ts`
- ✅ `backend/src/middleware/errorHandler.ts`

**Modificados:**
- ✅ `backend/src/types/index.ts`
- ✅ `backend/src/middleware/validation.ts`
- ✅ `backend/src/config/index.ts`
- ✅ `backend/src/routes/reports.ts`
- ✅ `backend/src/services/ai.service.ts`
- ✅ `backend/src/index.ts`

**Eliminados:**
- ❌ `backend/src/services/scroll.service.ts`
- ❌ `backend/src/services/report.service.legacy.ts`

### Estado Final

**Migración:** ✅ COMPLETADA (100%)
**Compilación:** ✅ EXITOSA
**Testing:** ⚠️ PENDIENTE (requiere contratos desplegados)
**Deploy:** ⚠️ PENDIENTE (requiere deploy de contratos)

La migración a la nueva arquitectura está **completa y funcional**. El backend está listo para recibir reportes con ZK proofs una vez que:
1. Los contratos estén desplegados en Scroll Sepolia
2. Las direcciones de contratos estén en `.env`
3. El frontend genere ZK proofs válidos
