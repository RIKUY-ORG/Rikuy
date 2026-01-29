/**
 * Hook para verificar el estado de verificación de identidad del usuario
 */
import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { SEMAPHORE_CONFIG } from '@/config/semaphore';

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

        // Primero verificar localStorage (fuente de verdad local)
        const identitySecret = localStorage.getItem('rikuy_identity_secret');

        if (identitySecret) {
          // Si tenemos el identity secret en localStorage, el usuario YA está verificado
          // (aunque el backend haya perdido la info por reinicio)
          console.log('[useIdentityStatus] Found identity secret in localStorage - user is verified');
          setStatus({
            isVerified: true,
            isLoading: false,
            error: null,
            commitment: identitySecret,
          });
          return;
        }

        // Si no hay nada en localStorage, verificar con el backend
        const url = `${SEMAPHORE_CONFIG.BACKEND_API_URL}/api/identity/status?userAddress=${user.wallet.address}`;
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

        // Incluso si el backend falla, verificar localStorage como fallback
        const identitySecret = localStorage.getItem('rikuy_identity_secret');
        if (identitySecret) {
          console.log('[useIdentityStatus] Backend failed but found localStorage - user is verified');
          setStatus({
            isVerified: true,
            isLoading: false,
            error: null,
            commitment: identitySecret,
          });
        } else {
          setStatus({
            isVerified: false,
            isLoading: false,
            error: 'Error al verificar identidad',
            commitment: null,
          });
        }
      }
    }

    checkIdentityStatus();
  }, [authenticated, user?.wallet?.address]);

  return status;
}
