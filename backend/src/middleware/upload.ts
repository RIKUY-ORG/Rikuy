import multer from 'multer';
import { config } from '../config';

/**
 * Configuración de multer para uploads
 */
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  // Solo imágenes
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten archivos de imagen'), false);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: config.security.maxFileSize, // 10MB por defecto
  },
  fileFilter,
});
