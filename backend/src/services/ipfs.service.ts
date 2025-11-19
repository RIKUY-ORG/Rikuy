import { PinataSDK } from 'pinata-web3';
import sharp from 'sharp';
import crypto from 'crypto';
import { config } from '../config';

/**
 * Servicio para IPFS usando Pinata
 */
class IPFSService {
  private pinata: PinataSDK;

  constructor() {
    this.pinata = new PinataSDK({
      pinataJwt: config.pinata.jwt,
      pinataGateway: config.pinata.gateway,
    });
  }

  /**
   * Subir imagen a IPFS (con optimización y limpieza de EXIF)
   */
  async uploadImage(file: Express.Multer.File): Promise<{
    ipfsHash: string;
    url: string;
    fileHash: string;
  }> {
    try {
      console.log(`[IPFS] Processing image: ${file.originalname}`);

      // 1. Limpiar metadata EXIF (privacidad)
      const cleanedBuffer = await sharp(file.buffer)
        .rotate() // Auto-rotar basado en EXIF antes de removerlo
        .jpeg({ quality: 85, mozjpeg: true }) // Optimizar
        .withMetadata({
          exif: {}, // Remover EXIF
          icc: undefined,
        })
        .toBuffer();

      // 2. Calcular hash del archivo (para duplicate detection)
      const fileHash = crypto
        .createHash('sha256')
        .update(cleanedBuffer)
        .digest('hex');

      console.log(`[IPFS] File hash: ${fileHash}`);

      // 3. Subir a IPFS via Pinata
      const upload = await this.pinata.upload
        .file(new File([cleanedBuffer], file.originalname))
        .addMetadata({
          name: `rikuy-evidence-${Date.now()}`,
          keyValues: {
            fileHash,
            uploadedAt: Date.now().toString(),
          },
        });

      const ipfsHash = upload.IpfsHash;
      const url = `${config.pinata.gateway}/ipfs/${ipfsHash}`;

      console.log(`[IPFS] Uploaded successfully: ${ipfsHash}`);

      return {
        ipfsHash,
        url,
        fileHash,
      };

    } catch (error) {
      console.error('[IPFS] Upload failed:', error);
      throw new Error('Failed to upload image to IPFS');
    }
  }

  /**
   * Verificar si un hash de archivo ya existe (duplicate detection)
   */
  async checkDuplicate(fileHash: string): Promise<boolean> {
    try {
      // Query Pinata por metadata
      // Nota: La API de Pinata puede variar, esto es un placeholder
      // En producción, implementar con la API correcta de Pinata
      const files = await this.pinata.listFiles().pageLimit(1);

      // Filtrar por fileHash en memoria (temporal)
      // TODO: Mejorar con query directa cuando la API lo soporte
      return files.some((file: any) =>
        file.metadata?.keyValues?.fileHash === fileHash
      );

    } catch (error) {
      console.error('[IPFS] Duplicate check failed:', error);
      return false; // En caso de error, permitir upload
    }
  }

  /**
   * Obtener URL de IPFS
   */
  getIPFSUrl(hash: string): string {
    return `${config.pinata.gateway}/ipfs/${hash}`;
  }
}

export const ipfsService = new IPFSService();
