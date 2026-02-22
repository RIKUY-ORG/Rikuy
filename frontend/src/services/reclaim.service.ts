// frontend/src/services/reclaim.service.ts
import { RIKUY_CONFIG } from '@/config/rikuy';

export class ReclaimService {
  /**
   * Inicializar sesion de Reclaim Protocol desde el backend
   * El APP_SECRET se mantiene en el backend (nunca en el frontend)
   */
  static async initSession() {
    const response = await fetch(`${RIKUY_CONFIG.BACKEND_API_URL}/api/identity/reclaim-init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to initialize Reclaim session');
    }

    return response.json();
  }

  /**
   * Verificar identidad con proof de Reclaim
   */
  static async verifyIdentity(proofData: any, walletAddress: string) {
    const response = await fetch(`${RIKUY_CONFIG.BACKEND_API_URL}/api/identity/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-address': walletAddress,
      },
      body: JSON.stringify({
        // Ciudadania Digital provider devuelve 'usuario' y 'rol'
        usuario: proofData.claimData?.usuario
          || proofData.extractedParameterValues?.usuario
          || '',
        walletAddress,
        reclaimProof: proofData,
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Verification failed');
    }

    return response.json();
  }
}
