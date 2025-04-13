// Import required modules
require('dotenv').config();
const axios = require('axios');

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
  const commonNamesStr = Array.isArray(commonNames) ? commonNames.join(', ') : commonNames;
  
  const queryMessage = `Provide detailed ecological and practical stewardship information for ${scientificName}, also known as ${commonNamesStr}, covering stewardship best practices, planting recipes, pruning maintenance, disease/pest management, fire management, compatible soil types, cultural significance, conservation status, general description, habitat, elevation ranges, ecological function, native adapted habitats, and agroforestry use cases.`;
  
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
    console.log('Querying Perplexity API for ecological and stewardship data with message:', queryMessage);
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
  const commonNamesStr = Array.isArray(commonNames) ? commonNames.join(', ') : commonNames;
  
  const queryMessage = `Provide detailed morphological characteristics for ${scientificName}, also known as ${commonNamesStr}, including growth form, leaf type, deciduous or evergreen status, flower color, fruit type, bark characteristics, maximum height, maximum diameter, lifespan, and maximum tree age.`;
  
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
    console.log('Querying Perplexity API for morphological data with message:', queryMessage);
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
  
  const prompt = `You have been provided with raw text data from two sources about the tree species ${scientificName}, also known as ${commonNamesStr}. 
The first source contains ecological + stewardship information, and the second source contains morphological characteristics. 

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

    // Return the combined result with taxon_id and researched=true
    return {
      taxon_id: taxonID,
      species_scientific_name: scientificName,
      researched: true,
      ...structuredJSON,
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