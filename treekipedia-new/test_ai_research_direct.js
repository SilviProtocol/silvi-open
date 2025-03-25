// Test script for AI research services
require('dotenv').config();
const { performAIResearch } = require('./backend/services/aiResearch');
const { uploadToIPFS } = require('./backend/services/ipfs');
const fs = require('fs');

async function testAIResearch() {
  try {
    console.log('Starting AI research test...');
    
    // Get the scientific name and taxon_id from command line args
    const taxonId = process.argv[2] || 'AngMaFaFb0001-00';
    const scientificName = process.argv[3] || 'Abarema cochliocarpos';
    const commonName = process.argv[4] || '';
    const wallet = process.argv[5] || '0x1ee6a2bb0c64396cd0548dF4f51b1e09350111be';
    
    console.log(`Running AI research for ${scientificName} (${taxonId})...`);
    
    // Step 1: Perform AI research
    const researchData = await performAIResearch(
      taxonId,
      scientificName,
      commonName,
      wallet
    );
    
    // Save research data to file
    fs.writeFileSync('ai_research_output.json', JSON.stringify(researchData, null, 2));
    console.log('Research data saved to ai_research_output.json');
    
    // Step 2: Upload to IPFS
    console.log('Uploading research data to IPFS...');
    try {
      const ipfsCid = await uploadToIPFS(researchData);
      console.log(`IPFS CID: ${ipfsCid}`);
    } catch (ipfsError) {
      console.error('IPFS upload failed:', ipfsError.message);
    }
    
    console.log('AI research test completed successfully');
  } catch (error) {
    console.error('Error during AI research test:', error);
  }
}

testAIResearch();
