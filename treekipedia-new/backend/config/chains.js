// Chain-specific configurations for Treekipedia
// Includes RPC URLs, contract addresses, and network details for each supported chain
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// Log all environment variables related to contract addresses for debugging
console.log("==== CONTRACT ADDRESSES FROM ENV VARIABLES ====");
console.log("BASE_NFT_CONTRACT_ADDRESS:", process.env.BASE_NFT_CONTRACT_ADDRESS);
console.log("CELO_NFT_CONTRACT_ADDRESS:", process.env.CELO_NFT_CONTRACT_ADDRESS);
console.log("OPTIMISM_NFT_CONTRACT_ADDRESS:", process.env.OPTIMISM_NFT_CONTRACT_ADDRESS);
console.log("ARBITRUM_NFT_CONTRACT_ADDRESS:", process.env.ARBITRUM_NFT_CONTRACT_ADDRESS);
console.log("BASE_SEPOLIA_NFT_CONTRACT_ADDRESS:", process.env.BASE_SEPOLIA_NFT_CONTRACT_ADDRESS);
console.log("CELO_ALFAJORES_NFT_CONTRACT_ADDRESS:", process.env.CELO_ALFAJORES_NFT_CONTRACT_ADDRESS);
console.log("OPTIMISM_SEPOLIA_NFT_CONTRACT_ADDRESS:", process.env.OPTIMISM_SEPOLIA_NFT_CONTRACT_ADDRESS);
console.log("ARBITRUM_SEPOLIA_NFT_CONTRACT_ADDRESS:", process.env.ARBITRUM_SEPOLIA_NFT_CONTRACT_ADDRESS);
console.log("==============================================");

module.exports = {
  // Base chain configuration
  base: {
    name: 'Base',
    chainId: 8453,
    rpcUrl: process.env.BASE_RPC_URL,
    blockExplorer: 'https://basescan.org',
    nftContractAddress: process.env.BASE_NFT_CONTRACT_ADDRESS,
    easContractAddress: process.env.BASE_EAS_CONTRACT_ADDRESS,
    easSchemaId: process.env.BASE_EAS_SCHEMA_ID,
    isTestnet: false
  },
  
  // Celo chain configuration
  celo: {
    name: 'Celo',
    chainId: 42220,
    rpcUrl: process.env.CELO_RPC_URL,
    blockExplorer: 'https://celoscan.io',
    nftContractAddress: process.env.CELO_NFT_CONTRACT_ADDRESS,
    easContractAddress: process.env.CELO_EAS_CONTRACT_ADDRESS,
    easSchemaId: process.env.CELO_EAS_SCHEMA_ID,
    isTestnet: false
  },
  
  // Optimism chain configuration
  optimism: {
    name: 'Optimism',
    chainId: 10,
    rpcUrl: process.env.OPTIMISM_RPC_URL,
    blockExplorer: 'https://optimistic.etherscan.io',
    nftContractAddress: process.env.OPTIMISM_NFT_CONTRACT_ADDRESS,
    easContractAddress: process.env.OPTIMISM_EAS_CONTRACT_ADDRESS,
    easSchemaId: process.env.OPTIMISM_EAS_SCHEMA_ID,
    isTestnet: false
  },
  
  // Arbitrum chain configuration
  arbitrum: {
    name: 'Arbitrum',
    chainId: 42161,
    rpcUrl: process.env.ARBITRUM_RPC_URL,
    blockExplorer: 'https://arbiscan.io',
    nftContractAddress: process.env.ARBITRUM_NFT_CONTRACT_ADDRESS,
    easContractAddress: process.env.ARBITRUM_EAS_CONTRACT_ADDRESS,
    easSchemaId: process.env.ARBITRUM_EAS_SCHEMA_ID,
    isTestnet: false
  },
  
  // Test networks (for development and testing)
  'base-sepolia': {
    name: 'Base Sepolia',
    chainId: 84532,
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL,
    blockExplorer: 'https://sepolia.basescan.org',
    nftContractAddress: process.env.BASE_SEPOLIA_NFT_CONTRACT_ADDRESS,
    easContractAddress: process.env.BASE_SEPOLIA_EAS_CONTRACT_ADDRESS,
    easSchemaId: process.env.BASE_SEPOLIA_EAS_SCHEMA_ID,
    isTestnet: true
  },
  
  'celo-alfajores': {
    name: 'Celo Alfajores',
    chainId: 44787,
    rpcUrl: process.env.CELO_ALFAJORES_RPC_URL,
    blockExplorer: 'https://alfajores.celoscan.io',
    nftContractAddress: process.env.CELO_ALFAJORES_NFT_CONTRACT_ADDRESS,
    easContractAddress: process.env.CELO_ALFAJORES_EAS_CONTRACT_ADDRESS,
    easSchemaId: process.env.CELO_ALFAJORES_EAS_SCHEMA_ID,
    isTestnet: true
  },
  
  'optimism-sepolia': {
    name: 'Optimism Sepolia',
    chainId: 11155420,
    rpcUrl: process.env.OPTIMISM_SEPOLIA_RPC_URL,
    blockExplorer: 'https://sepolia-optimistic.etherscan.io',
    nftContractAddress: process.env.OPTIMISM_SEPOLIA_NFT_CONTRACT_ADDRESS,
    easContractAddress: process.env.OPTIMISM_SEPOLIA_EAS_CONTRACT_ADDRESS,
    easSchemaId: process.env.OPTIMISM_SEPOLIA_EAS_SCHEMA_ID,
    isTestnet: true
  },
  
  'arbitrum-sepolia': {
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    rpcUrl: process.env.ARBITRUM_SEPOLIA_RPC_URL,
    blockExplorer: 'https://sepolia.arbiscan.io',
    nftContractAddress: process.env.ARBITRUM_SEPOLIA_NFT_CONTRACT_ADDRESS,
    easContractAddress: process.env.ARBITRUM_SEPOLIA_EAS_CONTRACT_ADDRESS,
    easSchemaId: process.env.ARBITRUM_SEPOLIA_EAS_SCHEMA_ID,
    isTestnet: true
  }
};