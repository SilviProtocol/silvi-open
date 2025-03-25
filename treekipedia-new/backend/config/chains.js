// Chain-specific configurations for Treekipedia
// Includes RPC URLs, contract addresses, and network details for each supported chain

module.exports = {
  // Base chain configuration
  base: {
    name: 'Base',
    chainId: 8453,
    rpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    nftContractAddress: process.env.BASE_NFT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
    easContractAddress: process.env.BASE_EAS_CONTRACT_ADDRESS || '0x4200000000000000000000000000000000000020',
    easSchemaId: process.env.BASE_EAS_SCHEMA_ID || '0x911e11e82dc5709a0c674725c0dcc6b1e72102ad816c6eba23038f6bf9f87dac',
    isTestnet: false
  },
  
  // Celo chain configuration
  celo: {
    name: 'Celo',
    chainId: 42220,
    rpcUrl: process.env.CELO_RPC_URL || 'https://forno.celo.org',
    blockExplorer: 'https://celoscan.io',
    nftContractAddress: process.env.CELO_NFT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
    easContractAddress: process.env.CELO_EAS_CONTRACT_ADDRESS || '0x5ece93bE4BDCF293Ed61FA78698B594F2135AF34',
    easSchemaId: process.env.CELO_EAS_SCHEMA_ID || '0x911e11e82dc5709a0c674725c0dcc6b1e72102ad816c6eba23038f6bf9f87dac',
    isTestnet: false
  },
  
  // Optimism chain configuration
  optimism: {
    name: 'Optimism',
    chainId: 10,
    rpcUrl: process.env.OPTIMISM_RPC_URL || 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
    nftContractAddress: process.env.OPTIMISM_NFT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
    easContractAddress: process.env.OPTIMISM_EAS_CONTRACT_ADDRESS || '0x4200000000000000000000000000000000000020',
    easSchemaId: process.env.OPTIMISM_EAS_SCHEMA_ID || '0x911e11e82dc5709a0c674725c0dcc6b1e72102ad816c6eba23038f6bf9f87dac',
    isTestnet: false
  },
  
  // Arbitrum chain configuration
  arbitrum: {
    name: 'Arbitrum',
    chainId: 42161,
    rpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    nftContractAddress: process.env.ARBITRUM_NFT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
    easContractAddress: process.env.ARBITRUM_EAS_CONTRACT_ADDRESS || '0x45CB6Fa0870a8Af06796Ac15915619a0f22cd475',
    easSchemaId: process.env.ARBITRUM_EAS_SCHEMA_ID || '0x911e11e82dc5709a0c674725c0dcc6b1e72102ad816c6eba23038f6bf9f87dac',
    isTestnet: false
  },
  
  // Test networks (for development and testing)
  'base-sepolia': {
    name: 'Base Sepolia',
    chainId: 84532,
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    blockExplorer: 'https://sepolia.basescan.org',
    nftContractAddress: process.env.BASE_SEPOLIA_NFT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
    easContractAddress: process.env.BASE_SEPOLIA_EAS_CONTRACT_ADDRESS || '0x4200000000000000000000000000000000000020',
    easSchemaId: process.env.BASE_SEPOLIA_EAS_SCHEMA_ID || '0x911e11e82dc5709a0c674725c0dcc6b1e72102ad816c6eba23038f6bf9f87dac',
    isTestnet: true
  },
  
  'celo-alfajores': {
    name: 'Celo Alfajores',
    chainId: 44787,
    rpcUrl: process.env.CELO_ALFAJORES_RPC_URL || 'https://alfajores-forno.celo-testnet.org',
    blockExplorer: 'https://alfajores.celoscan.io',
    nftContractAddress: process.env.CELO_ALFAJORES_NFT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
    easContractAddress: process.env.CELO_ALFAJORES_EAS_CONTRACT_ADDRESS || '0x5ece93bE4BDCF293Ed61FA78698B594F2135AF34',
    easSchemaId: process.env.CELO_ALFAJORES_EAS_SCHEMA_ID || '0x911e11e82dc5709a0c674725c0dcc6b1e72102ad816c6eba23038f6bf9f87dac',
    isTestnet: true
  },
  
  'optimism-sepolia': {
    name: 'Optimism Sepolia',
    chainId: 11155420,
    rpcUrl: process.env.OPTIMISM_SEPOLIA_RPC_URL || 'https://sepolia.optimism.io',
    blockExplorer: 'https://sepolia-optimistic.etherscan.io',
    nftContractAddress: process.env.OPTIMISM_SEPOLIA_NFT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
    easContractAddress: process.env.OPTIMISM_SEPOLIA_EAS_CONTRACT_ADDRESS || '0x4200000000000000000000000000000000000020',
    easSchemaId: process.env.OPTIMISM_SEPOLIA_EAS_SCHEMA_ID || '0x911e11e82dc5709a0c674725c0dcc6b1e72102ad816c6eba23038f6bf9f87dac',
    isTestnet: true
  },
  
  'arbitrum-sepolia': {
    name: 'Arbitrum Sepolia',
    chainId: 421614,
    rpcUrl: process.env.ARBITRUM_SEPOLIA_RPC_URL || 'https://sepolia-rollup.arbitrum.io/rpc',
    blockExplorer: 'https://sepolia.arbiscan.io',
    nftContractAddress: process.env.ARBITRUM_SEPOLIA_NFT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000',
    easContractAddress: process.env.ARBITRUM_SEPOLIA_EAS_CONTRACT_ADDRESS || '0x45CB6Fa0870a8Af06796Ac15915619a0f22cd475',
    easSchemaId: process.env.ARBITRUM_SEPOLIA_EAS_SCHEMA_ID || '0x911e11e82dc5709a0c674725c0dcc6b1e72102ad816c6eba23038f6bf9f87dac',
    isTestnet: true
  }
};