import { useState, useEffect } from 'react';
import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk';
import { Button } from '@heroui/button';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useNavigate } from 'react-router-dom';
import { addToast } from '@heroui/toast';
import { ReclaimService } from '@/services/reclaim.service';
import { STORAGE_KEYS } from '@/config/rikuy';

/**
 * Componente de verificacion de ciudadania boliviana via Reclaim Protocol
 *
 * Flujo seguro:
 * 1. Frontend pide al backend que inicialice la sesion de Reclaim (APP_SECRET en backend)
 * 2. Backend genera requestUrl y statusUrl, los devuelve al frontend
 * 3. Frontend muestra QR/link al usuario
 * 4. Usuario verifica en Ciudadania Digital
 * 5. Reclaim devuelve proof al frontend
 * 6. Frontend envia proof al backend (/api/identity/verify)
 * 7. Backend registra commitment on-chain via Relayer (gasless)
 */
export function ReclaimVerification() {
    const navigate = useNavigate();
    const { authenticated } = usePrivy();
    const { wallets } = useWallets();
    const [loading, setLoading] = useState(false);
    const [proof, setProof] = useState<any>(null);
    const [verified, setVerified] = useState(false);
    const [error, setError] = useState('');
    const [qrUrl, setQrUrl] = useState('');

    // Verificar si ya esta verificado al montar
    useEffect(() => {
        const isVerified = localStorage.getItem(STORAGE_KEYS.VERIFIED);
        if (isVerified) {
            setVerified(true);
        }
    }, []);

    const handleVerification = async () => {
        if (!authenticated) return;
        setLoading(true);
        setError('');
        setQrUrl('');

        try {
            console.log('[Reclaim] Requesting session from backend...');

            // Paso 1: Pedir al backend que inicialice la sesion
            const initResult = await ReclaimService.initSession();

            if (!initResult.success) {
                throw new Error(initResult.error || 'Error inicializando sesion');
            }

            const { requestUrl, statusUrl, appId, providerId } = initResult.data;

            // Paso 2: Crear request en el frontend con los datos del backend
            // Usamos fromJsonString si el backend devuelve el JSON serializado,
            // o simplemente mostramos la URL si ya viene lista
            if (requestUrl) {
                setQrUrl(requestUrl);

                // Si tenemos statusUrl, hacer polling por el proof
                if (statusUrl) {
                    pollForProof(statusUrl);
                } else {
                    // Fallback: inicializar con ReclaimProofRequest usando solo appId (sin secret)
                    const reclaimRequest = await ReclaimProofRequest.init(appId, '', providerId);
                    await reclaimRequest.startSession({
                        onSuccess: async (proofs: any) => {
                            console.log('[Reclaim] Proof received:', proofs);
                            const proofData = Array.isArray(proofs) ? proofs[0] : proofs;
                            setProof(proofData);
                            await submitToBackend(proofData);
                        },
                        onError: (err: any) => {
                            console.error('[Reclaim] Session Error:', err);
                            setError('Error en la verificacion ZK de Reclaim');
                            setLoading(false);
                        }
                    });
                }
            }

        } catch (err: any) {
            console.error('[Reclaim] Init Error:', err);
            setError(err.message || 'Error iniciando Reclaim');
            setLoading(false);
        }
    };

    /**
     * Polling al statusUrl para obtener el proof cuando el usuario complete la verificacion
     */
    const pollForProof = async (statusUrl: string) => {
        const maxAttempts = 120; // 2 minutos
        let attempts = 0;

        const poll = setInterval(async () => {
            attempts++;
            if (attempts > maxAttempts) {
                clearInterval(poll);
                setError('Tiempo de espera agotado. Intenta de nuevo.');
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(statusUrl);
                const data = await response.json();

                if (data.session?.proofs && data.session.proofs.length > 0) {
                    clearInterval(poll);
                    const proofData = data.session.proofs[0];
                    console.log('[Reclaim] Proof received via polling:', proofData);
                    setProof(proofData);
                    await submitToBackend(proofData);
                }
            } catch {
                // Silently retry — the session might not be ready yet
            }
        }, 1000);
    };

    /**
     * Enviar proof al backend para verificacion y registro on-chain (gasless)
     */
    const submitToBackend = async (proofData: any) => {
        try {
            const wallet = wallets[0];
            if (!wallet) {
                throw new Error('No se encontro wallet conectada');
            }

            console.log('[Reclaim] Submitting proof to backend for wallet:', wallet.address);
            setLoading(true);

            const result = await ReclaimService.verifyIdentity(proofData, wallet.address);

            if (result.success) {
                // Guardar estado de verificacion
                if (result.data?.commitment) {
                    localStorage.setItem(STORAGE_KEYS.COMMITMENT, result.data.commitment);
                }
                localStorage.setItem(STORAGE_KEYS.VERIFIED, 'true');

                setVerified(true);
                setLoading(false);

                addToast({
                    title: 'Identidad verificada',
                    description: 'Tu ciudadania ha sido verificada de forma anonima.',
                    color: 'success',
                });

                // Redirigir a denunciar despues de 2 segundos
                setTimeout(() => {
                    navigate('/denunciar');
                }, 2000);
            } else {
                throw new Error(result.error || 'Error al verificar');
            }

        } catch (err: any) {
            console.error('[Reclaim] Backend submission error:', err);
            setError(err.message || 'Error registrando verificacion');
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto shadow-none border-0">
            <CardHeader className="flex flex-col gap-1 items-center px-6 pt-0">
                <h4 className="text-lg font-bold">Verificar Ciudadania Boliviana</h4>
                <p className="text-small text-default-500 text-center">Usa tus credenciales de Ciudadania Digital de forma privada.</p>
            </CardHeader>
            <CardBody className="px-6 py-4 flex flex-col items-center">
                {verified ? (
                    <div className="text-center py-4">
                        <div className="text-5xl mb-4">✅</div>
                        <p className="font-bold text-green-600 text-xl">Verificado</p>
                        <p className="text-sm text-default-500 mt-2">Tu identidad ha sido registrada on-chain de forma anonima.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 w-full items-center">

                        {loading && !qrUrl && !proof && <p className="text-sm animate-pulse">Iniciando sesion segura...</p>}

                        {qrUrl && !proof && (
                            <div className="flex flex-col items-center gap-2 my-2">
                                <div className="bg-white p-2 rounded shadow-sm border">
                                    <p className="text-xs text-center mb-1 font-semibold text-gray-700">ESCANEAME O HAZ CLICK</p>
                                    <a
                                        href={qrUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-600 underline break-all max-w-[200px] truncate block text-center"
                                    >
                                        Enlace de Verificacion
                                    </a>
                                </div>
                                <p className="text-xs text-default-400 mt-1">Esperando verificacion...</p>
                            </div>
                        )}

                        {proof && !verified && (
                            <div className="p-4 bg-blue-50 text-blue-700 rounded-lg text-center w-full border border-blue-200 shadow-sm">
                                <p className="font-bold text-sm">Prueba ZK Generada</p>
                                <p className="text-xs mt-1">Registrando en Rikuy Chain L3 via Relayer...</p>
                                {loading ? (
                                    <div className="mt-3 animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700 mx-auto"></div>
                                ) : (
                                    <Button
                                        size="sm"
                                        color="primary"
                                        className="mt-3 font-bold"
                                        onClick={() => submitToBackend(proof)}
                                    >
                                        Reintentar Verificacion
                                    </Button>
                                )}
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-red-50 text-red-600 rounded text-sm text-center w-full border border-red-100">
                                {error}
                            </div>
                        )}

                        {!loading && !proof && (
                            <Button
                                color="primary"
                                onClick={handleVerification}
                                className="w-full font-semibold"
                                size="lg"
                                isDisabled={!authenticated}
                            >
                                Iniciar Verificacion ZK
                            </Button>
                        )}

                        {authenticated && loading && qrUrl && !proof && (
                            <Button
                                variant="flat"
                                color="danger"
                                size="sm"
                                onClick={() => { setLoading(false); setQrUrl(''); }}
                            >
                                Cancelar
                            </Button>
                        )}
                    </div>
                )}
            </CardBody>
        </Card>
    );
}
