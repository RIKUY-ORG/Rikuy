import express from 'express';
import cors from 'cors';
import { config } from './config';
import { HealthData } from './types/health';
import { MetricsData } from './types/health';
import reportsRouter from './routes/reports';
import identityRouter from './routes/identity';
import { rateLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import logger, { logRequest } from './utils/logger';
import { metricsMiddleware, getMetrics } from './middleware/metrics';
import { formatResponseMiddleware } from './middleware/formatResponse';

const app = express();

// Configuración de entornos (basado en tu config.nodeEnv)
const ENVIRONMENTS = {
  development: {
    name: 'development',
    origins: ['http://localhost:5173', 'http://localhost:3000'],
    message: '🔧 Modo Desarrollo Local',
    emoji: '🔧',
    color: '\x1b[33m', // Amarillo
  },
  staging: {
    name: 'staging',
    origins: ['https://dev.rikuyapp.com', 'https://www.dev.rikuyapp.com'],
    message: '🧪 Modo Staging/Pruebas',
    emoji: '🧪',
    color: '\x1b[36m', // Cyan
  },
  production: {
    name: 'production',
    origins: [
      'https://rikuyapp.com',
      'https://www.rikuyapp.com',
      'https://api.rikuyapp.com',
      'https://www.api.rikuyapp.com'
    ],
    message: '🚀 Modo Producción',
    emoji: '🚀',
    color: '\x1b[32m', // Verde
  },
};

// Determinar entorno actual
const currentEnv = (config.nodeEnv || 'development') as keyof typeof ENVIRONMENTS;
const envConfig = ENVIRONMENTS[currentEnv] || ENVIRONMENTS.development;

// Construir lista completa de orígenes permitidos
const allowedOrigins = [
  ...envConfig.origins,
  'http://localhost:3001',
  'https://api.rikuyapp.com',
];

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn({ 
        origin, 
        environment: currentEnv,
        allowed: allowedOrigins 
      }, 'CORS blocked request from unauthorized origin');
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-address'],
}));

// Middleware global
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Métricas middleware
app.use(metricsMiddleware);

// Format Response middleware (para respuestas HTML/JSON)
app.use(formatResponseMiddleware);

// Rate limiting - Usando config.security en lugar de config.redis.enabled
if (config.security) {
  app.use(rateLimiter);
  logger.info('✅ Rate limiting enabled');
} else {
  logger.warn('⚠️ Rate limiting disabled');
}

// Health check con formato
app.get('/health', (req, res) => {
  const healthData: HealthData = {
    status: 'operational',
    service: 'rikuy-backend',
    environment: currentEnv as 'development' | 'staging' | 'production',
    environmentInfo: {
      name: envConfig.name,
      message: envConfig.message,
    },
    timestamp: Date.now(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0',
    features: {
      rateLimiting: !!config.security,
      metrics: true,
      blockchain: !!config.blockchain?.rpcUrl,
      network: config.network || 'unknown',
      chainId: config.blockchain?.chainId,
      networkType: config.network,
    },
  };

  // Solo agregar debug en development
  if (currentEnv === 'development') {
    healthData.debug = {
      rpcUrl: config.blockchain?.rpcUrl,
      contracts: config.blockchain?.contracts,
      envVars: {
        NODE_ENV: process.env.NODE_ENV,
        NETWORK: process.env.NETWORK,
        REDIS_URL: process.env.REDIS_URL,
      },
    };

    // Agregar endpoints en development
    healthData.endpoints = {
      root: '/',
      health: '/health',
      metrics: '/metrics',
      identityStatus: '/api/identity/status?wallet=0x...',
      identityVerify: '/api/identity/verify',
      reports: '/api/reports',
      reportsNearby: '/api/reports/nearby?lat=-16.5&long=-68.1&radius=1000',
    };
  }

  res.formatResponse(healthData, { 
    title: 'Health Check', 
    template: 'health' 
  });
});

// Endpoint de métricas con formato
app.get('/metrics', (req, res) => {
  const metricsKey = req.headers['x-metrics-key'];
  
  if (currentEnv !== 'development' && metricsKey !== 'rikuy-metrics-key') {
    return res.formatResponse({
      error: 'Unauthorized'
    }, { title: 'Error - No autorizado' });
  }

  const metrics = getMetrics() as MetricsData;
  res.formatResponse(metrics, { 
    title: 'Métricas del Servidor', 
    template: 'metrics' 
  });
});

// Endpoint raíz - página de bienvenida (mantiene HTML directo porque es especial)
app.get('/', (req, res) => {
  const welcomeHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rikuy Backend ${envConfig.emoji}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          margin: 0;
          padding: 0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        .container {
          text-align: center;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          padding: 3rem;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          max-width: 600px;
          margin: 20px;
        }
        h1 {
          font-size: 3rem;
          margin-bottom: 0.5rem;
        }
        .badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: ${currentEnv === 'production' ? '#10b981' : currentEnv === 'staging' ? '#f59e0b' : '#3b82f6'};
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }
        .status {
          background: rgba(255,255,255,0.2);
          padding: 1rem;
          border-radius: 10px;
          margin: 1.5rem 0;
          text-align: left;
        }
        .status-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }
        .status-label {
          font-weight: 600;
        }
        .status-value {
          font-family: monospace;
        }
        .links {
          margin-top: 2rem;
        }
        .link {
          color: white;
          text-decoration: none;
          padding: 0.5rem 1rem;
          margin: 0 0.5rem;
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 5px;
          transition: all 0.3s;
        }
        .link:hover {
          background: rgba(255,255,255,0.2);
          border-color: white;
        }
        .footer {
          margin-top: 2rem;
          font-size: 0.875rem;
          opacity: 0.8;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="badge">${envConfig.message}</div>
        <h1>🦅 Rikuy Backend</h1>
        <p>API de denuncias anónimas con blockchain y pruebas ZK</p>
        
        <div class="status">
          <div class="status-item">
            <span class="status-label">Estado:</span>
            <span class="status-value">✅ Operativo</span>
          </div>
          <div class="status-item">
            <span class="status-label">Entorno:</span>
            <span class="status-value">${currentEnv}</span>
          </div>
          <div class="status-item">
            <span class="status-label">Red:</span>
            <span class="status-value">${config.network || 'local'}</span>
          </div>
          <div class="status-item">
            <span class="status-label">Chain ID:</span>
            <span class="status-value">${config.blockchain?.chainId || 'N/A'}</span>
          </div>
          <div class="status-item">
            <span class="status-label">Tiempo activo:</span>
            <span class="status-value">${Math.floor(process.uptime() / 60)} min</span>
          </div>
          <div class="status-item">
            <span class="status-label">Rate Limiting:</span>
            <span class="status-value">${config.security ? '✅' : '❌'}</span>
          </div>
        </div>

        <div class="links">
          <a href="/health" class="link">Health Check</a>
          <a href="/api/identity/status?wallet=0x..." class="link">Verificar Estado</a>
          <a href="/metrics" class="link">Métricas</a>
          <a href="https://rikuyapp.com" class="link" target="_blank">Frontend</a>
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} Rikuy - Justicia con privacidad</p>
          <p style="font-size: 0.75rem;">Blockchain • ZK Proofs • IPFS</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  res.send(welcomeHtml);
});

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logRequest(req.method, req.path, res.statusCode, duration);
  });
  next();
});

// Routes
app.use('/api/identity', identityRouter);
app.use('/api/reports', reportsRouter);

// 404 handler
app.use(notFoundHandler);

// Error handler global
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
  };

  console.log(`\n${envConfig.color}╔════════════════════════════════════════╗${colors.reset}`);
  console.log(`${envConfig.color}║     RIKUY BACKEND - ${envConfig.message.padEnd(20)}║${colors.reset}`);
  console.log(`${envConfig.color}╚════════════════════════════════════════╝${colors.reset}\n`);

  console.log(`📡 Servidor:   ${colors.green}http://localhost:${PORT}${colors.reset}`);
  console.log(`🌐 Entorno:    ${envConfig.color}${currentEnv}${colors.reset}`);
  console.log(`⛓️  Red:        ${config.network || 'local'} (Chain ID: ${config.blockchain?.chainId})`);
  
  if (currentEnv === 'production') {
    console.log(`🔗 URL Pública: https://api.rikuyapp.com`);
  } else if (currentEnv === 'staging') {
    console.log(`🔗 URL Staging: https://dev.api.rikuyapp.com`);
  }
  
  console.log(`⛓️  RPC:        ${config.blockchain?.rpcUrl || 'N/A'}`);
  console.log(`🔑 Rate Limit: ${config.security ? '✅ Habilitado' : '❌ Deshabilitado'}`);
  
  if (config.devMode && currentEnv === 'development') {
    console.log(`\n${colors.yellow}⚠️  DEV MODE ACTIVE - DO NOT USE IN PRODUCTION${colors.reset}`);
  }
  
  console.log(`\n📚 Endpoints disponibles:`);
  console.log(`   → GET  /           Página de bienvenida`);
  console.log(`   → GET  /health     Health check detallado (HTML/JSON)`);
  console.log(`   → GET  /metrics     Métricas (HTML/JSON, requiere API key)`);
  console.log(`   → POST /api/identity/verify Verificar ciudadanía`);
  console.log(`   → GET  /api/identity/status Estado de verificación (HTML/JSON)`);
  console.log(`   → POST /api/reports Crear denuncia`);
  console.log(`   → GET  /api/reports/nearby Denuncias cercanas`);
  console.log(`\n💡 Tips:`);
  console.log(`   → Agrega ?format=json a cualquier URL para ver JSON`);
  console.log(`   → Los endpoints /api/* mantienen formato JSON por defecto\n`);
  
  logger.info({
    port: PORT,
    environment: currentEnv,
    network: config.network,
    chainId: config.blockchain?.chainId,
    environmentMessage: envConfig.message,
    rateLimiting: !!config.security,
  }, 'Rikuy Backend started successfully');
});

export default app;