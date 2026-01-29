import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const SEMAPHORE_ADAPTER_ABI = [
  'function addMember(uint256 identityCommitment) external',
  'function removeMember(uint256 identityCommitment) external',
  'function getGroupSize() external view returns (uint256)',
  'function owner() external view returns (address)',
  'function hasRole(bytes32 role, address account) external view returns (bool)',
  'function ADMIN_ROLE() external view returns (bytes32)',
];

async function checkSemaphore() {
  const provider = new ethers.JsonRpcProvider(process.env.SCROLL_RPC_URL);
  const relayerWallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY!, provider);

  const adapterAddress = process.env.SEMAPHORE_ADAPTER_ADDRESS!;
  const adapter = new ethers.Contract(adapterAddress, SEMAPHORE_ADAPTER_ABI, provider);

  console.log('\n🔍 Checking Semaphore Adapter...');
  console.log(`Adapter Address: ${adapterAddress}`);
  console.log(`Relayer Address: ${relayerWallet.address}`);

  try {
    // Check if contract exists
    const code = await provider.getCode(adapterAddress);
    if (code === '0x') {
      console.log('❌ Contract does not exist at this address!');
      return;
    }
    console.log('✅ Contract exists');

    // Check group size
    try {
      const groupSize = await adapter.getGroupSize();
      console.log(`📊 Group size: ${groupSize.toString()} members`);
    } catch (e: any) {
      console.log(`⚠️  Could not get group size: ${e.message}`);
    }

    // Check owner
    try {
      const owner = await adapter.owner();
      console.log(`👤 Contract owner: ${owner}`);
      console.log(`   Relayer is owner: ${owner.toLowerCase() === relayerWallet.address.toLowerCase()}`);
    } catch (e: any) {
      console.log(`⚠️  Could not get owner: ${e.message}`);
    }

    // Check role
    try {
      const ADMIN_ROLE = await adapter.ADMIN_ROLE();
      const hasRole = await adapter.hasRole(ADMIN_ROLE, relayerWallet.address);
      console.log(`🔑 Relayer has ADMIN_ROLE: ${hasRole}`);
    } catch (e: any) {
      console.log(`⚠️  Could not check roles: ${e.message}`);
    }

    // Try to estimate gas for adding a test commitment
    try {
      const testCommitment = BigInt('12345678901234567890');
      const gasEstimate = await adapter.addMember.estimateGas(testCommitment);
      console.log(`✅ Can estimate gas for addMember: ${gasEstimate.toString()}`);
    } catch (e: any) {
      console.log(`❌ Cannot add members: ${e.message}`);
      console.log(`   This is likely a permission issue or the contract is paused`);
    }

  } catch (error: any) {
    console.error('Error:', error.message);
  }
}

checkSemaphore();
