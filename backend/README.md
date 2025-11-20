# 🚀 RIKUY Backend API

Backend profesional para la plataforma de reportes ciudadanos RIKUY.

## 📦 Stack Tecnológico

- **Node.js + Express** - API REST
- **TypeScript** - Type safety
- **Arkiv SDK** - Storage inmutable
- **Pinata** - IPFS para imágenes
- **OpenAI Vision** - IA para descripción automática
- **Ethers.js** - Integración con Scroll blockchain
- **Redis** - Rate limiting
- **Zod** - Validación de datos

---

## 🚦 Instalación Rápida

```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus keys
npm run dev
```

---

## 🔑 Variables de Entorno

```env
# Server
PORT=3001

# Arkiv (Mendoza Testnet)
ARKIV_RPC_URL=https://mendoza.hoodi.arkiv.network/rpc
ARKIV_PRIVATE_KEY=0x...

# Pinata (IPFS)
PINATA_JWT=eyJ...

# OpenAI
OPENAI_API_KEY=sk-...

# Scroll
SCROLL_RPC_URL=https://sepolia-rpc.scroll.io
RIKUY_CONTRACT_ADDRESS=0x...

# Redis
REDIS_URL=redis://localhost:6379
```

---

## 📡 API Endpoints

### 1. Crear Reporte (Principal)

**POST** `/api/reports`

**Body** (multipart/form-data):
```
photo: File (imagen, max 10MB)
category: 0 | 1 | 2
  0 = Infraestructura
  1 = Inseguridad
  2 = Basura
description: string (opcional, máx 500 chars)
location: JSON string
  {
    "lat": -34.6037,
    "long": -58.3816,
    "accuracy": 10
  }
userSecret: string (opcional, para ZK proof)
```

**Response**:
```json
{
  "success": true,
  "reportId": "0xabc123...",
  "arkivTxId": "0xdef456...",
  "scrollTxHash": "0x789...",
  "estimatedReward": "$5000",
  "message": "Reporte creado exitosamente..."
}
```

**Ejemplo con cURL**:
```bash
curl -X POST http://localhost:3001/api/reports \
  -F "photo=@/path/to/image.jpg" \
  -F "category=1" \
  -F "description=Venta de drogas en la esquina" \
  -F 'location={"lat":-34.6037,"long":-58.3816,"accuracy":10}'
```

---

### 2. Obtener Reporte

**GET** `/api/reports/:id`

**Response**:
```json
{
  "success": true,
  "data": {
    "reportId": "0xabc...",
    "blockchain": {
      "status": 1,
      "upvotes": 7,
      "downvotes": 0,
      "isVerified": true,
      "isResolved": false
    },
    "data": {
      "protocol": "rikuy-v1",
      "evidence": {
        "imageIPFS": "Qm...",
        "description": "...",
        "aiTags": ["drogas", "peligro"]
      },
      "location": {...}
    }
  }
}
```

---

### 3. Validar Reporte

**POST** `/api/reports/:id/validate`

**Body**:
```json
{
  "reportId": "0xabc...",
  "isValid": true
}
```

**Response**:
```json
{
  "success": true,
  "message": "Validación registrada",
  "txHash": "0x..."
}
```

---

### 4. Reportes Cercanos

**GET** `/api/reports/nearby?lat=-34.6&long=-58.4&radiusKm=5`

**Query Params**:
- `lat`: number (required)
- `long`: number (required)
- `radiusKm`: number (default: 5, max: 50)
- `category`: 0 | 1 | 2 (optional)
- `limit`: number (default: 50, max: 100)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "reportId": "...",
      "category": {...},
      "evidence": {...},
      "location": {...}
    }
  ]
}
```

---

## 🔒 Seguridad

### Rate Limiting

- **Global**: 5 requests / minuto por IP
- **Reportes**:
  - Máximo 5 reportes / día
  - Máximo 2 reportes / hora
  - Mínimo 30 min entre reportes

### Validaciones

- ✅ Solo imágenes (jpg, png, webp)
- ✅ Tamaño máximo: 10MB
- ✅ Geofencing: Solo Argentina
- ✅ Content moderation (OpenAI)
- ✅ Duplicate detection (perceptual hash)
- ✅ EXIF stripping (privacidad)

---

## 🏗️ Arquitectura del Flujo

```
Usuario sube foto
      ↓
1. Upload a IPFS (Pinata)
   - Limpia EXIF
   - Optimiza imagen
   - Genera hash
      ↓
2. IA analiza imagen (OpenAI Vision)
   - Descripción automática
   - Tags relevantes
   - Nivel de severidad
      ↓
3. Guarda en Arkiv (inmutable)
   - Metadata completa
   - Evidencia permanente
      ↓
4. Crea en Scroll (blockchain)
   - Smart contract
   - ZK proof (mock por ahora)
      ↓
5. Retorna resultado
   - Report ID
   - TX hashes
   - Reward estimado
```

---

## 🧪 Testing

```bash
# Health check
curl http://localhost:3001/health

# Crear reporte de prueba
npm run test:report

# Ver logs
npm run dev  # modo watch con logs
```

---

## 🐛 Troubleshooting

### Error: "ARKIV_PRIVATE_KEY not set"
→ Configura `.env` con tu private key

### Error: "Redis connection failed"
→ Instala Redis: `brew install redis && redis-server`

### Error: "Insufficient funds"
→ Tu wallet necesita ETH en Scroll Sepolia

### Error: "Rate limit exceeded"
→ Espera 1 minuto o usa otra IP

---

## 📊 Monitoreo

El backend logea todo en consola con formato:
```
[Service] Action: details
```

Ejemplo:
```
[IPFS] Uploading image: photo.jpg
[AI] Image analyzed: Bache profundo en calle...
[Arkiv] Report stored: 0xabc...
[Scroll] TX sent: 0xdef...
```

---

## 🚀 Deploy (Producción)

```bash
npm run build
npm start
```

Usar PM2 para producción:
```bash
pm2 start dist/index.js --name rikuy-backend
```

---

## 📝 TODO

- [ ] Implementar ZK proof real (Circom)
- [ ] Agregar websockets para notificaciones en tiempo real
- [ ] Agregar cache de queries (Redis)
- [ ] Implementar backup automático de IPFS
- [ ] Agregar analytics dashboard

---

¿Preguntas? Check la documentación principal en `/ARQUITECTURA.md`
