/**
 * Investigar el chain owner y cómo configurar gas
 */
import { createPublicClient,createWalletClient,http,defineChain,encodeFunctionData,getAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

const envPath = fs.existsSync('.env') ? '.env' : '../.env';
dotenv.config({ path: envPath });

const L3_RPC = 'http://localhost:8449';

const rikuyChain = defineChain({
    id: 313370,network: 'rikuy-chain',name: 'Rikuy Chain',
    nativeCurrency: { name: 'Ether',symbol: 'ETH',decimals: 18 },
    rpcUrls: { default: { http: [L3_RPC] },public: { http: [L3_RPC] } },
    testnet: true,
});

// ArbOwnerPublic precompile - anyone can read
const ARB_OWNER_PUBLIC = '0x000000000000000000000000000000000000006b' as const;
const ArbOwnerPublicABI = [
    { inputs: [],name: 'getAllChainOwners',outputs: [{ name: '',type: 'address[]' }],stateMutability: 'view',type: 'function' },
    { inputs: [{ name: 'addr',type: 'address' }],name: 'isChainOwner',outputs: [{ name: '',type: 'bool' }],stateMutability: 'view',type: 'function' },
    { inputs: [],name: 'getNetworkFeeAccount',outputs: [{ name: '',type: 'address' }],stateMutability: 'view',type: 'function' },
    { inputs: [],name: 'getInfraFeeAccount',outputs: [{ name: '',type: 'address' }],stateMutability: 'view',type: 'function' },
] as const;

const ARB_OWNER = '0x0000000000000000000000000000000000000070' as const;
const ArbOwnerABI = [
    { inputs: [{ name: 'priceInWei',type: 'uint256' }],name: 'setMinimumL2BaseFee',outputs: [],stateMutability: 'nonpayable',type: 'function' },
    { inputs: [{ name: 'newOwner',type: 'address' }],name: 'addChainOwner',outputs: [],stateMutability: 'nonpayable',type: 'function' },
] as const;

const UpgradeExecutorABI = [
    { inputs: [{ name: 'target',type: 'address' },{ name: 'targetCallData',type: 'bytes' }],name: 'executeCall',outputs: [],stateMutability: 'payable',type: 'function' },
] as const;

async function main() {
    const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
    const account = privateKeyToAccount(DEPLOYER_KEY);

    const publicClient = createPublicClient({ chain: rikuyChain,transport: http(L3_RPC) });
    const walletClient = createWalletClient({ account,chain: rikuyChain,transport: http(L3_RPC) });

    console.log(`Deployer: ${account.address}\n`);

    // 1. Leer chain owners usando precompile público
    console.log('=== Chain Owners (via ArbOwnerPublic 0x6b) ===');
    try {
        const owners = await publicClient.readContract({
            address: ARB_OWNER_PUBLIC,abi: ArbOwnerPublicABI,functionName: 'getAllChainOwners',
        });
        console.log('Owners:',owners);

        // Check si deployer es owner
        const isOwner = await publicClient.readContract({
            address: ARB_OWNER_PUBLIC,abi: ArbOwnerPublicABI,functionName: 'isChainOwner',
            args: [account.address],
        });
        console.log(`Deployer is chain owner: ${isOwner}`);

        // Check network fee account
        const feeAccount = await publicClient.readContract({
            address: ARB_OWNER_PUBLIC,abi: ArbOwnerPublicABI,functionName: 'getNetworkFeeAccount',
        });
        console.log(`Network Fee Account: ${feeAccount}`);

        const infraAccount = await publicClient.readContract({
            address: ARB_OWNER_PUBLIC,abi: ArbOwnerPublicABI,functionName: 'getInfraFeeAccount',
        });
        console.log(`Infra Fee Account: ${infraAccount}`);

        // Si los chain owners no incluyen al deployer, intentamos vía cada owner como UpgradeExecutor
        if (!isOwner && owners.length > 0) {
            console.log('\n=== Deployer NO es chain owner. Intentando vía UpgradeExecutor... ===');

            for (const owner of owners) {
                console.log(`\nIntentando con owner: ${owner}`);

                // Primero, añadir al deployer como chain owner
                const addOwnerData = encodeFunctionData({
                    abi: ArbOwnerABI,
                    functionName: 'addChainOwner',
                    args: [account.address],
                });

                try {
                    const hash = await walletClient.writeContract({
                        address: owner as `0x${string}`,
                        abi: UpgradeExecutorABI,
                        functionName: 'executeCall',
                        args: [ARB_OWNER,addOwnerData],
                    });
                    console.log(`  addChainOwner tx: ${hash}`);
                    await publicClient.waitForTransactionReceipt({ hash });
                    console.log('  ✅ Deployer añadido como chain owner!');

                    // Verificar
                    const nowOwner = await publicClient.readContract({
                        address: ARB_OWNER_PUBLIC,abi: ArbOwnerPublicABI,functionName: 'isChainOwner',
                        args: [account.address],
                    });
                    console.log(`  Deployer is now chain owner: ${nowOwner}`);

                    if (nowOwner) {
                        // Ahora sí podemos setear el gas a 0
                        console.log('\n=== Configurando gas a 0 directamente ===');
                        const hash2 = await walletClient.writeContract({
                            address: ARB_OWNER,
                            abi: ArbOwnerABI,
                            functionName: 'setMinimumL2BaseFee',
                            args: [0n],
                        });
                        console.log(`  setMinimumL2BaseFee(0) tx: ${hash2}`);
                        await publicClient.waitForTransactionReceipt({ hash: hash2 });
                        console.log('  ✅ Gas configurado a 0!');
                    }

                    break; // Solo necesitamos un owner que funcione
                } catch (e: any) {
                    console.log(`  ❌ Error con ${owner}: ${e.shortMessage || e.message?.substring(0,80)}`);
                }
            }
        } else if (isOwner) {
            // El deployer ya es chain owner, intentar directamente
            console.log('\n=== Deployer ES chain owner. Configurando gas a 0... ===');
            try {
                const hash = await walletClient.writeContract({
                    address: ARB_OWNER,
                    abi: ArbOwnerABI,
                    functionName: 'setMinimumL2BaseFee',
                    args: [0n],
                });
                console.log(`  setMinimumL2BaseFee(0) tx: ${hash}`);
                await publicClient.waitForTransactionReceipt({ hash });
                console.log('  ✅ Gas configurado a 0!');
            } catch (e: any) {
                console.log(`  ❌ Error: ${e.shortMessage || e.message?.substring(0,80)}`);
            }
        }
    } catch (e: any) {
        console.error('Error leyendo chain owners:',e.message?.substring(0,100));
    }

    // Verificación final
    console.log('\n=== Verificación Final ===');
    const gasPrice = await publicClient.getGasPrice();
    console.log(`Gas Price: ${gasPrice} wei (${Number(gasPrice) / 1e9} gwei)`);
}

main().catch(console.error);
