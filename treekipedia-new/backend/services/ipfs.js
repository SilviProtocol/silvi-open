// Import required modules
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const axios = require('axios');
const FormData = require('form-data');

// Lighthouse API key from environment variables
const LIGHTHOUSE_API_KEY = process.env.LIGHTHOUSE_API_KEY;

/**
 * Uploads data to IPFS via Lighthouse
 * @param {Object} data - The data to upload to IPFS
 * @returns {Promise<string>} - CID (Content Identifier) of the uploaded data
 */
async function uploadToIPFS(data) {
  try {
    console.log('Uploading data to IPFS via Lighthouse');
    
    // CRITICAL FIX: First verify stewardship fields are present in data
    // This ensures these fields don't get lost during the serialization process
    const hasStewFields = 'stewardship_best_practices' in data || 
                           'planting_recipes' in data || 
                           'pruning_maintenance' in data;
    console.log(`Stewardship fields present in data before serialization: ${hasStewFields}`);
    
    if (hasStewFields) {
      console.log('Stewardship sample:', data.stewardship_best_practices?.substring(0, 30) + '...');
    } else {
      console.log('WARNING: No stewardship fields found in data object!');
    }
    
    // Create a new object to ensure field order is maintained
    // This is a more robust approach than relying on native object property order
    const orderedData = {
      // NFT standard metadata (always first per standards)
      name: data.name,
      description: data.description,
      image: data.image,
      
      // Core identification
      taxon_id: data.taxon_id,
      scientific_name: data.scientific_name,
      
      // Regular fields
      conservation_status: data.conservation_status,
      general_description: data.general_description,
      habitat: data.habitat,
      elevation_ranges: data.elevation_ranges,
      compatible_soil_types: data.compatible_soil_types,
      ecological_function: data.ecological_function,
      native_adapted_habitats: data.native_adapted_habitats,
      agroforestry_use_cases: data.agroforestry_use_cases,
      
      // Morphological fields
      growth_form: data.growth_form,
      leaf_type: data.leaf_type,
      deciduous_evergreen: data.deciduous_evergreen,
      flower_color: data.flower_color,
      fruit_type: data.fruit_type,
      bark_characteristics: data.bark_characteristics,
      
      // Numeric fields
      maximum_height: data.maximum_height,
      maximum_diameter: data.maximum_diameter,
      maximum_tree_age: data.maximum_tree_age,
      lifespan: data.lifespan,
      
      // CRITICAL: Explicitly include stewardship fields
      stewardship_best_practices: data.stewardship_best_practices,
      planting_recipes: data.planting_recipes,
      pruning_maintenance: data.pruning_maintenance,
      disease_pest_management: data.disease_pest_management,
      fire_management: data.fire_management,
      cultural_significance: data.cultural_significance,
    };
    
    // Add research_metadata at the end if present
    if (data.research_metadata) {
      orderedData.research_metadata = data.research_metadata;
    }
    
    // Convert ordered data to JSON string
    const jsonData = JSON.stringify(orderedData, null, 2);
    
    // Verify stewardship fields in serialized JSON
    console.log('JSON contains stewardship fields:', 
                jsonData.includes('stewardship_best_practices'));
    
    // Create FormData object
    const formData = new FormData();
    
    // Append file to FormData
    formData.append(
      'file', 
      Buffer.from(jsonData), 
      {
        filename: `treekipedia_${data.taxon_id}_${Date.now()}.json`,
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
    console.log(`Data uploaded to IPFS with CID: ${cid}`);
    
    return cid;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw new Error(`IPFS upload failed: ${error.message}`);
  }
}

/**
 * Retrieves data from IPFS via Lighthouse
 * @param {string} cid - CID (Content Identifier) of the data to retrieve
 * @returns {Promise<Object>} - Retrieved data as JSON object
 */
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

/**
 * Exports the entire species database to IPFS as CSV
 * @param {Object} pool - PostgreSQL connection pool
 * @returns {Promise<string>} - CID of the exported CSV
 */
async function exportSpeciesToIPFS(pool) {
  try {
    console.log('Exporting species database to IPFS');
    
    // Query all species data
    const query = 'SELECT * FROM species';
    const result = await pool.query(query);
    
    // Convert to CSV format
    const { parse } = require('json2csv');
    const fields = Object.keys(result.rows[0]);
    const opts = { fields };
    const csv = parse(result.rows, opts);
    
    // Create FormData object
    const formData = new FormData();
    
    // Generate version and timestamp
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const version = '1.0';
    
    // Append file to FormData
    formData.append(
      'file', 
      Buffer.from(csv), 
      {
        filename: `treekipedia_data_v${version}_${timestamp}.csv`,
        contentType: 'text/csv',
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
    console.log(`Database exported to IPFS with CID: ${cid}`);
    
    return cid;
  } catch (error) {
    console.error('Error exporting database to IPFS:', error);
    throw new Error(`Database export failed: ${error.message}`);
  }
}

module.exports = {
  uploadToIPFS,
  getFromIPFS,
  exportSpeciesToIPFS
};