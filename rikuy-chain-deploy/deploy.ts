/**
 * Rikuy Chain L3 Deployment Script
 * 
 * Este script despliega una nueva Arbitrum Orbit L3 chain sobre Arbitrum Sepolia.
 * 
 * Requisitos:
 * 1. ~1.5 ETH en Arbitrum Sepolia (faucet: https://faucet.arbitrum.io)
 * 2. Private key del deployer en .env
 * 
 * Uso:
 *   npx ts-node deploy.ts
 */

import {
    prepareChainConfig,
    createRollup,
    createRollupPrepareDeploymentParamsConfig
} from '@arbitrum/chain-sdk';
import { createPublicClient,http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrumSepolia } from 'viem/chains';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

// ============================================
// CONFIGURACIÓN DE RIKUY CHAIN
// ============================================

// Chain ID único para Rikuy Chain (verifica en chainlist.org que no esté ocupado)
const RIKUY_CHAIN_ID = 313370;

// Tu private key (NUNCA subas esto a git!)
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;

// RPC de Arbitrum Sepolia (parent chain)
const PARENT_CHAIN_RPC = process.env.ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc';

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

async function main() {
    console.log('🚀 Iniciando deployment de Rikuy Chain L3...\n');

    // Validar que tenemos la private key
    if (!DEPLOYER_PRIVATE_KEY) {
        console.error('❌ Error: DEPLOYER_PRIVATE_KEY no encontrada en .env');
        console.log('\nCrea un archivo .env con:');
        console.log('DEPLOYER_PRIVATE_KEY=0x...');
        process.exit(1);
    }

    // Crear cuenta del deployer
    const deployer = privateKeyToAccount(DEPLOYER_PRIVATE_KEY);
    console.log(`📝 Deployer address: ${deployer.address}`);

    // Crear cliente del parent chain (Arbitrum Sepolia)
    const parentChainPublicClient = createPublicClient({
        chain: arbitrumSepolia,
        transport: http(PARENT_CHAIN_RPC),
    });

    // Verificar balance
    const balance = await parentChainPublicClient.getBalance({ address: deployer.address });
    const balanceETH = Number(balance) / 1e18;
    console.log(`💰 Balance en Arbitrum Sepolia: ${balanceETH.toFixed(4)} ETH`);

    if (balanceETH < 1.0) {
        console.error('❌ Error: Necesitas al menos 1.0 ETH para el deployment');
        console.log('   Faucet: https://faucet.arbitrum.io');
        process.exit(1);
    }

    console.log('\n📦 Preparando configuración de Rikuy Chain...');

    // Paso 1: Preparar configuración de la chain
    const chainConfig = prepareChainConfig({
        chainId: RIKUY_CHAIN_ID,
        arbitrum: {
            InitialChainOwner: deployer.address,
            // Rollup (no AnyTrust) - postea data a L1 para máxima seguridad
            DataAvailabilityCommittee: false,
        },
    });

    console.log(`   Chain ID: ${RIKUY_CHAIN_ID}`);
    console.log(`   Tipo: Optimistic Rollup`);
    console.log(`   Owner: ${deployer.address}`);

    // Paso 2: Preparar configuración completa del deployment
    const createRollupConfig = createRollupPrepareDeploymentParamsConfig(
        parentChainPublicClient,
        {
            chainId: BigInt(RIKUY_CHAIN_ID),
            owner: deployer.address,
            chainConfig: chainConfig,
        }
    );

    console.log('\n🔨 Desplegando contratos en Arbitrum Sepolia...');
    console.log('   (Esto puede tomar varios minutos...)\n');

    try {
        // Paso 3: Deploy!
        const result = await createRollup({
            params: {
                config: createRollupConfig,
                batchPosters: [deployer.address],
                validators: [deployer.address],
            },
            account: deployer,
            parentChainPublicClient,
        });

        console.log('✅ ¡Rikuy Chain desplegada exitosamente!\n');
        console.log('📋 Contratos desplegados:');
        console.log('─'.repeat(50));

        const contracts = result.coreContracts;
        console.log(`   Rollup:           ${contracts.rollup}`);
        console.log(`   Bridge:           ${contracts.bridge}`);
        console.log(`   Inbox:            ${contracts.inbox}`);
        console.log(`   SequencerInbox:   ${contracts.sequencerInbox}`);
        console.log(`   Outbox:           ${contracts.outbox}`);
        console.log(`   RollupEventInbox: ${contracts.rollupEventInbox}`);
        console.log('─'.repeat(50));

        // Guardar resultados en archivo JSON
        const deploymentInfo = {
            chainId: RIKUY_CHAIN_ID,
            chainName: 'Rikuy Chain',
            parentChain: 'Arbitrum Sepolia',
            deployedAt: new Date().toISOString(),
            deployer: deployer.address,
            transactionHash: result.transactionReceipt.transactionHash,
            coreContracts: contracts,
        };

        fs.writeFileSync(
            'deployment-result.json',
            JSON.stringify(deploymentInfo,null,2)
        );
        console.log('\n💾 Resultados guardados en: deployment-result.json');

        console.log('\n📌 Próximos pasos:');
        console.log('   1. Generar configuración del nodo');
        console.log('   2. Levantar nodo con Docker');
        console.log('   3. Configurar Token Bridge (opcional)');

    } catch (error) {
        console.error('❌ Error durante el deployment:',error);
        process.exit(1);
    }
}

// Ejecutar
main().catch(console.error);
