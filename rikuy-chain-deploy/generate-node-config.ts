/**
 * Generate Node Configuration Script
 * 
 * Este script genera la configuración necesaria para correr el nodo de Rikuy Chain L3
 * 
 * Uso:
 *   npx ts-node generate-node-config.ts
 */

import { createPublicClient,http } from 'viem';
import {
    createRollupPrepareTransaction,
    createRollupPrepareTransactionReceipt,
    ChainConfig,
    prepareNodeConfig,
} from '@arbitrum/chain-sdk';
import { arbitrumSepolia } from 'viem/chains';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

// Leer el resultado del deployment
const deploymentResult = JSON.parse(fs.readFileSync('deployment-result.json','utf-8'));

// Configuración
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;
const PARENT_CHAIN_RPC = process.env.ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc';

async function main() {
    console.log('📦 Generando configuración del nodo Rikuy Chain L3...\n');

    if (!DEPLOYER_PRIVATE_KEY) {
        console.error('❌ Error: DEPLOYER_PRIVATE_KEY no encontrada en .env');
        process.exit(1);
    }

    // Crear cliente del parent chain
    const parentChainPublicClient = createPublicClient({
        chain: arbitrumSepolia,
        transport: http(PARENT_CHAIN_RPC),
    });

    const txHash = deploymentResult.transactionHash as `0x${string}`;
    console.log(`📝 Transaction hash: ${txHash}`);

    try {
        // Obtener la transacción original
        console.log('   Obteniendo transacción de deployment...');
        const rawTx = await parentChainPublicClient.getTransaction({ hash: txHash });
        const tx = createRollupPrepareTransaction(rawTx);

        // Obtener el recibo
        console.log('   Obteniendo recibo de transacción...');
        const rawReceipt = await parentChainPublicClient.getTransactionReceipt({ hash: txHash });
        const txReceipt = createRollupPrepareTransactionReceipt(rawReceipt);

        // Extraer configuración y contratos
        const config = tx.getInputs()[0].config;
        const chainConfig: ChainConfig = JSON.parse(config.chainConfig);
        const coreContracts = txReceipt.getCoreContracts();

        console.log(`   Chain ID: ${chainConfig.chainId}`);
        console.log(`   Chain Owner: ${chainConfig.arbitrum.InitialChainOwner}`);

        // Generar configuración del nodo
        console.log('\n🔧 Generando configuración del nodo...');

        const nodeConfig = prepareNodeConfig({
            chainName: 'Rikuy Chain',
            chainConfig,
            coreContracts,
            batchPosterPrivateKey: DEPLOYER_PRIVATE_KEY,
            validatorPrivateKey: DEPLOYER_PRIVATE_KEY,
            stakeToken: config.stakeToken,
            parentChainId: arbitrumSepolia.id,
            parentChainRpcUrl: PARENT_CHAIN_RPC,
        });

        // Guardar configuración
        fs.writeFileSync(
            'nodeConfig.json',
            JSON.stringify(nodeConfig,null,2)
        );

        console.log('\n✅ Configuración del nodo generada exitosamente!');
        console.log('💾 Guardada en: nodeConfig.json');

        // También guardar el chain info para el orbitSetupScript
        const orbitSetupScriptConfig = {
            networkFeeReceiver: deploymentResult.deployer,
            infrastructureFeeCollector: deploymentResult.deployer,
            staker: deploymentResult.deployer,
            batchPoster: deploymentResult.deployer,
            chainOwner: deploymentResult.deployer,
            chainId: deploymentResult.chainId,
            chainName: 'Rikuy Chain',
            minL2BaseFee: 100000000,  // 0.1 gwei
            parentChainId: arbitrumSepolia.id,
            'parent-chain-node-url': PARENT_CHAIN_RPC,
            utils: coreContracts.validatorWalletCreator,
            rollup: coreContracts.rollup,
            inbox: coreContracts.inbox,
            nativeToken: coreContracts.nativeToken,
            outbox: coreContracts.outbox,
            rollupEventInbox: coreContracts.rollupEventInbox,
            challengeManager: coreContracts.challengeManager,
            adminProxy: coreContracts.adminProxy,
            sequencerInbox: coreContracts.sequencerInbox,
            bridge: coreContracts.bridge,
            upgradeExecutor: coreContracts.upgradeExecutor,
            validatorWalletCreator: coreContracts.validatorWalletCreator,
        };

        fs.writeFileSync(
            'orbitSetupScriptConfig.json',
            JSON.stringify(orbitSetupScriptConfig,null,2)
        );

        console.log('💾 Guardada en: orbitSetupScriptConfig.json');

        console.log('\n📌 Próximos pasos:');
        console.log('   1. Copiar nodeConfig.json a la carpeta del nodo');
        console.log('   2. Ejecutar Docker para levantar el nodo');
        console.log('   3. El RPC estará disponible en http://localhost:8449');

    } catch (error) {
        console.error('❌ Error generando configuración:',error);
        process.exit(1);
    }
}

main().catch(console.error);
