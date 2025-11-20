import express from 'express';
import cors from 'cors';
import { config } from './config';
import reportsRouter from './routes/reports';
import { rateLimiter } from './middleware/rateLimit';

const app = express();

// Middleware global
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting global
app.use(rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'rikuy-backend',
    timestamp: Date.now(),
  });
});

// Routes
app.use('/api/reports', reportsRouter);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server] Error:', err);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`🚀 Rikuy Backend running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`⛓️  Scroll RPC: ${config.scroll.rpcUrl}`);
  console.log(`📦 Arkiv RPC: ${config.arkiv.rpcUrl}`);
});

export default app;
