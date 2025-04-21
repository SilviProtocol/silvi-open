// Import required modules
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const axios = require('axios');
const { getTopCommonNames } = require('../utils/commonNames');

// Retrieve API keys from environment variables
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Queries Perplexity API for ecological and stewardship data about a tree species
 * @param {string} scientificName - Scientific name of the tree species
 * @param {string|string[]} commonNames - Common name(s) of the tree species
 * @returns {Promise<string>} - Raw text containing ecological and stewardship information
 */
async function queryPerplexityEcologicalAndStewardship(scientificName, commonNames) {
  // Get optimized list of common names to avoid hitting API limits
  const optimizedCommonNames = getTopCommonNames(commonNames, 5, 200);
  
  // Only include common names in the query if we have them
  const commonNamesPart = optimizedCommonNames 
    ? `, also known as ${optimizedCommonNames}` 
    : '';
  
  const queryMessage = `Provide detailed ecological and practical stewardship information for ${scientificName}${commonNamesPart}, covering stewardship best practices, planting recipes, pruning maintenance, disease/pest management, fire management, compatible soil types, cultural significance, conservation status, general description, habitat, elevation ranges, ecological function, native adapted habitats, and agroforestry use cases.`;
  
  // Use the Perplexity API endpoint 
  const url = 'https://api.perplexity.ai/chat/completions';
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
  };
  const payload = {
    model: 'sonar-pro',
    messages: [
      { role: 'system', content: 'Be precise and concise.' },
      { role: 'user', content: queryMessage }
    ]
  };

  try {
    console.log('Querying Perplexity API for ecological and stewardship data');
    console.log(`Using scientific name: ${scientificName}`);
    
    // Log the original vs optimized common names length for debugging
    const originalLength = typeof commonNames === 'string' 
      ? commonNames.length 
      : (Array.isArray(commonNames) ? JSON.stringify(commonNames).length : 0);
    
    console.log(`Original common names length: ${originalLength} characters`);
    console.log(`Optimized common names (${optimizedCommonNames.split(',').length} names): ${optimizedCommonNames}`);
    console.log(`Optimized length: ${optimizedCommonNames.length} characters`);
    
    const response = await axios.post(url, payload, { headers });
    // Extract the message content from the first choice
    const ecologicalAndStewardshipData = response.data.choices[0].message.content.trim();
    console.log('Received ecological and stewardship data from Perplexity');
    return ecologicalAndStewardshipData;
  } catch (error) {
    console.error('Error querying Perplexity API for ecological and stewardship data:', error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * Queries Perplexity API for morphological characteristics about a tree species
 * @param {string} scientificName - Scientific name of the tree species
 * @param {string|string[]} commonNames - Common name(s) of the tree species
 * @returns {Promise<string>} - Raw text containing morphological information
 */
async function queryPerplexityMorphological(scientificName, commonNames) {
  // Get optimized list of common names to avoid hitting API limits
  const optimizedCommonNames = getTopCommonNames(commonNames, 5, 200);
  
  // Only include common names in the query if we have them
  const commonNamesPart = optimizedCommonNames 
    ? `, also known as ${optimizedCommonNames}` 
    : '';
  
  const queryMessage = `Provide detailed morphological characteristics for ${scientificName}${commonNamesPart}, including growth form, leaf type, deciduous or evergreen status, flower color, fruit type, bark characteristics, maximum height, maximum diameter, lifespan, and maximum tree age.`;
  
  // Use the Perplexity API endpoint
  const url = 'https://api.perplexity.ai/chat/completions';
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${PERPLEXITY_API_KEY}`
  };
  const payload = {
    model: 'sonar-pro',
    messages: [
      { role: 'system', content: 'Be precise and concise.' },
      { role: 'user', content: queryMessage }
    ]
  };

  try {
    console.log('Querying Perplexity API for morphological data');
    console.log(`Using scientific name: ${scientificName}`);
    console.log(`Using optimized common names: ${optimizedCommonNames}`);
    
    const response = await axios.post(url, payload, { headers });
    // Extract the message content from the first choice
    const morphologicalData = response.data.choices[0].message.content.trim();
    console.log('Received morphological data from Perplexity');
    return morphologicalData;
  } catch (error) {
    console.error('Error querying Perplexity API for morphological data:', error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * Uses ChatGPT 4o to structure the raw data from Perplexity into a JSON object with _ai fields
 * @param {string} ecologicalAndStewardshipData - Raw text of ecological and stewardship data
 * @param {string} morphologicalData - Raw text of morphological data
 * @param {string} scientificName - Scientific name of the tree species
 * @param {string|string[]} commonNames - Common name(s) of the tree species
 * @returns {Promise<Object>} - Structured JSON object
 */
async function structureWithChatGPT(ecologicalAndStewardshipData, morphologicalData, scientificName, commonNames) {
  const commonNamesStr = Array.isArray(commonNames) ? commonNames.join(', ') : commonNames;
  
  // First, check if the data returned matches the requested species
  const verifyPrompt = `Check if the following data is specifically about ${scientificName} (also known as: ${commonNamesStr}).
The data appears to be:

Ecological + Stewardship Data (first few lines):
${ecologicalAndStewardshipData.substring(0, 500)}...

Morphological Characteristics (first few lines):
${morphologicalData.substring(0, 500)}...

Respond with only a single word: either "correct" if the data is about ${scientificName}, or "wrong" followed by the actual species name mentioned in the data.`;

  // Verify the species first
  let isDataCorrect = true;
  let actualSpeciesName = scientificName;
  
  try {
    const verifyUrl = 'https://api.openai.com/v1/chat/completions';
    const verifyHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    };
    const verifyPayload = {
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a botanical verification assistant. Respond with only "correct" if the data matches the requested species, or "wrong: [actual species name]" if it doesn\'t.' },
        { role: 'user', content: verifyPrompt }
      ],
      temperature: 0.3,
      max_tokens: 50
    };
    
    console.log('Verifying species match...');
    const verifyResponse = await axios.post(verifyUrl, verifyPayload, { headers: verifyHeaders });
    const verifyOutput = verifyResponse.data.choices[0].message.content.trim().toLowerCase();
    
    if (verifyOutput.startsWith('wrong')) {
      isDataCorrect = false;
      // Try to extract the actual species name from the response
      const match = verifyOutput.match(/wrong:\s*(.*)/i);
      if (match && match[1]) {
        actualSpeciesName = match[1].trim();
      }
      console.warn(`⚠️ DATA MISMATCH WARNING: Requested species "${scientificName}" but received data for "${actualSpeciesName}"`);
    } else {
      console.log('✓ Species verification passed - data matches requested species');
    }
  } catch (verifyError) {
    console.error('Error verifying species match:', verifyError.message);
    // Continue processing even if verification fails
  }
  
  const prompt = `You have been provided with raw text data from two sources about the tree species ${scientificName}, also known as ${commonNamesStr}. 
The first source contains ecological + stewardship information, and the second source contains morphological characteristics. 

${!isDataCorrect ? `⚠️ IMPORTANT: It appears the data provided is actually about ${actualSpeciesName}, NOT ${scientificName}. Please extract what information you can but note any fields that seem clearly irrelevant to ${scientificName}.` : ''}

Your task is to extract and structure the relevant information into a JSON object matching this schema:

{
  "stewardship_best_practices_ai": "string",
  "planting_recipes_ai": "string",
  "pruning_maintenance_ai": "string",
  "disease_pest_management_ai": "string",
  "fire_management_ai": "string",
  "compatible_soil_types_ai": "string",
  "cultural_significance_ai": "string",
  "conservation_status_ai": "string",
  "general_description_ai": "string",
  "habitat_ai": "string",
  "elevation_ranges_ai": "string",
  "ecological_function_ai": "string",
  "native_adapted_habitats_ai": "string",
  "agroforestry_use_cases_ai": "string",
  "growth_form_ai": "string",
  "leaf_type_ai": "string",
  "deciduous_evergreen_ai": "string",
  "flower_color_ai": "string",
  "fruit_type_ai": "string",
  "bark_characteristics_ai": "string",
  "maximum_height_ai": "number",
  "maximum_diameter_ai": "number",
  "lifespan_ai": "string",
  "maximum_tree_age_ai": "integer"
}

For each field:
- If data is missing or contradictory, set that field to null.
- For maximum_height_ai, parse out a numeric value (in meters), using up to 2 decimals.
- For maximum_diameter_ai, parse out a numeric value (in meters), using up to 2 decimals.
- For maximum_tree_age_ai, parse out an integer (in years).
- If you believe the data is for the wrong species, still try to extract general information but omit species-specific details that clearly don't apply.

Return the structured JSON object, ensuring it's suitable for PostgreSQL insertion.

Ecological + Stewardship Data: ${ecologicalAndStewardshipData}

Morphological Characteristics: ${morphologicalData}`;

  const url = 'https://api.openai.com/v1/chat/completions';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_API_KEY}`
  };
  const payload = {
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: 'You are an expert botanist and data analyst.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 2000
  };

  try {
    console.log('Calling ChatGPT 4o API to structure data...');
    const response = await axios.post(url, payload, { headers });
    const chatOutput = response.data.choices[0].message.content.trim();
    console.log('Received structured data from ChatGPT 4o');

    let structuredData;
    try {
      // Extract JSON from the response (in case the model includes additional text)
      const jsonRegex = /{[\s\S]*}/;
      const jsonMatch = chatOutput.match(jsonRegex);
      
      if (jsonMatch) {
        structuredData = JSON.parse(jsonMatch[0]);
      } else {
        structuredData = JSON.parse(chatOutput);
      }
      
      // CRITICAL FIX: Ensure all fields have _ai suffix and are correctly mapped
      // This function ensures data is always saved to _ai fields, never to legacy fields
      console.log("Ensuring AI field consistency and proper field mapping...");
      
      const fieldMappings = [
        ['general_description', 'general_description_ai'],
        ['habitat', 'habitat_ai'],
        ['elevation_ranges', 'elevation_ranges_ai'],
        ['compatible_soil_types', 'compatible_soil_types_ai'],
        ['ecological_function', 'ecological_function_ai'],
        ['native_adapted_habitats', 'native_adapted_habitats_ai'],
        ['agroforestry_use_cases', 'agroforestry_use_cases_ai'],
        ['growth_form', 'growth_form_ai'],
        ['leaf_type', 'leaf_type_ai'],
        ['deciduous_evergreen', 'deciduous_evergreen_ai'],
        ['flower_color', 'flower_color_ai'],
        ['fruit_type', 'fruit_type_ai'],
        ['bark_characteristics', 'bark_characteristics_ai'],
        ['maximum_height', 'maximum_height_ai'],
        ['maximum_diameter', 'maximum_diameter_ai'],
        ['lifespan', 'lifespan_ai'],
        ['maximum_tree_age', 'maximum_tree_age_ai'],
        ['stewardship_best_practices', 'stewardship_best_practices_ai'],
        ['planting_recipes', 'planting_recipes_ai'],
        ['pruning_maintenance', 'pruning_maintenance_ai'],
        ['disease_pest_management', 'disease_pest_management_ai'],
        ['fire_management', 'fire_management_ai'],
        ['cultural_significance', 'cultural_significance_ai'],
        ['conservation_status', 'conservation_status_ai']
      ];

      // Step 1: Initialize all AI fields with empty strings if they don't exist
      // This ensures every AI field exists in the output
      for (const [_, aiField] of fieldMappings) {
        if (structuredData[aiField] === undefined || structuredData[aiField] === null) {
          structuredData[aiField] = '';
          console.log(`Initialized missing AI field: ${aiField}`);
        }
      }
      
      // Step 2: Copy any data from legacy fields (without _ai suffix) to AI fields
      // This handles cases where the AI model returns data in legacy format
      for (const [baseField, aiField] of fieldMappings) {
        // Only copy if base field has content and AI field is empty
        if (structuredData[baseField] && 
            (structuredData[aiField] === undefined || 
             structuredData[aiField] === null || 
             structuredData[aiField] === '')) {
          console.log(`Migrating data from legacy field: ${baseField} -> ${aiField}`);
          structuredData[aiField] = structuredData[baseField];
        }
        
        // Always remove legacy fields to prevent them from being used
        if (structuredData[baseField] !== undefined) {
          console.log(`Removing legacy field: ${baseField}`);
          delete structuredData[baseField];
        }
      }
      
      // Step 3: Add explicit researched=TRUE flag 
      // This ensures the species is marked as researched when the data is saved
      structuredData.researched = true;
      console.log("Setting researched flag to TRUE");
      
      // Check specifically for the stewardship fields to make sure they're populated
      if (!structuredData.stewardship_best_practices_ai || structuredData.stewardship_best_practices_ai === '') {
        console.log("WARNING: stewardship_best_practices_ai is empty or missing! Attempting to generate default value");
        // Create a default value based on basic ecological info if available
        if (structuredData.ecological_function_ai || structuredData.habitat_ai) {
          structuredData.stewardship_best_practices_ai = 
            `Best practices for this species include planting in appropriate conditions based on its ` +
            `natural habitat (${structuredData.habitat_ai || 'native range'}) and considering its ` +
            `ecological function (${structuredData.ecological_function_ai || 'contribution to the ecosystem'}).`;
          console.log("Generated default stewardship_best_practices_ai value");
        }
      } else {
        console.log("VERIFIED: stewardship_best_practices_ai is present:", 
                   structuredData.stewardship_best_practices_ai.substring(0, 50) + '...');
      }
      
      // Step 4: Detailed logging to verify field population
      const aiFields = Object.keys(structuredData).filter(key => key.endsWith('_ai'));
      const populatedFields = aiFields.filter(field => 
        structuredData[field] && 
        structuredData[field] !== '' && 
        typeof structuredData[field] === 'string' && 
        structuredData[field].trim() !== ''
      );
      
      console.log(`AI Fields in data: ${aiFields.length}, Populated: ${populatedFields.length}`);
      if (populatedFields.length > 0) {
        console.log(`Populated AI fields: ${populatedFields.join(', ')}`);
      } else {
        console.warn("WARNING: No AI fields were populated with content!");
      }
      
      // Step 5: Specifically check critical fields that must be present
      const criticalFields = [
        'general_description_ai', 
        'habitat_ai', 
        'ecological_function_ai',
        'stewardship_best_practices_ai'
      ];
      
      console.log("\nVerifying critical fields:");
      criticalFields.forEach(field => {
        const hasContent = !!(structuredData[field] && 
                            structuredData[field] !== '' && 
                            typeof structuredData[field] === 'string' && 
                            structuredData[field].trim() !== '');
                            
        console.log(`${field}: ${hasContent ? 'PRESENT ✓' : 'EMPTY ✗'}`);
      });
    } catch (parseError) {
      console.error('Error parsing ChatGPT output as JSON:', parseError);
      throw new Error('Failed to parse GPT response as JSON');
    }
    return structuredData;
  } catch (error) {
    console.error('Error calling ChatGPT 4o API:', error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * Performs AI research for a tree species using parallel Perplexity queries and ChatGPT structuring
 * @param {string} taxonID - Unique identifier for the species
 * @param {string} scientificName - Scientific name of the tree species
 * @param {string|string[]} commonNames - Common name(s) of the tree species
 * @param {string} researcherWallet - Wallet address of the researcher
 * @returns {Promise<Object>} - Structured research data with taxon_id
 */
async function performAIResearch(taxonID, scientificName, commonNames, researcherWallet) {
  try {
    console.log(`Starting AI research for ${scientificName} (${taxonID})`);
    
    // Step 1: Run parallel Perplexity queries for ecological+stewardship and morphological data
    const [ecologicalAndStewardshipData, morphologicalData] = await Promise.all([
      queryPerplexityEcologicalAndStewardship(scientificName, commonNames),
      queryPerplexityMorphological(scientificName, commonNames)
    ]);
    
    // Step 2: Structure the data using ChatGPT 4o with _ai fields
    const structuredJSON = await structureWithChatGPT(
      ecologicalAndStewardshipData, 
      morphologicalData, 
      scientificName, 
      commonNames
    );

    // CRITICAL FIX: Always use the input taxonID, not whatever ID might be in the structuredJSON
    // This ensures we update the correct row in the database
    return {
      taxon_id: taxonID, // Explicitly use the provided taxonID parameter
      species_scientific_name: scientificName, // Use the requested species name
      ...structuredJSON, // Include all the structured data fields
      // Include metadata about the research process
      research_metadata: {
        researcher_wallet: researcherWallet,
        research_date: new Date().toISOString(),
        research_method: "AI-assisted (Perplexity + GPT-4o)",
        verification_status: "unverified"
      }
    };
  } catch (error) {
    console.error('Error during AI research process:', error);
    throw error;
  }
}

module.exports = {
  performAIResearch,
  queryPerplexityEcologicalAndStewardship,
  queryPerplexityMorphological,
  structureWithChatGPT
};