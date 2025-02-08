// server.js

// Global error handlers to catch unhandled errors
process.on('uncaughtException', err => {
  console.error('Uncaught Exception:', err);
});
process.on('unhandledRejection', err => {
  console.error('Unhandled Rejection:', err);
});

// Load environment variables from the repository root .env file
require('dotenv').config({ path: '../.env' });
console.log("DB_HOST is:", process.env.DB_HOST);
console.log("LIGHTHOUSE_API_KEY is:", process.env.LIGHTHOUSE_API_KEY);

// Import required modules
const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const { Pool } = require('pg');

// Import the AI research service (Perplexity + ChatGPT 4o flow)
const { performAIResearch } = require('./aiResearchService');

// Create an Express application
const app = express();
app.use(express.json());

// Set up PostgreSQL connection pool using the DB_ variables from .env
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

// --- Function: uploadToIPFS ---
// Uploads JSON data to IPFS via Lighthouse and returns the CID.
async function uploadToIPFS(jsonData) {
  const url = 'https://node.lighthouse.storage/api/v0/add?pin=true';
  
  // Create a FormData instance and append the JSON data as a file.
  const formData = new FormData();
  const buffer = Buffer.from(JSON.stringify(jsonData));
  formData.append('file', buffer, { filename: 'research.json', contentType: 'application/json' });
  
  // Set up headers including the Lighthouse API key with "Bearer " prefix.
  const headers = {
    ...formData.getHeaders(),
    'Authorization': `Bearer ${process.env.LIGHTHOUSE_API_KEY}`
  };

  try {
    console.log('Uploading research JSON to IPFS via Lighthouse...');
    const response = await axios.post(url, formData, { headers });
    const ipfsCid = response.data.Hash;
    console.log('Received IPFS CID from Lighthouse:', ipfsCid);
    return ipfsCid;
  } catch (error) {
    console.error('Error uploading to Lighthouse:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// --- Function: storeResearchInDB ---
// Inserts the research data into the ai_research table.
// The table schema includes: taxon_id, general_description, native_adapted_habitats, stewardship_best_practices,
// planting_methods, ecological_function, agroforestry_use_cases, elevation_ranges, compatible_soil_types,
// conservation_status, research_status (default "unverified"), ipfs_cid, researcher_wallet, revision, revision_history,
// created_at, and updated_at.
async function storeResearchInDB(researchData, ipfsCid, researcherWallet) {
  const query = `
    INSERT INTO ai_research (
      taxon_id,
      general_description,
      native_adapted_habitats,
      stewardship_best_practices,
      planting_methods,
      ecological_function,
      agroforestry_use_cases,
      elevation_ranges,
      compatible_soil_types,
      conservation_status,
      research_status,
      ipfs_cid,
      researcher_wallet,
      revision,
      revision_history,
      created_at,
      updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'unverified', $11, $12, 1, '[]', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    ON CONFLICT (taxon_id) DO UPDATE SET
      general_description = EXCLUDED.general_description,
      native_adapted_habitats = EXCLUDED.native_adapted_habitats,
      stewardship_best_practices = EXCLUDED.stewardship_best_practices,
      planting_methods = EXCLUDED.planting_methods,
      ecological_function = EXCLUDED.ecological_function,
      agroforestry_use_cases = EXCLUDED.agroforestry_use_cases,
      elevation_ranges = EXCLUDED.elevation_ranges,
      compatible_soil_types = EXCLUDED.compatible_soil_types,
      conservation_status = EXCLUDED.conservation_status,
      research_status = 'unverified',
      ipfs_cid = EXCLUDED.ipfs_cid,
      researcher_wallet = EXCLUDED.researcher_wallet,
      updated_at = CURRENT_TIMESTAMP;
  `;
  const values = [
    researchData.taxon_id,
    researchData.general_description,
    researchData.native_adapted_habitats,
    researchData.stewardship_best_practices,
    researchData.planting_methods,
    researchData.ecological_function,
    researchData.agroforestry_use_cases,
    researchData.elevation_ranges,
    researchData.compatible_soil_types,
    researchData.conservation_status,
    ipfsCid,
    researcherWallet
  ];
  try {
    console.log('Storing research data in PostgreSQL...');
    await pool.query(query, values);
    console.log('Research data stored successfully.');
  } catch (error) {
    console.error('Error storing research data in PostgreSQL:', error);
    throw error;
  }
}

// --- POST /ai/research Endpoint ---
// Expects a JSON payload with keys: taxonID, scientificName, commonNames, researcherWallet.
app.post('/ai/research', async (req, res) => {
  try {
    const { taxonID, scientificName, commonNames, researcherWallet } = req.body;
    if (!taxonID || !scientificName || !commonNames || !researcherWallet) {
      return res.status(400).json({ error: 'Missing required fields: taxonID, scientificName, commonNames, researcherWallet' });
    }

    // Trigger the AI research workflow (Perplexity + ChatGPT 4o)
    const researchData = await performAIResearch(taxonID, scientificName, commonNames, researcherWallet);

    // Upload the structured research JSON to IPFS via Lighthouse
    const ipfsCid = await uploadToIPFS(researchData);

    // Store the research data in PostgreSQL (including ipfs_cid and researcher_wallet)
    await storeResearchInDB(researchData, ipfsCid, researcherWallet);

    // Dummy on-chain details (to be replaced with actual AgentKit onchain actions later)
    const onChainDetails = {
      attestation_id: "dummy_attestation_id",
      nftree_token_id: "dummy_nftree_token_id",
      contreebution_token_id: "dummy_contreebution_token_id"
    };

    // Combine research data with on-chain details and IPFS CID, then return final JSON.
    const finalResponse = {
      ...researchData,
      ipfs_cid: ipfsCid,
      on_chain: onChainDetails
    };

    res.json({ status: "success", data: finalResponse });
  } catch (error) {
    console.error("Error in POST /ai/research endpoint:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start the Express server on port 3000 (or the port specified in .env)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`AI Research API listening on port ${PORT}`);
});
