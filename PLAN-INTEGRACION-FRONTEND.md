# 🎨 PLAN DE INTEGRACIÓN FRONTEND - RIKUY

**Fecha:** 14 Diciembre 2024
**Estado:** Contratos deployados en Scroll Sepolia ✅
**Objetivo:** Conectar frontend React con contratos inteligentes

---

## 📊 ESTADO ACTUAL

### ✅ Completado
- [x] Contratos deployados en Scroll Sepolia
- [x] Semaphore Protocol integrado
- [x] Backend con ZK proof verification
- [x] Servicios de ZK proofs en frontend (zkproof.service.ts)
- [x] Hook useIdentity para gestión de identidad
- [x] Tipos TypeScript para Semaphore

### ⏳ Por Implementar
- [ ] Configuración de variables de entorno
- [ ] Hooks para interactuar con contratos
- [ ] Provider de Web3 (ethers.js/viem)
- [ ] Integración con Privy wallet
- [ ] UI para crear reportes
- [ ] UI para validar reportes
- [ ] Mapa con reportes cercanos
- [ ] Panel de usuario (mis reportes, recompensas)

---

## 🏗️ ARQUITECTURA PROPUESTA

```
Frontend (React + Vite)
├── Privy Auth (Wallet Connection)
├── ethers.js / viem (Web3 Provider)
├── Hooks personalizados
│   ├── useContract (interacción con contratos)
│   ├── useIdentity (ya existe)
│   ├── useReports (gestión de reportes)
│   └── useRewards (consultar recompensas)
├── Services
│   ├── zkproof.service.ts (ya existe)
│   ├── report.service.ts (ya existe)
│   ├── contract.service.ts (nuevo - llamadas directas)
│   └── validation.service.ts (nuevo - validar reportes)
└── Pages
    ├── CreateReport (crear reporte con ZK)
    ├── ReportMap (ver reportes cercanos)
    ├── ValidateReport (votar reportes)
    └── Dashboard (mis reportes y recompensas)
```

---

## 📝 PLAN DE IMPLEMENTACIÓN DETALLADO

---

## FASE 1: CONFIGURACIÓN INICIAL (1 día)

### 1.1 Instalar dependencias necesarias

```bash
cd frontend

# Web3 libraries
npm install ethers@^6.13.0
npm install @privy-io/react-auth@^3.8.1  # Ya instalado
npm install wagmi viem@^2.x  # Opcional, alternativa moderna

# Utils
npm install @tanstack/react-query  # Para caché de datos
npm install zustand  # State management ligero
```

### 1.2 Configurar variables de entorno

**Archivo: `frontend/.env`**

```bash
# Network Configuration
VITE_SCROLL_RPC_URL=https://sepolia-rpc.scroll.io
VITE_SCROLL_CHAIN_ID=534351

# Contratos Deployados
VITE_RIKUY_CORE_ADDRESS=0x2b514e6ebaa9a7dEd3f7c6c668708ae92791f478
VITE_TREASURY_ADDRESS=0xb53cd2E6a71E88C4Df5863CD8c257077cD8C1aa2
VITE_REPORT_REGISTRY_ADDRESS=0xdc3c4c07e4675cf1BBDEa627026e92170f9F5AE1
VITE_SEMAPHORE_ADAPTER_ADDRESS=0x6536ee56e3f30A427bc83c208D829d059E8eEDA4
VITE_MOCK_USX_ADDRESS=0xD15ED9ea64B0a1d9535374F27de79111EbE872C1

# Semaphore Protocol
VITE_SEMAPHORE_ADDRESS=0x8A1fd199516489B0Fb7153EB5f075cDAC83c693D
VITE_SEMAPHORE_GROUP_ID=30

# Backend API
VITE_BACKEND_API_URL=http://localhost:3001

# Privy (ya configurado)
VITE_PRIVY_APP_ID=your_privy_app_id
```

### 1.3 Copiar ABIs al frontend

```bash
# Desde la raíz del proyecto
mkdir -p frontend/src/contracts/abis

cp out/RikuyCoreV2.sol/RikuyCoreV2.json frontend/src/contracts/abis/
cp out/Treasury.sol/RikuyTreasury.json frontend/src/contracts/abis/
cp out/ReportRegistry.sol/ReportRegistry.json frontend/src/contracts/abis/
cp out/SemaphoreAdapter.sol/SemaphoreAdapter.json frontend/src/contracts/abis/
cp out/MockUSX.sol/MockUSX.json frontend/src/contracts/abis/

ls -la frontend/src/contracts/abis/
```

---

## FASE 2: SERVICIOS Y HOOKS BASE (2 días)

### 2.1 Crear servicio de contratos

**Archivo: `frontend/src/services/contract.service.ts`**

```typescript
import { ethers } from 'ethers';
import RikuyCoreV2ABI from '@/contracts/abis/RikuyCoreV2.json';
import TreasuryABI from '@/contracts/abis/RikuyTreasury.json';
import ReportRegistryABI from '@/contracts/abis/ReportRegistry.json';

const CONTRACTS = {
  RikuyCoreV2: import.meta.env.VITE_RIKUY_CORE_ADDRESS,
  Treasury: import.meta.env.VITE_TREASURY_ADDRESS,
  ReportRegistry: import.meta.env.VITE_REPORT_REGISTRY_ADDRESS,
};

export class ContractService {
  private provider: ethers.Provider;
  private signer?: ethers.Signer;

  constructor(provider: ethers.Provider, signer?: ethers.Signer) {
    this.provider = provider;
    this.signer = signer;
  }

  // RikuyCoreV2 Contract
  getRikuyCore(withSigner = false) {
    return new ethers.Contract(
      CONTRACTS.RikuyCoreV2,
      RikuyCoreV2ABI.abi,
      withSigner && this.signer ? this.signer : this.provider
    );
  }

  // Treasury Contract
  getTreasury(withSigner = false) {
    return new ethers.Contract(
      CONTRACTS.Treasury,
      TreasuryABI.abi,
      withSigner && this.signer ? this.signer : this.provider
    );
  }

  // ReportRegistry Contract (read-only)
  getReportRegistry() {
    return new ethers.Contract(
      CONTRACTS.ReportRegistry,
      ReportRegistryABI.abi,
      this.provider
    );
  }

  // Obtener estado de un reporte
  async getReportStatus(reportId: string) {
    const rikuyCore = this.getRikuyCore();
    const [status, upvotes, downvotes, isVerified, isResolved] =
      await rikuyCore.getReportStatus(reportId);

    return {
      status: ['Pending', 'Verified', 'Disputed', 'Resolved'][status],
      upvotes: upvotes.toString(),
      downvotes: downvotes.toString(),
      isVerified,
      isResolved,
    };
  }

  // Validar un reporte (requiere firma)
  async validateReport(reportId: string, isValid: boolean) {
    if (!this.signer) throw new Error('Signer required');

    const rikuyCore = this.getRikuyCore(true);
    const tx = await rikuyCore.validateReport(reportId, isValid);
    return await tx.wait();
  }

  // Obtener recompensas por categoría
  async getCategoryReward(categoryId: number) {
    const treasury = this.getTreasury();
    const reward = await treasury.getCategoryReward(categoryId);
    return ethers.formatEther(reward);
  }
}
```

### 2.2 Crear hook useContract

**Archivo: `frontend/src/hooks/useContract.ts`**

```typescript
import { useMemo } from 'react';
import { ethers } from 'ethers';
import { usePrivy } from '@privy-io/react-auth';
import { ContractService } from '@/services/contract.service';

export function useContract() {
  const { authenticated, user } = usePrivy();

  const contractService = useMemo(() => {
    // Provider público de Scroll Sepolia
    const provider = new ethers.JsonRpcProvider(
      import.meta.env.VITE_SCROLL_RPC_URL
    );

    // Si el usuario está autenticado, obtener signer
    // (esto depende de cómo Privy exponga el signer)
    const signer = undefined; // TODO: Obtener de Privy

    return new ContractService(provider, signer);
  }, [authenticated, user]);

  return {
    contractService,
    isConnected: authenticated,
  };
}
```

### 2.3 Crear hook useReports

**Archivo: `frontend/src/hooks/useReports.ts`**

```typescript
import { useState, useEffect } from 'react';
import { useContract } from './useContract';

export function useReports() {
  const { contractService } = useContract();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Obtener reportes cercanos
  const getNearbyReports = async (lat: number, lng: number, radius = 1000) => {
    setLoading(true);
    try {
      // Llamar al backend para obtener reportes
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_API_URL}/api/reports/nearby?lat=${lat}&long=${lng}&radius=${radius}`
      );
      const data = await response.json();
      setReports(data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  // Obtener estado de un reporte específico
  const getReportStatus = async (reportId: string) => {
    return await contractService.getReportStatus(reportId);
  };

  // Validar un reporte
  const validateReport = async (reportId: string, isValid: boolean) => {
    return await contractService.validateReport(reportId, isValid);
  };

  return {
    reports,
    loading,
    getNearbyReports,
    getReportStatus,
    validateReport,
  };
}
```

---

## FASE 3: INTEGRACIÓN CON PRIVY WALLET (1 día)

### 3.1 Configurar Privy Provider

**Archivo: `frontend/src/providers/privyProvider.tsx`** (actualizar)

```typescript
import { PrivyProvider } from '@privy-io/react-auth';
import { scrollSepolia } from 'viem/chains';

export function PrivyProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'dark',
          accentColor: '#676FFF',
        },
        // Configurar Scroll Sepolia
        defaultChain: scrollSepolia,
        supportedChains: [scrollSepolia],
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
```

### 3.2 Hook para obtener signer de Privy

**Archivo: `frontend/src/hooks/useWallet.ts`**

```typescript
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { useMemo } from 'react';

export function useWallet() {
  const { authenticated, user, login, logout } = usePrivy();
  const { wallets } = useWallets();

  const signer = useMemo(() => {
    if (!authenticated || !wallets.length) return null;

    const wallet = wallets[0];
    const provider = new ethers.BrowserProvider(wallet.provider);
    return provider.getSigner();
  }, [authenticated, wallets]);

  const address = wallets[0]?.address || null;

  return {
    authenticated,
    address,
    signer,
    login,
    logout,
  };
}
```

---

## FASE 4: PÁGINAS Y COMPONENTES (3-4 días)

### 4.1 Página: Crear Reporte (YA EXISTE - Mejorar)

**Archivo: `frontend/src/pages/Denuncia/createReport.tsx`** (ya existe, mejorar)

**Mejoras necesarias:**
1. Integrar con `useWallet` para obtener dirección del usuario
2. Mostrar balance de MockUSX (para recompensas)
3. Mostrar estado de la transacción on-chain
4. Agregar botón para agregar identidad al grupo Semaphore (si no está)

### 4.2 Página: Mapa de Reportes

**Archivo: `frontend/src/pages/ReportMap.tsx`** (nuevo)

```typescript
import { useEffect, useState } from 'react';
import { useReports } from '@/hooks/useReports';
import DefaultLayout from '@/layouts/default';

export default function ReportMapPage() {
  const { reports, getNearbyReports, loading } = useReports();
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);

  useEffect(() => {
    // Obtener ubicación del usuario
    navigator.geolocation.getCurrentPosition((pos) => {
      const location = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };
      setUserLocation(location);
      getNearbyReports(location.lat, location.lng, 5000); // 5km radius
    });
  }, []);

  return (
    <DefaultLayout>
      <div className="h-screen">
        <h1>Reportes Cercanos</h1>

        {loading && <p>Cargando reportes...</p>}

        {/* TODO: Integrar con Mapbox/Leaflet */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reports.map((report) => (
            <ReportCard key={report.id} report={report} />
          ))}
        </div>
      </div>
    </DefaultLayout>
  );
}
```

### 4.3 Componente: Validar Reporte

**Archivo: `frontend/src/components/ValidateReport.tsx`** (nuevo)

```typescript
import { useState } from 'react';
import { useReports } from '@/hooks/useReports';
import { useWallet } from '@/hooks/useWallet';
import { addToast } from '@heroui/toast';

interface Props {
  reportId: string;
}

export function ValidateReport({ reportId }: Props) {
  const { validateReport, getReportStatus } = useReports();
  const { authenticated, login } = useWallet();
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleValidate = async (isValid: boolean) => {
    if (!authenticated) {
      login();
      return;
    }

    setLoading(true);
    try {
      const tx = await validateReport(reportId, isValid);

      addToast({
        title: 'Validación enviada',
        description: `Tu voto fue registrado. TX: ${tx.transactionHash}`,
        color: 'success',
      });

      // Actualizar estado
      const newStatus = await getReportStatus(reportId);
      setStatus(newStatus);
    } catch (error: any) {
      addToast({
        title: 'Error',
        description: error.message,
        color: 'danger',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Validar Reporte</h3>

      {status && (
        <div className="mb-4">
          <p>Estado: {status.status}</p>
          <p>Votos a favor: {status.upvotes}</p>
          <p>Votos en contra: {status.downvotes}</p>
        </div>
      )}

      <div className="flex gap-4">
        <button
          onClick={() => handleValidate(true)}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded"
        >
          ✅ Es Real
        </button>
        <button
          onClick={() => handleValidate(false)}
          disabled={loading}
          className="px-4 py-2 bg-red-600 text-white rounded"
        >
          ❌ Es Falso
        </button>
      </div>
    </div>
  );
}
```

### 4.4 Página: Dashboard de Usuario

**Archivo: `frontend/src/pages/Dashboard.tsx`** (nuevo)

```typescript
import { useEffect, useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { useContract } from '@/hooks/useContract';
import DefaultLayout from '@/layouts/default';

export default function DashboardPage() {
  const { address, authenticated } = useWallet();
  const { contractService } = useContract();
  const [balance, setBalance] = useState('0');
  const [myReports, setMyReports] = useState<any[]>([]);

  useEffect(() => {
    if (authenticated && address) {
      // Obtener balance de USX
      loadBalance();
      // Obtener mis reportes del backend
      loadMyReports();
    }
  }, [authenticated, address]);

  const loadBalance = async () => {
    // TODO: Llamar a contract para obtener balance de USX
  };

  const loadMyReports = async () => {
    // TODO: Llamar al backend para obtener reportes del usuario
    const response = await fetch(
      `${import.meta.env.VITE_BACKEND_API_URL}/api/reports/my-reports?address=${address}`
    );
    const data = await response.json();
    setMyReports(data);
  };

  return (
    <DefaultLayout>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-6">Mi Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-100 dark:bg-blue-900 p-6 rounded-lg">
            <h3 className="text-sm font-medium">Balance USX</h3>
            <p className="text-3xl font-bold">{balance} USX</p>
          </div>

          <div className="bg-green-100 dark:bg-green-900 p-6 rounded-lg">
            <h3 className="text-sm font-medium">Reportes Creados</h3>
            <p className="text-3xl font-bold">{myReports.length}</p>
          </div>

          <div className="bg-purple-100 dark:bg-purple-900 p-6 rounded-lg">
            <h3 className="text-sm font-medium">Validaciones</h3>
            <p className="text-3xl font-bold">0</p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Mis Reportes</h2>
          {/* Lista de reportes */}
        </div>
      </div>
    </DefaultLayout>
  );
}
```

---

## FASE 5: TESTING E INTEGRACIÓN (2 días)

### 5.1 Testing Manual

**Checklist de testing:**

```bash
# 1. Conectar Wallet
[ ] Usuario puede conectar wallet con Privy
[ ] Se muestra dirección correctamente
[ ] Se puede desconectar

# 2. Identidad Semaphore
[ ] Se genera identidad al cargar por primera vez
[ ] Se guarda en localStorage
[ ] Se puede exportar/importar

# 3. Crear Reporte
[ ] Usuario puede capturar foto
[ ] Se obtiene ubicación
[ ] Se genera ZK proof
[ ] Se envía al backend
[ ] Backend crea TX on-chain
[ ] Se muestra confirmación con TX hash

# 4. Ver Reportes
[ ] Se cargan reportes cercanos
[ ] Se muestran en mapa
[ ] Se puede ver detalle de reporte

# 5. Validar Reporte
[ ] Usuario puede votar (solo 1 vez por reporte)
[ ] Se muestra TX hash
[ ] Estado se actualiza en tiempo real

# 6. Dashboard
[ ] Se muestra balance de USX
[ ] Se muestran reportes del usuario
[ ] Se muestran validaciones realizadas
```

### 5.2 Implementar manejo de errores

```typescript
// src/utils/errorHandler.ts
export function handleContractError(error: any) {
  if (error.code === 'ACTION_REJECTED') {
    return 'Transacción cancelada por el usuario';
  }
  if (error.message.includes('Already validated')) {
    return 'Ya has validado este reporte';
  }
  if (error.message.includes('Insufficient funds')) {
    return 'Fondos insuficientes para gas';
  }
  return error.message || 'Error desconocido';
}
```

---

## 📦 DEPENDENCIAS ADICIONALES NECESARIAS

```json
{
  "dependencies": {
    "ethers": "^6.13.0",
    "@privy-io/react-auth": "^3.8.1",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.5.0",

    // Opcional: Para mapa
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.1",

    // Ya instaladas
    "@semaphore-protocol/core": "latest",
    "@semaphore-protocol/identity": "latest"
  },
  "devDependencies": {
    "@types/leaflet": "^1.9.8"
  }
}
```

---

## 🎯 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

### Semana 1 (Fundamentos)
1. **Día 1:** Configuración inicial + instalación de dependencias
2. **Día 2:** Crear servicios y hooks base (contract.service, useContract)
3. **Día 3:** Integrar Privy wallet + useWallet hook
4. **Día 4:** Testing de conexión wallet + lectura de contratos

### Semana 2 (Features)
5. **Día 5:** Mejorar página CreateReport con integración completa
6. **Día 6:** Crear página ReportMap con lista de reportes
7. **Día 7:** Implementar componente ValidateReport
8. **Día 8:** Crear Dashboard de usuario

### Semana 3 (Polish)
9. **Día 9-10:** Testing E2E completo
10. **Día 11:** Manejo de errores y UX mejorada
11. **Día 12:** Documentación y deployment

---

## 🚀 SIGUIENTE ACCIÓN INMEDIATA

**Para tu compañero del frontend, debe empezar con:**

1. **Actualizar `.env`** con las direcciones deployadas
2. **Instalar dependencias:** `npm install ethers@^6.13.0`
3. **Copiar ABIs** desde `out/` a `frontend/src/contracts/abis/`
4. **Crear `contract.service.ts`** para interactuar con contratos
5. **Probar lectura básica:** leer `VERIFICATION_THRESHOLD` de RikuyCore

---

## 📝 NOTAS IMPORTANTES

1. **Backend Relayer:** El frontend NO envía transacciones directamente para `createReport()`, solo el backend puede hacerlo (rol RELAYER)
2. **Validaciones:** Los usuarios SÍ pueden enviar transacciones directamente para `validateReport()`
3. **ZK Proofs:** Se generan en el navegador, NO se envían a contratos directamente, van al backend primero
4. **Gasless:** Como usamos Backend Relayer, los usuarios NO pagan gas para crear reportes

---

**¿Listo para empezar la implementación?**
