# 🚀 Rikuy Chain L3 - Guía del Nodo

## 🔗 Datos de Conexión

| Campo | Valor |
|:---|:---|
| **Nombre** | Rikuy Chain |
| **Chain ID** | 313370 |
| **RPC URL** | http://localhost:8449 |
| **Currency Symbol** | ETH (Testnet) |
| **Nitro Version** | v3.6.5-89cef87 |

## ⛽ Configuración de Gas

| Parámetro | Valor |
|:---|:---|
| **Min Base Fee** | 1 wei (~0 gwei) |
| **Speed Limit** | 7,000,000 gas/sec |
| **Costo por tx** | ~$0.00000000001 (prácticamente GRATIS) |

### Costos para el Operador (Rikuy)

| Escenario | Txs/día | Costo mensual |
|:---|:---|:---|
| 100 usuarios × 5 txs | 500 | ~$1.50 |
| 1,000 usuarios × 10 txs | 10,000 | ~$30 |
| 10,000 usuarios × 10 txs | 100,000 | ~$300 |
| 100,000 usuarios × 10 txs | 1,000,000 | ~$3,000 |

> **Nota:** Los costos del operador vienen del batch posting a L2 (Arbitrum Sepolia), no del gas L3. El gas L3 es prácticamente $0.

## 🔑 Credenciales

### Deployer, Staker & Chain Owner
- **Address**: `0x8A387ef9acC800eea39E3E6A2d92694dB6c813Ac`
- Private Key: En `.env` principal

### Batch Poster (Wallet Secundaria)
- **Address**: `0x9b1290B49465E9f4C92A48044f0A62b790c3c0Bc`
- Private Key: `0x1c192aee49be88ae0de62f4af55fbab98b9f1986957730863cb315ef3c752099`

## 🌉 Token Bridge

| Contrato | Arbitrum Sepolia (L2) | Rikuy Chain (L3) |
|:---|:---|:---|
| Router | `0x6bf1004983F9B01f575D6477471aE10f5b77506b` | `0xc9984d8C2f4b43BE998E67CaEC5923afb7DDCd84` |
| Standard Gateway | `0x0284F0f9e435b5Af92a953cF1E0A6707A550C1e7` | `0x362B75E28328a70655F785c0C96a09A8c70c59a1` |
| Custom Gateway | `0x9EC3704c56dB33a41D723a96070d229cBf47ecfC` | `0x035dfaeABCCF20DcA41f86bC4ED6844eE207e5D1` |
| WETH Gateway | `0x5C5b3Ee10DB2c41C1E513f4719238DFAb33835C5` | `0x00108461B1BBc13785612d991729d41037193fba` |
| Multicall | `0xce1CAd780c529e66e3aa6D952a1ED9A6447791c1` | `0xE103811CC85B7982284C6a8BFA83110Cc0661A41` |

## ⚠️ Configuración Actual

### RPC Provider (L2 Parent Chain)
- **URL**: `https://arb-sepolia.g.alchemy.com/v2/CXT...` (Alchemy Free Tier)
- ⚠️ Limitación: eth_getLogs con rango máximo de 10 bloques. Para operaciones que requieran rangos mayores, usar temporalmente el RPC público (`https://sepolia-rollup.arbitrum.io/rpc`).

## 🐳 Comandos Docker

```bash
# Ver logs en tiempo real
cd ~/Desktop/orbit-setup-script && docker compose logs -f nitro

# Reiniciar nodo
docker compose restart nitro

# Detener nodo
docker compose stop nitro

# Destruir todo (¡BORRA datos de la chain!)
docker compose down -v
```

## 🗺️ Arquitectura UX para Bolivia

### Experiencia del Usuario Final
1. **Sin gas**: Transacciones cuestan $0.00 para el usuario ✅
2. **Sin wallet crypto**: Se usa wallet embebida (email/Google login) 🔜
3. **Sin conocimiento técnico**: Toda la complejidad es invisible 🔜

### Stack Técnico
```
[Usuario en Bolivia]
    ↓ (email login → wallet embebida)
[Frontend Rikuy App]
    ↓ (transacciones con gas ~0)
[Rikuy Chain L3] ← Chain ID: 313370
    ↓ (batch posting automático)  
[Arbitrum Sepolia L2] ← Parent Chain
    ↓ (data availability)
[Ethereum Sepolia L1]
```
