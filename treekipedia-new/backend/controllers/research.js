const express = require('express');
const { ethers } = require('ethers');
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
   *   ipfs_cid: String - IPFS CID for the NFT metadata
   *   scientific_name: String - Scientific name (species field value)
   * }
   */
  router.post('/fund-research', async (req, res) => {
    try {
      const { taxon_id, wallet_address, chain, transaction_hash, ipfs_cid, scientific_name } = req.body;
      
      // Validate required fields
      if (!taxon_id || !wallet_address || !chain || !transaction_hash || !ipfs_cid || !scientific_name) {
        return res.status(400).json({ 
          error: 'Missing required fields', 
          required: ['taxon_id', 'wallet_address', 'chain', 'transaction_hash', 'ipfs_cid', 'scientific_name'] 
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
      console.log("Querying species information for taxon_id:", taxon_id);
      const speciesQuery = `
        SELECT taxon_id, species, species_scientific_name, common_name, accepted_scientific_name 
        FROM species 
        WHERE taxon_id = $1
      `;
      let speciesResult;
      try {
        speciesResult = await pool.query(speciesQuery, [taxon_id]);
        console.log("Query result:", speciesResult.rows);
      } catch (queryError) {
        console.error("Error in species query:", queryError);
        throw queryError;
      }
      
      if (speciesResult.rows.length === 0) {
        return res.status(404).json({ error: 'Species not found' });
      }
      
      const speciesData = speciesResult.rows[0];
      
      // Use the provided scientific_name or fall back to species_scientific_name or species field
      // Note: Prefer species_scientific_name but fall back to species field for backward compatibility
      const scientificName = scientific_name || speciesData.species_scientific_name || speciesData.species;
      const commonNames = speciesData.common_name;
      
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
      
      // Step 3: Update species table with research data (using the new AI fields)
      console.log('Updating species table with research data');
      const updateQuery = `
        UPDATE species
        SET 
          species_scientific_name = COALESCE($1, species_scientific_name),
          conservation_status_ai = $2,
          general_description_ai = $3,
          habitat_ai = $4,
          elevation_ranges_ai = $5,
          compatible_soil_types_ai = $6,
          ecological_function_ai = $7,
          native_adapted_habitats_ai = $8,
          agroforestry_use_cases_ai = $9,
          growth_form_ai = $10,
          leaf_type_ai = $11,
          deciduous_evergreen_ai = $12,
          flower_color_ai = $13,
          fruit_type_ai = $14,
          bark_characteristics_ai = $15,
          maximum_height_ai = $16,
          maximum_diameter_ai = $17,
          lifespan_ai = $18,
          maximum_tree_age_ai = $19,
          stewardship_best_practices_ai = $20,
          planting_recipes_ai = $21,
          pruning_maintenance_ai = $22,
          disease_pest_management_ai = $23,
          fire_management_ai = $24,
          cultural_significance_ai = $25,
          verification_status = 'unverified',
          ipfs_cid = $26,
          researched = TRUE,
          updated_at = CURRENT_TIMESTAMP
        WHERE taxon_id = $27
        RETURNING *
      `;
      
      const updateValues = [
        scientificName,
        researchData.conservation_status_ai,
        researchData.general_description_ai,
        researchData.habitat_ai,
        researchData.elevation_ranges_ai,
        researchData.compatible_soil_types_ai,
        researchData.ecological_function_ai,
        researchData.native_adapted_habitats_ai,
        researchData.agroforestry_use_cases_ai,
        researchData.growth_form_ai,
        researchData.leaf_type_ai,
        researchData.deciduous_evergreen_ai,
        researchData.flower_color_ai,
        researchData.fruit_type_ai,
        researchData.bark_characteristics_ai,
        researchData.maximum_height_ai,
        researchData.maximum_diameter_ai,
        researchData.lifespan_ai,
        researchData.maximum_tree_age_ai,
        researchData.stewardship_best_practices_ai,
        researchData.planting_recipes_ai,
        researchData.pruning_maintenance_ai,
        researchData.disease_pest_management_ai,
        researchData.fire_management_ai,
        researchData.cultural_significance_ai,
        ipfsCid,
        taxon_id
      ];
      
      const updateResult = await pool.query(updateQuery, updateValues);
      
      // Step 4: Create EAS attestation
      console.log(`Creating EAS attestation on ${chain}`);
      
      // For now, we'll always use ZeroHash for refUID (blank/initial reference)
      // In the future, we can implement linking to previous attestations
      console.log('Using ZeroHash for refUID (initial attestation)');
      
      const attestationData = {
        species: scientific_name || scientificName, // Use provided scientific_name or fallback to DB value
        researcher: wallet_address,
        ipfsCid: ipfs_cid || ipfsCid, // Use provided ipfs_cid or fallback to generated one
        taxonId: taxon_id,
        refUID: ethers.ZeroHash // Always use ZeroHash for now
      };
      
      console.log('Attestation data prepared:', attestationData);
      
      const attestationUID = await createAttestation(chain, attestationData);
      
      // Step 5: First insert record to get a global_id from the sequence
      console.log('Storing NFT data in database to get global_id');
      const insertQuery = `
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
      
      const prelimMetadata = {
        species: scientificName,
        chain: chain,
        attestation_uid: attestationUID,
        research_date: new Date().toISOString(),
        minting_status: 'pending'
      };
      
      const initialValues = [
        taxon_id,
        wallet_address,
        2, // Default points
        ipfsCid,
        transaction_hash,
        JSON.stringify(prelimMetadata)
      ];
      
      // Begin transaction to allow rollback if needed
      const client = await pool.connect();
      
      try {
        await client.query('BEGIN');
        
        // Insert record to get global_id
        const insertResult = await client.query(insertQuery, initialValues);
        const nftRecord = insertResult.rows[0];
        const globalId = nftRecord.global_id;
        
        console.log(`Generated global_id: ${globalId} for NFT minting`);
        
        // Step 6: Mint NFT using the global_id as tokenId
        console.log(`Minting NFT on ${chain} with tokenId: ${globalId}`);
        const tokenURI = ipfsCid;
        
        const mintReceipt = await mintNFT(chain, wallet_address, globalId, tokenURI);
        
        if (mintReceipt.status === 'failed') {
          console.error(`NFT minting failed: ${mintReceipt.error}`);
          
          // Save the failure state for debugging
          const updateFailedQuery = `
            UPDATE contreebution_nfts
            SET metadata = jsonb_set(metadata::jsonb, '{minting_status}', '"failed"')::jsonb ||
                          jsonb_build_object('error', $1)::jsonb
            WHERE global_id = $2
            RETURNING *
          `;
          
          await client.query(updateFailedQuery, [
            mintReceipt.error, 
            globalId
          ]);
          
          // Rollback to release the global_id sequence
          await client.query('ROLLBACK');
          
          throw new Error(`NFT minting failed: ${mintReceipt.error}`);
        }
        
        // If minting succeeded, update the record with mint receipt
        const updateQuery = `
          UPDATE contreebution_nfts
          SET 
            transaction_hash = $1,
            metadata = jsonb_set(
              jsonb_set(metadata::jsonb, '{minting_status}', '"completed"')::jsonb,
              '{mint_receipt}', $2::jsonb
            )
          WHERE global_id = $3
          RETURNING *
        `;
        
        const nftResult = await client.query(updateQuery, [
          mintReceipt.transactionHash,
          JSON.stringify(mintReceipt),
          globalId
        ]);
        
        // Commit the transaction
        await client.query('COMMIT');
        
        // Use the final NFT record
        const finalNftRecord = nftResult.rows[0];
        
        // Return complete response with all data
        // For attestation_uid, convert to string for consistent API response format
        // This ensures it's safe to display in JSON responses
        res.status(201).json({
          success: true,
          research_data: researchData,
          ipfs_cid: ipfsCid,
          attestation_uid: attestationUID ? attestationUID.toString() : "0x0000000000000000000000000000000000000000000000000000000000000000",
          nft_details: finalNftRecord
        });
      } catch (txError) {
        // Release the client back to the pool on error
        if (client) {
          await client.query('ROLLBACK');
        }
        throw txError;
      } finally {
        client.release();
      }
      
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
          species_scientific_name,
          conservation_status_ai,
          conservation_status_human,
          general_description_ai,
          general_description_human,
          habitat_ai,
          habitat_human,
          elevation_ranges_ai,
          elevation_ranges_human,
          compatible_soil_types_ai,
          compatible_soil_types_human,
          ecological_function_ai,
          ecological_function_human,
          native_adapted_habitats_ai,
          native_adapted_habitats_human,
          agroforestry_use_cases_ai,
          agroforestry_use_cases_human,
          growth_form_ai,
          growth_form_human,
          leaf_type_ai,
          leaf_type_human,
          deciduous_evergreen_ai,
          deciduous_evergreen_human,
          flower_color_ai,
          flower_color_human,
          fruit_type_ai,
          fruit_type_human,
          bark_characteristics_ai,
          bark_characteristics_human,
          maximum_height_ai,
          maximum_height_human,
          maximum_diameter_ai,
          maximum_diameter_human,
          lifespan_ai,
          lifespan_human,
          maximum_tree_age_ai,
          maximum_tree_age_human,
          stewardship_best_practices_ai,
          stewardship_best_practices_human,
          planting_recipes_ai,
          planting_recipes_human,
          pruning_maintenance_ai,
          pruning_maintenance_human,
          disease_pest_management_ai,
          disease_pest_management_human,
          fire_management_ai,
          fire_management_human,
          cultural_significance_ai,
          cultural_significance_human,
          verification_status,
          researched,
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
      if (!species.researched) {
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