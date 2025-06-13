const { ethers } = require('ethers');
const chains = require('./config/chains');

// Get the chain's EAS address
const celoConfig = chains.celo;
const easAddress = celoConfig.easContractAddress;

// Get the checksummed address
const checksummedAddress = ethers.getAddress(easAddress);

console.log('Original address:', easAddress);
console.log('Checksummed address:', checksummedAddress);

if (easAddress \!== checksummedAddress) {
  console.log('Addresses do not match - need to update the configuration.');
} else {
  console.log('Address already properly checksummed.');
}

// Check all chain addresses
console.log('\nChecking all chain EAS addresses:');
Object.entries(chains).forEach(([chainName, config]) => {
  if (config.easContractAddress) {
    const original = config.easContractAddress;
    try {
      const checksummed = ethers.getAddress(original);
      console.log(`${chainName}: ${original === checksummed ? '✓' : '✗'} (${checksummed})`);
    } catch (error) {
      console.log(`${chainName}: INVALID ADDRESS ${original}`);
    }
  }
});
