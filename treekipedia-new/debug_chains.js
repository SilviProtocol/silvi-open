// Debug script to check chain configurations
require('dotenv').config();
const chains = require('./backend/config/chains');

console.log('Environment variables:');
console.log('CELO_EAS_CONTRACT_ADDRESS:', process.env.CELO_EAS_CONTRACT_ADDRESS);
console.log('CELO_EAS_SCHEMA_ID:', process.env.CELO_EAS_SCHEMA_ID);
console.log('CELO_NFT_CONTRACT_ADDRESS:', process.env.CELO_NFT_CONTRACT_ADDRESS);

console.log('\nChain configurations:');
console.log('Celo Mainnet:');
console.log('- EAS Contract:', chains.celo.easContractAddress);
console.log('- Schema ID:', chains.celo.easSchemaId);
console.log('- NFT Contract:', chains.celo.nftContractAddress);

console.log('\nCelo Alfajores:');
console.log('- EAS Contract:', chains['celo-alfajores'].easContractAddress);
console.log('- Schema ID:', chains['celo-alfajores'].easSchemaId);
console.log('- NFT Contract:', chains['celo-alfajores'].nftContractAddress);