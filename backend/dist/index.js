"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_1 = require("./config");
const reports_1 = __importDefault(require("./routes/reports"));
const identity_1 = __importDefault(require("./routes/identity"));
const rateLimit_1 = require("./middleware/rateLimit");
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = __importStar(require("./utils/logger"));
const metrics_1 = require("./middleware/metrics");
const formatResponse_1 = require("./middleware/formatResponse");
const app = (0, express_1.default)();
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
const currentEnv = (config_1.config.nodeEnv || 'development');
const envConfig = ENVIRONMENTS[currentEnv] || ENVIRONMENTS.development;
// Construir lista completa de orígenes permitidos
const allowedOrigins = [
    ...envConfig.origins,
    'http://localhost:3001',
    'https://api.rikuyapp.com',
];
// CORS configuration
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            logger_1.default.warn({
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
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Métricas middleware
app.use(metrics_1.metricsMiddleware);
// Format Response middleware (para respuestas HTML/JSON)
app.use(formatResponse_1.formatResponseMiddleware);
// Rate limiting - Usando config.security en lugar de config.redis.enabled
if (config_1.config.security) {
    app.use(rateLimit_1.rateLimiter);
    logger_1.default.info('✅ Rate limiting enabled');
}
else {
    logger_1.default.warn('⚠️ Rate limiting disabled');
}
// Health check con formato
app.get('/health', (req, res) => {
    const healthData = {
        status: 'operational',
        service: 'rikuy-backend',
        environment: currentEnv,
        environmentInfo: {
            name: envConfig.name,
            message: envConfig.message,
        },
        timestamp: Date.now(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || '1.0.0',
        features: {
            rateLimiting: !!config_1.config.security,
            metrics: true,
            blockchain: !!config_1.config.blockchain?.rpcUrl,
            network: config_1.config.network || 'unknown',
            chainId: config_1.config.blockchain?.chainId,
            networkType: config_1.config.network,
        },
    };
    // Solo agregar debug en development
    if (currentEnv === 'development') {
        healthData.debug = {
            rpcUrl: config_1.config.blockchain?.rpcUrl,
            contracts: config_1.config.blockchain?.contracts,
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
    const metrics = (0, metrics_1.getMetrics)();
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
            <span class="status-value">${config_1.config.network || 'local'}</span>
          </div>
          <div class="status-item">
            <span class="status-label">Chain ID:</span>
            <span class="status-value">${config_1.config.blockchain?.chainId || 'N/A'}</span>
          </div>
          <div class="status-item">
            <span class="status-label">Tiempo activo:</span>
            <span class="status-value">${Math.floor(process.uptime() / 60)} min</span>
          </div>
          <div class="status-item">
            <span class="status-label">Rate Limiting:</span>
            <span class="status-value">${config_1.config.security ? '✅' : '❌'}</span>
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
        (0, logger_1.logRequest)(req.method, req.path, res.statusCode, duration);
    });
    next();
});
// Routes
app.use('/api/identity', identity_1.default);
app.use('/api/reports', reports_1.default);
// 404 handler
app.use(errorHandler_1.notFoundHandler);
// Error handler global
app.use(errorHandler_1.errorHandler);
// Start server
const PORT = config_1.config.port;
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
    console.log(`⛓️  Red:        ${config_1.config.network || 'local'} (Chain ID: ${config_1.config.blockchain?.chainId})`);
    if (currentEnv === 'production') {
        console.log(`🔗 URL Pública: https://api.rikuyapp.com`);
    }
    else if (currentEnv === 'staging') {
        console.log(`🔗 URL Staging: https://dev.api.rikuyapp.com`);
    }
    console.log(`⛓️  RPC:        ${config_1.config.blockchain?.rpcUrl || 'N/A'}`);
    console.log(`🔑 Rate Limit: ${config_1.config.security ? '✅ Habilitado' : '❌ Deshabilitado'}`);
    if (config_1.config.devMode && currentEnv === 'development') {
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
    logger_1.default.info({
        port: PORT,
        environment: currentEnv,
        network: config_1.config.network,
        chainId: config_1.config.blockchain?.chainId,
        environmentMessage: envConfig.message,
        rateLimiting: !!config_1.config.security,
    }, 'Rikuy Backend started successfully');
});
exports.default = app;
