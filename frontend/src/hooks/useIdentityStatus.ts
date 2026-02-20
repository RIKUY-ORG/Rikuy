/**
 * Hook para verificar el estado de verificación de identidad del usuario
 */
import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
<<<<<<< HEAD
import { SEMAPHORE_CONFIG } from '@/config/semaphore';
=======
import { RIKUY_CONFIG } from '@/config/rikuy';
>>>>>>> f0c7a9502aa745d4741595090075b6e8c17ca924

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

<<<<<<< HEAD
        const url = `${SEMAPHORE_CONFIG.BACKEND_API_URL}/api/identity/status?userAddress=${user.wallet.address}`;
=======
        // Primero verificar localStorage (fuente de verdad local)
        const isVerified = localStorage.getItem('rikuy_verified');
        const commitment = localStorage.getItem('rikuy_commitment');

        if (isVerified) {
          console.log('[useIdentityStatus] Found verified status in localStorage');
          setStatus({
            isVerified: true,
            isLoading: false,
            error: null,
            commitment: commitment,
          });
          return;
        }

        // Si no hay nada en localStorage, verificar con el backend
        const url = `${RIKUY_CONFIG.BACKEND_API_URL}/api/identity/status?walletAddress=${user.wallet.address}`;
>>>>>>> f0c7a9502aa745d4741595090075b6e8c17ca924
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
<<<<<<< HEAD
            commitment: data.data.identityCommitment || null,
=======
            commitment: data.data.commitment || null,
>>>>>>> f0c7a9502aa745d4741595090075b6e8c17ca924
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
<<<<<<< HEAD
        setStatus({
          isVerified: false,
          isLoading: false,
          error: 'Error al verificar identidad',
          commitment: null,
        });
=======

        // Incluso si el backend falla, verificar localStorage como fallback
        const isVerified = localStorage.getItem('rikuy_verified');
        if (isVerified) {
          console.log('[useIdentityStatus] Backend failed but found localStorage - user is verified');
          setStatus({
            isVerified: true,
            isLoading: false,
            error: null,
            commitment: localStorage.getItem('rikuy_commitment'),
          });
        } else {
          setStatus({
            isVerified: false,
            isLoading: false,
            error: 'Error al verificar identidad',
            commitment: null,
          });
        }
>>>>>>> f0c7a9502aa745d4741595090075b6e8c17ca924
      }
    }

    checkIdentityStatus();
  }, [authenticated, user?.wallet?.address]);

  return status;
}
