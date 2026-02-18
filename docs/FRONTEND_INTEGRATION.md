# Rikuy Frontend Integration Guide

## Stack
- **Chain**: Rikuy Chain L3 (Arbitrum Orbit, Chain ID `313370`)
- **Auth**: Privy embedded wallets
- **Identity**: Reclaim Protocol (ciudadaniadigital.bo)
- **Backend**: Express API at `VITE_BACKEND_API_URL`

## Anonymous Report Flow

### `POST /api/reports` (multipart/form-data)

**Headers:**
```
x-user-address: <privy embedded wallet address>
```

**FormData fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `photo` | File (JPEG) | Yes | Image evidence |
| `category` | string ("0"-"4") | Yes | Category ID |
| `description` | string | No | Optional description |
| `location` | JSON string | Yes | `{ lat, long, accuracy }` |

**Response (success):**
```json
{
  "success": true,
  "reportId": "0x...",
  "status": "confirmado",
  "recompensa": { "puntos": 10, "mensaje": "..." },
  "mensaje": "Denuncia registrada exitosamente",
  "_internal": {
    "arkivTxId": "0x...",
    "txHash": "0x...",
    "gasUsed": "...",
    "gasCost": "..."
  }
}
```

The backend handles: IPFS upload, AI image analysis, Arkiv storage, commitment generation (`keccak256(wallet + salt + nonce)`), nullifier generation, and blockchain TX via gasless relayer.

## Identity Verification Flow

### `POST /api/identity/verify` (JSON)

**Headers:**
```
Content-Type: application/json
x-user-address: <privy embedded wallet address>
```

**Body:**
```json
{
  "ci": "12345678",
  "fullName": "Juan Perez",
  "walletAddress": "0x..."
}
```

**Response (success):**
```json
{
  "success": true,
  "data": {
    "verified": true,
    "commitment": "0x...",
    "txHash": "0x...",
    "status": "VERIFIED",
    "verifiedAt": "2025-..."
  }
}
```

### `GET /api/identity/status?walletAddress=0x...`

Returns verification status for a wallet.

## Categories (canonical)

| ID | Name | Constant |
|----|------|----------|
| 0 | Infraestructura | `INFRAESTRUCTURA` |
| 1 | Inseguridad | `INSEGURIDAD` |
| 2 | Basura | `BASURA` |
| 3 | Corrupcion | `CORRUPCION` |
| 4 | Otro | `OTRO` |

Defined in: `frontend/src/config/rikuy.ts` and `backend/src/types/index.ts`

## localStorage Keys

| Key | Value | Set by |
|-----|-------|--------|
| `rikuy_verified` | `"true"` | Identity verification page |
| `rikuy_commitment` | `"0x..."` | Identity verification page |

Defined in: `frontend/src/config/rikuy.ts` (`STORAGE_KEYS`)

## Contract Addresses

See `frontend/src/config/contracts.json` for deployed addresses. After a fresh deploy via `script/DeployAllL3.s.sol`, this file is auto-generated.

Key contracts:
- **RikuyCoreV2** (Solidity, UUPS Proxy) — main entry point
- **ReportRegistry** (Solidity, UUPS Proxy) — stores report metadata
- **AnonymousReport** (Stylus/Rust) — stores anonymous report data
- **CitizenZkVerifier** (Solidity) — Reclaim proof verification
- **GovernmentRegistry** (Solidity) — government entity management

## Reclaim Verification (on-chain)

The `ReclaimVerification` component (`frontend/src/components/ReclaimVerification.tsx`) handles on-chain ZK verification via `CitizenZkVerifier.verifyProof()`.

**Gap**: After on-chain verification succeeds, the frontend should ALSO call `POST /api/identity/verify` with the user's CI and name to register the anonymous commitment in the backend. This step is currently not wired up.

## Key Config Files

- `frontend/src/config/rikuy.ts` — backend URL, categories, storage keys
- `frontend/src/config/contracts.json` — deployed contract addresses
- `frontend/.env` — environment variables (Privy, Reclaim, RPC)
