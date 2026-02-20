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
   * Subir JSON a IPFS (metadata de reportes, datos legales Ley 974)
   * Reemplaza Arkiv como storage de metadata — Pinata keyvalues permiten queries
   */
  async uploadJSON(
    data: object,
    metadata: { name: string; keyvalues: Record<string, string> },
  ): Promise<{ ipfsHash: string; url: string }> {
    try {
      console.log(`[IPFS] Uploading JSON metadata: ${metadata.name}`);

      const jsonString = JSON.stringify(data, null, 2);
      const jsonBlob = new File(
        [new TextEncoder().encode(jsonString)],
        `${metadata.name}.json`,
        { type: 'application/json' },
      );

      const upload = await this.pinata.upload
        .file(jsonBlob)
        .addMetadata({
          name: metadata.name,
          keyValues: metadata.keyvalues,
        });

      const ipfsHash = upload.IpfsHash;
      const url = `${config.pinata.gateway}/ipfs/${ipfsHash}`;

      console.log(`[IPFS] JSON uploaded successfully: ${ipfsHash}`);

      return { ipfsHash, url };
    } catch (error) {
      console.error('[IPFS] JSON upload failed:', error);
      throw new Error('Failed to upload metadata JSON to IPFS');
    }
  }

  /**
   * Obtener JSON desde IPFS por hash (CID)
   * Usado para recuperar metadata de reportes almacenada en IPFS
   */
  async getJSON<T = any>(ipfsHash: string): Promise<T> {
    try {
      console.log(`[IPFS] Fetching JSON: ${ipfsHash}`);
      const url = `${config.pinata.gateway}/ipfs/${ipfsHash}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`IPFS fetch failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      console.error('[IPFS] JSON fetch failed:', error);
      throw new Error(`Failed to fetch JSON from IPFS: ${ipfsHash}`);
    }
  }

  /**
   * Buscar archivos en Pinata por keyvalues (reemplaza queries de Arkiv)
   * Permite filtrar reportes por reportId, category, protocol, etc.
   */
  async findByKeyValues(
    keyvalues: Record<string, string>,
    limit: number = 50,
  ): Promise<Array<{ ipfsHash: string; name: string; metadata: any }>> {
    try {
      console.log(`[IPFS] Searching files by keyvalues:`, keyvalues);

      // Pinata SDK listFiles con filtro de metadata
      // keyValue() acepta (key, value, operator?) — encadenar multiples filtros
      let query = this.pinata.listFiles().pageLimit(limit) as any;

      for (const [key, value] of Object.entries(keyvalues)) {
        query = query.keyValue(key, value);
      }

      const files = await query;

      return files.map((file: any) => ({
        ipfsHash: file.ipfs_pin_hash,
        name: file.metadata?.name || '',
        metadata: file.metadata?.keyvalues || {},
      }));
    } catch (error) {
      console.error('[IPFS] Search failed:', error);
      return [];
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
