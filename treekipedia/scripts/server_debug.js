// Debug version of the server with additional logging
const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from the parent directory .env file
dotenv.config({ path: path.join(__dirname, '.env') });

// Log loaded environment variables
console.log('Loaded environment variables:');
console.log('CELO_EAS_CONTRACT_ADDRESS:', process.env.CELO_EAS_CONTRACT_ADDRESS);
console.log('CELO_EAS_SCHEMA_ID:', process.env.CELO_EAS_SCHEMA_ID);
console.log('CELO_NFT_CONTRACT_ADDRESS:', process.env.CELO_NFT_CONTRACT_ADDRESS);

// Import chain configuration
const chains = require('../backend/config/chains');

// Log chain configurations
console.log('\nChain configurations:');
console.log('Celo Mainnet:');
console.log('- EAS Contract:', chains.celo.easContractAddress);
console.log('- Schema ID:', chains.celo.easSchemaId);
console.log('- NFT Contract:', chains.celo.nftContractAddress);

// Create express app
const app = express();
app.use(express.json());

// Simple route to verify the server is running
app.get('/', (req, res) => {
  res.json({ message: 'Debug server is running!' });
});

// Route to check chain configs
app.get('/config', (req, res) => {
  res.json({
    chains: {
      celo: {
        easContractAddress: chains.celo.easContractAddress,
        easSchemaId: chains.celo.easSchemaId,
        nftContractAddress: chains.celo.nftContractAddress
      }
    },
    env: {
      CELO_EAS_CONTRACT_ADDRESS: process.env.CELO_EAS_CONTRACT_ADDRESS,
      CELO_EAS_SCHEMA_ID: process.env.CELO_EAS_SCHEMA_ID,
      CELO_NFT_CONTRACT_ADDRESS: process.env.CELO_NFT_CONTRACT_ADDRESS
    }
  });
});

// Listen on port 3001 to avoid conflict with the main server
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Debug server running on port ${PORT}`);
});