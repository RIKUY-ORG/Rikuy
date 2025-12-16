import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import {
  ExtractedCIData,
  ExtractedPassportData,
  DocumentType,
  BolivianDepartment,
  isValidDepartment
} from '../types/identity';
import { getServiceLogger } from '../utils/logger';

const logger = getServiceLogger('OCRService');

class OCRService {
  private tesseractWorker: Tesseract.Worker | null = null;

  async initialize(): Promise<void> {
    logger.info('Initializing Tesseract worker');
    this.tesseractWorker = await Tesseract.createWorker('spa');
  }

  async extractText(imageBuffer: Buffer): Promise<string> {
    if (!this.tesseractWorker) {
      await this.initialize();
    }

    const preprocessed = await this.preprocessImage(imageBuffer);

    const { data } = await this.tesseractWorker!.recognize(preprocessed);

    return data.text;
  }

  async extractBolivianCI(imageBuffer: Buffer): Promise<ExtractedCIData> {
    const text = await this.extractText(imageBuffer);

    // Intentar múltiples patrones para mayor flexibilidad
    const ciPatterns = [
      /(\d{8})\s*([A-Z]{2})/,           // Estándar: 12345678 LP
      /(\d{7,9})\s*([A-Z]{1,3})/,       // Más flexible
      /CI[:\s]*(\d{7,9})\s*([A-Z]{2})/, // Con prefijo CI
      /(\d{8})\s*[-–]\s*([A-Z]{2})/     // Con guión
    ];

    let match = null;
    for (const pattern of ciPatterns) {
      match = text.match(pattern);
      if (match) break;
    }

    if (!match) {
      logger.warn({ rawText: text.substring(0, 200) }, 'Failed to extract CI number');
      throw new Error('No se pudo extraer número de CI del documento');
    }

    let [, documentNumber, expedition] = match;

    // Normalizar a 8 dígitos si es necesario
    documentNumber = documentNumber.padStart(8, '0');

    if (!isValidDepartment(expedition)) {
      throw new Error(`Departamento de expedición inválido: ${expedition}`);
    }

    const names = this.extractNames(text);
    const dateOfBirth = this.extractDate(text);

    return {
      documentNumber,
      expedition: expedition as BolivianDepartment,
      firstName: names.firstName,
      lastName: names.lastName,
      dateOfBirth,
      confidence: 0.85,
      rawText: text
    };
  }

  async extractBolivianPassport(imageBuffer: Buffer): Promise<ExtractedPassportData> {
    const text = await this.extractText(imageBuffer);

    const passportPattern = /[A-Z]{2}\d{7}/;
    const match = text.match(passportPattern);

    if (!match) {
      throw new Error('No se pudo extraer número de pasaporte');
    }

    const passportNumber = match[0];
    const nationality = this.extractNationality(text);

    if (!nationality.includes('BOL') && !nationality.includes('BOLIVIA')) {
      throw new Error('El pasaporte no es boliviano');
    }

    const names = this.extractNames(text);
    const dates = this.extractPassportDates(text);

    return {
      passportNumber,
      nationality: 'BOLIVIA',
      firstName: names.firstName,
      lastName: names.lastName,
      dateOfBirth: dates.dateOfBirth,
      sex: this.extractSex(text),
      issueDate: dates.issueDate,
      expiryDate: dates.expiryDate,
      confidence: 0.8,
      rawText: text
    };
  }

  async validateImageQuality(imageBuffer: Buffer): Promise<boolean> {
    const metadata = await sharp(imageBuffer).metadata();

    if (!metadata.width || !metadata.height) {
      return false;
    }

    if (metadata.width < 800 || metadata.height < 600) {
      logger.warn({ width: metadata.width, height: metadata.height }, 'Image resolution too low');
      return false;
    }

    const stats = await sharp(imageBuffer).stats();
    const avgBrightness = stats.channels.reduce((sum, ch) => sum + ch.mean, 0) / stats.channels.length;

    if (avgBrightness < 30 || avgBrightness > 225) {
      logger.warn({ brightness: avgBrightness }, 'Image brightness out of range');
      return false;
    }

    return true;
  }

  private async preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
    // Preprocesamiento agresivo para mejorar OCR
    return sharp(imageBuffer)
      .resize(2000, 2000, { fit: 'inside', withoutEnlargement: false }) // Escalar a tamaño óptimo
      .greyscale() // Convertir a escala de grises
      .normalize() // Normalizar histograma
      .sharpen({ sigma: 1.5 }) // Aumentar nitidez
      .linear(1.2, -(128 * 1.2) + 128) // Aumentar contraste
      .threshold(128) // Binarización para texto más claro
      .toBuffer();
  }

  private extractNames(text: string): { firstName: string; lastName: string } {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    const namePattern = /[A-ZÁÉÍÓÚÑ\s]{2,}/;
    const potentialNames = lines
      .filter(line => namePattern.test(line))
      .filter(line => line.length > 3 && line.length < 50);

    if (potentialNames.length < 2) {
      return { firstName: 'DESCONOCIDO', lastName: 'DESCONOCIDO' };
    }

    const [lastName, firstName] = potentialNames;

    return {
      firstName: firstName.trim(),
      lastName: lastName.trim()
    };
  }

  private extractDate(text: string): string {
    const datePatterns = [
      /(\d{2})\/(\d{2})\/(\d{4})/,
      /(\d{2})-(\d{2})-(\d{4})/,
      /(\d{4})\/(\d{2})\/(\d{2})/
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        const [, p1, p2, p3] = match;

        if (p3.length === 4) {
          return `${p1}/${p2}/${p3}`;
        } else {
          return `${p3}/${p2}/${p1}`;
        }
      }
    }

    return '01/01/1990';
  }

  private extractNationality(text: string): string {
    const nationalityPattern = /(?:NATIONALITY|NACIONALIDAD)\s*:?\s*([A-Z]{3}|[A-ZÁÉÍÓÚÑ\s]+)/i;
    const match = text.match(nationalityPattern);

    if (match) {
      return match[1].toUpperCase();
    }

    if (text.includes('BOLIVIA') || text.includes('BOL')) {
      return 'BOLIVIA';
    }

    return 'UNKNOWN';
  }

  private extractSex(text: string): string {
    if (text.includes('M') && !text.includes('F')) return 'M';
    if (text.includes('F')) return 'F';
    return 'U';
  }

  private extractPassportDates(text: string): {
    dateOfBirth: string;
    issueDate: string;
    expiryDate: string;
  } {
    const dates = text.match(/\d{2}\/\d{2}\/\d{4}/g) || [];

    return {
      dateOfBirth: dates[0] || '01/01/1990',
      issueDate: dates[1] || '01/01/2020',
      expiryDate: dates[2] || '01/01/2030'
    };
  }

  async shutdown(): Promise<void> {
    if (this.tesseractWorker) {
      await this.tesseractWorker.terminate();
      this.tesseractWorker = null;
      logger.info('Tesseract worker terminated');
    }
  }
}

export const ocrService = new OCRService();
