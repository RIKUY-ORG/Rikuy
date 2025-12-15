import { semaphoreService } from '../services/semaphore.service';

describe('SemaphoreService', () => {
  describe('generateIdentity', () => {
    it('should generate a valid Semaphore identity', () => {
      const identity = semaphoreService.generateIdentity();

      expect(identity).toBeDefined();
      expect(identity.commitment).toBeDefined();
      expect(identity.nullifier).toBeDefined();
      expect(identity.trapdoor).toBeDefined();
      expect(identity.secret).toBeDefined();
    });

    it('should generate deterministic identity from seed', () => {
      const seed = 'test-seed-123';
      const identity1 = semaphoreService.generateIdentity(seed);
      const identity2 = semaphoreService.generateIdentity(seed);

      expect(identity1.commitment).toBe(identity2.commitment);
      expect(identity1.nullifier).toBe(identity2.nullifier);
      expect(identity1.trapdoor).toBe(identity2.trapdoor);
    });

    it('should generate different identities for different seeds', () => {
      const identity1 = semaphoreService.generateIdentity('seed1');
      const identity2 = semaphoreService.generateIdentity('seed2');

      expect(identity1.commitment).not.toBe(identity2.commitment);
    });
  });

  describe('verifyProof', () => {
    it('should reject proof with invalid format', async () => {
      const invalidProof = {
        proof: ['invalid'],
        publicSignals: ['invalid']
      };

      const result = await semaphoreService.verifyProof(invalidProof);

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject proof with wrong number of elements', async () => {
      const invalidProof = {
        proof: ['0', '0', '0'],
        publicSignals: ['0', '0']
      };

      const result = await semaphoreService.verifyProof(invalidProof);

      expect(result.isValid).toBe(false);
    });
  });
});
