// Test script to exactly match the NFT metadata structure
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { uploadToIPFS, getFromIPFS } = require('../../backend/services/ipfs');
const fs = require('fs');

async function testNFTStructure() {
  try {
    console.log('Testing with exact NFT metadata structure');
    
    // Create data matching the exact structure from the controller
    const nftStructureData = {
      // NFT standard metadata
      name: `Research Contreebution Test`,
      description: "Thank you for sponsoring tree research!",
      image: "ipfs://bafkreibkta2e54ddqjlrmxmacjvqcpj7w6o3a4oww6ea7hldjazio22c3e",
      
      // Core identification
      taxon_id: "TEST-ID-" + Date.now(),
      scientific_name: "Test Scientific Name",
     
      // Simple fields (group 1)
      conservation_status: "Test conservation status",
      general_description: "Test general description",
      habitat: "Test habitat",
      
      // Simple fields (group 2)
      elevation_ranges: "Test elevation ranges",
      compatible_soil_types: "Test compatible soil types",
      ecological_function: "Test ecological function",
      native_adapted_habitats: "Test native adapted habitats",
      agroforestry_use_cases: "Test agroforestry use cases",
      
      // Morphological fields
      growth_form: "Test growth form",
      leaf_type: "Test leaf type",
      deciduous_evergreen: "Test deciduous evergreen",
      flower_color: "Test flower color",
      fruit_type: "Test fruit type",
      bark_characteristics: "Test bark characteristics",
      
      // Numeric fields  
      maximum_height: 25,
      maximum_diameter: 2,
      maximum_tree_age: 100,
      lifespan: "Test lifespan",
      
      // Stewardship fields - at the end like in the controller
      stewardship_best_practices: "Test stewardship best practices", 
      planting_recipes: "Test planting recipes",
      pruning_maintenance: "Test pruning maintenance",
      disease_pest_management: "Test disease pest management",
      fire_management: "Test fire management",
      cultural_significance: "Test cultural significance",
     
      // Metadata at the end
      research_metadata: {
        researcher_wallet: "0xTEST_WALLET_ADDRESS",
        research_date: new Date().toISOString(),
        research_method: "AI-assisted (Perplexity + GPT-4o)",
        verification_status: "unverified"
      }
    };
    
    // Upload to IPFS
    console.log('Uploading NFT structure data...');
    const cid = await uploadToIPFS(nftStructureData);
    console.log(`Uploaded with CID: ${cid}`);
    
    // Retrieve and check
    console.log('Retrieving NFT structure data...');
    const retrievedData = await getFromIPFS(cid);
    
    // Get original and retrieved keys
    const originalKeys = Object.keys(nftStructureData);
    const retrievedKeys = Object.keys(retrievedData);
    
    // Check what fields were lost
    const fieldsLost = originalKeys.filter(key => !retrievedKeys.includes(key));
    
    // Check stewardship fields specifically
    const stewardshipFields = [
      'stewardship_best_practices',
      'planting_recipes',
      'pruning_maintenance',
      'disease_pest_management',
      'fire_management',
      'cultural_significance'
    ];
    
    const stewardshipLost = stewardshipFields.filter(field => !retrievedKeys.includes(field));
    
    // Save results
    fs.writeFileSync(
      path.join(__dirname, 'nft-structure-original.json'),
      JSON.stringify(nftStructureData, null, 2)
    );
    
    fs.writeFileSync(
      path.join(__dirname, 'nft-structure-retrieved.json'),
      JSON.stringify(retrievedData, null, 2)
    );
    
    // Log results
    console.log('\nResults:');
    console.log('Total fields in original data:', originalKeys.length);
    console.log('Total fields in retrieved data:', retrievedKeys.length);
    
    if (fieldsLost.length > 0) {
      console.log('\nMISSING FIELDS:');
      fieldsLost.forEach(field => console.log(`- ${field}`));
    } else {
      console.log('\nAll fields were preserved! No missing fields.');
    }
    
    console.log('\nStewardship fields status:');
    if (stewardshipLost.length > 0) {
      console.log('MISSING STEWARDSHIP FIELDS:');
      stewardshipLost.forEach(field => console.log(`- ${field}`));
    } else {
      console.log('All stewardship fields were preserved!');
      stewardshipFields.forEach(field => {
        console.log(`- ${field}: ${retrievedData[field] ? 'PRESENT' : 'MISSING'}`);
      });
    }
    
    return {
      success: fieldsLost.length === 0,
      fieldsLost,
      stewardshipLost,
      cid
    };
  } catch (error) {
    console.error('Error in NFT structure test:', error);
    throw error;
  }
}

// Run the test
testNFTStructure()
  .then(result => {
    console.log('\nTest completed!');
    console.log('Success:', result.success);
    console.log('CID:', result.cid);
  })
  .catch(err => {
    console.error('Test failed:', err);
  });