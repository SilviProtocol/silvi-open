// Calculate EAS Schema UIDs for Treekipedia research data
require('dotenv').config();
const { ethers } = require('ethers');

// Schema definition
const schema = 'string taxon_id, string ipfs_cid, address wallet_address, uint256 timestamp, uint256 research_version, string scientific_name';
const revocable = true; // Allow attestations to be revoked

// Chain configurations with Schema Registry Addresses
const chains = [
  {
    name: 'Arbitrum Sepolia',
    envVarName: 'ARBITRUM_EAS_SCHEMA_ID',
    schemaRegistryAddress: '0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0' // Arbitrum Sepolia
  },
  {
    name: 'Base Sepolia',
    envVarName: 'BASE_EAS_SCHEMA_ID',
    schemaRegistryAddress: '0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0' // Base Sepolia
  },
  {
    name: 'Celo Alfajores',
    envVarName: 'CELO_EAS_SCHEMA_ID',
    schemaRegistryAddress: '0xAcFE09Fd03f7812F022FBf636700AdEA18Fd2A7A' // Celo Alfajores
  },
  {
    name: 'Optimism Sepolia',
    envVarName: 'OPTIMISM_EAS_SCHEMA_ID',
    schemaRegistryAddress: '0x0a7E2Ff54e76B8E6659aedc9103FB21c038050D0' // Optimism Sepolia
  }
];

/**
 * Calculate schema UID based on EAS specifications
 * @param {string} schema - Schema string
 * @param {string} resolverAddress - Resolver address
 * @param {boolean} revocable - Whether the schema is revocable
 * @returns {string} - Schema UID
 */
function calculateSchemaUID(schema, chain) {
  try {
    console.log(`\n=== Calculating Schema UID for ${chain.name} ===`);
    console.log(`Schema: ${schema}`);
    console.log(`Resolver: ${ethers.ZeroAddress}`);
    console.log(`Revocable: ${revocable}`);
    
    // Step 1: Get the schema hash
    const schemaHash = ethers.keccak256(ethers.toUtf8Bytes(schema));
    console.log(`Schema Hash: ${schemaHash}`);
    
    // Step 2: Encode the data (schema hash + resolver + revocable)
    const abiCoder = new ethers.AbiCoder();
    const encodedData = abiCoder.encode(
      ['bytes32', 'address', 'bool'],
      [schemaHash, ethers.ZeroAddress, revocable]
    );
    console.log(`Encoded Data: ${encodedData.slice(0, 66)}...`);
    
    // Step 3: Get the keccak256 hash of the encoded data
    const schemaUID = ethers.keccak256(encodedData);
    console.log(`Schema UID: ${schemaUID}`);
    
    return schemaUID;
  } catch (error) {
    console.error(`Error calculating schema UID: ${error.message}`);
    return null;
  }
}

/**
 * Calculate schema UIDs for all chains
 */
function calculateSchemaUIDs() {
  console.log('=== Treekipedia EAS Schema UIDs ===');
  console.log(`Schema: ${schema}`);
  
  // Store results for .env update
  const results = {};
  
  // Generate schema UIDs for each chain
  for (const chain of chains) {
    try {
      const schemaId = calculateSchemaUID(schema, chain);
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
  
  // Generate a single EAS_SCHEMA_ID that can be used for all chains
  console.log('\n# Or use a single variable for all chains:');
  if (Object.values(results).length > 0) {
    console.log(`EAS_SCHEMA_ID=${Object.values(results)[0]}`);
  }
}

// Execute calculation
calculateSchemaUIDs();