/**
 * Script para verificar que los contratos estén desplegados correctamente
 * en Rikuy Chain L3 (Arbitrum Orbit)
 */

import { ethers } from 'ethers';
import { config } from '../src/config';

async function verifyContracts() {
  console.log('Verificando contratos en Rikuy Chain L3...\n');
  console.log(`RPC: ${config.blockchain.rpcUrl}`);
  console.log(`Chain ID: ${config.blockchain.chainId}\n`);

  const provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);

  const contracts = {
    RikuyCoreV2: config.blockchain.contracts.rikuyCoreV2,
    ReportRegistry: config.blockchain.contracts.reportRegistry,
    GovernmentRegistry: config.blockchain.contracts.governmentRegistry,
    AnonymousReport: config.blockchain.contracts.anonymousReport,
  };

  let allValid = true;

  for (const [name, address] of Object.entries(contracts)) {
    if (!address) {
      console.log(`-- ${name.padEnd(20)} Not configured`);
      continue;
    }

    try {
      const code = await provider.getCode(address);

      if (code === '0x') {
        console.log(`FAIL ${name.padEnd(20)} ${address} - NO CONTRACT`);
        allValid = false;
      } else {
        const codeSize = (code.length - 2) / 2;
        console.log(`OK   ${name.padEnd(20)} ${address} (${codeSize} bytes)`);
      }
    } catch (error: any) {
      console.log(`FAIL ${name.padEnd(20)} ${address} - ERROR: ${error.message}`);
      allValid = false;
    }
  }

  console.log('\n' + '='.repeat(60));
  if (allValid) {
    console.log('All configured contracts verified');
  } else {
    console.log('Some contracts are invalid or not deployed');
    process.exit(1);
  }
  console.log('='.repeat(60) + '\n');
}

verifyContracts()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Verification error:', error);
    process.exit(1);
  });
