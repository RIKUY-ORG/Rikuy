# FLUJO DE ALMACENAMIENTO DE MEDIOS - RIKUY

**Objetivo:** Almacenar fotos, audios y videos de reportes de manera inmutable y permanente, con validación automática de contenido y metadatos accesibles.

---

## 1. ARQUITECTURA DE ALMACENAMIENTO

### Decisión de Diseño: ¿Por qué Arkiv + Pinata?

**ARKIV (Storage Inmutable):**
- ✅ Almacenamiento PERMANENTE (10+ años garantizados)
- ✅ Inmutable (no se puede modificar/eliminar)
- ✅ Queryable (buscar por metadata)
- ✅ Prueba criptográfica de existencia
- 🎯 **USO:** Archivo del contenido multimedia COMPLETO

**PINATA (IPFS + Metadata):**
- ✅ IPFS descentralizado (acceso global)
- ✅ Gateway rápido para previsualización
- ✅ Metadata flexible (JSON)
- ✅ Búsqueda por tags
- 🎯 **USO:** Hash IPFS + Metadata del reporte

### Estrategia Dual

```
┌─────────────────────────────────────────────────────┐
│                   USUARIO                            │
│              (Captura foto/audio/video)              │
└────────────────────┬────────────────────────────────┘
                     ↓
         ┌───────────────────────┐
         │   BACKEND RIKUY       │
         └───────────┬───────────┘
                     ↓
         ┌───────────────────────┐
         │  1. VALIDACIÓN OpenAI  │
         │  - Moderación contenido │
         │  - Detección objetos    │
         │  - Descripción auto     │
         └───────────┬───────────┘
                     ↓
         ┌───────────────────────┐
         │  2. PROCESAMIENTO      │
         │  - Comprimir imagen    │
         │  - Extraer EXIF        │
         │  - Generar hash        │
         │  - Detección duplicados│
         └───────────┬───────────┘
                     ↓
    ┌────────────────┴────────────────┐
    ↓                                  ↓
┌───────────┐                  ┌───────────┐
│  PINATA   │                  │  ARKIV    │
│  (IPFS)   │                  │ (Storage) │
└───────────┘                  └───────────┘
    │                                  │
    ↓                                  ↓
┌─────────────────────────────────────────┐
│         METADATA JSON                   │
│  {                                      │
│    ipfsHash: "Qm...",                  │
│    arkivTxId: "0x...",                 │
│    description: "...",                 │
│    tags: [...],                        │
│    location: {...}                     │
│  }                                      │
└─────────────────────────────────────────┘
                     ↓
         ┌───────────────────────┐
         │  3. BLOCKCHAIN         │
         │  - Crear reporte       │
         │  - Registrar hash      │
         │  - Emitir evento       │
         └───────────┬───────────┘
                     ↓
         ┌───────────────────────┐
         │  4. RESPUESTA          │
         │  - Report ID           │
         │  - URLs acceso         │
         │  - Estado validación   │
         └───────────────────────┘
```

---

## 2. FLUJO DETALLADO PASO A PASO

### FASE 1: RECEPCIÓN Y VALIDACIÓN (1-3 segundos)

```typescript
POST /api/reports
{
  photo: File,              // 📸 Foto del reporte
  audio: File?,             // 🎤 Audio opcional (descripción usuario)
  video: File?,             // 🎥 Video opcional (casos graves)
  category: number,         // 0-4
  location: {
    lat: -16.5,
    long: -68.15,
    accuracy: 10
  },
  description: string?,     // Descripción manual (opcional)
  zkProof: {...}
}
```

**1.1 Validaciones Iniciales**
```typescript
// backend/src/middleware/upload.ts
✓ Verificar tamaño archivo:
  - Foto: max 10 MB
  - Audio: max 5 MB
  - Video: max 50 MB

✓ Verificar formato:
  - Foto: jpg, png, webp, heic
  - Audio: mp3, m4a, wav, ogg
  - Video: mp4, mov, webm

✓ Verificar que no está corrupto

✓ Rate limiting:
  - Máximo 5 reportes/día por usuario
  - Máximo 2 reportes/hora
```

**1.2 Validación con OpenAI**
```typescript
// backend/src/services/ai.service.ts

const validation = await aiService.validateMedia({
  image: photo,
  audio: audio,
  video: video
});

// OpenAI responde:
{
  isValid: boolean,           // ✅ true = apto, ❌ false = rechazar
  reason: string?,            // Si rechazado: "explicit_content" | "not_relevant" | "quality_too_low"
  contentType: string,        // "infrastructure" | "crime" | "garbage" | etc.
  description: string,        // Descripción auto-generada
  tags: string[],            // ["bache", "calle", "peligroso"]
  severity: number,          // 1-10 (qué tan grave es)
  confidence: number,        // 0-1 (confianza del modelo)
  detectedObjects: string[], // ["car", "street", "pothole"]
  hasPeople: boolean,        // ⚠️ Para privacidad
  isExplicit: boolean,       // ⚠️ Contenido explícito
  isRelevant: boolean        // ⚠️ Es relevante para reporte ciudadano
}
```

**1.3 Moderación de Contenido**
```typescript
// RECHAZAR si:
❌ isExplicit === true        (contenido sexual/violento)
❌ isRelevant === false       (selfies, memes, spam)
❌ confidence < 0.6           (modelo no está seguro)
❌ quality_score < 0.5        (imagen muy borrosa/oscura)

// ACEPTAR si:
✅ isValid === true
✅ contentType matches category
✅ No viola términos de servicio
```

---

### FASE 2: PROCESAMIENTO DE MEDIOS (2-5 segundos)

**2.1 Procesamiento de Imagen**
```typescript
// backend/src/services/media.service.ts

// A. Comprimir imagen (ahorrar espacio)
const compressed = await sharp(photo)
  .resize(1920, 1080, {
    fit: 'inside',
    withoutEnlargement: true
  })
  .jpeg({ quality: 85 })
  .toBuffer();

// B. Extraer metadata EXIF
const exif = await sharp(photo).metadata();
const gpsData = exif.exif?.GPSLatitude ?
  parseGPS(exif.exif) : null;

// C. Strip EXIF sensible (privacidad)
const sanitized = await sharp(compressed)
  .rotate() // Auto-rotar según EXIF
  .withMetadata({
    exif: {} // Remover EXIF completo
  })
  .toBuffer();

// D. Generar hashes
const fileHash = crypto
  .createHash('sha256')
  .update(sanitized)
  .digest('hex');

const perceptualHash = await phash(sanitized); // Para duplicados

// E. Detección de duplicados
const isDuplicate = await checkDuplicate(perceptualHash);
if (isDuplicate) {
  throw new Error('DUPLICATE_REPORT');
}
```

**2.2 Procesamiento de Audio (si existe)**
```typescript
// A. Convertir a formato estándar
const standardized = await ffmpeg(audio)
  .audioCodec('libmp3lame')
  .audioBitrate('128k')
  .toBuffer();

// B. Transcribir con OpenAI Whisper
const transcription = await openai.audio.transcriptions.create({
  file: audio,
  model: "whisper-1",
  language: "es"
});

// C. Validar transcripción
const analysis = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{
    role: "user",
    content: `Analiza si esta transcripción es un reporte válido: "${transcription.text}"`
  }]
});
```

**2.3 Procesamiento de Video (si existe)**
```typescript
// A. Extraer frame representativo (thumbnail)
const thumbnail = await ffmpeg(video)
  .screenshots({
    timestamps: ['00:00:02'],
    size: '640x480'
  });

// B. Validar duración (max 2 minutos)
const duration = await getVideoDuration(video);
if (duration > 120) {
  throw new Error('VIDEO_TOO_LONG');
}

// C. Comprimir video
const compressed = await ffmpeg(video)
  .videoCodec('libx264')
  .size('720x?')
  .videoBitrate('1000k')
  .toBuffer();
```

---

### FASE 3: ALMACENAMIENTO DUAL (5-10 segundos)

**3.1 Upload a PINATA (IPFS)**
```typescript
// backend/src/services/ipfs.service.ts

// A. Preparar metadata
const metadata = {
  name: `Rikuy Report ${Date.now()}`,
  keyvalues: {
    reportId: reportId,
    category: categoryName,
    location: `${lat},${long}`,
    timestamp: new Date().toISOString(),
    fileType: 'image/jpeg',
    fileSize: compressed.length,
    fileHash: fileHash
  }
};

// B. Upload archivo a IPFS
const pinataResult = await pinata.pinFileToIPFS(compressed, {
  pinataMetadata: metadata,
  pinataOptions: {
    cidVersion: 1  // Usar CIDv1 (más moderno)
  }
});

// C. Resultado
const ipfsData = {
  ipfsHash: pinataResult.IpfsHash,     // "QmXxx..." o "bafxxx..."
  pinSize: pinataResult.PinSize,       // Tamaño en bytes
  timestamp: pinataResult.Timestamp,   // Fecha de pin
  url: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
  isDuplicate: pinataResult.isDuplicate
};

// D. Pin metadata JSON también
const metadataJson = {
  reportId,
  description: aiValidation.description,
  tags: aiValidation.tags,
  severity: aiValidation.severity,
  location: { lat, long },
  timestamp: new Date().toISOString(),
  category: categoryName,
  aiAnalysis: aiValidation,
  fileHash,
  ipfsHash: ipfsData.ipfsHash
};

const metadataIpfs = await pinata.pinJSONToIPFS(metadataJson, {
  pinataMetadata: {
    name: `Rikuy Report Metadata ${reportId}`
  }
});
```

**3.2 Upload a ARKIV (Storage Inmutable)**
```typescript
// backend/src/services/arkiv.service.ts

// A. Preparar datos para Arkiv
const arkivData: ArkivReportData = {
  // Datos principales
  reportId: reportId,
  ipfsHash: ipfsData.ipfsHash,
  category: category,

  // Geolocalización (fuzzy para privacidad)
  location: {
    lat: fuzzyCoordinate(lat),      // Redondear a 2 decimales (~1km precisión)
    long: fuzzyCoordinate(long),
    accuracy: accuracy,
    geohash: geohash.encode(lat, long, 6)  // Para búsquedas
  },

  // Metadata del archivo
  mediaType: 'image',
  fileHash: fileHash,
  fileSize: compressed.length,

  // Análisis de AI
  description: aiValidation.description,
  tags: aiValidation.tags,
  severity: aiValidation.severity,

  // Timestamps
  createdAt: new Date().toISOString(),

  // Privacidad
  isAnonymous: true,
  identityCommitment: zkProof.publicSignals[0]  // No identifica a persona
};

// B. Enviar a Arkiv Network
const arkivTx = await arkivService.createTransaction({
  data: arkivData,
  retention: 10 * 365 * 24 * 60 * 60 * 1000,  // 10 años en ms
  tags: [
    { name: 'App-Name', value: 'Rikuy' },
    { name: 'Content-Type', value: 'application/json' },
    { name: 'Report-Category', value: categoryName },
    { name: 'Location-Geohash', value: arkivData.location.geohash },
    { name: 'Timestamp', value: arkivData.createdAt },
    { name: 'IPFS-Hash', value: ipfsData.ipfsHash }
  ]
});

// C. Esperar confirmación de Arkiv
await arkivTx.wait();

// D. Resultado
const arkivResult = {
  txId: arkivTx.id,                 // "0xabc123..." (ID único en Arkiv)
  status: arkivTx.status,           // "confirmed"
  dataSize: arkivData.length,
  retention: 10,                    // años
  url: `https://mendoza.hoodi.arkiv.network/tx/${arkivTx.id}`
};
```

---

### FASE 4: REGISTRO EN BLOCKCHAIN (3-5 segundos)

**4.1 Crear Reporte en Smart Contract**
```typescript
// backend/src/services/relayer.service.ts

// A. Preparar datos del reporte
const reportData = {
  arkivTxId: arkivResult.txId,        // Hash de Arkiv
  categoryId: category,
  zkProof: {
    proof: zkProof.proof,             // [8 elementos]
    publicSignals: zkProof.publicSignals  // [nullifier, merkleRoot, message, scope]
  }
};

// B. Enviar transacción (backend paga gas)
const tx = await rikuyCoreContract.createReport(
  ethers.toUtf8Bytes(reportData.arkivTxId),  // bytes32
  reportData.categoryId,                      // uint16
  reportData.zkProof.proof,                   // uint256[8]
  reportData.zkProof.publicSignals,           // uint256[4]
  {
    gasLimit: 500000,
    // Backend firma y paga
  }
);

// C. Esperar confirmación
const receipt = await tx.wait();

// D. Extraer reportId del evento
const event = receipt.logs.find(log =>
  log.topics[0] === rikuyCoreContract.interface.getEvent('ReportCreated').topicHash
);
const parsedEvent = rikuyCoreContract.interface.parseLog(event);
const onChainReportId = parsedEvent.args.reportId;

// E. Calcular gas usado
const gasUsed = receipt.gasUsed;
const gasCost = gasUsed * receipt.gasPrice;
```

---

### FASE 5: RESPUESTA AL USUARIO (instantánea)

```typescript
// Response exitoso
{
  "success": true,
  "message": "¡Reporte creado exitosamente! La comunidad lo validará pronto.",
  "data": {
    // IDs
    "reportId": "0x1234...abcd",        // ID en blockchain
    "arkivTxId": "0xabc...123",         // ID en Arkiv
    "ipfsHash": "QmXxx...yyy",          // Hash IPFS

    // URLs de acceso
    "imageUrl": "https://gateway.pinata.cloud/ipfs/QmXxx",
    "arkivUrl": "https://mendoza.hoodi.arkiv.network/tx/0xabc",
    "blockchainUrl": "https://sepolia.scrollscan.com/tx/0x123",

    // Metadata
    "description": "Bache grande en la calle...",
    "category": "INFRAESTRUCTURA",
    "tags": ["bache", "calle", "peligroso"],
    "severity": 7,
    "location": {
      "lat": -16.50,     // Fuzzy (redondeado)
      "long": -68.15
    },

    // Estado
    "status": "PENDING_VALIDATION",
    "validationsNeeded": 3,
    "estimatedReward": "50 USX",

    // Timestamps
    "createdAt": "2024-12-12T10:30:00Z",
    "expiresAt": "2024-12-19T10:30:00Z"  // 7 días para validar
  },

  // Metadata interna (no mostrar a usuario)
  "_internal": {
    "gasUsed": "420000",
    "gasCost": "0.0042 ETH",
    "processingTime": "12.3s",
    "aiConfidence": 0.89
  }
}
```

---

## 3. SERVICIOS DEL BACKEND

### A. media.service.ts (NUEVO)

**Responsabilidades:**
- Procesar fotos (comprimir, sanitizar, hashear)
- Procesar audio (convertir, transcribir)
- Procesar video (comprimir, extraer thumbnail)
- Detectar duplicados (perceptual hash)

```typescript
// backend/src/services/media.service.ts

import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import crypto from 'crypto';
import { pHash } from 'phash';

export class MediaService {
  /**
   * Procesar imagen para reporte
   */
  async processImage(file: Express.Multer.File): Promise<ProcessedImage> {
    // 1. Comprimir
    const compressed = await sharp(file.buffer)
      .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    // 2. Sanitizar EXIF
    const sanitized = await sharp(compressed)
      .rotate()
      .withMetadata({ exif: {} })
      .toBuffer();

    // 3. Generar hashes
    const fileHash = crypto.createHash('sha256').update(sanitized).digest('hex');
    const perceptualHash = await pHash(sanitized);

    // 4. Detectar duplicados
    const isDuplicate = await this.checkDuplicate(perceptualHash);

    return {
      buffer: sanitized,
      fileHash,
      perceptualHash,
      isDuplicate,
      size: sanitized.length,
      mimeType: 'image/jpeg'
    };
  }

  /**
   * Procesar audio para reporte
   */
  async processAudio(file: Express.Multer.File): Promise<ProcessedAudio> {
    // 1. Convertir a MP3 estándar
    const mp3Buffer = await this.convertToMP3(file.buffer);

    // 2. Generar hash
    const fileHash = crypto.createHash('sha256').update(mp3Buffer).digest('hex');

    return {
      buffer: mp3Buffer,
      fileHash,
      size: mp3Buffer.length,
      mimeType: 'audio/mpeg'
    };
  }

  /**
   * Procesar video para reporte
   */
  async processVideo(file: Express.Multer.File): Promise<ProcessedVideo> {
    // 1. Validar duración
    const duration = await this.getVideoDuration(file.buffer);
    if (duration > 120) {
      throw new Error('Video demasiado largo (max 2 minutos)');
    }

    // 2. Comprimir
    const compressed = await this.compressVideo(file.buffer);

    // 3. Extraer thumbnail
    const thumbnail = await this.extractThumbnail(compressed);

    // 4. Generar hash
    const fileHash = crypto.createHash('sha256').update(compressed).digest('hex');

    return {
      buffer: compressed,
      thumbnail,
      fileHash,
      duration,
      size: compressed.length,
      mimeType: 'video/mp4'
    };
  }

  /**
   * Detectar imagen duplicada usando perceptual hash
   */
  private async checkDuplicate(perceptualHash: string): Promise<boolean> {
    // Buscar en DB hashes similares
    const similar = await db.query(`
      SELECT file_hash
      FROM reports
      WHERE hamming_distance(perceptual_hash, $1) < 10
      LIMIT 1
    `, [perceptualHash]);

    return similar.rows.length > 0;
  }

  /**
   * Fuzzy coordinates para privacidad
   */
  fuzzyCoordinate(coord: number): number {
    // Redondear a 2 decimales (~1.1km de precisión)
    return Math.round(coord * 100) / 100;
  }
}

export const mediaService = new MediaService();
```

### B. ai.service.ts (EXTENDER EXISTENTE)

**Agregar validación de medios:**

```typescript
// backend/src/services/ai.service.ts

export class AIService {
  // ... métodos existentes ...

  /**
   * Validar media (foto/audio/video) con OpenAI
   */
  async validateMedia(request: {
    image?: Buffer;
    audio?: Buffer;
    video?: Buffer;
  }): Promise<MediaValidation> {

    // 1. Validar imagen con Vision
    if (request.image) {
      const imageAnalysis = await this.analyzeImage(request.image);

      // Moderación de contenido
      if (imageAnalysis.isExplicit) {
        return {
          isValid: false,
          reason: 'EXPLICIT_CONTENT',
          message: 'Contenido inapropiado detectado'
        };
      }

      if (!imageAnalysis.isRelevant) {
        return {
          isValid: false,
          reason: 'NOT_RELEVANT',
          message: 'La imagen no parece ser un reporte válido'
        };
      }

      if (imageAnalysis.confidence < 0.6) {
        return {
          isValid: false,
          reason: 'LOW_CONFIDENCE',
          message: 'No podemos determinar el contenido con certeza'
        };
      }
    }

    // 2. Validar audio con Whisper + GPT-4
    if (request.audio) {
      const transcription = await openai.audio.transcriptions.create({
        file: request.audio,
        model: 'whisper-1',
        language: 'es'
      });

      const textAnalysis = await this.analyzeText(transcription.text);

      if (!textAnalysis.isRelevant) {
        return {
          isValid: false,
          reason: 'NOT_RELEVANT',
          message: 'El audio no describe un problema válido'
        };
      }
    }

    // 3. Validar video (extraer frames + analizar)
    if (request.video) {
      // Extraer frame del medio del video
      const frame = await extractVideoFrame(request.video, '00:00:02');
      const frameAnalysis = await this.analyzeImage(frame);

      if (!frameAnalysis.isRelevant) {
        return {
          isValid: false,
          reason: 'NOT_RELEVANT',
          message: 'El video no muestra un problema válido'
        };
      }
    }

    // Todo válido
    return {
      isValid: true,
      confidence: 0.85,
      description: imageAnalysis?.description || textAnalysis?.description,
      tags: imageAnalysis?.tags || textAnalysis?.tags,
      severity: imageAnalysis?.severity || textAnalysis?.severity
    };
  }

  /**
   * Analizar imagen con GPT-4 Vision
   */
  private async analyzeImage(image: Buffer): Promise<ImageAnalysis> {
    const base64Image = image.toString('base64');

    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analiza esta imagen de un reporte ciudadano en Bolivia.

Determina:
1. ¿Es un reporte válido? (problema de infraestructura, basura, inseguridad, etc)
2. ¿Contiene contenido explícito o inapropiado?
3. Descripción del problema (2 oraciones max)
4. Tags relevantes (5 palabras clave)
5. Severidad del problema (1-10)

Responde en formato JSON:
{
  "isRelevant": boolean,
  "isExplicit": boolean,
  "confidence": 0-1,
  "contentType": "infrastructure" | "crime" | "garbage" | "corruption" | "other",
  "description": "string",
  "tags": ["tag1", "tag2"],
  "severity": 1-10,
  "detectedObjects": ["object1", "object2"],
  "hasPeople": boolean
}`
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      }],
      max_tokens: 500
    });

    return JSON.parse(response.choices[0].message.content);
  }

  /**
   * Analizar texto (de transcripción de audio)
   */
  private async analyzeText(text: string): Promise<TextAnalysis> {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'user',
        content: `Analiza esta transcripción de un reporte ciudadano en Bolivia: "${text}"

¿Describe un problema válido? (infraestructura, basura, inseguridad, etc)

Responde en JSON:
{
  "isRelevant": boolean,
  "description": "string",
  "tags": ["tag1", "tag2"],
  "severity": 1-10
}`
      }]
    });

    return JSON.parse(response.choices[0].message.content);
  }
}
```

### C. ipfs.service.ts (EXTENDER EXISTENTE)

**Ya existe, agregar soporte para audio/video:**

```typescript
// backend/src/services/ipfs.service.ts

export class IPFSService {
  // ... métodos existentes ...

  /**
   * Upload audio a IPFS
   */
  async uploadAudio(file: Buffer, metadata: AudioMetadata): Promise<IPFSResult> {
    const pinataMetadata = {
      name: `Rikuy Audio ${Date.now()}`,
      keyvalues: {
        reportId: metadata.reportId,
        fileType: 'audio/mpeg',
        fileSize: file.length,
        duration: metadata.duration,
        transcription: metadata.transcription
      }
    };

    const result = await this.pinata.pinFileToIPFS(file, {
      pinataMetadata,
      pinataOptions: { cidVersion: 1 }
    });

    return {
      ipfsHash: result.IpfsHash,
      url: `${this.gatewayUrl}/ipfs/${result.IpfsHash}`,
      size: result.PinSize
    };
  }

  /**
   * Upload video a IPFS
   */
  async uploadVideo(file: Buffer, metadata: VideoMetadata): Promise<IPFSResult> {
    const pinataMetadata = {
      name: `Rikuy Video ${Date.now()}`,
      keyvalues: {
        reportId: metadata.reportId,
        fileType: 'video/mp4',
        fileSize: file.length,
        duration: metadata.duration
      }
    };

    const result = await this.pinata.pinFileToIPFS(file, {
      pinataMetadata,
      pinataOptions: { cidVersion: 1 }
    });

    return {
      ipfsHash: result.IpfsHash,
      url: `${this.gatewayUrl}/ipfs/${result.IpfsHash}`,
      size: result.PinSize
    };
  }
}
```

### D. arkiv.service.ts (EXTENDER EXISTENTE)

**Ya existe, ya soporta cualquier tipo de dato**

---

## 4. TIPOS DE DATOS

### A. Types para Medios

```typescript
// backend/src/types/media.ts

export interface ProcessedImage {
  buffer: Buffer;
  fileHash: string;          // SHA-256
  perceptualHash: string;    // pHash para duplicados
  isDuplicate: boolean;
  size: number;              // bytes
  mimeType: string;
}

export interface ProcessedAudio {
  buffer: Buffer;
  fileHash: string;
  size: number;
  mimeType: string;
  duration?: number;         // segundos
  transcription?: string;    // De Whisper
}

export interface ProcessedVideo {
  buffer: Buffer;
  thumbnail: Buffer;         // Frame extraído
  fileHash: string;
  duration: number;          // segundos
  size: number;
  mimeType: string;
}

export interface MediaValidation {
  isValid: boolean;
  reason?: 'EXPLICIT_CONTENT' | 'NOT_RELEVANT' | 'LOW_CONFIDENCE' | 'QUALITY_TOO_LOW';
  message?: string;
  confidence?: number;
  description?: string;
  tags?: string[];
  severity?: number;
}

export interface ImageAnalysis {
  isRelevant: boolean;       // ¿Es un reporte válido?
  isExplicit: boolean;       // ¿Contiene contenido explícito?
  confidence: number;        // 0-1
  contentType: 'infrastructure' | 'crime' | 'garbage' | 'corruption' | 'other';
  description: string;
  tags: string[];
  severity: number;          // 1-10
  detectedObjects: string[];
  hasPeople: boolean;        // Para privacidad
}

export interface TextAnalysis {
  isRelevant: boolean;
  description: string;
  tags: string[];
  severity: number;
}
```

### B. Actualizar CreateReportRequest

```typescript
// backend/src/types/index.ts

export interface CreateReportRequest {
  // Medios (al menos uno requerido)
  photo?: Express.Multer.File;    // Foto principal
  audio?: Express.Multer.File;    // Descripción de audio (opcional)
  video?: Express.Multer.File;    // Video del problema (opcional)

  // Metadata
  category: ReportCategory;
  description?: string;            // Descripción manual (opcional)
  location: {
    lat: number;
    long: number;
    accuracy: number;
  };

  // Anonimato
  zkProof: ZKProof;
  userSecret?: string;             // Para re-identificarse después (opcional)
}

export interface CreateReportResponse {
  success: boolean;
  message: string;
  data: {
    reportId: string;
    arkivTxId: string;
    ipfsHash: string;
    ipfsAudioHash?: string;       // Si hay audio
    ipfsVideoHash?: string;       // Si hay video
    imageUrl: string;
    audioUrl?: string;
    videoUrl?: string;
    arkivUrl: string;
    blockchainUrl: string;
    description: string;
    category: string;
    tags: string[];
    severity: number;
    location: {
      lat: number;
      long: number;
    };
    status: ReportStatus;
    validationsNeeded: number;
    estimatedReward: string;
    createdAt: string;
    expiresAt: string;
  };
  _internal?: {
    gasUsed: string;
    gasCost: string;
    processingTime: string;
    aiConfidence: number;
  };
}
```

---

## 5. VALIDACIONES Y LÍMITES

### A. Límites de Archivo

```typescript
// backend/src/middleware/upload.ts

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: {
      photo: 10 * 1024 * 1024,      // 10 MB
      audio: 5 * 1024 * 1024,       // 5 MB
      video: 50 * 1024 * 1024       // 50 MB
    }
  },
  fileFilter: (req, file, cb) => {
    // Foto
    if (file.fieldname === 'photo') {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
      if (!allowedMimes.includes(file.mimetype)) {
        return cb(new Error('Formato de imagen no soportado'));
      }
    }

    // Audio
    if (file.fieldname === 'audio') {
      const allowedMimes = ['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/ogg'];
      if (!allowedMimes.includes(file.mimetype)) {
        return cb(new Error('Formato de audio no soportado'));
      }
    }

    // Video
    if (file.fieldname === 'video') {
      const allowedMimes = ['video/mp4', 'video/quicktime', 'video/webm'];
      if (!allowedMimes.includes(file.mimetype)) {
        return cb(new Error('Formato de video no soportado'));
      }
    }

    cb(null, true);
  }
});

// Configurar campos
export const uploadReportMedia = upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'audio', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]);
```

### B. Rate Limiting

```typescript
// backend/src/middleware/rateLimit.ts

export const mediaUploadLimiter = rateLimit({
  store: new RedisStore({ client: redis }),
  windowMs: 24 * 60 * 60 * 1000,  // 24 horas
  max: 5,                          // Máximo 5 reportes con media por día
  message: 'Límite diario de reportes alcanzado. Intenta mañana.',
  keyGenerator: (req) => {
    // Usar wallet address o IP
    return req.headers['x-user-address'] || req.ip;
  }
});
```

---

## 6. COSTOS ESTIMADOS

### A. Costos por Reporte

**Almacenamiento:**
```
PINATA (IPFS):
  • Foto (2 MB compressed):     Free tier (hasta 1 GB)
  • Audio (1 MB):               Free tier
  • Video (10 MB compressed):   Free tier
  • Total IPFS:                 $0

ARKIV (10 años):
  • Foto:     ~$0.10
  • Audio:    ~$0.05
  • Video:    ~$0.50
  • Total:    ~$0.15 - $0.65 por reporte

BLOCKCHAIN (Scroll Sepolia):
  • createReport TX:  ~0.001 ETH (~$2)
  • Testnet:          $0 (gratis)

OPENAI:
  • GPT-4 Vision:     $0.01 por imagen
  • Whisper:          $0.006 por minuto
  • GPT-4 Text:       $0.01 por 1K tokens
  • Total AI:         ~$0.02 - $0.05 por reporte
```

**Total por reporte:** $0.17 - $0.70 en testnet (sin contar gas real)

### B. Costos Mensuales (estimado 100 reportes/mes)

```
Arkiv:      $17 - $65
OpenAI:     $2 - $5
Pinata:     $0 (free tier hasta 1000 reportes)
Scroll:     $0 (testnet)
────────────────────
Total:      $19 - $70/mes
```

---

## 7. DIAGRAMA DE FLUJO VISUAL

```
┌──────────────────────────────────────────────────────────┐
│                  USUARIO FRONTEND                        │
│  📸 Captura foto del problema                            │
│  🎤 (Opcional) Graba descripción de audio                │
│  🎥 (Opcional) Graba video corto                         │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ↓ POST /api/reports
┌──────────────────────────────────────────────────────────┐
│               BACKEND - MIDDLEWARE                       │
│  ✓ Validar tamaño (10MB max foto)                       │
│  ✓ Validar formato (jpg, png, webp)                     │
│  ✓ Rate limiting (5 reportes/día)                       │
│  ✓ Verificar identidad (ZK proof válido)                │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────────┐
│          SERVICIO: media.service.ts                      │
│  1️⃣ Comprimir imagen (1920x1080, 85% quality)            │
│  2️⃣ Strip EXIF sensible (privacidad)                     │
│  3️⃣ Generar hashes (SHA-256 + pHash)                     │
│  4️⃣ Detectar duplicados (perceptual hash)                │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────────┐
│          SERVICIO: ai.service.ts                         │
│  🤖 OpenAI GPT-4 Vision analiza imagen                   │
│     ✓ ¿Es contenido válido?                              │
│     ✓ ¿Contiene explícito?                               │
│     ✓ Descripción automática                             │
│     ✓ Tags (ej: "bache", "calle")                        │
│     ✓ Severidad (1-10)                                   │
│                                                           │
│  🎤 (Si audio) Whisper transcribe                        │
│     → GPT-4 analiza transcripción                        │
└────────────────────┬─────────────────────────────────────┘
                     │
             ┌───────┴────────┐
             │                │
             ↓                ↓
┌──────────────────┐  ┌──────────────────┐
│  PINATA (IPFS)   │  │  ARKIV NETWORK   │
│  ────────────    │  │  ────────────    │
│  Upload foto     │  │  Upload metadata │
│  → ipfsHash      │  │  → arkivTxId     │
│  QmXxx...        │  │  0xabc...        │
│                  │  │                  │
│  Metadata JSON:  │  │  Datos completos:│
│  • description   │  │  • ipfsHash      │
│  • tags          │  │  • geohash       │
│  • timestamp     │  │  • severity      │
│                  │  │  • aiAnalysis    │
│  Acceso:         │  │                  │
│  gateway.pinata  │  │  Inmutable 10años│
└────────┬─────────┘  └─────────┬────────┘
         │                      │
         └──────────┬───────────┘
                    ↓
┌──────────────────────────────────────────────────────────┐
│       SERVICIO: relayer.service.ts                       │
│  🔗 Crear reporte en blockchain (Scroll)                 │
│     → RikuyCoreV2.createReport(                          │
│         arkivTxId,                                       │
│         categoryId,                                      │
│         zkProof                                          │
│       )                                                  │
│                                                           │
│  ✅ TX confirmada → reportId on-chain                    │
└────────────────────┬─────────────────────────────────────┘
                     │
                     ↓
┌──────────────────────────────────────────────────────────┐
│                  RESPUESTA AL USUARIO                    │
│  {                                                       │
│    success: true,                                        │
│    reportId: "0x123...",                                 │
│    imageUrl: "https://gateway.pinata.cloud/...",        │
│    arkivUrl: "https://mendoza.hoodi.arkiv.network/...", │
│    description: "Bache grande en calle...",             │
│    status: "PENDING_VALIDATION",                        │
│    estimatedReward: "50 USX"                            │
│  }                                                       │
└──────────────────────────────────────────────────────────┘
```

---

## 8. FLUJO ALTERNATIVO: SOLO AUDIO

**Caso de uso:** Usuario en situación de peligro, solo puede grabar audio

```
Usuario → 🎤 Graba audio describiendo problema
       ↓
Backend → Whisper transcribe audio
       → GPT-4 analiza transcripción
       → Genera ubicación del teléfono
       → Upload audio a IPFS
       → Metadata a Arkiv
       → Blockchain
       ↓
Reporte creado SIN foto pero CON audio + transcripción
```

**Ventaja:** Reportes en tiempo real de situaciones de peligro

---

## 9. FLUJO ALTERNATIVO: VIDEO

**Caso de uso:** Problema grave que necesita más contexto

```
Usuario → 🎥 Graba video (max 2 min)
       ↓
Backend → Extrae frame thumbnail
       → GPT-4 Vision analiza frame
       → Comprimir video (720p)
       → Upload video a IPFS
       → Upload thumbnail a IPFS
       → Metadata a Arkiv
       → Blockchain
       ↓
Reporte creado con video + thumbnail preview
```

**Ventaja:** Más contexto para problemas complejos

---

## 10. MEJORAS FUTURAS

### A. Compresión Avanzada
- [ ] WebP para imágenes (mejor compresión que JPEG)
- [ ] Opus codec para audio (mejor que MP3)
- [ ] H.265/HEVC para video (50% menos tamaño que H.264)

### B. Privacidad Mejorada
- [ ] Blur automático de caras (OpenCV)
- [ ] Blur de placas de autos
- [ ] Blur de números de teléfono/direcciones

### C. Verificación de Autenticidad
- [ ] Verificar que foto no es screenshot
- [ ] Verificar que no es deepfake
- [ ] Verificar EXIF original (timestamp, GPS)

### D. Backup y Redundancia
- [ ] Backup automático a Web3.Storage
- [ ] Verificación periódica de pins IPFS
- [ ] Re-pin automático si se pierde

---

## 11. PRÓXIMOS PASOS DE IMPLEMENTACIÓN

1. **Crear media.service.ts** - Procesamiento de archivos
2. **Extender ai.service.ts** - Validación con OpenAI
3. **Extender ipfs.service.ts** - Soporte audio/video
4. **Actualizar report.service.ts** - Flujo completo
5. **Actualizar routes/reports.ts** - Nuevos campos
6. **Testing** - Probar con fotos/audios/videos reales

---

**Última actualización:** 12 Diciembre 2024
**Autor:** Backend Rikuy Team
**Siguiente paso:** Implementar media.service.ts
