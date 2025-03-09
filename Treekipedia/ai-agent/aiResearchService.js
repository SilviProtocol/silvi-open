// Load environment variables from the .env file located in the repository root
require('dotenv').config({ path: '../.env' });

// Import required modules
const axios = require('axios');
const agentkit = require('@coinbase/agentkit');

// Retrieve API keys from environment variables
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// --- Function: queryPerplexity ---
// Constructs a query using the scientificName and commonNames, then calls the Perplexity API
// to retrieve unstructured search results that include: general description, native/adapted habitats,
// stewardship best practices, planting methods, ecological function, agroforestry use-cases,
// elevation ranges, compatible soil types, and conservation status.
async function queryPerplexity(scientificName, commonNames) {
  const queryMessage = `Research tree species: ${scientificName}. Gather detailed information on:
- General description,
- Native or adapted habitats and regions,
- Stewardship best practices,
- Planting methods,
- Ecological function,
- Agroforestry use-cases,
- Elevation ranges,
- Compatible soil types,
- Conservation status.
Common names: ${Array.isArray(commonNames) ? commonNames.join(', ') : commonNames}.`;
  
  // Use the Perplexity API endpoint as per their documentation.
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
    // For structured outputs, you could include a "response_format" parameter if enabled on your account.
  };

  try {
    console.log('Querying Perplexity API with message:', queryMessage);
    const response = await axios.post(url, payload, { headers });
    // Extract the message content from the first choice.
    const unstructuredData = response.data.choices[0].message.content.trim();
    console.log('Received unstructured data from Perplexity:', unstructuredData);
    return unstructuredData;
  } catch (error) {
    console.error('Error querying Perplexity API:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// --- Function: refineWithChatGPT ---
// Uses the ChatGPT 4o API to refine the unstructured data into structured JSON output.
// The output will conform to the DeepTrees PostgreSQL schema.
async function refineWithChatGPT(unstructuredData, scientificName, commonNames) {
  const prompt = `
You are an expert botanist and data analyst.
Using the following unstructured search results:
"${unstructuredData}"
Provide a detailed research summary for the tree species with scientific name "${scientificName}" and common names "${Array.isArray(commonNames) ? commonNames.join(', ') : commonNames}".
Output the data in the following JSON format (do not include any extra text):

{
  "general_description": "A brief description of the species.",
  "native_adapted_habitats": "Regions and climates.",
  "stewardship_best_practices": "Guidelines for care.",
  "planting_methods": "Propagation methods.",
  "ecological_function": "Ecosystem roles.",
  "agroforestry_use_cases": "Uses in agroforestry.",
  "elevation_ranges": "Suitable elevation ranges.",
  "compatible_soil_types": "Preferred soil conditions.",
  "conservation_status": "Conservation status."
}
  `;
  const url = 'https://api.openai.com/v1/chat/completions';
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_API_KEY}`
  };
  const payload = {
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'You are an expert botanist.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 500
  };

  try {
    console.log('Calling ChatGPT 4o API to refine data...');
    const response = await axios.post(url, payload, { headers });
    const chatOutput = response.data.choices[0].message.content.trim();
    console.log('Raw output from ChatGPT 4o:', chatOutput);

    let structuredData;
    try {
      structuredData = JSON.parse(chatOutput);
    } catch (parseError) {
      console.error('Error parsing ChatGPT output as JSON:', parseError);
      structuredData = { general_description: chatOutput };
    }
    return structuredData;
  } catch (error) {
    console.error('Error calling ChatGPT 4o API:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// --- Function: performAIResearch ---
// Orchestrates the two-step process: first calls Perplexity API, then refines the data using ChatGPT 4o.
// Accepts: taxonID, scientificName, commonNames, researcherWallet.
async function performAIResearch(taxonID, scientificName, commonNames, researcherWallet) {
  try {
    // Use AgentKit for any onchain pre-checks or logging (placeholder for now)
    if (typeof agentkit.dummyFunction === 'function') {
      agentkit.dummyFunction();
    } else {
      console.warn("AgentKit dummy function is not available.");
    }

    // Step 1: Retrieve unstructured data from Perplexity API.
    const unstructuredData = await queryPerplexity(scientificName, commonNames);

    // Step 2: Refine the unstructured data using ChatGPT 4o API.
    const structuredJSON = await refineWithChatGPT(unstructuredData, scientificName, commonNames);

    // Return the combined result with taxon_id.
    // (The researcherWallet is used in later steps for onchain actions and is not stored per the current schema.)
    return {
      taxon_id: taxonID,
      ...structuredJSON
    };
  } catch (error) {
    console.error('Error during AI research process:', error);
    throw error;
  }
}

// Export the performAIResearch function so it can be used in your API endpoints.
module.exports = { performAIResearch };
