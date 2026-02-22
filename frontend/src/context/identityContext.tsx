// src/context/identityContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { RIKUY_CONFIG, STORAGE_KEYS } from '@/config/rikuy';

interface IdentityContextType {
  isVerified: boolean;
  isLoading: boolean;
  commitment: string | null;
  verifiedAt: string | null;
  refreshStatus: () => Promise<void>;
}

const IdentityContext = createContext<IdentityContextType | undefined>(undefined);

export function IdentityProvider({ children }: { children: React.ReactNode }) {
  const { authenticated, user, ready } = usePrivy();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [commitment, setCommitment] = useState<string | null>(null);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);

  const checkStatus = async () => {
    // Si no está autenticado, resetear estado
    if (!authenticated || !user?.wallet?.address) {
      setIsVerified(false);
      setCommitment(null);
      setVerifiedAt(null);
      localStorage.removeItem(STORAGE_KEYS.VERIFIED);
      localStorage.removeItem(STORAGE_KEYS.COMMITMENT);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Consultar al backend (fuente de verdad)
      const response = await fetch(
        `${RIKUY_CONFIG.BACKEND_API_URL}/api/identity/status?walletAddress=${user.wallet.address}`
      );

      if (response.ok) {
        const data = await response.json();
        const verified = data.data?.isVerified || false;
        const userCommitment = data.data?.commitment || null;
        const userVerifiedAt = data.data?.verifiedAt || null;

        setIsVerified(verified);
        setCommitment(userCommitment);
        setVerifiedAt(userVerifiedAt);

        // Sincronizar localStorage (solo como cache)
        if (verified) {
          localStorage.setItem(STORAGE_KEYS.VERIFIED, 'true');
          if (userCommitment) {
            localStorage.setItem(STORAGE_KEYS.COMMITMENT, userCommitment);
          }
        } else {
          localStorage.removeItem(STORAGE_KEYS.VERIFIED);
          localStorage.removeItem(STORAGE_KEYS.COMMITMENT);
        }
      } else {
        // Fallback a localStorage si el backend falla
        const cached = localStorage.getItem(STORAGE_KEYS.VERIFIED);
        setIsVerified(cached === 'true');
        setCommitment(localStorage.getItem(STORAGE_KEYS.COMMITMENT));
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      // Fallback a localStorage
      const cached = localStorage.getItem(STORAGE_KEYS.VERIFIED);
      setIsVerified(cached === 'true');
      setCommitment(localStorage.getItem(STORAGE_KEYS.COMMITMENT));
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar cuando cambia la autenticación
  useEffect(() => {
    if (ready) {
      checkStatus();
    }
  }, [authenticated, user?.wallet?.address, ready]);

  // Verificar periódicamente (opcional, cada 5 minutos)
  useEffect(() => {
    if (!authenticated) return;

    const interval = setInterval(checkStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [authenticated]);

  const refreshStatus = async () => {
    await checkStatus();
  };

  return (
    <IdentityContext.Provider
      value={{
        isVerified,
        isLoading,
        commitment,
        verifiedAt,
        refreshStatus,
      }}
    >
      {children}
    </IdentityContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useIdentity() {
  const context = useContext(IdentityContext);
  if (context === undefined) {
    throw new Error('useIdentity must be used within an IdentityProvider');
  }
  return context;
}