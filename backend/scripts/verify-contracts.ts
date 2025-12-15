/**
 * Script para verificar que los contratos estén desplegados correctamente
 * en Scroll Sepolia
 */

import { ethers } from 'ethers';
import { config } from '../src/config';

// Direcciones de los contratos desplegados
const CONTRACTS = {
  RikuyCore: '0x2b514e6ebaa9a7dEd3f7c6c668708ae92791f478',
  Treasury: '0xb53cd2E6a71E88C4Df5863CD8c257077cD8C1aa2',
  ReportRegistry: '0xdc3c4c07e4675cf1BBDEa627026e92170f9F5AE1',
  MockUSX: '0xD615074c2603336fa0Da8AF44B5CCB9D9C0B2F9c',
  Paymaster: '0xD65C9aA84b78a2aDea2011CD992F2475a4CD01a0',
  GovernmentRegistry: '0x9890872bbf4B2DC3fBcA848ECa94799676E6F37e',
};

async function verifyContracts() {
  console.log('🔍 Verificando contratos en Scroll Sepolia...\n');
  console.log(`RPC: ${config.scroll.rpcUrl}\n`);

  // Conectar a Scroll Sepolia
  const provider = new ethers.JsonRpcProvider(config.scroll.rpcUrl);

  let allValid = true;

  for (const [name, address] of Object.entries(CONTRACTS)) {
    try {
      // Verificar que la dirección tenga bytecode
      const code = await provider.getCode(address);

      if (code === '0x') {
        console.log(`❌ ${name.padEnd(20)} ${address} - NO ES UN CONTRATO`);
        allValid = false;
      } else {
        // Obtener el balance para verificar conectividad
        const balance = await provider.getBalance(address);
        const codeSize = (code.length - 2) / 2; // Remover '0x' y dividir por 2

        console.log(`✅ ${name.padEnd(20)} ${address}`);
        console.log(`   └─ Bytecode size: ${codeSize} bytes`);
        console.log(`   └─ Balance: ${ethers.formatEther(balance)} ETH`);
      }
    } catch (error: any) {
      console.log(`❌ ${name.padEnd(20)} ${address} - ERROR: ${error.message}`);
      allValid = false;
    }
  }

  console.log('\n' + '='.repeat(80));

  if (allValid) {
    console.log('✅ TODOS LOS CONTRATOS VERIFICADOS CORRECTAMENTE');
  } else {
    console.log('❌ ALGUNOS CONTRATOS NO ESTÁN DESPLEGADOS O SON INVÁLIDOS');
    process.exit(1);
  }

  console.log('='.repeat(80) + '\n');

  // Verificar configuración del backend
  console.log('📋 Verificando configuración del backend...\n');

  const configuredAddress = config.scroll.contractAddress;
  const expectedAddress = CONTRACTS.RikuyCore;

  if (configuredAddress.toLowerCase() === expectedAddress.toLowerCase()) {
    console.log(`✅ RikuyCore address configurada correctamente`);
    console.log(`   ${configuredAddress}\n`);
  } else {
    console.log(`❌ RikuyCore address NO COINCIDE`);
    console.log(`   Configurada: ${configuredAddress}`);
    console.log(`   Esperada:    ${expectedAddress}\n`);
  }

  console.log('✨ Verificación completa\n');
}

// Ejecutar
verifyContracts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error en verificación:', error);
    process.exit(1);
  });
