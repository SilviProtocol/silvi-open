// Test script to simulate frontend fetch and common name processing
const axios = require('axios');
const { getTopCommonNames } = require('../../backend/utils/commonNames');

// Function to fetch and process the data like the frontend would
async function testFrontendProcessing() {
  try {
    // Fetch the species data from the API
    console.log('Fetching species data from API...');
    const apiUrl = 'https://treekipedia-api.silvi.earth/species/AngMaGepc37897-00';
    const response = await axios.get(apiUrl);
    const species = response.data;
    
    // DETAILED DEBUGGING: Examine exact format of the first few names
    console.log('\nDETAILED COMMON NAME DEBUGGING:');
    console.log('Character codes of first 20 chars:');
    const firstChars = species.common_name.substring(0, 20);
    console.log(firstChars);
    for (let i = 0; i < firstChars.length; i++) {
      console.log(`Pos ${i}: '${firstChars[i]}' (${firstChars.charCodeAt(i)})`);
    }
    
    // Show the raw data from the API
    console.log(`\nAPI Response for ${species.species_scientific_name || species.species}:`);
    console.log(`Taxon ID: ${species.taxon_id}`);
    console.log(`Common name length: ${species.common_name.length} characters`);
    console.log(`First 100 chars: ${species.common_name.substring(0, 100)}...`);
    
    // Apply the same common names processing as the frontend
    console.log('\nApplying frontend common name processing...');
    const optimizedCommonNames = getTopCommonNames(species.common_name, 15, 1000);
    console.log(`Optimized common names (${optimizedCommonNames.length} chars)`);
    console.log(`Optimized names: ${optimizedCommonNames}`);
    
    // Get the primary name that would be displayed
    const allNames = optimizedCommonNames
      .split(',')
      .map((name) => name.trim())
      .filter((name) => name.length > 0);
      
    // The first name is the most important one (like "Frangipani")
    const primary = allNames.length > 0 ? allNames[0] : "Unknown";
    const others = allNames.slice(1, 5); // Show the next few names
    
    console.log('\nFrontend display would show:');
    console.log(`Primary name: "${primary}"`);
    console.log(`Next names: ${others.join(', ')}`);
    
    return {
      success: true,
      primary,
      others
    };
  } catch (error) {
    console.error('Error fetching or processing data:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
testFrontendProcessing()
  .then(result => {
    if (result.success) {
      console.log('\nTest completed successfully.');
      console.log(result.primary === 'Frangipani' 
        ? '✅ SUCCESS: Frangipani is correctly shown as the primary name' 
        : `❌ ISSUE: Primary name is "${result.primary}" instead of "Frangipani"`);
    } else {
      console.log('\nTest failed:', result.error);
    }
  })
  .catch(err => console.error('Test error:', err));