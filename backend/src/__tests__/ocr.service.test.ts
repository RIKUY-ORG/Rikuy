import { ocrService } from '../services/ocr.service';
import sharp from 'sharp';

describe('OCRService', () => {
  describe('validateImageQuality', () => {
    it('should reject images with low resolution', async () => {
      const lowResImage = await sharp({
        create: {
          width: 400,
          height: 300,
          channels: 3,
          background: { r: 255, g: 255, b: 255 }
        }
      }).jpeg().toBuffer();

      const isValid = await ocrService.validateImageQuality(lowResImage);

      expect(isValid).toBe(false);
    });

    it('should accept images with good resolution', async () => {
      const goodImage = await sharp({
        create: {
          width: 1200,
          height: 900,
          channels: 3,
          background: { r: 128, g: 128, b: 128 }
        }
      }).jpeg().toBuffer();

      const isValid = await ocrService.validateImageQuality(goodImage);

      expect(isValid).toBe(true);
    });

    it('should reject images that are too dark', async () => {
      const darkImage = await sharp({
        create: {
          width: 1200,
          height: 900,
          channels: 3,
          background: { r: 10, g: 10, b: 10 }
        }
      }).jpeg().toBuffer();

      const isValid = await ocrService.validateImageQuality(darkImage);

      expect(isValid).toBe(false);
    });

    it('should reject images that are too bright', async () => {
      const brightImage = await sharp({
        create: {
          width: 1200,
          height: 900,
          channels: 3,
          background: { r: 250, g: 250, b: 250 }
        }
      }).jpeg().toBuffer();

      const isValid = await ocrService.validateImageQuality(brightImage);

      expect(isValid).toBe(false);
    });
  });

  afterAll(async () => {
    await ocrService.shutdown();
  });
});
