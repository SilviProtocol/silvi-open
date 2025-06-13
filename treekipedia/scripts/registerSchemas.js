// Register EAS schemas for Treekipedia on multiple chains
require('dotenv').config();
const { EAS, SchemaEncoder } = require('@ethereum-attestation-service/eas-sdk');
const { ethers } = require('ethers');

// Import EAS contract ABI
const easAbi = [
  "function register(string schema, address resolver, bool revocable) external returns (bytes32)",
  "function getSchema(bytes32 schemaUID) external view returns (tuple(string schema, address resolver, bool revocable, bool replaceable))",
  "function getSchemaRegistry() external view returns (address)"
];

// Import SchemaRegistry ABI
const schemaRegistryAbi = [
  "function register(string schema, address resolver, bool revocable) external returns (bytes32)",
  "function getSchema(bytes32 uid) external view returns (tuple(string schema, address resolver, bool revocable))"
];

// Schema definition
const schema = 'string taxon_id, string ipfs_cid, address wallet_address, uint256 timestamp, uint256 research_version, string scientific_name';
const schemaDescription = 'Treekipedia Research Attestation Schema - Records tree species research data';
const revocable = true; // Allow attestations to be revoked

// Chain configurations
const chains = [
  {
    name: 'Arbitrum',
    rpcUrl: process.env.ARBITRUM_RPC_URL,
    easContractAddress: '0x45CB6Fa0870a8Af06796Ac15915619a0f22cd475',
    envVarName: 'ARBITRUM_EAS_SCHEMA_ID'
  },
  {
    name: 'Base',
    rpcUrl: process.env.BASE_RPC_URL,
    easContractAddress: '0x4200000000000000000000000000000000000020',
    envVarName: 'BASE_EAS_SCHEMA_ID'
  },
  {
    name: 'Celo',
    rpcUrl: process.env.CELO_RPC_URL,
    easContractAddress: '0x5ece93bE4BDCF293Ed61FA78698B594F2135AF34',
    envVarName: 'CELO_EAS_SCHEMA_ID'
  },
  {
    name: 'Optimism',
    rpcUrl: process.env.OPTIMISM_RPC_URL,
    easContractAddress: '0x4200000000000000000000000000000000000020',
    envVarName: 'OPTIMISM_EAS_SCHEMA_ID'
  }
];

// Load private key from environment
const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  console.error('PRIVATE_KEY not found in .env file');
  process.exit(1);
}

/**
 * Register schema on a specific chain
 * @param {Object} chain - Chain configuration
 * @returns {Promise<string>} - Schema ID
 */
async function registerSchemaOnChain(chain) {
  console.log(`\n=== Registering schema on ${chain.name} ===`);
  
  try {
    // Validate RPC URL
    if (!chain.rpcUrl) {
      throw new Error(`${chain.name}_RPC_URL not found in .env file`);
    }
    
    console.log(`Connecting to ${chain.name} at ${chain.rpcUrl}`);
    
    // Set up provider and wallet
    const provider = new ethers.JsonRpcProvider(chain.rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // Get network info
    try {
      const network = await provider.getNetwork();
      console.log(`Connected to network: ${network.name} (Chain ID: ${network.chainId})`);
      
      const blockNumber = await provider.getBlockNumber();
      console.log(`Current block number: ${blockNumber}`);
      
      const balance = await provider.getBalance(wallet.address);
      console.log(`Wallet balance: ${ethers.formatEther(balance)} ETH`);
      
      if (balance === 0n) {
        console.warn(`Warning: Wallet has 0 balance on ${chain.name}. Transaction may fail.`);
      }
    } catch (error) {
      console.error(`Error getting network info: ${error.message}`);
      throw error;
    }
    
    // Initialize EAS contract directly
    const easContract = new ethers.Contract(
      chain.easContractAddress,
      easAbi,
      wallet
    );
    
    // Get SchemaRegistry address
    let schemaRegistryAddress;
    try {
      schemaRegistryAddress = await easContract.getSchemaRegistry();
      console.log(`Schema Registry address: ${schemaRegistryAddress}`);
    } catch (error) {
      console.error(`Error getting schema registry address: ${error.message}`);
      // Fall back to a hardcoded address or handle the error
      throw error;
    }
    
    // Initialize SchemaRegistry contract
    const schemaRegistry = new ethers.Contract(
      schemaRegistryAddress,
      schemaRegistryAbi,
      wallet
    );
    
    console.log('Registering schema with the following details:');
    console.log(`- Schema: ${schema}`);
    console.log(`- Description: ${schemaDescription}`);
    console.log(`- Revocable: ${revocable}`);
    
    // Register schema
    console.log('Sending transaction to register schema...');
    const tx = await schemaRegistry.register(
      schema,
      ethers.ZeroAddress, // No custom resolver
      revocable,
      {
        gasLimit: 1000000 // Set a reasonable gas limit
      }
    );
    
    console.log(`Transaction hash: ${tx.hash}`);
    console.log('Waiting for transaction confirmation...');
    
    // Wait for transaction confirmation
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
    
    // Extract schema UID from transaction logs
    // The schema UID is typically emitted as an event
    let schemaUID;
    
    // Look for the event in the transaction receipt
    if (receipt.logs && receipt.logs.length > 0) {
      // The schema registration typically emits an event with the schema UID
      // The exact format depends on the contract implementation
      // This is a simplified approach
      for (const log of receipt.logs) {
        if (log.topics && log.topics.length > 1) {
          // The first topic is usually the event signature
          // The second topic might be the schema UID
          schemaUID = log.topics[1];
          break;
        }
      }
    }
    
    if (!schemaUID) {
      console.log('Could not extract schema UID from transaction logs');
      console.log('Attempting to calculate schema UID...');
      
      // Calculate schema UID manually as fallback
      const encoder = new ethers.AbiCoder();
      const schemaHash = ethers.keccak256(ethers.toUtf8Bytes(schema));
      
      const encodedData = encoder.encode(
        ['bytes32', 'address', 'bool'],
        [schemaHash, ethers.ZeroAddress, revocable]
      );
      
      schemaUID = ethers.keccak256(encodedData);
      console.log('Calculated schema UID');
    }
    
    console.log(`✅ Schema registered successfully on ${chain.name}`);
    console.log(`Schema ID: ${schemaUID}`);
    
    return schemaUID;
    
  } catch (error) {
    console.error(`❌ Error registering schema on ${chain.name}: ${error.message}`);
    if (error.data) {
      console.error(`Error data: ${JSON.stringify(error.data)}`);
    }
    return null;
  }
}

/**
 * Register schemas on all chains
 */
async function registerSchemas() {
  console.log('=== Treekipedia EAS Schema Registration ===');
  console.log(`Schema: ${schema}`);
  console.log(`Wallet address: ${new ethers.Wallet(privateKey).address}`);
  
  // Store results for .env update
  const results = {};
  
  // Register schema on each chain
  for (const chain of chains) {
    try {
      const schemaId = await registerSchemaOnChain(chain);
      if (schemaId) {
        results[chain.envVarName] = schemaId;
      }
    } catch (error) {
      console.error(`Error processing ${chain.name}: ${error.message}`);
    }
  }
  
  // Generate .env updates
  console.log('\n=== Add the following lines to your .env file ===');
  for (const [envVar, schemaId] of Object.entries(results)) {
    console.log(`${envVar}=${schemaId}`);
  }
}

// Execute registration
registerSchemas()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });