// Check if a species is marked as researched
const axios = require('axios');

async function checkSpeciesResearched() {
  const taxonId = process.argv[2];
  
  if (!taxonId) {
    console.error('Error: Please provide a taxon_id as an argument');
    console.log('Usage: node check-species-researched.js [taxon_id]');
    return;
  }
  
  try {
    const apiUrl = 'http://localhost:3000'; // Local API URL
    
    console.log(`Checking research status for species ${taxonId}`);
    
    // First check the species endpoint
    const speciesUrl = `${apiUrl}/species/${taxonId}`;
    console.log(`Fetching species data from: ${speciesUrl}`);
    const speciesResponse = await axios.get(speciesUrl);
    
    console.log('\n===== SPECIES ENDPOINT RESPONSE =====');
    console.log(`Researched flag: ${speciesResponse.data.researched}`);
    console.log(`Has general_description: ${!!speciesResponse.data.general_description}`);
    console.log(`Has general_description_ai: ${!!speciesResponse.data.general_description_ai}`);
    
    // Then check the research endpoint
    try {
      const researchUrl = `${apiUrl}/research/research/${taxonId}`;
      console.log(`\nFetching research data from: ${researchUrl}`);
      const researchResponse = await axios.get(researchUrl);
      
      console.log('\n===== RESEARCH ENDPOINT RESPONSE =====');
      console.log(`Researched flag: ${researchResponse.data.researched}`);
      console.log(`Has general_description_ai: ${!!researchResponse.data.general_description_ai}`);
      console.log(`Has stewardship_best_practices_ai: ${!!researchResponse.data.stewardship_best_practices_ai}`);
    } catch (researchError) {
      if (researchError.response && researchError.response.status === 404) {
        console.log('\n===== RESEARCH ENDPOINT RESPONSE =====');
        console.log('Research data not found (404)');
        console.log('This indicates the species has not been researched yet');
      } else {
        console.error('Error fetching research data:', researchError.message);
      }
    }
    
  } catch (error) {
    console.error('Error checking species:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

checkSpeciesResearched();