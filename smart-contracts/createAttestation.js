require('dotenv').config(); // Load environment variables from .env
const { EAS, NO_EXPIRATION, SchemaEncoder } = require('@ethereum-attestation-service/eas-sdk');
const { JsonRpcProvider, ethers } = require('ethers');

// Load environment variables
const EAS_CONTRACT_ADDRESS = process.env.EAS_CONTRACT_ADDRESS;
const _privateKey = process.env.AGENTKIT_WALLET_PRIVATE_KEY;  // Use your admin wallet's private key
const RPC_URL = process.env.BASE_L2_RPC_URL; // Use the Base L2 RPC URL from your .env
const SCHEMA_UID = process.env.SCHEMA_UID;

// Initialize the provider and signer
const provider = new JsonRpcProvider(RPC_URL);
let _chainId; // Declare _chainId outside the promise scope

provider.getNetwork().then(network => {
  _chainId = Number(network.chainId)
  console.log('Network Chain ID:', _chainId);
  console.log('Network Name:', network.name);
});
const signer = new ethers.Wallet(_privateKey, provider);

// Debug environment variables
console.log('EAS_CONTRACT_ADDRESS:', EAS_CONTRACT_ADDRESS);
console.log('SCHEMA_UID:', SCHEMA_UID);
console.log('RPC_URL:', RPC_URL);

// Initialize the EAS SDK
const eas = new EAS(EAS_CONTRACT_ADDRESS);
eas.connect(signer);

// Initialize SchemaEncoder with schema string
const schemaEncoder = new SchemaEncoder(
  'uint256 researchLogID, address triggerWallet, string scientificName, string speciesUID, string[] speciesURL, string llmModel, string ipfsCID, uint16 numberInsights, uint16 numberCitations'
);
const encodedData = schemaEncoder.encodeData([
  { name: 'researchLogID', value: 9374445464563, type: 'uint256' },
  { name: 'triggerWallet', value: '0xf703e22985579d53284648Ba4C56735d6B746c2d', type: 'address' },
  { name: 'scientificName', value: 'STeste 9', type: 'string' },
  { name: 'speciesUID', value: 'egdrgylidfclhhayfjteag4wef', type: 'string' },
  { name: 'speciesURL', value: ['https://example.com'], type: 'string[]' },
  { name: 'llmModel', value: 'GPT-4', type: 'string' },
  { name: 'ipfsCID', value: 'ipfs.io/ipfs/QmExampleCID', type: 'string' },
  { name: 'numberInsights', value: 96, type: 'uint16' },
  { name: 'numberCitations', value: 51, type: 'uint16' }
]);

// Function to create an attestation
async function createAttestation() {
  try {
    const transaction = await eas.attest({
      schema: SCHEMA_UID,
      data: {
        recipient: '0xf703e22985579d53284648Ba4C56735d6B746c2d',
        expirationTime: NO_EXPIRATION,
        revocable: false,
        data: encodedData,
      },
    });

    const attestationUID = await transaction.wait(); // Wait for transaction receipt
    console.log("AttestationUID:", attestationUID);    

    return attestationUID; // Return the AttestationUID
  } catch (error) {
    console.error('Error creating attestation:', error);
    if (error.attestationUID) {
      console.error('Error Receipt:', error.attestationUID);
    }
    throw error; // Re-throw the error for external handling
  }
}

module.exports = { createAttestation };
