"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const config_1 = require("../config");
/**
 * Configuración de multer para uploads
 */
const storage = multer_1.default.memoryStorage();
const fileFilter = (req, file, cb) => {
    // Solo imágenes
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('Solo se permiten archivos de imagen'), false);
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: config_1.config.security.maxFileSize, // 10MB por defecto
    },
    fileFilter,
});
