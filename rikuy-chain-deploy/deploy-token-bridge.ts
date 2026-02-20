/**
 * Deploy Token Bridge Script
 * 
 * Este script despliega los contratos del Token Bridge para Rikuy Chain L3.
 * 
 * Componentes Clave:
 * - AdminProxy (para gestionar lógica de bridge)
 * - Token Bridge Creators (L2 y L3)
 * - Standard Gateway (para tokens ERC20 estándar)
 * 
 * Uso:
 *   npx ts-node deploy-token-bridge.ts
 */

import { ethers } from 'ethers';
import {
    createTokenBridge,
    L2Network,
    L3Config,
} from '@arbitrum/orbit-sdk';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Cargar .env
const envPath = fs.existsSync('.env') ? '.env' : '../.env';
dotenv.config({ path: envPath });

// Cargar deployment result para obtener direcciones base
const deploymentResult = JSON.parse(fs.readFileSync('deployment-result.json','utf-8'));

// Configuración
const L2_RPC_URL = process.env.ARBITRUM_SEPOLIA_RPC || 'https://arb-sepolia.g.alchemy.com/v2/CXTtnX3H1j6N4rFb0vSFw'; // Usando tu Alchemy
const L3_RPC_URL = 'http://localhost:8449'; // Tu nodo local
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

if (!DEPLOYER_PRIVATE_KEY) {
    console.error('❌ Error: DEPLOYER_PRIVATE_KEY no encontrada en .env');
    process.exit(1);
}

async function main() {
    console.log('🌉 Iniciando despliegue del Token Bridge para Rikuy Chain...\n');

    // 1. Conectar proveedores y signer
    const l2Provider = new ethers.providers.JsonRpcProvider(L2_RPC_URL);
    const l3Provider = new ethers.providers.JsonRpcProvider(L3_RPC_URL);
    const l2Signer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY!,l2Provider);
    const l3Signer = new ethers.Wallet(DEPLOYER_PRIVATE_KEY!,l3Provider);

    console.log(`👤 Deployer: ${l2Signer.address}`);
    console.log(`🔗 L2 RPC: ${L2_RPC_URL}`);
    console.log(`🔗 L3 RPC: ${L3_RPC_URL}`);

    try {
        // Verificar conexión L3
        const l3Network = await l3Provider.getNetwork();
        console.log(`✅ Conectado a L3 (Chain ID: ${l3Network.chainId})`);

        // 2. Definir configuración de la red L3
        // Necesitamos construir el objeto L3Config basado en lo que ya desplegamos
        // Pero @arbitrum/orbit-sdk tiene una función helper 'createTokenBridge' que simplifica esto

        console.log('\n🚀 Desplegando contratos del Bridge...');

        // Usamos el SDK para crear el bridge
        // Nota: createTokenBridge asume que los contratos base (rollup) ya existen
        const tokenBridge = await createTokenBridge({
            l2Signer,
            l3Signer,
            rollupAddress: deploymentResult.coreContracts.rollup,
            parentChainId: 421614, // Arbitrum Sepolia
        });

        console.log('\n✅ Token Bridge desplegado exitosamente!');

        // Guardar direcciones
        const bridgeResult = {
            l2: {
                tokenBridgeCreator: tokenBridge.l2TokenBridgeCreator,
                router: tokenBridge.l2Router,
                standardGateway: tokenBridge.l2StandardGateway,
                customGateway: tokenBridge.l2CustomGateway,
                wethGateway: tokenBridge.l2WethGateway,
                weth: tokenBridge.l2Weth,
                multicall: tokenBridge.l2Multicall, // Si existe
                proxyAdmin: tokenBridge.l2ProxyAdmin,
            },
            l3: {
                tokenBridgeCreator: tokenBridge.l3TokenBridgeCreator,
                router: tokenBridge.l3Router,
                standardGateway: tokenBridge.l3StandardGateway,
                customGateway: tokenBridge.l3CustomGateway,
                wethGateway: tokenBridge.l3WethGateway,
                weth: tokenBridge.l3Weth,
                multicall: tokenBridge.l3Multicall,
                proxyAdmin: tokenBridge.l3ProxyAdmin,
            }
        };

        console.log(JSON.stringify(bridgeResult,null,2));

        // Guardar en archivo
        fs.writeFileSync(
            'token-bridge-deployment.json',
            JSON.stringify(bridgeResult,null,2)
        );
        console.log('\n💾 Resultados guardados en: token-bridge-deployment.json');

    } catch (error) {
        console.error('❌ Error durante el despliegue del Bridge:',error);
        if (error.code === 'NETWORK_ERROR') {
            console.error('   Sugerencia: Verifica que el nodo L3 esté corriendo (docker compose up)');
        }
    }
}

main().catch(console.error);
