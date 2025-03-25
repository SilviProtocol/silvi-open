const express = require('express');
const { performAIResearch } = require('../services/aiResearch');
const { uploadToIPFS } = require('../services/ipfs');
const { createAttestation, mintNFT } = require('../services/blockchain');
const { v4: uuidv4 } = require('uuid');

module.exports = (pool) => {
  const router = express.Router();

  /**
   * POST /fund-research
   * Initiates AI research for a tree species
   * Body: {
   *   taxon_id: String - Unique identifier of the species to research
   *   wallet_address: String - User's wallet address
   *   chain: String - User's chosen chain for NFT minting
   *   transaction_hash: String - Blockchain transaction hash for funding
   * }
   */
  router.post('/fund-research', async (req, res) => {
    try {
      const { taxon_id, wallet_address, chain, transaction_hash } = req.body;
      
      // Validate required fields
      if (!taxon_id || !wallet_address || !chain || !transaction_hash) {
        return res.status(400).json({ 
          error: 'Missing required fields', 
          required: ['taxon_id', 'wallet_address', 'chain', 'transaction_hash'] 
        });
      }

      // Validate chain choice
      const validChains = ['base', 'celo', 'optimism', 'arbitrum'];
      if (!validChains.includes(chain)) {
        return res.status(400).json({ 
          error: 'Invalid chain selection', 
          valid_chains: validChains 
        });
      }

      // Get species information
      const speciesQuery = `
        SELECT taxon_id, species, common_name, accepted_scientific_name 
        FROM species 
        WHERE taxon_id = $1
      `;
      const speciesResult = await pool.query(speciesQuery, [taxon_id]);
      
      if (speciesResult.rows.length === 0) {
        return res.status(404).json({ error: 'Species not found' });
      }
      
      const species = speciesResult.rows[0];
      
      // Use accepted_scientific_name or species as the scientific name
      const scientificName = species.accepted_scientific_name || species.species;
      const commonNames = species.common_name;
      
      // Step 1: Perform AI research
      console.log(`Starting AI research for ${scientificName} (${taxon_id})`);
      const researchData = await performAIResearch(
        taxon_id,
        scientificName,
        commonNames,
        wallet_address
      );
      
      // Step 2: Upload research data to IPFS
      console.log('Uploading research data to IPFS');
      const ipfsCid = await uploadToIPFS(researchData);
      
      // Step 3: Update species table with research data
      console.log('Updating species table with research data');
      const updateQuery = `
        UPDATE species
        SET 
          conservation_status = $1,
          general_description = $2,
          habitat = $3,
          elevation_ranges = $4,
          compatible_soil_types = $5,
          ecological_function = $6,
          native_adapted_habitats = $7,
          agroforestry_use_cases = $8,
          growth_form = $9,
          leaf_type = $10,
          deciduous_evergreen = $11,
          flower_color = $12,
          fruit_type = $13,
          bark_characteristics = $14,
          maximum_height = $15,
          maximum_diameter = $16,
          lifespan = $17,
          maximum_tree_age = $18,
          verification_status = 'unverified',
          ipfs_cid = $19,
          updated_at = CURRENT_TIMESTAMP
        WHERE taxon_id = $20
        RETURNING *
      `;
      
      const updateValues = [
        researchData.conservation_status,
        researchData.general_description,
        researchData.habitat,
        researchData.elevation_ranges,
        researchData.compatible_soil_types,
        researchData.ecological_function,
        researchData.native_adapted_habitats,
        researchData.agroforestry_use_cases,
        researchData.growth_form,
        researchData.leaf_type,
        researchData.deciduous_evergreen,
        researchData.flower_color,
        researchData.fruit_type,
        researchData.bark_characteristics,
        researchData.maximum_height,
        researchData.maximum_diameter,
        researchData.lifespan,
        researchData.maximum_tree_age,
        ipfsCid,
        taxon_id
      ];
      
      const updateResult = await pool.query(updateQuery, updateValues);
      
      // Step 4: Create EAS attestation
      console.log(`Creating EAS attestation on ${chain}`);
      const attestationData = {
        species: scientificName,
        researcher: wallet_address,
        ipfsCid: ipfsCid,
        taxonId: taxon_id
      };
      
      const attestationUID = await createAttestation(chain, attestationData);
      
      // Step 5: Mint NFT
      console.log(`Minting NFT on ${chain}`);
      const tokenId = uuidv4().replace(/-/g, '').substring(0, 10);
      const tokenURI = ipfsCid;
      
      const mintReceipt = await mintNFT(chain, wallet_address, tokenId, tokenURI);
      
      // Step 6: Store NFT data in contreebution_nfts table
      console.log('Storing NFT data in database');
      const nftQuery = `
        INSERT INTO contreebution_nfts (
          taxon_id, 
          wallet_address, 
          points, 
          ipfs_cid, 
          transaction_hash, 
          metadata
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;
      
      const nftMetadata = {
        species: scientificName,
        chain: chain,
        attestation_uid: attestationUID,
        mint_receipt: mintReceipt,
        research_date: new Date().toISOString()
      };
      
      const nftValues = [
        taxon_id,
        wallet_address,
        2, // Default points
        ipfsCid,
        transaction_hash,
        JSON.stringify(nftMetadata)
      ];
      
      const nftResult = await pool.query(nftQuery, nftValues);
      
      // Return complete response with all data
      res.status(201).json({
        success: true,
        research_data: researchData,
        ipfs_cid: ipfsCid,
        attestation_uid: attestationUID,
        nft_details: nftResult.rows[0]
      });
      
    } catch (error) {
      console.error('Error in /fund-research endpoint:', error);
      
      // Handle specific error types with custom messages
      if (error.code === '22001') {
        // PostgreSQL error: value too long for type
        return res.status(500).json({
          error: 'Database constraint error',
          message: 'One or more values exceed database column size limits',
          details: error.message,
          hint: 'Database columns have been updated to handle longer values. Try again.'
        });
      } else if (error.code === '23505') {
        // PostgreSQL error: unique violation
        return res.status(409).json({
          error: 'Duplicate entry',
          message: 'This research has already been funded',
          details: error.message
        });
      } else if (error.message && error.message.includes('Cannot find module')) {
        // Missing module dependency
        return res.status(500).json({
          error: 'Server configuration error',
          message: 'Missing required dependency',
          details: error.message,
          hint: 'Server administrator needs to install required npm packages'
        });
      } else if (error.message && (
          error.message.includes('API key') || 
          error.message.includes('PERPLEXITY_API_KEY') || 
          error.message.includes('OPENAI_API_KEY') ||
          error.message.includes('LIGHTHOUSE_API_KEY'))) {
        // API key related errors
        return res.status(500).json({
          error: 'API configuration error',
          message: 'Missing or invalid API key',
          details: error.message,
          hint: 'Check environment variables for API keys'
        });
      } else if (error.message && error.message.includes('Invalid chain')) {
        // Chain-related errors
        return res.status(400).json({
          error: 'Blockchain error',
          message: 'Invalid chain selection or configuration',
          details: error.message,
          hint: 'Check chain configuration and contract addresses'
        });
      }
      
      // Default fallback for other errors
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * GET /research/:taxon_id
   * Get research data for a specific species
   */
  router.get('/research/:taxon_id', async (req, res) => {
    try {
      const { taxon_id } = req.params;
      
      const query = `
        SELECT 
          taxon_id,
          conservation_status,
          general_description,
          habitat,
          elevation_ranges,
          compatible_soil_types,
          ecological_function,
          native_adapted_habitats,
          agroforestry_use_cases,
          growth_form,
          leaf_type,
          deciduous_evergreen,
          flower_color,
          fruit_type,
          bark_characteristics,
          maximum_height,
          maximum_diameter,
          lifespan,
          maximum_tree_age,
          verification_status,
          ipfs_cid
        FROM species 
        WHERE taxon_id = $1
      `;
      
      const result = await pool.query(query, [taxon_id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Species not found' });
      }
      
      // Check if the species has research data
      const species = result.rows[0];
      if (!species.general_description) {
        return res.status(404).json({ 
          error: 'No research data available for this species',
          species_exists: true,
          taxon_id: taxon_id
        });
      }
      
      res.json(species);
    } catch (error) {
      console.error(`Error fetching research data for taxon_id "${req.params.taxon_id}":`, error);
      
      if (error.code && error.code.startsWith('22')) {
        // PostgreSQL data exception error
        return res.status(500).json({
          error: 'Database data error',
          message: 'Error processing data in the database',
          details: error.message
        });
      } else if (error.code && error.code.startsWith('23')) {
        // PostgreSQL integrity constraint violation
        return res.status(500).json({
          error: 'Database integrity error',
          message: 'Database constraint violation',
          details: error.message
        });
      }
      
      res.status(500).json({ 
        error: 'Internal server error', 
        message: error.message,
        timestamp: new Date().toISOString() 
      });
    }
  });

  return router;
};