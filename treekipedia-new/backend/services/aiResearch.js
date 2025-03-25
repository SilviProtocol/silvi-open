// Import required modules
require('dotenv').config();
const axios = require('axios');

// Retrieve API keys from environment variables
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Queries Perplexity API for ecological data about a tree species
 * @param {string} scientificName - Scientific name of the tree species
 * @param {string|string[]} commonNames - Common name(s) of the tree species
 * @returns {Promise<string>} - Raw text containing ecological information
 */
async function queryPerplexityEcological(scientificName, commonNames) {
  const commonNamesStr = Array.isArray(commonNames) ? commonNames.join(', ') : commonNames;
  
  const queryMessage = `Provide detailed ecological information for ${scientificName}, also known as ${commonNamesStr}, covering conservation status, general description, habitat, elevation ranges, compatible soil types, ecological function, native adapted habitats, and agroforestry use cases.`;
  
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
    console.log('Querying Perplexity API for ecological data with message:', queryMessage);
    const response = await axios.post(url, payload, { headers });
    // Extract the message content from the first choice
    const ecologicalData = response.data.choices[0].message.content.trim();
    console.log('Received ecological data from Perplexity');
    return ecologicalData;
  } catch (error) {
    console.error('Error querying Perplexity API for ecological data:', error.response ? error.response.data : error.message);
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
 * Uses ChatGPT 4o to structure the raw data from Perplexity into a JSON object
 * @param {string} ecologicalData - Raw text of ecological data
 * @param {string} morphologicalData - Raw text of morphological data
 * @param {string} scientificName - Scientific name of the tree species
 * @param {string|string[]} commonNames - Common name(s) of the tree species
 * @returns {Promise<Object>} - Structured JSON object
 */
async function structureWithChatGPT(ecologicalData, morphologicalData, scientificName, commonNames) {
  const commonNamesStr = Array.isArray(commonNames) ? commonNames.join(', ') : commonNames;
  
  const prompt = `You have been provided with raw text data from two sources about the tree species ${scientificName}, also known as ${commonNamesStr}. The first source contains ecological information, and the second source contains morphological characteristics. Your task is to:

Extract and structure the relevant information from the raw text into a JSON object matching this schema:
{
  "conservation_status": "string",
  "general_description": "string",
  "habitat": "string",
  "elevation_ranges": "string",
  "compatible_soil_types": "string",
  "ecological_function": "string",
  "native_adapted_habitats": "string",
  "agroforestry_use_cases": "string",
  "growth_form": "string",
  "leaf_type": "string",
  "deciduous_evergreen": "string",
  "flower_color": "string",
  "fruit_type": "string",
  "bark_characteristics": "string",
  "maximum_height": "number",
  "maximum_diameter": "number",
  "lifespan": "string",
  "maximum_tree_age": "integer"
}

For each field, extract the relevant data from the text. If data is missing or seems inaccurate (e.g., vague, contradictory, or implausible), set that field to null.

For specific fields, apply these formatting rules:
- maximum_height: Parse the text to extract a numeric value (e.g., from "30.5 meters" or "30.5 m" to 30.5). Assume meters as the unit unless otherwise specified, and strip the unit from the output. Use up to 2 decimal places. Set to null if no clear number is found.
- maximum_diameter: Parse the text to extract a numeric value (e.g., from "1.2 meters" to 1.2). Assume meters as the unit unless otherwise specified, and strip the unit from the output. Use up to 2 decimal places. Set to null if no clear number is found.
- maximum_tree_age: Parse the text to extract an integer value (e.g., from "200 years" to 200). Assume years as the unit unless otherwise specified, and strip the unit from the output. Set to null if no clear integer is found.

For all other fields, keep the data as a string, preserving the original text as closely as possible.
Ensure the structured data is ready for database storage in PostgreSQL, adhering to the schema's type requirements.

Ecological Data: ${ecologicalData}

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
    
    // Step 1: Run parallel Perplexity queries for ecological and morphological data
    const [ecologicalData, morphologicalData] = await Promise.all([
      queryPerplexityEcological(scientificName, commonNames),
      queryPerplexityMorphological(scientificName, commonNames)
    ]);
    
    // Step 2: Structure the data using ChatGPT 4o
    const structuredJSON = await structureWithChatGPT(
      ecologicalData, 
      morphologicalData, 
      scientificName, 
      commonNames
    );

    // Return the combined result with taxon_id
    return {
      taxon_id: taxonID,
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
  queryPerplexityEcological,
  queryPerplexityMorphological,
  structureWithChatGPT
};