# 📘 Documentación de APIs - Rikuy Backend

## 🎯 Filosofía del Backend

**EL USUARIO NO DEBE SABER QUE USA BLOCKCHAIN**

- ❌ No exponemos: gas fees, transaction hashes, addresses, términos técnicos
- ✅ Sí mostramos: mensajes simples en español, puntos en lugar de tokens, estados claros

---

## 🔐 Base URL

```
Desarrollo: http://localhost:3000
Producción: https://api.rikuy.com
```

---

## 📋 Endpoints

### 1. **Crear Reporte**

Permite a un usuario reportar un problema con una foto.

```http
POST /api/reports
```

#### Request

**Content-Type:** `multipart/form-data`

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `photo` | File | Sí | Imagen del problema (JPG, PNG, WebP, max 10MB) |
| `category` | number | Sí | Categoría: 0=Infraestructura, 1=Inseguridad, 2=Basura |
| `description` | string | No | Descripción manual (opcional, la IA genera una si falta) |
| `location` | JSON string | Sí | `{"lat": -34.6037, "long": -58.3816, "accuracy": 10}` |
| `userSecret` | string | No | Secreto para ZK proof (para privacidad) |

#### Ejemplo Request (JavaScript/TypeScript)

```typescript
const formData = new FormData();
formData.append('photo', fileInput.files[0]);
formData.append('category', '0'); // Infraestructura
formData.append('location', JSON.stringify({
  lat: -34.6037,
  long: -58.3816,
  accuracy: 10
}));
formData.append('description', 'Hay un bache grande en esta calle');

const response = await fetch('http://localhost:3000/api/reports', {
  method: 'POST',
  body: formData,
});

const data = await response.json();
```

#### Response Exitosa (200 OK)

```json
{
  "success": true,
  "reportId": "a3f2b1c...",
  "status": "confirmado",
  "recompensa": {
    "puntos": 3500,
    "mensaje": "Podrás ganar hasta 3500 puntos cuando tu reporte sea validado por la comunidad"
  },
  "mensaje": "¡Reporte creado exitosamente! Está siendo procesado por la comunidad."
}
```

**IMPORTANTE:** El frontend NO debe mostrar `_internal` al usuario. Ese campo es solo para logging.

#### Errores Posibles

```json
// 400 - Foto requerida
{
  "success": false,
  "error": "Foto es requerida"
}

// 400 - Ubicación fuera de Argentina
{
  "success": false,
  "error": "Ubicación fuera de Argentina"
}

// 400 - Foto duplicada
{
  "success": false,
  "error": "Esta foto ya fue reportada anteriormente"
}

// 500 - Error general
{
  "success": false,
  "error": "Error al crear reporte"
}
```

---

### 2. **Obtener Reporte**

Obtiene los detalles completos de un reporte por su ID.

```http
GET /api/reports/:id
```

#### Ejemplo Request

```typescript
const response = await fetch('http://localhost:3000/api/reports/a3f2b1c...');
const data = await response.json();
```

#### Response Exitosa (200 OK)

```json
{
  "success": true,
  "reporte": {
    "reportId": "a3f2b1c...",
    "estado": "validado",
    "validaciones": {
      "positivas": 45,
      "negativas": 3,
      "confiabilidad": 94
    },
    "verificado": true,
    "resuelto": false,
    "recompensaGanada": 3500,
    "datosReporte": {
      "protocol": "rikuy-v1",
      "timestamp": 1700000000000,
      "category": {
        "id": 0,
        "name": "Infraestructura"
      },
      "evidence": {
        "imageIPFS": "QmX...",
        "description": "Bache grande en la calle",
        "aiTags": ["bache", "calle", "infraestructura"]
      },
      "location": {
        "approximate": {
          "lat": -34.60,
          "long": -58.38,
          "precision": "~100m"
        }
      }
    }
  }
}
```

#### Interpretación de Estados

| Estado | Significado para el usuario |
|--------|------------------------------|
| `procesando` | Tu reporte está siendo verificado |
| `confirmado` | Tu reporte fue registrado exitosamente |
| `validado` | La comunidad validó tu reporte |
| `resuelto` | El problema fue solucionado |

#### Confiabilidad

- **0-30%**: Bajo - Posible reporte fraudulento
- **31-69%**: Medio - En validación
- **70-100%**: Alto - Reporte confiable

---

### 3. **Validar Reporte (Votar)**

Permite a otros usuarios validar si un reporte es real o no.

```http
POST /api/reports/:id/validate
```

#### Request Body

```json
{
  "isValid": true
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `isValid` | boolean | `true` = reporte es válido, `false` = reporte no es válido |

#### Ejemplo Request

```typescript
const response = await fetch('http://localhost:3000/api/reports/a3f2b1c.../validate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    isValid: true
  }),
});

const data = await response.json();
```

#### Response Exitosa (200 OK)

```json
{
  "success": true,
  "mensaje": "¡Gracias por validar este reporte! Tu voto ha sido registrado."
}
```

```json
{
  "success": true,
  "mensaje": "Tu voto ha sido registrado. Ayudas a mantener la calidad de la comunidad."
}
```

---

### 4. **Buscar Reportes Cercanos**

Busca reportes cerca de una ubicación.

```http
GET /api/reports/nearby?lat=-34.6037&long=-58.3816&radiusKm=5&category=0
```

#### Query Parameters

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `lat` | number | Sí | Latitud |
| `long` | number | Sí | Longitud |
| `radiusKm` | number | No | Radio de búsqueda en km (default: 5) |
| `category` | number | No | Filtrar por categoría (0, 1, 2) |
| `limit` | number | No | Máximo de resultados (default: 50) |

#### Ejemplo Request

```typescript
const params = new URLSearchParams({
  lat: '-34.6037',
  long: '-58.3816',
  radiusKm: '10',
  category: '0',
});

const response = await fetch(`http://localhost:3000/api/reports/nearby?${params}`);
const data = await response.json();
```

#### Response Exitosa (200 OK)

```json
{
  "success": true,
  "data": [
    {
      "reportId": "abc123...",
      "category": {
        "id": 0,
        "name": "Infraestructura"
      },
      "location": {
        "approximate": {
          "lat": -34.60,
          "long": -58.38
        }
      },
      "timestamp": 1700000000000,
      "evidence": {
        "imageIPFS": "QmX...",
        "description": "Bache en la calle"
      },
      "distance": 2.3
    }
  ]
}
```

---

## 🎨 Cómo Mostrar al Usuario

### ✅ HACER (User-Friendly)

```typescript
// Mostrar estado
if (reporte.estado === 'validado') {
  mostrarMensaje('✅ Tu reporte fue validado por la comunidad');
}

// Mostrar recompensa
mostrarPuntos(`Ganaste ${reporte.recompensaGanada} puntos`);

// Mostrar confiabilidad
const confianza = reporte.validaciones.confiabilidad;
if (confianza > 70) {
  mostrarBadge('Reporte Confiable');
}
```

### ❌ NO HACER (Expone Blockchain)

```typescript
// ❌ NO mostrar
mostrarTxHash(data._internal.scrollTxHash);
mostrarGasUsado(data._internal.gasUsed);
mostrarBlockNumber(data._internal.block);
```

---

## 🔒 Rate Limiting

**Rate limits aplicados:**
- Global: 5 requests/minuto por IP
- Crear reporte:
  - Max 5 reportes/día
  - Max 2 reportes/hora

**Respuesta cuando se excede:**
```json
{
  "success": false,
  "error": "Has excedido el límite de reportes. Intenta más tarde."
}
```

---

## 🌍 Geofencing

Solo se aceptan reportes dentro de Argentina:
- Latitud: -55.0 a -21.7
- Longitud: -73.5 a -53.6

---

## 💡 Ejemplos de Integración

### React Example

```typescript
import { useState } from 'react';

function CrearReporte() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        alert(data.mensaje); // "¡Reporte creado exitosamente!"
        mostrarPuntos(data.recompensa.puntos);
      }
    } catch (error) {
      alert('Error al crear reporte. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="file" name="photo" required />
      <select name="category">
        <option value="0">Infraestructura</option>
        <option value="1">Inseguridad</option>
        <option value="2">Basura</option>
      </select>
      <button disabled={loading}>
        {loading ? 'Enviando...' : 'Crear Reporte'}
      </button>
    </form>
  );
}
```

---

## 🚀 Próximos Pasos para el Frontend

1. **Integrar Privy** para manejo de wallets (invisible para el usuario)
2. **No mostrar campos `_internal`** al usuario
3. **Usar estados simples**: "procesando", "confirmado", "validado", "resuelto"
4. **Mostrar puntos**, no valores en crypto
5. **Mensajes en español**, sin términos técnicos
6. **Manejar errores con gracia** - mensajes simples y claros

---

## ❓ FAQ para Developers

**P: ¿Por qué hay campos `_internal`?**
R: Son para logging/debugging backend. Nunca los expongas al usuario final.

**P: ¿Qué pasa con los gas fees?**
R: El backend los paga automáticamente usando un relayer. El usuario nunca los ve.

**P: ¿Cómo funcionan las recompensas?**
R: Se calculan en "puntos" basados en la categoría y severidad. Más adelante se pueden convertir a tokens, pero el usuario solo ve puntos.

**P: ¿Necesito manejar Web3 en el frontend?**
R: No. Privy maneja las wallets y el backend maneja las transacciones. Tu frontend solo hace llamadas REST.

---

## 📞 Soporte

Si tienes dudas sobre la integración, consulta el código en `src/routes/reports.ts` para ver ejemplos de uso.
