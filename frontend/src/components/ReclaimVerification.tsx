import { useState,useRef,useEffect } from 'react';
import { ReclaimProofRequest } from '@reclaimprotocol/js-sdk';
import { Button } from '@heroui/button';
import { Card,CardBody,CardHeader } from '@heroui/card';
import { usePrivy,useWallets } from '@privy-io/react-auth';
import { createWalletClient,custom } from 'viem';
import { rikuyChain } from '@/config/chain';
import contracts from '@/config/contracts.json';

// ABI mínimo para verificar en contrato
const VerifierABI = [
    {
        inputs: [{ components: [{ name: "claimInfo",type: "tuple",components: [{ name: "provider",type: "string" },{ name: "parameters",type: "string" },{ name: "context",type: "string" }] },{ name: "signedClaim",type: "tuple",components: [{ name: "claim",type: "tuple",components: [{ name: "identifier",type: "bytes32" },{ name: "owner",type: "string" },{ name: "timestampS",type: "uint32" },{ name: "epoch",type: "uint32" }] },{ name: "signatures",type: "bytes[]" }] }],name: "proof",type: "tuple" }],
        name: "verifyProof",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
    }
] as const;

export function ReclaimVerification() {
    const { authenticated } = usePrivy();
    const { wallets } = useWallets();
    const walletsRef = useRef(wallets);
    const [loading,setLoading] = useState(false);
    const [proof,setProof] = useState<any>(null);
    const [verified,setVerified] = useState(false);
    const [error,setError] = useState('');
    const [qrUrl,setQrUrl] = useState('');

    // Mantener walletsRef actualizado para evitar stale closures
    useEffect(() => {
        walletsRef.current = wallets;
        console.log('Wallets updated in ReclaimVerification:',wallets.length);
    },[wallets]);

    // Configurar Reclaim
    const APP_ID = import.meta.env.VITE_RECLAIM_APP_ID || '0x43b...';
    const APP_SECRET = import.meta.env.VITE_RECLAIM_APP_SECRET || '0x...';
    const PROVIDER_ID = import.meta.env.VITE_RECLAIM_PROVIDER_ID || 'http-provider-id';

    const handleVerification = async () => {
        if (!authenticated) return;
        setLoading(true);
        setError('');
        setQrUrl('');

        try {
            console.log('Starting Reclaim Proof Request...');
            const reclaimRequest = await ReclaimProofRequest.init(APP_ID,APP_SECRET,PROVIDER_ID);
            const requestUrl = await reclaimRequest.getRequestUrl();
            setQrUrl(requestUrl);

            await reclaimRequest.startSession({
                onSuccess: async (proofs: any) => {
                    console.log('✅ Proof received from Reclaim:',proofs);
                    const proofData = Array.isArray(proofs) ? proofs[0] : proofs;
                    setProof(proofData);

                    // Esperar un poco para asegurar que wallets estén listas
                    setTimeout(() => {
                        submitToBlockchain(proofData);
                    },1000);
                },
                onError: (err: any) => {
                    console.error('❌ Reclaim Session Error:',err);
                    setError('Error en la verificación ZK de Reclaim');
                    setLoading(false);
                }
            });

        } catch (err: any) {
            console.error('Reclaim Init Error:',err);
            setError(err.message || 'Error iniciando Reclaim');
            setLoading(false);
        }
    };

    const submitToBlockchain = async (proofData: any) => {
        try {
            // Usar la referencia más reciente de wallets
            const currentWallets = walletsRef.current;
            const wallet = currentWallets[0];

            if (!wallet) {
                console.error('No wallet available in submitToBlockchain. Wallets array:',currentWallets);
                throw new Error("No connected wallet found. Please make sure your wallet is connected and try the 'Retry' button.");
            }

            console.log('🚀 Submitting Proof to Blockchain with wallet:',wallet.address);
            setLoading(true);

            const provider = await wallet.getEthereumProvider();
            const walletClient = createWalletClient({
                account: wallet.address as `0x${string}`,
                chain: rikuyChain,
                transport: custom(provider)
            });

            // Mapeo manual al formato Reclaim.Proof de Solidity
            const formattedProof = {
                claimInfo: {
                    provider: proofData.claimData.provider,
                    parameters: proofData.claimData.parameters,
                    context: proofData.claimData.context,
                },
                signedClaim: {
                    claim: {
                        identifier: proofData.claimData.identifier,
                        owner: proofData.claimData.owner,
                        timestampS: Number(proofData.claimData.timestampS),
                        epoch: Number(proofData.claimData.epoch),
                    },
                    signatures: proofData.signatures,
                },
            };

            const tx = await walletClient.writeContract({
                address: contracts.CitizenZkVerifier as `0x${string}`,
                abi: VerifierABI,
                functionName: 'verifyProof',
                args: [formattedProof],
                account: wallet.address as `0x${string}`
            });

            console.log('Blockchain Transaction Success! Hash:',tx);
            setVerified(true);
            setLoading(false);

        } catch (err: any) {
            console.error('Blockchain Submission Error:',err);
            if (!err.message.includes('User rejected')) {
                setError('Error en blockchain: ' + (err.shortMessage || err.message));
            }
            setLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto shadow-none border-0">
            <CardHeader className="flex flex-col gap-1 items-center px-6 pt-0">
                <h4 className="text-lg font-bold">Verificar Ciudadanía Boliviana 🇧🇴</h4>
                <p className="text-small text-default-500 text-center">Usa tus credenciales de Ciudadanía Digital de forma privada.</p>
            </CardHeader>
            <CardBody className="px-6 py-4 flex flex-col items-center">
                {verified ? (
                    <div className="text-center py-4">
                        <div className="text-5xl mb-4">✅</div>
                        <p className="font-bold text-green-600 text-xl">¡Verificado!</p>
                        <p className="text-sm text-default-500 mt-2">Tu identidad ha sido registrada on-chain de forma anónima.</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4 w-full items-center">

                        {loading && !qrUrl && !proof && <p className="text-sm animate-pulse">Iniciando sesión segura...</p>}

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
                                        Enlace de Verificación
                                    </a>
                                </div>
                            </div>
                        )}

                        {proof && !verified && (
                            <div className="p-4 bg-blue-50 text-blue-700 rounded-lg text-center w-full border border-blue-200 shadow-sm">
                                <p className="font-bold text-sm">¡Prueba ZK Generada! ✨</p>
                                <p className="text-xs mt-1">Registrando en Rikuy Chain L3...</p>
                                {loading ? (
                                    <div className="mt-3 animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700 mx-auto"></div>
                                ) : (
                                    <Button
                                        size="sm"
                                        color="primary"
                                        className="mt-3 font-bold"
                                        onClick={() => submitToBlockchain(proof)}
                                    >
                                        Subir a Blockchain Manualmente
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
                                Iniciar Verificación ZK
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
