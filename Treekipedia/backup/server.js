// backend/server.js

// Load environment variables from the root .env file
require('dotenv').config({ path: '../.env' });

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const axios = require('axios');
const FormData = require('form-data');

// Import the AI research function from your ai-agent folder
const { performAIResearch } = require('../ai-agent/aiResearchService');

const app = express();
app.use(cors());
const port = process.env.PORT || 3000;

// Parse JSON request bodies
app.use(express.json());

// Setup PostgreSQL connection pool using environment variables
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// -----------------------------------------------------------------
// Basic health-check endpoint
app.get('/', (req, res) => {
  res.send('DeepTrees PostgreSQL API is running.');
});

// GET /research/species/:taxonID
// Retrieves a research record for the given taxonID
app.get('/research/species/:taxonID', async (req, res) => {
  const { taxonID } = req.params;
  try {
    const query = 'SELECT * FROM ai_research WHERE taxon_id = $1';
    const result = await pool.query(query, [taxonID]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Species not found.' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error retrieving research data:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /research/species
// Inserts a new research record or updates an existing one (upsert)
app.post('/research/species', async (req, res) => {
  const {
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
  } = req.body;

  // Basic validation
  if (!taxon_id || !general_description) {
    return res.status(400).json({ error: 'taxon_id and general_description are required.' });
  }

  try {
    const query = `
      INSERT INTO ai_research
        (taxon_id, general_description, native_adapted_habitats, stewardship_best_practices, planting_methods,
         ecological_function, agroforestry_use_cases, elevation_ranges, compatible_soil_types, conservation_status,
         research_status, ipfs_cid, researcher_wallet, created_at, updated_at, revision)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW(), 1)
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
         research_status = EXCLUDED.research_status,
         ipfs_cid = EXCLUDED.ipfs_cid,
         researcher_wallet = EXCLUDED.researcher_wallet,
         updated_at = NOW(),
         revision = ai_research.revision + 1
      RETURNING *;
    `;
    const values = [
      taxon_id,
      general_description,
      native_adapted_habitats || null,
      stewardship_best_practices || null,
      planting_methods || null,
      ecological_function || null,
      agroforestry_use_cases || null,
      elevation_ranges || null,
      compatible_soil_types || null,
      conservation_status || null,
      research_status || 'unverified',
      ipfs_cid || null,
      researcher_wallet || null,
    ];
    const result = await pool.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error inserting/updating research data:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// -----------------------------------------------------------------
// Helper function: Upload JSON to IPFS using Lighthouse
async function uploadToIPFS(jsonData) {
  const formData = new FormData();
  formData.append('file', Buffer.from(JSON.stringify(jsonData)), {
    filename: 'research.json',
    contentType: 'application/json',
  });

  try {
    const response = await axios.post(
      'https://node.lighthouse.storage/api/v0/add?pin=true',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.LIGHTHOUSE_API_KEY}`,
          ...formData.getHeaders(),
        },
      }
    );
    // Expect response.data.Hash to contain the IPFS CID
    return response.data.Hash;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
}

// -----------------------------------------------------------------
// New Endpoint: POST /ai/research
// This endpoint triggers the complete AI research workflow:
// 1. Call the AI research agent (Perplexity + GPT‑4)
// 2. Upload the resulting JSON to IPFS
// 3. Upsert the research data into PostgreSQL
// 4. Return the research data with dummy on‑chain details
app.post('/ai/research', async (req, res) => {
  const { taxonID, scientificName, commonNames, researcherWallet } = req.body;

  if (!taxonID || !scientificName || !commonNames || !researcherWallet) {
    return res.status(400).json({
      error: 'Missing required fields: taxonID, scientificName, commonNames, researcherWallet.'
    });
  }

  try {
    // Step 1: Call the AI Research Agent
    // (This function should perform the Perplexity search and GPT‑4 JSON formatting)
    const researchData = await performAIResearch(taxonID, scientificName, commonNames, researcherWallet);
    // researchData is expected to be an object with fields like general_description, etc.

    // Step 2: Upload the structured JSON to IPFS
    const ipfsCid = await uploadToIPFS(researchData);

    // Append IPFS CID and researcher wallet to the research data
    researchData.ipfs_cid = ipfsCid;
    researchData.researcher_wallet = researcherWallet;
    researchData.taxon_id = taxonID;
    researchData.research_status = researchData.research_status || 'unverified';

    // Step 3: Upsert the research record into PostgreSQL
    const query = `
      INSERT INTO ai_research
        (taxon_id, general_description, native_adapted_habitats, stewardship_best_practices, planting_methods,
         ecological_function, agroforestry_use_cases, elevation_ranges, compatible_soil_types, conservation_status,
         research_status, ipfs_cid, researcher_wallet, created_at, updated_at, revision)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW(), 1)
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
         research_status = EXCLUDED.research_status,
         ipfs_cid = EXCLUDED.ipfs_cid,
         researcher_wallet = EXCLUDED.researcher_wallet,
         updated_at = NOW(),
         revision = ai_research.revision + 1
      RETURNING *;
    `;
    const values = [
      taxonID,
      researchData.general_description,
      researchData.native_adapted_habitats || null,
      researchData.stewardship_best_practices || null,
      researchData.planting_methods || null,
      researchData.ecological_function || null,
      researchData.agroforestry_use_cases || null,
      researchData.elevation_ranges || null,
      researchData.compatible_soil_types || null,
      researchData.conservation_status || null,
      researchData.research_status,
      ipfsCid,
      researcherWallet,
    ];
    const dbResult = await pool.query(query, values);

    // Step 4: Return the final response including dummy on-chain details
    const finalResponse = {
      ...dbResult.rows[0],
      attestation_id: "dummy_attestation_id",
      nft_token_ids: {
        NFTree: "dummy_nftree_token",
        Contreebution: "dummy_contreebution_token"
      }
    };

    res.json(finalResponse);
  } catch (error) {
    console.error('Error in /ai/research endpoint:', error);
    res.status(500).json({ error: 'Internal server error in AI research workflow.' });
  }
});

// -----------------------------------------------------------------
// Start the Express server
app.listen(port, () => {
  console.log(`DeepTrees API is listening on port ${port}`);
});
