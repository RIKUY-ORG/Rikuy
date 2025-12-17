/**
 * Hook para gestionar la identidad Semaphore del usuario
 */

import { useState, useEffect, useCallback } from 'react';
import { Identity } from '@semaphore-protocol/identity';
import { STORAGE_KEYS } from '@/config/semaphore';
import type { SemaphoreIdentity, IdentityStorage } from '@/types/semaphore';

export function useIdentity() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [commitment, setCommitment] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Cargar identidad desde localStorage
   */
  useEffect(() => {
    const loadIdentity = async () => {
      try {
        setIsLoading(true);
        const stored = localStorage.getItem(STORAGE_KEYS.SEMAPHORE_IDENTITY);

        if (stored) {
          const identityData: IdentityStorage = JSON.parse(stored);

          // Reconstruir identidad desde el commitment almacenado
          // NOTA: En producción, esto debería estar cifrado con la wallet del usuario
          const restoredIdentity = new Identity(identityData.encrypted);

          setIdentity(restoredIdentity);
          setCommitment(restoredIdentity.commitment.toString());
        }
      } catch (err) {
        console.error('Error loading identity:', err);
        setError('Failed to load identity');
      } finally {
        setIsLoading(false);
      }
    };

    loadIdentity();
  }, []);

  /**
   * Generar nueva identidad Semaphore
   */
  const generateIdentity = useCallback(async (): Promise<SemaphoreIdentity> => {
    try {
      setIsLoading(true);
      setError(null);

      // Generar nueva identidad con seed aleatorio
      const newIdentity = new Identity();

      // Preparar datos para almacenar
      const identityData: IdentityStorage = {
        commitment: newIdentity.commitment.toString(),
        encrypted: newIdentity.toString(), // Exportar identidad
        createdAt: Date.now(),
      };

      // Guardar en localStorage
      // IMPORTANTE: En producción, esto debe estar cifrado
      localStorage.setItem(
        STORAGE_KEYS.SEMAPHORE_IDENTITY,
        JSON.stringify(identityData)
      );

      setIdentity(newIdentity);
      setCommitment(newIdentity.commitment.toString());

      return {
        commitment: newIdentity.commitment.toString(),
        secret: newIdentity.toString(),
      };
    } catch (err) {
      console.error('Error generating identity:', err);
      setError('Failed to generate identity');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Eliminar identidad actual
   */
  const deleteIdentity = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.SEMAPHORE_IDENTITY);
    localStorage.removeItem(STORAGE_KEYS.USER_COMMITMENT);
    setIdentity(null);
    setCommitment(null);
  }, []);

  /**
   * Exportar identidad para backup
   */
  const exportIdentity = useCallback((): string | null => {
    if (!identity) return null;
    return identity.toString();
  }, [identity]);

  /**
   * Importar identidad desde backup
   */
  const importIdentity = useCallback(async (identityString: string): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);

      const importedIdentity = new Identity(identityString);

      const identityData: IdentityStorage = {
        commitment: importedIdentity.commitment.toString(),
        encrypted: identityString,
        createdAt: Date.now(),
      };

      localStorage.setItem(
        STORAGE_KEYS.SEMAPHORE_IDENTITY,
        JSON.stringify(identityData)
      );

      setIdentity(importedIdentity);
      setCommitment(importedIdentity.commitment.toString());
    } catch (err) {
      console.error('Error importing identity:', err);
      setError('Invalid identity format');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Verificar si el usuario tiene identidad
   */
  const hasIdentity = useCallback((): boolean => {
    return identity !== null;
  }, [identity]);

  return {
    identity,
    commitment,
    isLoading,
    error,
    generateIdentity,
    deleteIdentity,
    exportIdentity,
    importIdentity,
    hasIdentity,
  };
}
