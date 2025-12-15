import express from 'express';
import cors from 'cors';
import { config } from './config';
import reportsRouter from './routes/reports';
import identityRouter from './routes/identity';
import { rateLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import logger, { logRequest } from './utils/logger';

const app = express();

// Middleware global
app.use(cors());
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
    console.log(`   → Environment: ${config.nodeEnv}\n`);
  }
});

export default app;
