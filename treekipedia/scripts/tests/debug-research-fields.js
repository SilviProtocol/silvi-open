// Debug script to compare stewardship_best_practices vs agroforestry_use_cases fields
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { performAIResearch } = require('../../backend/services/aiResearch');

async function testFieldsGeneration() {
  try {
    const taxonId = process.argv[2] || 'AngMaMyMy17742-00';
    const scientificName = process.argv[3] || 'Eucalyptus quinniorum';
    const commonName = process.argv[4] || 'Quinni\'s eucalyptus';
    
    console.log(`Testing field generation for ${scientificName} (${taxonId})`);
    
    // Run the AI research
    const researchData = await performAIResearch(
      taxonId,
      scientificName,
      commonName,
      '0xTEST_WALLET'
    );
    
    // Compare the fields
    const fields = [
      'agroforestry_use_cases_ai',
      'stewardship_best_practices_ai',
      'compatible_soil_types_ai',
      'planting_recipes_ai',
      'pruning_maintenance_ai',
      'disease_pest_management_ai',
      'fire_management_ai',
      'cultural_significance_ai'
    ];
    
    console.log('\nCOMPARING STEWARDSHIP FIELDS:');
    console.log('=========================================');
    
    fields.forEach(field => {
      const value = researchData[field];
      const valuePresent = value !== undefined && value !== null;
      const valueLength = valuePresent ? value.length : 0;
      
      console.log(`${field}:`);
      console.log(`  Present: ${valuePresent}`);
      console.log(`  Length: ${valueLength}`);
      if (valuePresent) {
        console.log(`  Preview: ${value.substring(0, 50)}...`);
      }
      console.log('----------------------------------------');
    });
    
    // Write the results to a file
    const fs = require('fs');
    fs.writeFileSync(
      path.join(__dirname, 'debug-research-fields-output.json'), 
      JSON.stringify(researchData, null, 2)
    );
    console.log(`\nFull result saved to debug-research-fields-output.json`);
    
  } catch (error) {
    console.error('Error during testing:', error);
  }
}

testFieldsGeneration();