// Verify IPFS data retrieval
const axios = require('axios');
const fs = require('fs');

async function verifyIPFS() {
  try {
    const ipfsCid = 'bafkreihtmegwph4mqvdozpxlunjoyxt3sdims5n7pd3kxyf2l7oxhf5w74';
    const ipfsUrl = `https://gateway.lighthouse.storage/ipfs/${ipfsCid}`;
    
    console.log(`Retrieving data from IPFS gateway: ${ipfsUrl}`);
    
    const response = await axios.get(ipfsUrl);
    const ipfsData = response.data;
    
    // Save to file for inspection
    fs.writeFileSync('ipfs_retrieved_data.json', JSON.stringify(ipfsData, null, 2));
    
    console.log('IPFS data retrieved successfully and saved to ipfs_retrieved_data.json');
    
    // Compare with our local file
    const localData = JSON.parse(fs.readFileSync('ai_research_output.json', 'utf8'));
    
    // Check if taxon_id matches
    if (ipfsData.taxon_id === localData.taxon_id) {
      console.log('Verification successful: Local and IPFS data match for taxon_id');
    } else {
      console.log('Verification failed: Local and IPFS data do not match');
    }
    
    // Print a sample of the data
    console.log('\nSample of retrieved IPFS data:');
    console.log('- Conservation Status:', ipfsData.conservation_status);
    console.log('- General Description:', ipfsData.general_description?.substring(0, 100) + '...');
    console.log('- Habitat:', ipfsData.habitat?.substring(0, 100) + '...');
    
  } catch (error) {
    console.error('Error verifying IPFS data:', error.message);
  }
}

verifyIPFS();