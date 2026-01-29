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
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = __importStar(require("./utils/logger"));
const app = (0, express_1.default)();
// CORS configuration
const allowedOrigins = [
    'http://localhost:5173', // Local development
    'http://localhost:3000',
    'https://rikuy.up.railway.app', // Production frontend
];
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            logger_1.default.warn({ origin }, 'CORS blocked request from unauthorized origin');
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
        (0, logger_1.logRequest)(req.method, req.path, res.statusCode, duration);
    });
    next();
});
// Routes
app.use('/api/identity', identity_1.default);
app.use('/api/reports', reports_1.default);
// 404 handler (rutas no encontradas) - DESPUÉS de todas las rutas
app.use(errorHandler_1.notFoundHandler);
// Error handler global - DEBE SER EL ÚLTIMO MIDDLEWARE
app.use(errorHandler_1.errorHandler);
// Start server
const PORT = config_1.config.port;
app.listen(PORT, () => {
    logger_1.default.info({
        port: PORT,
        environment: config_1.config.nodeEnv,
        scrollRpc: config_1.config.blockchain.rpcUrl,
        arkivRpc: config_1.config.arkiv.rpcUrl,
    }, 'Rikuy Backend started successfully');
    // Pretty console log for development
    if (config_1.config.nodeEnv === 'development') {
        console.log('\n🚀 Rikuy Backend ready');
        console.log(`   → http://localhost:${PORT}`);
        console.log(`   → Environment: ${config_1.config.nodeEnv}`);
        // DEV MODE WARNING
        if (config_1.config.devMode) {
            console.log('\n⚠️  ⚠️  ⚠️  DEV MODE ACTIVE ⚠️  ⚠️  ⚠️');
            console.log('   → ZK proofs are NOT being verified!');
            console.log('   → Membership checks are DISABLED!');
            console.log('   → Nullifier uniqueness is NOT enforced!');
            console.log('   → DO NOT USE IN PRODUCTION!\n');
            logger_1.default.warn({
                devMode: config_1.config.devMode,
                warning: 'SECURITY BYPASSED FOR DEVELOPMENT'
            }, '⚠️  DEV MODE ACTIVE - All security checks disabled');
        }
        console.log();
    }
});
exports.default = app;
