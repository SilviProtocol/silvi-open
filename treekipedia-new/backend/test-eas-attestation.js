// Simple test script to verify EAS attestation functionality
require('dotenv').config({ path: '../.env' });  // Load environment variables from parent directory
const { ethers } = require('ethers');
const chains = require('./config/chains');

async function testEASAttestation() {
  try {
    console.log('Testing EAS attestation on Celo...');
    
    // Get Celo chain configuration
    const chain = 'celo';
    const chainConfig = chains[chain];
    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${chain}`);
    }
    
    console.log('Chain config:', {
      name: chainConfig.name,
      chainId: chainConfig.chainId,
      easContractAddress: chainConfig.easContractAddress,
      easSchemaId: chainConfig.easSchemaId
    });
    
    // Set up provider and signer
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    if (!PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY environment variable is not set');
    }
    
    const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const signerAddress = await signer.getAddress();
    console.log('Signer address:', signerAddress);
    
    // Initialize EAS contract
    const easContractABIFile = require('./config/abis/eas.json');
    const easContractABI = easContractABIFile.abi;
    const checksummedEasAddress = ethers.getAddress(chainConfig.easContractAddress);
    const easContract = new ethers.Contract(
      checksummedEasAddress,
      easContractABI,
      signer
    );
    
    // Prepare a simple test attestation
    const schema = chainConfig.easSchemaId;
    const timestamp = Math.floor(Date.now() / 1000);
    const testData = {
      taxonId: 'TEST-TAXON-ID',
      ipfsCid: 'TEST-IPFS-CID',
      researcher: signerAddress,
      species: 'Test Species',
      timestamp: timestamp,
      researchVersion: 1,
      refUID: ethers.ZeroHash
    };
    
    console.log('Test attestation data:', testData);
    
    // Encode the data according to the schema
    console.log('Encoding attestation data...');
    const attestationData = ethers.AbiCoder.defaultAbiCoder().encode(
      ['string', 'string', 'address', 'uint256', 'uint256', 'string', 'bytes32'],
      [
        testData.taxonId,
        testData.ipfsCid,
        testData.researcher,
        timestamp,
        testData.researchVersion,
        testData.species,
        testData.refUID
      ]
    );
    
    // Log the attestation request
    console.log('Attestation request:', {
      schema,
      recipient: testData.researcher,
      data: attestationData.substring(0, 66) + '...' // Truncated for readability
    });
    
    // Create the attestation
    console.log('Creating attestation...');
    const tx = await easContract.attest({
      schema,
      data: {
        recipient: testData.researcher,
        expirationTime: 0, // No expiration
        revocable: false,
        refUID: testData.refUID,
        data: attestationData,
        value: 0 // No value being sent with the transaction
      }
    });
    
    console.log('Transaction sent:', tx.hash);
    console.log('Waiting for confirmation...');
    
    // Wait for transaction to be confirmed
    const receipt = await tx.wait();
    console.log('Transaction confirmed in block:', receipt.blockNumber);
    
    // Log the full receipt for analysis
    console.log('Transaction receipt:', JSON.stringify(receipt, null, 2));
    
    // Try to extract the attestation UID
    console.log('Analyzing receipt for attestation UID...');
    
    // Check if events exist and display them
    if (receipt.events && receipt.events.length > 0) {
      console.log('Number of events:', receipt.events.length);
      
      // Log each event in receipt
      receipt.events.forEach((event, index) => {
        console.log(`Event ${index}:`, {
          name: event.event || 'Unnamed',
          args: event.args ? Object.keys(event.args) : 'No args'
        });
        
        if (event.args) {
          // Print each argument
          Object.entries(event.args).forEach(([key, value]) => {
            console.log(`  Arg ${key}:`, value.toString());
          });
        }
      });
    } else {
      console.log('No events found in receipt');
    }
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Error in EAS attestation test:', error);
    
    if (error.data) {
      console.error('Error data:', error.data);
    }
    
    if (error.transaction) {
      console.error('Transaction data:', error.transaction);
    }
    
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testEASAttestation();