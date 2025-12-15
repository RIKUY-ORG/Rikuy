import { identityService } from '../services/identity.service';
import { DocumentType, BolivianDepartment } from '../types/identity';

describe('IdentityService', () => {
  describe('validateBolivianCI', () => {
    it('should validate correct CI format', () => {
      const result = identityService.validateBolivianCI('12345678', 'LP');

      expect(result.isValid).toBe(true);
      expect(result.normalized).toBeDefined();
      expect(result.normalized?.number).toBe('12345678');
      expect(result.normalized?.expedition).toBe(BolivianDepartment.LP);
    });

    it('should reject CI with less than 8 digits', () => {
      const result = identityService.validateBolivianCI('1234567', 'LP');

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('8 dígitos');
    });

    it('should reject CI with more than 8 digits', () => {
      const result = identityService.validateBolivianCI('123456789', 'LP');

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject CI with invalid department', () => {
      const result = identityService.validateBolivianCI('12345678', 'XX');

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error).toContain('inválido');
    });

    it('should clean non-numeric characters from CI', () => {
      const result = identityService.validateBolivianCI('12-345-678', 'SC');

      expect(result.isValid).toBe(true);
      expect(result.normalized?.number).toBe('12345678');
    });

    it('should accept all valid Bolivian departments', () => {
      const validDepartments = ['LP', 'CB', 'SC', 'OR', 'PT', 'TJ', 'CH', 'BN', 'PD'];

      validDepartments.forEach(dept => {
        const result = identityService.validateBolivianCI('12345678', dept);
        expect(result.isValid).toBe(true);
      });
    });

    it('should normalize department to uppercase', () => {
      const result = identityService.validateBolivianCI('12345678', 'lp');

      expect(result.isValid).toBe(true);
      expect(result.normalized?.expedition).toBe(BolivianDepartment.LP);
    });
  });

  describe('getIdentityStatus', () => {
    it('should return unverified status for non-existent user', async () => {
      const status = await identityService.getIdentityStatus('0x1234567890123456789012345678901234567890');

      expect(status.success).toBe(true);
      expect(status.data.isVerified).toBe(false);
      expect(status.data.canCreateReports).toBe(false);
    });
  });
});
