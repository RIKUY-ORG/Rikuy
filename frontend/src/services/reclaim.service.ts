// frontend/src/services/reclaim.service.ts
export class ReclaimService {
  static async verifyIdentity(proofData: any, walletAddress: string) {
    const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/api/identity/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ci: proofData.claimData.ci,
        fullName: proofData.claimData.fullName,
        walletAddress
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Verification failed');
    }

    return response.json();
  }
}