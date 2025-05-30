// Test script to debug IPFS metadata issues
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const axios = require('axios');
const FormData = require('form-data');

// Lighthouse API key from environment variables
const LIGHTHOUSE_API_KEY = process.env.LIGHTHOUSE_API_KEY;

// Sample data similar to what's used in production
const sampleData = {
  // NFT standard metadata
  name: "Research Contreebution #12345",
  description: "Thank you for sponsoring tree research!",
  image: "ipfs://bafkreibkta2e54ddqjlrmxmacjvqcpj7w6o3a4oww6ea7hldjazio22c3e",
  
  // Core identification
  taxon_id: "AngNAParc36603-00",
  scientific_name: "Phoenix dactylifera",
  
  // Regular fields 
  conservation_status: "Least Concern",
  general_description: "Date palm is a tall, erect palm tree growing to 30 m in height.",
  habitat: "Native to arid regions of the Middle East and North Africa.",
  
  // Last fields - testing ordering impact
  stewardship_best_practices: "Plant in full sun and well-draining soil. Water deeply but infrequently.",
  planting_recipes: "Recommendations for planting include spacing palms at least 20 feet apart.",
  pruning_maintenance: "Remove dead or damaged fronds regularly to promote healthy growth."
};

// Upload to IPFS using standard method (similar to production code)
async function uploadToIPFS(data) {
  try {
    console.log('Testing metadata upload to IPFS via Lighthouse');
    
    // Convert data to JSON string with pretty formatting
    const jsonData = JSON.stringify(data, null, 2);
    
    // Log the key structure before upload
    console.log('METADATA KEYS BEFORE UPLOAD:', Object.keys(JSON.parse(jsonData)));
    console.log('METADATA INCLUDES STEWARDSHIP?', jsonData.includes('stewardship_best_practices'));
    
    // Create FormData object
    const formData = new FormData();
    
    // Append file to FormData
    formData.append(
      'file', 
      Buffer.from(jsonData), 
      {
        filename: `test_metadata_${Date.now()}.json`,
        contentType: 'application/json',
      }
    );
    
    // Set Lighthouse API endpoint and headers
    const url = 'https://node.lighthouse.storage/api/v0/add';
    const headers = {
      'Authorization': `Bearer ${LIGHTHOUSE_API_KEY}`,
      ...formData.getHeaders()
    };
    
    // Make POST request to Lighthouse API
    const response = await axios.post(url, formData, { headers });
    
    // Extract CID from response
    const cid = response.data.Hash;
    console.log(`Test data uploaded to IPFS with CID: ${cid}`);
    
    return cid;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw new Error(`IPFS upload failed: ${error.message}`);
  }
}

// Retrieve from IPFS to verify what actually got stored
async function getFromIPFS(cid) {
  try {
    console.log(`Retrieving data from IPFS with CID: ${cid}`);
    
    // Set IPFS gateway URL
    const gatewayUrl = `https://gateway.lighthouse.storage/ipfs/${cid}`;
    
    // Make GET request to IPFS gateway
    const response = await axios.get(gatewayUrl);
    
    // Return data
    return response.data;
  } catch (error) {
    console.error('Error retrieving from IPFS:', error);
    throw new Error(`IPFS retrieval failed: ${error.message}`);
  }
}

// Test different JSON stringification methods
async function testJSONMethods() {
  console.log('TESTING DIFFERENT JSON SERIALIZATION METHODS:');
  
  // Standard JSON.stringify
  const standardJSON = JSON.stringify(sampleData);
  console.log('Standard JSON length:', standardJSON.length);
  console.log('Contains stewardship?', standardJSON.includes('stewardship_best_practices'));
  
  // Pretty JSON with indentation
  const prettyJSON = JSON.stringify(sampleData, null, 2);
  console.log('Pretty JSON length:', prettyJSON.length);
  console.log('Contains stewardship?', prettyJSON.includes('stewardship_best_practices'));
  
  // Manual property order preservation
  const orderedData = {
    name: sampleData.name,
    description: sampleData.description,
    image: sampleData.image,
    taxon_id: sampleData.taxon_id,
    scientific_name: sampleData.scientific_name,
    conservation_status: sampleData.conservation_status,
    general_description: sampleData.general_description,
    habitat: sampleData.habitat,
    // Explicitly add stewardship fields
    stewardship_best_practices: sampleData.stewardship_best_practices,
    planting_recipes: sampleData.planting_recipes,
    pruning_maintenance: sampleData.pruning_maintenance
  };
  
  const orderedJSON = JSON.stringify(orderedData);
  console.log('Ordered JSON length:', orderedJSON.length);
  console.log('Contains stewardship?', orderedJSON.includes('stewardship_best_practices'));
  
  // Upload all versions
  console.log('\nUPLOADING ALL TEST VERSIONS:');
  
  // Upload standard serialization
  const cid1 = await uploadToIPFS(sampleData);
  console.log('Standard upload CID:', cid1);
  
  // Upload with explicit ordering
  const cid2 = await uploadToIPFS(orderedData);
  console.log('Ordered upload CID:', cid2);
  
  // Test retrieving from IPFS
  console.log('\nRETRIEVING FROM IPFS TO VERIFY:');
  
  // Get standard upload
  const retrieved1 = await getFromIPFS(cid1);
  console.log('Standard Retrieved Keys:', Object.keys(retrieved1));
  console.log('Has stewardship field?', retrieved1.hasOwnProperty('stewardship_best_practices'));
  
  // Get ordered upload
  const retrieved2 = await getFromIPFS(cid2);
  console.log('Ordered Retrieved Keys:', Object.keys(retrieved2));
  console.log('Has stewardship field?', retrieved2.hasOwnProperty('stewardship_best_practices'));
  
  return {
    standardCID: cid1,
    orderedCID: cid2
  };
}

// Direct test: Create the same formattedData object structure as in the research.js controller
async function testExactProductionStructure() {
  console.log('\nTESTING EXACT PRODUCTION STRUCTURE:');
  
  // Create a data structure exactly as in the controller
  let formattedData = {
    // NFT standard metadata
    name: `Research Contreebution #12345`,
    description: "Thank you for sponsoring tree research!",
    image: "ipfs://bafkreibkta2e54ddqjlrmxmacjvqcpj7w6o3a4oww6ea7hldjazio22c3e",
    
    // Core identification
    taxon_id: "AngNAParc36603-00",
    scientific_name: "Phoenix dactylifera",
   
    // Simple fields (group 1)
    conservation_status: "Least Concern",
    general_description: "Date palm is a tall, erect palm tree growing to 30 m in height.",
    habitat: "Native to arid regions of the Middle East and North Africa.",
    
    // Simple fields (group 2)
    elevation_ranges: "Sea level to 1500 meters",
    compatible_soil_types: "Sandy, well-draining soils",
    ecological_function: "Provides habitat and food for various wildlife species",
    native_adapted_habitats: "Arid and semi-arid regions",
    agroforestry_use_cases: "Intercropping, windbreaks, soil stabilization",
    
    // Morphological fields
    growth_form: "Tree",
    leaf_type: "Pinnate",
    deciduous_evergreen: "Evergreen",
    flower_color: "Yellow",
    fruit_type: "Drupe",
    bark_characteristics: "Brown, fibrous with leaf scars",
    
    // Numeric fields  
    maximum_height: 30,
    maximum_diameter: 1,
    maximum_tree_age: 100,
    lifespan: "100+ years",
    
    // Stewardship fields - simplified group
    stewardship_best_practices: "Plant in full sun and well-draining soil. Water deeply but infrequently.",
    planting_recipes: "Recommendations for planting include spacing palms at least 20 feet apart.",
    pruning_maintenance: "Remove dead or damaged fronds regularly to promote healthy growth.",
    disease_pest_management: "Monitor for red palm weevil and scale insects.",
    fire_management: "Fire management considerations.",
    cultural_significance: "Cultural and historical importance.",
   
    // Metadata at the end
    research_metadata: {
      researcher_wallet: "0x6B1f82a1d7E24A47c11655E19243F9368C893A18",
      research_date: new Date().toISOString(),
      research_method: "AI-assisted (Perplexity + GPT-4o)",
      verification_status: "unverified"
    }
  };
  
  // Critical check: Are stewardship fields present?
  console.log('FORMATTED DATA KEYS:', Object.keys(formattedData).join(', '));
  console.log('CONTAINS STEWARDSHIP?', Object.keys(formattedData).includes('stewardship_best_practices'));
  
  // Log the exact JSON string that will be sent to IPFS
  const metadataJson = JSON.stringify(formattedData, null, 2);
  console.log('METADATA JSON CONTAINS STEWARDSHIP:', metadataJson.includes('stewardship_best_practices'));
  
  // Upload to IPFS
  const cid = await uploadToIPFS(formattedData);
  console.log('Production structure CID:', cid);
  
  // Verify what was saved
  const retrieved = await getFromIPFS(cid);
  console.log('RETRIEVED KEYS:', Object.keys(retrieved));
  console.log('HAS STEWARDSHIP?', retrieved.hasOwnProperty('stewardship_best_practices'));
  console.log('STEWARDSHIP VALUE:', retrieved.stewardship_best_practices);
  
  return cid;
}

// Test special case: Create a deeper structure 
async function testNestedStructure() {
  console.log('\nTESTING NESTED STRUCTURE:');
  
  // Create a nested structure
  const nestedData = {
    // NFT standard metadata
    name: `Research Contreebution #12345`,
    description: "Thank you for sponsoring tree research!",
    image: "ipfs://bafkreibkta2e54ddqjlrmxmacjvqcpj7w6o3a4oww6ea7hldjazio22c3e",
    
    // Identification group
    identification: {
      taxon_id: "AngNAParc36603-00",
      scientific_name: "Phoenix dactylifera"
    },
    
    // General info group
    general_info: {
      conservation_status: "Least Concern",
      general_description: "Date palm is a tall, erect palm tree growing to 30 m in height.",
      habitat: "Native to arid regions of the Middle East and North Africa."
    },
    
    // Stewardship group - this tests if nested fields are preserved
    stewardship: {
      best_practices: "Plant in full sun and well-draining soil. Water deeply but infrequently.",
      planting_recipes: "Recommendations for planting include spacing palms at least 20 feet apart.",
      pruning_maintenance: "Remove dead or damaged fronds regularly to promote healthy growth."
    }
  };
  
  // Upload to IPFS
  const cid = await uploadToIPFS(nestedData);
  console.log('Nested structure CID:', cid);
  
  // Verify what was saved
  const retrieved = await getFromIPFS(cid);
  console.log('RETRIEVED KEYS:', Object.keys(retrieved));
  console.log('HAS STEWARDSHIP OBJECT?', retrieved.hasOwnProperty('stewardship'));
  if (retrieved.stewardship) {
    console.log('STEWARDSHIP KEYS:', Object.keys(retrieved.stewardship));
  }
  
  return cid;
}

// Run all tests
async function runAllTests() {
  try {
    console.log('STARTING IPFS METADATA DEBUG TESTS');
    
    // Run all three test types
    const jsonTestResults = await testJSONMethods();
    const productionStructureResult = await testExactProductionStructure();
    const nestedStructureResult = await testNestedStructure();
    
    console.log('\nTEST SUMMARY:');
    console.log('- JSON Methods Test CIDs:', jsonTestResults);
    console.log('- Production Structure CID:', productionStructureResult);
    console.log('- Nested Structure CID:', nestedStructureResult);
    
    console.log('\nCheck these CIDs at https://gateway.lighthouse.storage/ipfs/{CID}');
    
  } catch (error) {
    console.error('Test execution failed:', error);
  }
}

// Run the tests
runAllTests();