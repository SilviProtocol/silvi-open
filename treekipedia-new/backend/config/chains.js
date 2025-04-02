// Chain-specific configurations for Treekipedia
// Includes RPC URLs, contract addresses, and network details for each supported chain

module.exports = {
  // Base chain configuration
  base: {
    name: 'Base',
    chainId: 8453,
    rpcUrl: process.env.BASE_RPC_URL || 'https://base-mainnet.infura.io/v3/03ccdfb9f1b1421b803e7c9e0fbee198',
    blockExplorer: 'https://basescan.org',
    nftContractAddress: process.env.BASE_NFT_CONTRACT_ADDRESS || '0x4D673AD5BD926266A8d06EE26103a0D0d9Eea599',
    easContractAddress: process.env.BASE_EAS_CONTRACT_ADDRESS || '0x4200000000000000000000000000000000000020',
    easSchemaId: process.env.BASE_EAS_SCHEMA_ID || '0xcf573b05cd63a15003b7a67ed4ea2aa6d9963c6518d0c3efd3bfab12d8d74ac9',
    isTestnet: false
  },
  
  // Celo chain configuration
  celo: {
    name: 'Celo',
    chainId: 42220,
    rpcUrl: process.env.CELO_RPC_URL || 'https://celo-mainnet.infura.io/v3/03ccdfb9f1b1421b803e7c9e0fbee198',
    blockExplorer: 'https://celoscan.io',
    nftContractAddress: process.env.CELO_NFT_CONTRACT_ADDRESS || '0x85FbbE1694B6Add91a815896f0b4B65b3bf61A01',
    easContractAddress: process.env.CELO_EAS_CONTRACT_ADDRESS || '0x72E1d8ccf5299fb36fEfD8CC4394B8ef7e98Af92',
    easSchemaId: process.env.CELO_EAS_SCHEMA_ID || '0xcf573b05cd63a15003b7a67ed4ea2aa6d9963c6518d0c3efd3bfab12d8d74ac9',
    isTestnet: false
  },
  
  // Optimism chain configuration
  optimism: {
    name: 'Optimism',
    chainId: 10,
    rpcUrl: process.env.OPTIMISM_RPC_URL || 'https://optimism-mainnet.infura.io/v3/03ccdfb9f1b1421b803e7c9e0fbee198',
    blockExplorer: 'https://optimistic.etherscan.io',
    nftContractAddress: process.env.OPTIMISM_NFT_CONTRACT_ADDRESS || '0x4D673AD5BD926266A8d06EE26103a0D0d9Eea599',
    easContractAddress: process.env.OPTIMISM_EAS_CONTRACT_ADDRESS || '0x4200000000000000000000000000000000000020',
    easSchemaId: process.env.OPTIMISM_EAS_SCHEMA_ID || '0xcf573b05cd63a15003b7a67ed4ea2aa6d9963c6518d0c3efd3bfab12d8d74ac9',
    isTestnet: false
  },
  
  // Arbitrum chain configuration
  arbitrum: {
    name: 'Arbitrum',
    chainId: 42161,
    rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arbitrum-mainnet.infura.io/v3/03ccdfb9f1b1421b803e7c9e0fbee198',
    blockExplorer: 'https://arbiscan.io',
    nftContractAddress: process.env.ARBITRUM_NFT_CONTRACT_ADDRESS || '0x4D673AD5BD926266A8d06EE26103a0D0d9Eea599',
    easContractAddress: process.env.ARBITRUM_EAS_CONTRACT_ADDRESS || '0x45CB6Fa0870a8Af06796Ac15915619a0f22cd475',
    easSchemaId: process.env.ARBITRUM_EAS_SCHEMA_ID || '0xcf573b05cd63a15003b7a67ed4ea2aa6d9963c6518d0c3efd3bfab12d8d74ac9',
    isTestnet: false
  },
  
  // Test networks (for development and testing)
  'base-sepolia': {
    name: 'Base Sepolia',
    chainId: 84532,
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || 'https://base-sepolia.infura.io/v3/03ccdfb9f1b1421b803e7c9e0fbee198',
    blockExplorer: 'https://sepolia.basescan.org',
    nftContractAddress: process.env.BASE_SEPOLIA_NFT_CONTRACT_ADDRESS || '0x4D673AD5BD926266A8d06EE26103a0D0d9Eea599',
    easContractAddress: process.env.BASE_SEPOLIA_EAS_CONTRACT_ADDRESS || '0x4200000000000000000000000000000000000020',
    easSchemaId: process.env.BASE_SEPOLIA_EAS_SCHEMA_ID || '0xcf573b05cd63a15003b7a67ed4ea2aa6d9963c6518d0c3efd3bfab12d8d74ac9',
    isTestnet: true
  },
  
  'celo-alfajores': {
    name: 'Celo Alfajores',
    chainId: 44787,
    rpcUrl: process.env.CELO_ALFAJORES_RPC_URL || 'https://alfajores-forno.celo-testnet.org',
    blockExplorer: 'https://alfajores.celoscan.io',
    nftContractAddress: process.env.CELO_ALFAJORES_NFT_CONTRACT_ADDRESS || '0x85FbbE1694B6Add91a815896f0b4B65b3bf61A01', // Using mainnet address
    // For testnet, we'll use the same EAS contract address as mainnet since it's a special case
    easContractAddress: process.env.CELO_ALFAJORES_EAS_CONTRACT_ADDRESS || '0x72E1d8ccf5299fb36fEfD8CC4394B8ef7e98Af92', 
    easSchemaId: process.env.CELO_EAS_SCHEMA_ID || '0xcf573b05cd63a15003b7a67ed4ea2aa6d9963c6518d0c3efd3bfab12d8d74ac9',
    isTestnet: true
  },
  
  'optimism-sepolia': {
    name: 'Optimism Sepolia',
    chainId: 11155420,
    rpcUrl: process.env.OPTIMISM_SEPOLIA_RPC_URL || 'https://optimism-sepolia.infura.io/v3/03ccdfb9f1b1421b803e7c9e0fbee198',
    blockExplorer: 'https://sepolia-optimistic.etherscan.io',
    nftContractAddress: process.env.OPTIMISM_SEPOLIA_NFT_CONTRACT_ADDRESS || '0x4D673AD5BD926266A8d06EE26103a0D0d9Eea599',
    easContractAddress: process.env.OPTIMISM_SEPOLIA_EAS_CONTRACT_ADDRESS || '0x4200000000000000000000000000000000000020',
    easSchemaId: process.env.OPTIMISM_SEPOLIA_EAS_SCHEMA_ID || '0xcf573b05cd63a15003b7a67ed4ea2aa6d9963c6518d0c3efd3bfab12d8d74ac9',
    isTestnet: true
  },
  
  'arbitrum-sepolia': {
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    rpcUrl: process.env.ARBITRUM_SEPOLIA_RPC_URL || 'https://arbitrum-sepolia.infura.io/v3/03ccdfb9f1b1421b803e7c9e0fbee198',
    blockExplorer: 'https://sepolia.arbiscan.io',
    nftContractAddress: process.env.ARBITRUM_SEPOLIA_NFT_CONTRACT_ADDRESS || '0x4D673AD5BD926266A8d06EE26103a0D0d9Eea599',
    easContractAddress: process.env.ARBITRUM_SEPOLIA_EAS_CONTRACT_ADDRESS || '0x45CB6Fa0870a8Af06796Ac15915619a0f22cd475',
    easSchemaId: process.env.ARBITRUM_SEPOLIA_EAS_SCHEMA_ID || '0xcf573b05cd63a15003b7a67ed4ea2aa6d9963c6518d0c3efd3bfab12d8d74ac9',
    isTestnet: true
  }
};