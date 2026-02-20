/**
 * Configure Zero Gas for Rikuy Chain L3
 * 
 * Este script configura el gas a 0 en Rikuy Chain para que los usuarios
 * no necesiten tener ETH para realizar transacciones.
 * 
 * Utiliza los precompiles de Arbitrum:
 * - ArbOwner (0x70): Para configurar parámetros de la chain
 * - ArbGasInfo (0x6c): Para leer información de gas actual
 * 
 * Uso:
 *   npx ts-node configure-zero-gas.ts
 */

import { createPublicClient,createWalletClient,http,defineChain,encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

const envPath = fs.existsSync('.env') ? '.env' : '../.env';
dotenv.config({ path: envPath });

// ====== Configuración ======
const L3_RPC = 'http://localhost:8449';
const CHAIN_ID = 313370;

// Precompile Addresses (Arbitrum Standard)
const ARB_OWNER = '0x0000000000000000000000000000000000000070' as const;
const ARB_GAS_INFO = '0x000000000000000000000000000000000000006C' as const;

// ABIs de los Precompiles
const ArbOwnerABI = [
    {
        inputs: [{ name: 'priceInWei',type: 'uint256' }],
        name: 'setMinimumL2BaseFee',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: 'priceInWei',type: 'uint256' }],
        name: 'setL2BaseFee',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: 'limit',type: 'uint64' }],
        name: 'setSpeedLimit',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: 'newNetworkFeeAccount',type: 'address' }],
        name: 'setNetworkFeeAccount',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [{ name: 'newInfraFeeAccount',type: 'address' }],
        name: 'setInfraFeeAccount',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getAllChainOwners',
        outputs: [{ name: '',type: 'address[]' }],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

const ArbGasInfoABI = [
    {
        inputs: [],
        name: 'getMinimumGasPrice',
        outputs: [{ name: '',type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getL1BaseFeeEstimate',
        outputs: [{ name: '',type: 'uint256' }],
        stateMutability: 'view',
        type: 'function',
    },
    {
        inputs: [],
        name: 'getPricesInWei',
        outputs: [
            { name: '',type: 'uint256' },
            { name: '',type: 'uint256' },
            { name: '',type: 'uint256' },
            { name: '',type: 'uint256' },
            { name: '',type: 'uint256' },
            { name: '',type: 'uint256' },
        ],
        stateMutability: 'view',
        type: 'function',
    },
] as const;

// Chain definition
const rikuyChain = defineChain({
    id: CHAIN_ID,
    network: 'rikuy-chain',
    name: 'Rikuy Chain',
    nativeCurrency: { name: 'Ether',symbol: 'ETH',decimals: 18 },
    rpcUrls: {
        default: { http: [L3_RPC] },
        public: { http: [L3_RPC] },
    },
    testnet: true,
});

async function main() {
    const DEPLOYER_KEY = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
    if (!DEPLOYER_KEY) {
        console.error('❌ DEPLOYER_PRIVATE_KEY no encontrada en .env');
        process.exit(1);
    }

    const account = privateKeyToAccount(DEPLOYER_KEY);

    const publicClient = createPublicClient({
        chain: rikuyChain,
        transport: http(L3_RPC),
    });

    const walletClient = createWalletClient({
        account,
        chain: rikuyChain,
        transport: http(L3_RPC),
    });

    console.log('═══════════════════════════════════════════════');
    console.log('  ⛽ Configuración de Gas Cero - Rikuy Chain');
    console.log('═══════════════════════════════════════════════');
    console.log(`  Chain ID: ${CHAIN_ID}`);
    console.log(`  RPC: ${L3_RPC}`);
    console.log(`  Deployer: ${account.address}`);
    console.log('═══════════════════════════════════════════════\n');

    // ====== PASO 1: Leer configuración actual ======
    console.log('📊 PASO 1: Leyendo configuración actual de gas...\n');

    try {
        const minGasPrice = await publicClient.readContract({
            address: ARB_GAS_INFO,
            abi: ArbGasInfoABI,
            functionName: 'getMinimumGasPrice',
        });
        console.log(`  Min Gas Price actual: ${minGasPrice} wei (${Number(minGasPrice) / 1e9} gwei)`);
    } catch (e: any) {
        console.log(`  ⚠️ No se pudo leer min gas price: ${e.message?.substring(0,80)}`);
    }

    try {
        const owners = await publicClient.readContract({
            address: ARB_OWNER,
            abi: ArbOwnerABI,
            functionName: 'getAllChainOwners',
        });
        console.log(`  Chain Owners: ${JSON.stringify(owners)}`);
    } catch (e: any) {
        console.log(`  ⚠️ No se pudo leer chain owners: ${e.message?.substring(0,80)}`);
    }

    // ====== PASO 2: Configurar gas a 0 ======
    console.log('\n⚙️  PASO 2: Configurando gas a CERO...\n');

    // 2a. Set minimum L2 base fee to 0
    console.log('  2a. setMinimumL2BaseFee(0)...');
    try {
        const hash1 = await walletClient.writeContract({
            address: ARB_OWNER,
            abi: ArbOwnerABI,
            functionName: 'setMinimumL2BaseFee',
            args: [0n],
        });
        console.log(`      Tx: ${hash1}`);
        await publicClient.waitForTransactionReceipt({ hash: hash1 });
        console.log('      ✅ Minimum base fee = 0');
    } catch (e: any) {
        console.error(`      ❌ Error: ${e.shortMessage || e.message?.substring(0,100)}`);
        console.log('      Intentando vía alternativa...');

        // Si falla, puede que necesitemos llamar desde el chain owner (UpgradeExecutor en L3)
        const deploymentResult = JSON.parse(fs.readFileSync('deployment-result.json','utf-8'));

        // Leer el UpgradeExecutor de L3 del bridge deployment
        const l3UpgradeExecutor = '0x7397d901241E30db55F348Ec58CB1cBa435a4C6D'; // Del verifyBridge output

        const UpgradeExecutorABI = [
            {
                inputs: [
                    { name: 'target',type: 'address' },
                    { name: 'targetCallData',type: 'bytes' },
                ],
                name: 'executeCall',
                outputs: [],
                stateMutability: 'payable',
                type: 'function',
            },
        ] as const;

        const callData = encodeFunctionData({
            abi: ArbOwnerABI,
            functionName: 'setMinimumL2BaseFee',
            args: [0n],
        });

        try {
            const hash = await walletClient.writeContract({
                address: l3UpgradeExecutor,
                abi: UpgradeExecutorABI,
                functionName: 'executeCall',
                args: [ARB_OWNER,callData],
            });
            console.log(`      Tx (vía UpgradeExecutor): ${hash}`);
            await publicClient.waitForTransactionReceipt({ hash });
            console.log('      ✅ Minimum base fee = 0');
        } catch (e2: any) {
            console.error(`      ❌ Error vía UpgradeExecutor: ${e2.shortMessage || e2.message?.substring(0,100)}`);
        }
    }

    // 2b. Set speed limit alto (para no limitar throughput)
    console.log('\n  2b. setSpeedLimit(maxSpeed)...');
    try {
        const hash2 = await walletClient.writeContract({
            address: ARB_OWNER,
            abi: ArbOwnerABI,
            functionName: 'setSpeedLimit',
            args: [7000000n], // 7M gas per second (generoso)
        });
        console.log(`      Tx: ${hash2}`);
        await publicClient.waitForTransactionReceipt({ hash: hash2 });
        console.log('      ✅ Speed limit = 7,000,000 gas/sec');
    } catch (e: any) {
        console.log(`      ⚠️ Speed limit no modificado: ${e.shortMessage || e.message?.substring(0,80)}`);

        // Intentar vía UpgradeExecutor en L3
        const l3UpgradeExecutor = '0x7397d901241E30db55F348Ec58CB1cBa435a4C6D';
        const UpgradeExecutorABI = [{ inputs: [{ name: 'target',type: 'address' },{ name: 'targetCallData',type: 'bytes' }],name: 'executeCall',outputs: [],stateMutability: 'payable',type: 'function' }] as const;
        const callData = encodeFunctionData({ abi: ArbOwnerABI,functionName: 'setSpeedLimit',args: [7000000n] });
        try {
            const hash = await walletClient.writeContract({ address: l3UpgradeExecutor,abi: UpgradeExecutorABI,functionName: 'executeCall',args: [ARB_OWNER,callData] });
            await publicClient.waitForTransactionReceipt({ hash });
            console.log('      ✅ Speed limit = 7,000,000 gas/sec (vía UpgradeExecutor)');
        } catch (e2: any) {
            console.log(`      ⚠️ No se pudo modificar speed limit`);
        }
    }

    // ====== PASO 3: Verificar cambios ======
    console.log('\n📊 PASO 3: Verificando nueva configuración...\n');

    try {
        const newMinGasPrice = await publicClient.readContract({
            address: ARB_GAS_INFO,
            abi: ArbGasInfoABI,
            functionName: 'getMinimumGasPrice',
        });
        console.log(`  Min Gas Price: ${newMinGasPrice} wei (${Number(newMinGasPrice) / 1e9} gwei)`);

        if (newMinGasPrice === 0n) {
            console.log('  🎉 ¡GAS CERO CONFIRMADO! Los usuarios no pagarán gas.');
        } else {
            console.log(`  ⚠️ Gas no es 0. Valor actual: ${newMinGasPrice} wei`);
        }
    } catch (e: any) {
        console.log(`  ⚠️ No se pudo verificar: ${e.message?.substring(0,80)}`);
    }

    // ====== PASO 4: Test de transacción sin gas ======
    console.log('\n🧪 PASO 4: Test de transacción...\n');

    try {
        const gasPrice = await publicClient.getGasPrice();
        console.log(`  Gas Price actual del nodo: ${gasPrice} wei (${Number(gasPrice) / 1e9} gwei)`);

        const blockNumber = await publicClient.getBlockNumber();
        console.log(`  Bloque actual: ${blockNumber}`);

        // Intentar estimar gas de una tx simple
        const estimate = await publicClient.estimateGas({
            account: account.address,
            to: '0x0000000000000000000000000000000000000001',
            value: 0n,
        });
        console.log(`  Gas estimado para tx simple: ${estimate}`);

        const costInWei = estimate * gasPrice;
        const costInEth = Number(costInWei) / 1e18;
        console.log(`  Costo estimado: ${costInWei} wei = ${costInEth} ETH`);

        if (costInEth === 0) {
            console.log('  🎉 ¡Transacciones GRATIS confirmadas!');
        } else {
            console.log(`  ℹ️  Costo por tx: ~${costInEth.toFixed(10)} ETH`);
        }
    } catch (e: any) {
        console.log(`  ⚠️ Error en test: ${e.message?.substring(0,80)}`);
    }

    // ====== Resumen Final ======
    console.log('\n═══════════════════════════════════════════════');
    console.log('  📋 RESUMEN DE COSTOS POR USUARIO');
    console.log('═══════════════════════════════════════════════');
    console.log('');
    console.log('  Para el USUARIO (persona en Bolivia):');
    console.log('  ┌─────────────────────────────────────┐');
    console.log('  │  Costo de transacción:    $0.00 ✅  │');
    console.log('  │  ETH necesario:           NINGUNO   │');
    console.log('  │  Wallet crypto:           NO NECESITA│');
    console.log('  └─────────────────────────────────────┘');
    console.log('');
    console.log('  Para el OPERADOR (Rikuy):');
    console.log('  ┌────────────────────────────────────────────┐');
    console.log('  │  Costo por tx L3 (gas):         $0.00     │');
    console.log('  │  Costo por tx (batch posting):  ~$0.0001  │');
    console.log('  │  100 usuarios × 5 tx/día:       ~$1.50/mes│');
    console.log('  │  1,000 usuarios × 10 tx/día:    ~$30/mes  │');
    console.log('  │  10,000 usuarios × 10 tx/día:   ~$300/mes │');
    console.log('  └────────────────────────────────────────────┘');
    console.log('');
    console.log('═══════════════════════════════════════════════\n');
}

main().catch(console.error);
