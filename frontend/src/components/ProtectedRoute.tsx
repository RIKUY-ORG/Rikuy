/**
 * Componente que protege rutas verificando:
 * 1. Usuario está logueado (Privy)
 * 2. Usuario tiene identidad verificada (CI boliviano)
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePrivy } from '@privy-io/react-auth';
import { useIdentityStatus } from '@/hooks/useIdentityStatus';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireVerification?: boolean; // Si es false, solo requiere login
}

export default function ProtectedRoute({
  children,
  requireVerification = true
}: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { authenticated, ready, login } = usePrivy();
  const { isVerified, isLoading } = useIdentityStatus();

  useEffect(() => {
    // Esperar a que Privy esté listo
    if (!ready) return;

    // Si no está autenticado, mostrar login de Privy
    if (!authenticated) {
      login();
      return;
    }

    // Si requiere verificación y no está verificando
    if (requireVerification && !isLoading) {
      if (!isVerified) {
        // Redirigir a verificación de identidad
        navigate('/verificar-identidad');
      }
    }
  }, [ready, authenticated, isVerified, isLoading, requireVerification, navigate, login]);

  // Mostrar loading mientras verifica
  if (!ready || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-gray-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, no mostrar nada (Privy se encarga)
  if (!authenticated) {
    return null;
  }

  // Si requiere verificación pero no está verificado, no mostrar contenido
  if (requireVerification && !isVerified) {
    return null;
  }

  // Todo OK, mostrar contenido protegido
  return <>{children}</>;
}
