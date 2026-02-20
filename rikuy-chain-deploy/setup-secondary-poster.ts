/**
 * Setup Secondary Batch Poster Script (UpgradeExecutor support)
 * 
 * Este script:
 * 1. Genera una nueva wallet para Batch Poster
 * 2. Le envía ETH desde la cuenta Deployer (Owner)
 * 3. Autoriza a la nueva wallet como Batch Poster a través del UpgradeExecutor
 * 4. Actualiza el nodeConfig.json con la nueva wallet
 * 
 * Uso:
 *   npx ts-node setup-secondary-poster.ts
 */

import { createPublicClient,createWalletClient,http,parseEther,encodeFunctionData } from 'viem';
import { privateKeyToAccount,generatePrivateKey } from 'viem/accounts';
import { arbitrumSepolia } from 'viem/chains';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Cargar .env desde el root si no existe local
const envPath = fs.existsSync('.env') ? '.env' : '../.env';
dotenv.config({ path: envPath });

// Leer deployment result
const deploymentResult = JSON.parse(fs.readFileSync('deployment-result.json','utf-8'));
const SEQUENCER_INBOX_ADDRESS = deploymentResult.coreContracts.sequencerInbox as `0x${string}`;
const UPGRADE_EXECUTOR_ADDRESS = deploymentResult.coreContracts.upgradeExecutor as `0x${string}`;

// ABIs
const SequencerInboxABI = [
    {
        inputs: [
            { internalType: 'address',name: 'addr',type: 'address' },
            { internalType: 'bool',name: 'isBatchPoster',type: 'bool' }
        ],
        name: 'setIsBatchPoster',
        outputs: [],
        stateMutability: 'nonpayable',
        type: 'function'
    }
] as const;

const UpgradeExecutorABI = [
    {
        inputs: [
            { internalType: 'address',name: 'target',type: 'address' },
            { internalType: 'bytes',name: 'targetCallData',type: 'bytes' }
        ],
        name: 'executeCall',
        outputs: [],
        stateMutability: 'payable',
        type: 'function'
    },
    {
        inputs: [
            { internalType: 'address',name: 'target',type: 'address' },
            { internalType: 'bytes',name: 'targetCallData',type: 'bytes' }
        ],
        name: 'execute',
        outputs: [],
        stateMutability: 'payable',
        type: 'function'
    }
] as const;

async function main() {
    const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
    if (!DEPLOYER_PRIVATE_KEY) {
        console.error('❌ Error: DEPLOYER_PRIVATE_KEY no encontrada en .env');
        process.exit(1);
    }

    const deployer = privateKeyToAccount(DEPLOYER_PRIVATE_KEY);
    const client = createPublicClient({
        chain: arbitrumSepolia,
        transport: http('https://sepolia-rollup.arbitrum.io/rpc'),
    });

    const walletClient = createWalletClient({
        account: deployer,
        chain: arbitrumSepolia,
        transport: http('https://sepolia-rollup.arbitrum.io/rpc'),
    });

    console.log(`📝 Deployer (Owner): ${deployer.address}`);
    console.log(`📝 SequencerInbox: ${SEQUENCER_INBOX_ADDRESS}`);
    console.log(`📝 UpgradeExecutor: ${UPGRADE_EXECUTOR_ADDRESS}`);

    // 1. Generar nueva wallet
    const newPrivateKey = generatePrivateKey();
    const newAccount = privateKeyToAccount(newPrivateKey);
    console.log(`\n🔑 Nueva Wallet Batch Poster: ${newAccount.address}`);
    console.log(`   Private Key: ${newPrivateKey} (GUARDAR SI FALLA ESCRITURA)`);

    // 2. Fondear nueva wallet
    const amountToSend = parseEther('0.2');

    const balance = await client.getBalance({ address: newAccount.address });
    if (balance < parseEther('0.1')) {
        console.log(`\n💸 Enviando 0.2 ETH a ${newAccount.address}...`);
        try {
            const hash = await walletClient.sendTransaction({
                to: newAccount.address,
                value: amountToSend,
            });
            console.log(`   Tx Hash: ${hash}`);
            await client.waitForTransactionReceipt({ hash });
            console.log('   ✅ Fondos enviados');
        } catch (error) {
            console.error('❌ Error enviando fondos:',error);
            process.exit(1);
        }
    } else {
        console.log(`   ✅ Wallet ya tiene fondos (${Number(balance) / 1e18} ETH)`);
    }

    // 3. Autorizar como Batch Poster
    console.log('\n✍️  Autorizando nueva wallet en SequencerInbox via UpgradeExecutor...');

    const setIsBatchPosterData = encodeFunctionData({
        abi: SequencerInboxABI,
        functionName: 'setIsBatchPoster',
        args: [newAccount.address,true],
    });

    try {
        console.log('   Ejecutando UpgradeExecutor.executeCall...');
        // Intentar ejecutar la llamada a través del UpgradeExecutor
        const hash = await walletClient.writeContract({
            address: UPGRADE_EXECUTOR_ADDRESS,
            abi: UpgradeExecutorABI,
            functionName: 'executeCall',
            args: [SEQUENCER_INBOX_ADDRESS,setIsBatchPosterData],
        });

        console.log(`   Tx Hash: ${hash}`);
        await client.waitForTransactionReceipt({ hash });
        console.log('   ✅ Wallet autorizada como Batch Poster');

        // 4. Actualizar nodeConfig.json
        console.log('\n💾 Actualizando nodeConfig.json...');
        const cfgPath = '/Users/firrton/Desktop/orbit-setup-script/config/nodeConfig.json'; // Ruta absoluta
        console.log(`   Path: ${cfgPath}`);

        if (fs.existsSync(cfgPath)) {
            const cfg = JSON.parse(fs.readFileSync(cfgPath,'utf-8'));

            // Asignar nueva wallet al batch-poster
            cfg.node['batch-poster']['parent-chain-wallet']['private-key'] = newPrivateKey.slice(2); // Sin 0x
            // Asegurar que staker usa deployer key (sin 0x)
            cfg.node.staker['parent-chain-wallet']['private-key'] = DEPLOYER_PRIVATE_KEY.slice(2);

            fs.writeFileSync(cfgPath,JSON.stringify(cfg,null,2));
            console.log('   ✅ nodeConfig.json actualizado exitosamente');
        } else {
            console.error(`❌ No se encontró ${cfgPath}`);
        }

        console.log('\n🎉 Proceso completado. Ahora puedes reiniciar el nodo.');

    } catch (error) {
        console.error('❌ Error autorizando wallet:',error);
        process.exit(1);
    }
}

main().catch(console.error);
