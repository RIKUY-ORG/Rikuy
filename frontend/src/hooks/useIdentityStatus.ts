/**
 * Hook para verificar el estado de verificación de identidad del usuario
 */
import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';

interface IdentityStatus {
  isVerified: boolean;
  isLoading: boolean;
  error: string | null;
  commitment: string | null;
}

export function useIdentityStatus() {
  const { user, authenticated } = usePrivy();
  const [status, setStatus] = useState<IdentityStatus>({
    isVerified: false,
    isLoading: true,
    error: null,
    commitment: null,
  });

  useEffect(() => {
    async function checkIdentityStatus() {
      console.log('[useIdentityStatus] Checking status...', { authenticated, address: user?.wallet?.address });

      if (!authenticated || !user?.wallet?.address) {
        console.log('[useIdentityStatus] User not authenticated or no wallet');
        setStatus({
          isVerified: false,
          isLoading: false,
          error: null,
          commitment: null,
        });
        return;
      }

      try {
        setStatus(prev => ({ ...prev, isLoading: true, error: null }));

        const url = `${import.meta.env.VITE_BACKEND_API_URL}/api/identity/status?userAddress=${user.wallet.address}`;
        console.log('[useIdentityStatus] Fetching:', url);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        console.log('[useIdentityStatus] Response:', data);

        if (data.success && data.data) {
          setStatus({
            isVerified: data.data.isVerified || false,
            isLoading: false,
            error: null,
            commitment: data.data.identityCommitment || null,
          });
        } else {
          setStatus({
            isVerified: false,
            isLoading: false,
            error: null,
            commitment: null,
          });
        }
      } catch (error) {
        console.error('[useIdentityStatus] Error checking identity status:', error);
        setStatus({
          isVerified: false,
          isLoading: false,
          error: 'Error al verificar identidad',
          commitment: null,
        });
      }
    }

    checkIdentityStatus();
  }, [authenticated, user?.wallet?.address]);

  return status;
}
