import express from 'express';
import cors from 'cors';
import { config } from './config';
import reportsRouter from './routes/reports';
import identityRouter from './routes/identity';
import { rateLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import logger, { logRequest } from './utils/logger';

const app = express();

// CORS configuration
const allowedOrigins = [
  'http://localhost:5173', // Local development
  'http://localhost:3000',
  'https://rikuy.up.railway.app', // Production frontend
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn({ origin }, 'CORS blocked request from unauthorized origin');
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

// Rate limiting global (DESACTIVADO temporalmente - requiere Redis)
// app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'rikuy-backend',
    timestamp: Date.now(),
  });
});

// Request logging middleware (ANTES de las rutas)
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

// 404 handler (rutas no encontradas) - DESPUÉS de todas las rutas
app.use(notFoundHandler);

// Error handler global - DEBE SER EL ÚLTIMO MIDDLEWARE
app.use(errorHandler);

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  logger.info({
    port: PORT,
    environment: config.nodeEnv,
    scrollRpc: config.blockchain.rpcUrl,
    arkivRpc: config.arkiv.rpcUrl,
  }, 'Rikuy Backend started successfully');

  // Pretty console log for development
  if (config.nodeEnv === 'development') {
    console.log('\n🚀 Rikuy Backend ready');
    console.log(`   → http://localhost:${PORT}`);
    console.log(`   → Environment: ${config.nodeEnv}`);

    // DEV MODE WARNING
    if (config.devMode) {
      console.log('\n⚠️  ⚠️  ⚠️  DEV MODE ACTIVE ⚠️  ⚠️  ⚠️');
      console.log('   → ZK proofs are NOT being verified!');
      console.log('   → Membership checks are DISABLED!');
      console.log('   → Nullifier uniqueness is NOT enforced!');
      console.log('   → DO NOT USE IN PRODUCTION!\n');

      logger.warn({
        devMode: config.devMode,
        warning: 'SECURITY BYPASSED FOR DEVELOPMENT'
      }, '⚠️  DEV MODE ACTIVE - All security checks disabled');
    }
    console.log();
  }
});

export default app;
