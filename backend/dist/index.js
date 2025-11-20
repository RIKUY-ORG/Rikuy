"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const config_1 = require("./config");
const reports_1 = __importDefault(require("./routes/reports"));
const rateLimit_1 = require("./middleware/rateLimit");
const app = (0, express_1.default)();
// Middleware global
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Rate limiting global
app.use(rateLimit_1.rateLimiter);
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'rikuy-backend',
        timestamp: Date.now(),
    });
});
// Routes
app.use('/api/reports', reports_1.default);
// Error handler
app.use((err, req, res, next) => {
    console.error('[Server] Error:', err);
    res.status(err.status || 500).json({
        success: false,
        error: err.message || 'Internal server error',
    });
});
// Start server
const PORT = config_1.config.port;
app.listen(PORT, () => {
    console.log(`🚀 Rikuy Backend running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${config_1.config.nodeEnv}`);
    console.log(`⛓️  Scroll RPC: ${config_1.config.scroll.rpcUrl}`);
    console.log(`📦 Arkiv RPC: ${config_1.config.arkiv.rpcUrl}`);
});
exports.default = app;
