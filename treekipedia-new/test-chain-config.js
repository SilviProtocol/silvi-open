// Simple test script to verify our chain configuration
const chains = require('./backend/config/chains');

console.log('Treekipedia Chain Configuration Test\n');

// Test each chain configuration
for (const [chainKey, chainConfig] of Object.entries(chains)) {
  console.log(`Chain: ${chainConfig.name} (${chainKey}) - ${chainConfig.isTestnet ? 'TESTNET' : 'MAINNET'}`);
  console.log(`  ChainID: ${chainConfig.chainId}`);
  console.log(`  RPC URL: ${chainConfig.rpcUrl}`);
  console.log(`  NFT Contract: ${chainConfig.nftContractAddress}`);
  console.log(`  EAS Contract: ${chainConfig.easContractAddress}`);
  console.log(`  EAS Schema ID: ${chainConfig.easSchemaId}`);
  console.log('');
}

// Verify all real contract addresses are used (no zeros)
let allValid = true;
for (const [chainKey, chainConfig] of Object.entries(chains)) {
  if (chainConfig.nftContractAddress === '0x0000000000000000000000000000000000000000') {
    console.error(`❌ ERROR: ${chainConfig.name} is using zero address for NFT contract`);
    allValid = false;
  }
}

if (allValid) {
  console.log('✅ All chains are using proper NFT contract addresses');
} else {
  console.log('❌ Some chains are using zero addresses - check configuration');
}

// Verify Celo mainnet EAS schema ID is set correctly
if (chains.celo.easSchemaId === '0xcf573b05cd63a15003b7a67ed4ea2aa6d9963c6518d0c3efd3bfab12d8d74ac9') {
  console.log('✅ Celo mainnet is using the correct EAS schema ID');
} else {
  console.log('❌ Celo mainnet is NOT using the correct EAS schema ID');
}