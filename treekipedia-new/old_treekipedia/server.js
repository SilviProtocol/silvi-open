// ai-agent/server.js

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
console.log("BASE_L2_RPC_URL is:", process.env.BASE_L2_RPC_URL);

// Import required modules
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const FormData = require('form-data');
const { Pool } = require('pg');
const { createAttestation } = require('../smart-contracts/createAttestation');
const { uploadResearchToIPFS } = require('../smart-contracts/uploadToIPFS');
const { mintNFTree } = require('../smart-contracts/mintNFTree');
const path = require('path');

// Import the AI research service (Perplexity + ChatGPT 4o flow)
const { performAIResearch } = require('./aiResearchService');

// Create an Express application
const app = express();
app.use(cors());
app.use(express.json());

// Set up PostgreSQL connection pool using the DB_ variables from .env
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

// --- Function: storeResearchInDB ---
// Inserts the research data into the ai_research table.
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
    console.error('Error storing research data in PostgreSQL:', error.stack);
    throw error;
  }
}

// --- POST /ai/research Endpoint ---
// Expects a JSON payload with keys: scientificName, commonNames, researcherWallet.
// Uses scientificName as the TaxonID.
app.post('/ai/research', async (req, res) => {
  try {
    const { scientificName, commonNames, researcherWallet } = req.body;
    if (!scientificName || !commonNames || !researcherWallet) {
      return res.status(400).json({ error: 'Missing required fields: scientificName, commonNames, researcherWallet' });
    }
    
    // Use scientificName as the TaxonID.
    const taxonID = scientificName;

    // Trigger the AI research workflow (Perplexity + ChatGPT 4o)
    const researchData = await performAIResearch(taxonID, scientificName, commonNames, researcherWallet);

    // Upload the structured research JSON to IPFS via Lighthouse using Athus's module
    const ipfsCid = await uploadResearchToIPFS(researchData);

    // Store the research data in PostgreSQL (including ipfs_cid and researcher_wallet)
    await storeResearchInDB(researchData, ipfsCid, researcherWallet);

    // Trigger attestation and NFT minting via Athus's modules
    const attestationDetails = await triggerAttestationAndMint(researchData, ipfsCid, researcherWallet);

    // Combine research data with the attestation details returned by AgentKit and the IPFS CID
    const finalResponse = {
      ...researchData,
      ipfs_cid: ipfsCid,
      on_chain: attestationDetails
    };

    res.json({ status: "success", data: finalResponse });
  } catch (error) {
    console.error("Error in POST /ai/research endpoint:", error.stack);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

// --- GET /ai/research/:scientificName Endpoint ---
// Retrieves research data for the given scientificName (used as TaxonID).
app.get('/ai/research/:scientificName', async (req, res) => {
  const { scientificName } = req.params;
  try {
    const query = 'SELECT * FROM ai_research WHERE taxon_id = $1';
    const result = await pool.query(query, [scientificName]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: `No research data found for scientificName: ${scientificName}` });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error retrieving research data:', error.stack);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// --- Function: triggerAttestationAndMint ---
// Triggers attestation and NFT minting using Athus's modules.
async function triggerAttestationAndMint(researchData, ipfsCid, researcherWallet) {
  try {
    console.log("Creating attestation using Athus's module...");
    const attestationUID = await createAttestation();
    console.log("Attestation UID:", attestationUID);

    // Reuse the IPFS CID as the token URI.
    const tokenURI = ipfsCid;

    console.log("Minting NFT using Athus's mintNFTree module...");
    // Using the researcherWallet as recipient; tokenId 2 and amount 1 are examples.
    const mintReceipt = await mintNFTree(researcherWallet, 2, 1, tokenURI);
    console.log("Mint Receipt:", mintReceipt);

    return {
      attestation_id: attestationUID,
      attestation_metadata_ipfs: tokenURI,
      nft_mint_receipt: mintReceipt
    };
  } catch (error) {
    console.error("Error in triggerAttestationAndMint:", error.stack);
    throw error;
  }
}

// Start the Express server on port 3000 (or the port specified in .env)
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`AI Research API listening on port ${PORT}`);
});

