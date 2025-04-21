// Test script to diagnose IPFS stewardship field issue
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { uploadToIPFS, getFromIPFS } = require('../../backend/services/ipfs');
const fs = require('fs');

async function testFieldsInIPFS() {
  try {
    // Load the AI research data from our debug output
    const researchDataPath = path.join(__dirname, 'debug-research-fields-output.json');
    const researchData = JSON.parse(fs.readFileSync(researchDataPath, 'utf8'));
    
    console.log('Testing IPFS metadata with stewardship fields from actual AI research');
    console.log('Using research data for:', researchData.species_scientific_name);
    
    // Format metadata using the same approach as in research.js controller
    const formattedData = {
      name: `Research Contreebution Test`,
      description: "Thank you for sponsoring tree research!",
      image: "ipfs://bafkreibkta2e54ddqjlrmxmacjvqcpj7w6o3a4oww6ea7hldjazio22c3e",
      
      // Core identification data
      taxon_id: researchData.taxon_id,
      scientific_name: researchData.species_scientific_name,
      
      // Original fields that work
      conservation_status: researchData.conservation_status_ai || '',
      general_description: researchData.general_description_ai || '',
      habitat: researchData.habitat_ai || '',
      ecological_function: researchData.ecological_function_ai || '',
      
      // Stewardship fields that don't appear
      stewardship_best_practices: researchData.stewardship_best_practices_ai || '',
      planting_recipes: researchData.planting_recipes_ai || '',
      pruning_maintenance: researchData.pruning_maintenance_ai || '',
      
      // Research metadata
      research_metadata: {
        researcher_wallet: researchData.research_metadata.researcher_wallet,
        research_date: new Date().toISOString(),
        research_method: "AI-assisted (Perplexity + GPT-4o)",
        verification_status: "unverified"
      }
    };
    
    console.log('FORMATTED DATA KEYS:', Object.keys(formattedData).join(', '));
    console.log('stewardship_best_practices exists in formatted data:', formattedData.hasOwnProperty('stewardship_best_practices'));
    
    if (formattedData.stewardship_best_practices) {
      console.log('stewardship_best_practices value:', formattedData.stewardship_best_practices.substring(0, 50) + '...');
    }
    
    // Upload to IPFS
    console.log('Uploading to IPFS...');
    const cid = await uploadToIPFS(formattedData);
    console.log('Uploaded with CID:', cid);
    
    // Retrieve and check
    console.log('Retrieving from IPFS...');
    const retrievedData = await getFromIPFS(cid);
    console.log('RETRIEVED KEYS:', Object.keys(retrievedData).join(', '));
    console.log('stewardship_best_practices exists in retrieved data:', retrievedData.hasOwnProperty('stewardship_best_practices'));
    
    if (retrievedData.stewardship_best_practices) {
      console.log('RETRIEVED stewardship_best_practices:', retrievedData.stewardship_best_practices.substring(0, 50) + '...');
    } else {
      console.log('STEWARDSHIP IS MISSING in IPFS data!');
    }
    
    return { cid, formattedData, retrievedData };
  } catch (error) {
    console.error('Error in IPFS test:', error);
    throw error;
  }
}

// Run the test and save results
testFieldsInIPFS()
  .then(({ cid, formattedData, retrievedData }) => {
    console.log('Test completed. CID:', cid);
    
    // Save results for comparison
    fs.writeFileSync(
      path.join(__dirname, 'ipfs-field-test-sent.json'), 
      JSON.stringify(formattedData, null, 2)
    );
    
    fs.writeFileSync(
      path.join(__dirname, 'ipfs-field-test-received.json'), 
      JSON.stringify(retrievedData, null, 2)
    );
    
    console.log('Test results saved to ipfs-field-test-sent.json and ipfs-field-test-received.json');
  })
  .catch(err => {
    console.error('Test failed:', err);
  });