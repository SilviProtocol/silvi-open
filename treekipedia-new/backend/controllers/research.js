const express = require('express');
const { ethers } = require('ethers');
const { performAIResearch } = require('../services/aiResearch');
const { uploadToIPFS, getFromIPFS } = require('../services/ipfs');
const { createAttestation, mintNFT } = require('../services/blockchain');
const { v4: uuidv4 } = require('uuid');

/**
 * Helper function to map numeric chain IDs to chain keys
 * @param {string|number} chain - Chain ID (numeric) or chain key (string)
 * @returns {string} - Mapped chain key or original value if not numeric
 */
function mapChainIdToKey(chain) {
  // If null or undefined, default to base-sepolia
  if (chain === null || chain === undefined) {
    console.log('Chain is null or undefined, defaulting to base-sepolia');
    return 'base-sepolia';
  }
  
  // Convert to string in case it's a number
  const chainString = String(chain);
  
  // If not numeric, return as is
  if (!/^\d+$/.test(chainString)) {
    return chainString;
  }
  
  // Mapping of numeric chain IDs to chain keys
  const chainIdMapping = {
    '8453': 'base',
    '42220': 'celo',
    '10': 'optimism',
    '42161': 'arbitrum',
    '84532': 'base-sepolia',
    '44787': 'celo-alfajores',
    '11155420': 'optimism-sepolia',
    '421614': 'arbitrum-sepolia'
  };
  
  // If not in mapping, default to base-sepolia for safety
  const mappedChain = chainIdMapping[chainString] || 'base-sepolia';
  console.log(`Mapped numeric chain ID ${chainString} to chain key: ${mappedChain}`);
  return mappedChain;
}

/**
 * Core research function that can be called programmatically without HTTP req/res
 * @param {Object} pool - PostgreSQL connection pool
 * @param {string} taxonId - Species taxon ID
 * @param {string} walletAddress - Researcher's wallet address
 * @param {string} chain - Blockchain chain to use
 * @param {string} transactionHash - Transaction hash from payment
 * @param {string} scientificName - Scientific name of the species
 * @param {string} commonNames - Common names of the species
 * @returns {Promise<Object>} - Research result with NFT details
 */
async function performResearch(pool, taxonId, walletAddress, chain, transactionHash, scientificName, commonNames) {
  console.log(`Starting performResearch for ${scientificName} (${taxonId})`);
  
  try {
    // Validate inputs
    if (!taxonId || !walletAddress || !chain || !transactionHash) {
      throw new Error('Missing required fields: taxon_id, wallet_address, chain, transaction_hash');
    }

    // Check if species exists
    console.log("Querying species information for taxon_id:", taxonId);
    const speciesQuery = `
      SELECT taxon_id, species, species_scientific_name, common_name, accepted_scientific_name 
      FROM species 
      WHERE taxon_id = $1
    `;
    
    const speciesResult = await pool.query(speciesQuery, [taxonId]);
    
    if (speciesResult.rows.length === 0) {
      throw new Error(`Species not found for taxon_id: ${taxonId}`);
    }
    
    const speciesData = speciesResult.rows[0];
    
    // Use provided values or fall back to database values
    const finalScientificName = scientificName || speciesData.species_scientific_name || speciesData.species;
    const finalCommonNames = commonNames || speciesData.common_name;
    
    // Step 1: Perform AI research
    console.log(`Starting AI research for ${finalScientificName} (${taxonId})`);
    const researchData = await performAIResearch(
      taxonId,
      finalScientificName,
      finalCommonNames,
      walletAddress
    );
    
    // Force the researched flag to be true
    if (!researchData.researched) {
      console.log('WARNING: researched flag not set in researchData, explicitly setting it to TRUE');
      researchData.researched = true;
    }
    
    // Step 2: Update species table with research data
    console.log('Updating species table with research data');
    
    // Check if taxon_id matches what's expected
    if (researchData.taxon_id !== taxonId) {
      console.error(`WARNING: researchData.taxon_id (${researchData.taxon_id}) doesn't match request taxon_id (${taxonId})`);
      researchData.taxon_id = taxonId;
    }
    
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
        maximum_height_ai = NULLIF($16, '')::NUMERIC,
        maximum_diameter_ai = NULLIF($17, '')::NUMERIC,
        lifespan_ai = $18,
        maximum_tree_age_ai = NULLIF($19, '')::INTEGER,
        stewardship_best_practices_ai = $20,
        planting_recipes_ai = $21,
        pruning_maintenance_ai = $22,
        disease_pest_management_ai = $23,
        fire_management_ai = $24,
        cultural_significance_ai = $25,
        verification_status = 'unverified',
        researched = TRUE,
        updated_at = CURRENT_TIMESTAMP
      WHERE taxon_id = $26
      RETURNING *
    `;
    
    const updateValues = [
      finalScientificName,
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
      taxonId
    ];
    
    const updateResult = await pool.query(updateQuery, updateValues);
    
    if (updateResult.rowCount === 0) {
      throw new Error(`Species update failed: No matching record found with taxon_id=${taxonId}`);
    }
    
    // Begin transaction to allow rollback if needed
    const client = await pool.connect();
    let nftRecord = null;
    let ipfsCid = null;
    let attestationUID = null;
    
    try {
      await client.query('BEGIN');
      
      // Step 3: First insert record to get a global_id from the sequence
      console.log('Storing preliminary NFT data in database to get global_id');
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
      
      // Use empty string as placeholder for ipfs_cid - will update later
      const prelimMetadata = {
        species: finalScientificName,
        chain: chain,
        research_date: new Date().toISOString(),
        minting_status: 'pending'
      };
      
      const initialValues = [
        taxonId,
        walletAddress,
        2, // Default points
        '', // Empty placeholder for ipfs_cid
        transactionHash,
        JSON.stringify(prelimMetadata)
      ];
      
      // Insert record to get global_id
      const insertResult = await client.query(insertQuery, initialValues);
      nftRecord = insertResult.rows[0];
      const globalId = nftRecord.global_id;
      
      console.log(`Generated global_id: ${globalId} for NFT minting`);
      
      // Step 4: Format metadata and upload to IPFS
      console.log('Formatting metadata for NFT standards');
      
      // Create NFT metadata with standardized field names
      let formattedData = {
        // NFT standard metadata (always first per standards)
        name: `Research Contreebution #${globalId}`,
        description: "Thank you for sponsoring tree research!",
        image: "ipfs://bafkreibkta2e54ddqjlrmxmacjvqcpj7w6o3a4oww6ea7hldjazio22c3e",
        
        // Core identification
        taxon_id: researchData.taxon_id,
        scientific_name: finalScientificName,
        
        // Simple fields (group 1)
        conservation_status: researchData.conservation_status_ai || '',
        general_description: researchData.general_description_ai || '',
        habitat: researchData.habitat_ai || '',
        
        // Simple fields (group 2)
        elevation_ranges: researchData.elevation_ranges_ai || '',
        compatible_soil_types: researchData.compatible_soil_types_ai || '',
        ecological_function: researchData.ecological_function_ai || '',
        native_adapted_habitats: researchData.native_adapted_habitats_ai || '',
        agroforestry_use_cases: researchData.agroforestry_use_cases_ai || '',
        
        // Morphological fields
        growth_form: researchData.growth_form_ai || '',
        leaf_type: researchData.leaf_type_ai || '',
        deciduous_evergreen: researchData.deciduous_evergreen_ai || '',
        flower_color: researchData.flower_color_ai || '',
        fruit_type: researchData.fruit_type_ai || '',
        bark_characteristics: researchData.bark_characteristics_ai || '',
        
        // Numeric fields  
        maximum_height: researchData.maximum_height_ai || null,
        maximum_diameter: researchData.maximum_diameter_ai || null,
        maximum_tree_age: researchData.maximum_tree_age_ai || null,
        lifespan: researchData.lifespan_ai || '',
      };

      // Add stewardship fields
      formattedData.stewardship_best_practices = researchData.stewardship_best_practices_ai || 
        'Best practices for care and maintenance.';
      formattedData.planting_recipes = researchData.planting_recipes_ai || 
        'Recommendations for planting.';
      formattedData.pruning_maintenance = researchData.pruning_maintenance_ai || 
        'Guidelines for pruning and maintenance.';
      formattedData.disease_pest_management = researchData.disease_pest_management_ai || 
        'Management of pests and diseases.';
      formattedData.fire_management = researchData.fire_management_ai || 
        'Fire management considerations.';
      formattedData.cultural_significance = researchData.cultural_significance_ai || 
        'Cultural and historical importance.';
      
      // Add metadata
      formattedData.research_metadata = {
        researcher_wallet: walletAddress,
        research_date: new Date().toISOString(),
        research_method: "AI-assisted (Perplexity + GPT-4o)",
        verification_status: "unverified"
      };
      
      console.log('Uploading formatted metadata to IPFS');
      ipfsCid = await uploadToIPFS(formattedData);
      console.log(`Metadata uploaded to IPFS with CID: ${ipfsCid}`);
      
      // Step 5: Update species table with ipfs_cid
      const updateSpeciesQuery = `
        UPDATE species
        SET ipfs_cid = $1
        WHERE taxon_id = $2
      `;
      await client.query(updateSpeciesQuery, [ipfsCid, taxonId]);
      
      // Step 6: Update the NFT record with the IPFS CID
      const updateNftQuery = `
        UPDATE contreebution_nfts
        SET ipfs_cid = $1,
            metadata = jsonb_set(metadata::jsonb, '{ipfs_cid}', $2::jsonb)
        WHERE global_id = $3
        RETURNING *
      `;
      
      await client.query(updateNftQuery, [
        ipfsCid, 
        JSON.stringify(ipfsCid),
        globalId
      ]);
      
      // Step 7: Create EAS attestation
      // Map numeric chain ID to chain key if needed
      const attestationChainKey = mapChainIdToKey(chain);
      console.log(`Creating EAS attestation on ${attestationChainKey}`);
      
      const attestationData = {
        species: finalScientificName,
        researcher: walletAddress,
        ipfsCid: ipfsCid,
        taxonId: taxonId,
        refUID: ethers.ZeroHash
      };
      
      console.log('Attestation data prepared:', attestationData);
      attestationUID = await createAttestation(attestationChainKey, attestationData);
      console.log(`Attestation created with UID: ${attestationUID}`);
      
      // Update NFT record with attestation UID
      const updateAttestationQuery = `
        UPDATE contreebution_nfts
        SET metadata = jsonb_set(metadata::jsonb, '{attestation_uid}', $1::jsonb)
        WHERE global_id = $2
      `;
      
      await client.query(updateAttestationQuery, [
        JSON.stringify(attestationUID),
        globalId
      ]);
      
      // Step 8: Mint NFT
      // Map numeric chain ID to chain key if needed
      const nftChainKey = mapChainIdToKey(chain);
      console.log(`Minting NFT on ${nftChainKey} with tokenId: ${globalId}`);
      const mintReceipt = await mintNFT(nftChainKey, walletAddress, globalId, attestationData.ipfsCid);
      
      if (mintReceipt.status === 'failed') {
        console.error(`NFT minting failed: ${mintReceipt.error}`);
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
      
      // Update the NFT record
      nftRecord = nftResult.rows[0];
      
      // Commit the transaction
      await client.query('COMMIT');
    } catch (txError) {
      // Release the client back to the pool on error
      if (client) {
        await client.query('ROLLBACK');
      }
      throw txError;
    } finally {
      client.release();
    }
    
    // Verify database state after research completion
    console.log(`Research completion verification for ${taxonId} at ${new Date().toISOString()}`);
    try {
      const verifyQuery = `
        SELECT taxon_id, researched, general_description_ai FROM species WHERE taxon_id = $1
      `;
      const verifyResult = await pool.query(verifyQuery, [taxonId]);
      if (verifyResult.rows.length > 0) {
        console.log(`[VERIFICATION] After research completion, database state for ${taxonId}:`, {
          researched: verifyResult.rows[0].researched,
          has_description: !!verifyResult.rows[0].general_description_ai
        });
        
        // Force update the researched flag to true if needed
        if (verifyResult.rows[0].researched !== true) {
          console.log(`[VERIFICATION] Fixing missing researched flag for ${taxonId}`);
          await pool.query('UPDATE species SET researched = TRUE WHERE taxon_id = $1', [taxonId]);
        }
      }
    } catch (verifyError) {
      console.error(`[VERIFICATION] Error during verification:`, verifyError);
    }

    // Return the final result
    return {
      success: true,
      research_data: researchData,
      ipfs_cid: ipfsCid,
      attestation_uid: attestationUID ? attestationUID.toString() : "0x0000000000000000000000000000000000000000000000000000000000000000",
      nft_details: nftRecord
    };
  } catch (error) {
    console.error('Error in performResearch function:', error);
    throw error;
  }
}

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
      if (!taxon_id || !wallet_address || !chain || !transaction_hash) {
        return res.status(400).json({ 
          error: 'Missing required fields', 
          required: ['taxon_id', 'wallet_address', 'chain', 'transaction_hash'] 
        });
      }

      // Handle numeric chain IDs by mapping them to chain keys
      const mappedChain = mapChainIdToKey(chain);
      
      // Validate chain choice - include both mainnet and testnet chains
      const validChains = [
        'base', 'celo', 'optimism', 'arbitrum',  // Mainnet chains
        'base-sepolia', 'celo-alfajores', 'optimism-sepolia', 'arbitrum-sepolia'  // Testnet chains
      ];
      if (!validChains.includes(mappedChain)) {
        return res.status(400).json({ 
          error: 'Invalid chain selection', 
          valid_chains: validChains,
          provided_chain: chain,
          mapped_chain: mappedChain
        });
      }
      
      // Get species data for common_name
      const speciesQuery = `
        SELECT common_name FROM species WHERE taxon_id = $1
      `;
      const speciesResult = await pool.query(speciesQuery, [taxon_id]);
      const commonName = speciesResult.rows.length > 0 ? speciesResult.rows[0].common_name : '';
      
      // Call the core research function
      console.log(`Calling performResearch function for ${taxon_id}`);
      try {
        // Use the mapped chain for performResearch
        const result = await performResearch(
          pool,
          taxon_id, 
          wallet_address, 
          mappedChain, // Use the mapped chain value
          transaction_hash, 
          scientific_name,
          commonName
        );
        
        // Return the result to the client
        res.status(201).json(result);
      } catch (researchError) {
        console.error('Error in performResearch function:', researchError);
        throw researchError;
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
   * GET /:taxon_id
   * Get research data for a specific species
   */
  router.get('/:taxon_id', async (req, res) => {
    try {
      const { taxon_id } = req.params;
      
      console.log(`[ENDPOINT DEBUG] GET /research/${taxon_id} - Fetching research data at ${new Date().toISOString()}`);
      
      const query = `
        SELECT 
          taxon_id,
          species_scientific_name,
          researched,
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
      
      // Check if ANY AI research field is populated
      const hasAnyResearchData = Object.keys(species).some(key => 
        key.endsWith('_ai') && 
        species[key] !== null && 
        species[key] !== undefined && 
        species[key] !== ''
      );
      
      // Log the total number of populated AI fields for debugging
      const aiFields = Object.keys(species).filter(key => 
        key.endsWith('_ai') && 
        species[key] !== null && 
        species[key] !== undefined && 
        species[key] !== ''
      );
      
      console.log(`GET /research/${taxon_id} - Found ${aiFields.length} populated AI fields`);
      
      if (!hasAnyResearchData) {
        console.log(`GET /research/${taxon_id} - No AI fields found, returning 404`);
        // Also update the database to ensure researched=false
        try {
          await pool.query(
            'UPDATE species SET researched = FALSE WHERE taxon_id = $1',
            [taxon_id]
          );
        } catch (updateError) {
          console.error(`Error updating researched flag: ${updateError.message}`);
        }
        
        return res.status(404).json({ 
          error: 'No research data available for this species',
          species_exists: true,
          taxon_id: taxon_id
        });
      }
      
      // Ensure researched is explicitly true
      species.researched = true;
      console.log(`[ENDPOINT DEBUG] GET /research/${req.params.taxon_id} - Returning research data with researched=true`);
      
      // Log the AI fields we found to help with debugging
      console.log(`[ENDPOINT DEBUG] AI fields for ${req.params.taxon_id}:`, aiFields);
      
      // Also update the database to ensure the researched flag is set properly
      try {
        await pool.query(
          'UPDATE species SET researched = TRUE WHERE taxon_id = $1 AND (researched IS NULL OR researched = FALSE)',
          [taxon_id]
        );
      } catch (updateError) {
        console.error(`Error updating researched flag: ${updateError.message}`);
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

  // Return both the router and the standalone performResearch function
  return {
    router,
    performResearch
  };
};