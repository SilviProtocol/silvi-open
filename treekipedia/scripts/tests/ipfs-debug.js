// Debug script to test IPFS metadata formatting
const { uploadToIPFS, getFromIPFS } = require('../../backend/services/ipfs');

async function testIPFSWithStewardship() {
  console.log('Testing IPFS metadata with stewardship fields');
  
  // Create test metadata with both core and stewardship fields
  const testData = {
    name: "Test Contreebution",
    description: "Test metadata",
    image: "ipfs://test",
    
    // Core fields
    taxon_id: "TEST-ID",
    conservation_status: "Test status",
    habitat: "Test habitat",
    
    // Stewardship fields - these are the ones missing in actual data
    stewardship_best_practices: "Test stewardship practices",
    planting_recipes: "Test planting recipes",
    pruning_maintenance: "Test pruning",
    
    // Metadata
    research_metadata: {
      test: true,
      timestamp: new Date().toISOString()
    }
  };
  
  console.log('ORIGINAL KEYS:', Object.keys(testData).join(', '));
  console.log('ORIGINAL HAS STEWARDSHIP:', testData.hasOwnProperty('stewardship_best_practices'));
  
  try {
    // Upload to IPFS
    console.log('Uploading to IPFS...');
    const cid = await uploadToIPFS(testData);
    console.log('Uploaded with CID:', cid);
    
    // Retrieve and check
    console.log('Retrieving from IPFS...');
    const retrievedData = await getFromIPFS(cid);
    console.log('RETRIEVED KEYS:', Object.keys(retrievedData).join(', '));
    console.log('RETRIEVED HAS STEWARDSHIP:', retrievedData.hasOwnProperty('stewardship_best_practices'));
    
    // Compare metadata
    if (retrievedData.stewardship_best_practices) {
      console.log('STEWARDSHIP VALUE IS PRESENT:', retrievedData.stewardship_best_practices);
    } else {
      console.log('STEWARDSHIP VALUE IS MISSING!');
    }
    
    return cid;
  } catch (error) {
    console.error('Error in IPFS test:', error);
    throw error;
  }
}

// Run the test
testIPFSWithStewardship()
  .then(cid => {
    console.log('Test completed. CID:', cid);
  })
  .catch(err => {
    console.error('Test failed:', err);
  });