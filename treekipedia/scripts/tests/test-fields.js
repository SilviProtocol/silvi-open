const axios = require('axios');

// Configuration 
const BASE_URL = 'https://treekipedia-api.silvi.earth';
const TEST_TAXON_ID = 'AngNAParc36603-00'; // Date Palm
const TEST_WALLET_ADDRESS = '0x6B1f82a1d7E24A47c11655E19243F9368C893A18';
const TEST_SCIENTIFIC_NAME = 'Phoenix dactylifera';

// Helper for logging
function logField(name, value) {
  if (typeof value === 'string' && value.length > 100) {
    console.log(`  ${name}: ${value.substring(0, 100)}...`);
  } else {
    console.log(`  ${name}: ${value || 'N/A'}`);
  }
}

// Function to fund research
async function fundResearch() {
  try {
    console.log(`\n💰 Funding research for ${TEST_TAXON_ID} (${TEST_SCIENTIFIC_NAME})`);
    
    // Generate unique transaction hash
    const uniqueHash = '0x' + Math.random().toString(16).substring(2, 10) + 
                        Date.now().toString(16) + 
                        Math.random().toString(16).substring(2, 10);
    
    const ipfsCid = 'bafkreig4zkttxdexpnmhvyahp5h2qyq2yy6puumuo6yfpni6mpmz4r6s6q';
    
    const requestData = {
      taxon_id: TEST_TAXON_ID,
      wallet_address: TEST_WALLET_ADDRESS,
      chain: 'celo',
      transaction_hash: uniqueHash,
      ipfs_cid: ipfsCid,
      scientific_name: TEST_SCIENTIFIC_NAME
    };
    
    console.log('Request data:', requestData);
    
    const response = await axios.post(`${BASE_URL}/research/fund-research`, requestData);
    
    console.log('Research funding successful!');
    console.log('Response status:', response.status);
    console.log('IPFS CID:', response.data.ipfs_cid);
    console.log('Attestation UID:', response.data.attestation_uid);
    
    return true;
  } catch (error) {
    console.error('Error funding research:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Main test function
async function testStewardshipFields() {
  try {
    console.log(`\n🔍 Testing species data for ${TEST_TAXON_ID} (${TEST_SCIENTIFIC_NAME})`);
    
    // Step 1: Check species data before research
    console.log('\n📊 BEFORE RESEARCH:');
    const speciesResponse = await axios.get(`${BASE_URL}/species/${TEST_TAXON_ID}`);
    const species = speciesResponse.data;
    
    console.log('Species data:');
    console.log('  taxon_id:', species.taxon_id);
    console.log('  species_scientific_name:', species.species_scientific_name);
    console.log('  common_name:', species.common_name);
    console.log('  researched flag:', species.researched);
    
    console.log('\nStewardship fields in species data:');
    logField('stewardship_best_practices', species.stewardship_best_practices);
    logField('stewardship_best_practices_ai', species.stewardship_best_practices_ai);
    logField('stewardship_best_practices_human', species.stewardship_best_practices_human);
    
    // Step 2: Check research data before funding
    try {
      const researchResponse = await axios.get(`${BASE_URL}/research/research/${TEST_TAXON_ID}`);
      const research = researchResponse.data;
      
      console.log('\nResearch data:');
      console.log('  taxon_id:', research.taxon_id);
      console.log('  researched flag:', research.researched);
      
      console.log('\nStewardship fields in research data:');
      logField('stewardship_best_practices', research.stewardship_best_practices);
      logField('stewardship_best_practices_ai', research.stewardship_best_practices_ai);
      logField('stewardship_best_practices_human', research.stewardship_best_practices_human);
      
      // Analyze all _ai fields
      const aiFields = Object.keys(research).filter(key => key.endsWith('_ai'));
      console.log('\nAI Fields Analysis:');
      console.log('  Total _ai fields:', aiFields.length);
      
      const nonEmptyAiFields = aiFields.filter(field => research[field] && research[field] !== '');
      console.log('  Non-empty _ai fields:', nonEmptyAiFields.length);
      console.log('  Field list:', nonEmptyAiFields.join(', '));
      
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('\nNo research data available yet.');
      } else {
        console.error('Error fetching research data:', error.message);
      }
    }
    
    // Step 3: Fund the research
    const fundingResult = await fundResearch();
    
    if (fundingResult) {
      console.log('\nWaiting for research to complete...');
      await new Promise(resolve => setTimeout(resolve, 20000)); // Wait 20 seconds
      
      // Step 4: Check data after research
      console.log('\n📊 AFTER RESEARCH:');
      
      // Check species data
      const updatedSpeciesResponse = await axios.get(`${BASE_URL}/species/${TEST_TAXON_ID}`);
      const updatedSpecies = updatedSpeciesResponse.data;
      
      console.log('Updated species data:');
      console.log('  taxon_id:', updatedSpecies.taxon_id);
      console.log('  researched flag:', updatedSpecies.researched);
      
      console.log('\nUpdated stewardship fields in species data:');
      logField('stewardship_best_practices', updatedSpecies.stewardship_best_practices);
      logField('stewardship_best_practices_ai', updatedSpecies.stewardship_best_practices_ai);
      logField('stewardship_best_practices_human', updatedSpecies.stewardship_best_practices_human);
      
      // Check research data
      try {
        const updatedResearchResponse = await axios.get(`${BASE_URL}/research/research/${TEST_TAXON_ID}`);
        const updatedResearch = updatedResearchResponse.data;
        
        console.log('\nUpdated research data:');
        console.log('  taxon_id:', updatedResearch.taxon_id);
        console.log('  researched flag:', updatedResearch.researched);
        
        console.log('\nUpdated stewardship fields in research data:');
        logField('stewardship_best_practices', updatedResearch.stewardship_best_practices);
        logField('stewardship_best_practices_ai', updatedResearch.stewardship_best_practices_ai);
        logField('stewardship_best_practices_human', updatedResearch.stewardship_best_practices_human);
        
        // Analyze all _ai fields
        const aiFields = Object.keys(updatedResearch).filter(key => key.endsWith('_ai'));
        console.log('\nUpdated AI Fields Analysis:');
        console.log('  Total _ai fields:', aiFields.length);
        
        const nonEmptyAiFields = aiFields.filter(field => updatedResearch[field] && updatedResearch[field] !== '');
        console.log('  Non-empty _ai fields:', nonEmptyAiFields.length);
        console.log('  Field list:', nonEmptyAiFields.join(', '));
        
      } catch (error) {
        console.error('Error fetching updated research data:', error.message);
      }
    }
    
    console.log('\n✅ Field analysis complete.');
    
  } catch (error) {
    console.error('Error testing fields:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testStewardshipFields();