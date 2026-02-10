/**
 * Check Balance Script
 * Verifica que tienes suficiente ETH en Arbitrum Sepolia para el deployment
 */

import { createPublicClient,http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrumSepolia } from 'viem/chains';
import * as dotenv from 'dotenv';

dotenv.config();

async function main() {
    const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}`;

    if (!DEPLOYER_PRIVATE_KEY) {
        console.error('❌ Error: DEPLOYER_PRIVATE_KEY no encontrada en .env');
        process.exit(1);
    }

    const deployer = privateKeyToAccount(DEPLOYER_PRIVATE_KEY);
    console.log(`\n📝 Wallet address: ${deployer.address}`);

    const client = createPublicClient({
        chain: arbitrumSepolia,
        transport: http('https://sepolia-rollup.arbitrum.io/rpc'),
    });

    const balance = await client.getBalance({ address: deployer.address });
    const balanceETH = Number(balance) / 1e18;

    console.log(`💰 Balance en Arbitrum Sepolia: ${balanceETH.toFixed(6)} ETH\n`);

    if (balanceETH >= 1.5) {
        console.log('✅ Tienes suficiente ETH para el deployment (~1.5 ETH necesarios)');
    } else if (balanceETH >= 1.0) {
        console.log('⚠️  Tienes un balance marginal. Recomendamos 1.5 ETH para estar seguros.');
    } else {
        console.log('❌ No tienes suficiente ETH. Necesitas al menos 1.0-1.5 ETH');
        console.log('   Faucet: https://faucet.arbitrum.io');
    }
}

main().catch(console.error);
