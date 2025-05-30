const express = require('express');
const { ethers } = require('ethers');
const { performAIResearch, validateResearchData, researchQueue } = require('../services/aiResearch');
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
  
  // Begin transaction to allow rollback if needed
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
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
    
    const speciesResult = await client.query(speciesQuery, [taxonId]);
    
    if (speciesResult.rows.length === 0) {
      throw new Error(`Species not found for taxon_id: ${taxonId}`);
    }
    
    const speciesData = speciesResult.rows[0];
    
    // Use provided values or fall back to database values
    const finalScientificName = scientificName || speciesData.species_scientific_name || speciesData.species;
    const finalCommonNames = commonNames || speciesData.common_name;
    
    // Check if this species is already being researched
    const researchStatus = await client.query(
      `SELECT research_status FROM species_research_queue WHERE taxon_id = $1`,
      [taxonId]
    );
    
    // If it's already in the queue or being processed, return existing status
    if (researchStatus.rows.length > 0 && 
        ['queued', 'processing'].includes(researchStatus.rows[0].research_status)) {
      console.log(`Research for ${finalScientificName} (${taxonId}) is already ${researchStatus.rows[0].research_status}`);
      return {
        taxon_id: taxonId,
        status: 'already_in_progress',
        message: `Research for this species is already ${researchStatus.rows[0].research_status}`,
        research_status: researchStatus.rows[0].research_status
      };
    }
    
    // Add to research queue table for tracking
    await client.query(
      `INSERT INTO species_research_queue (
        taxon_id, species_scientific_name, wallet_address, transaction_hash, 
        research_status, added_at, chain
      ) VALUES ($1, $2, $3, $4, $5, NOW(), $6)
      ON CONFLICT (taxon_id) DO UPDATE SET
        research_status = $5,
        wallet_address = $3,
        transaction_hash = $4,
        updated_at = NOW(),
        chain = $6
      `,
      [taxonId, finalScientificName, walletAddress, transactionHash, 'queued', chain]
    );
    
    // Commit transaction
    await client.query('COMMIT');
    client.release();
    
    // Step 1: Perform AI research (this uses the queue system internally)
    console.log(`Starting AI research for ${finalScientificName} (${taxonId})`);
    
    // Update status to processing
    await pool.query(
      `UPDATE species_research_queue SET research_status = 'processing', updated_at = NOW() WHERE taxon_id = $1`,
      [taxonId]
    );
    
    const researchData = await performAIResearch(
      taxonId,
      finalScientificName,
      finalCommonNames,
      walletAddress
    );
    
    // Validate research data
    const validation = validateResearchData(researchData);
    if (!validation.valid) {
      console.error(`Validation errors for ${taxonId}:`, validation.errors);
      throw new Error(`Research data validation failed: ${validation.errors.join(', ')}`);
    }
    
    if (validation.warnings.length > 0) {
      console.warn(`Validation warnings for ${taxonId}:`, validation.warnings);
    }
    
    // Centralized location for ensuring the researched flag is true
    researchData.researched = true;
    
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
    
    // Begin a new transaction for NFT minting
    const nftClient = await pool.connect();
    let nftRecord = null;
    let ipfsCid = null;
    let attestationUID = null;
    
    try {
      await nftClient.query('BEGIN');
      
      // Update research queue status to 'completed'
      await nftClient.query(
        `UPDATE species_research_queue SET research_status = 'completed', updated_at = NOW() WHERE taxon_id = $1`,
        [taxonId]
      );
      
      // Step 3: First insert record to get a global_id from the sequence
      console.log('Storing preliminary NFT data in database to get global_id');
      
      // Start with initial data
      const prelimMetadata = {
        species_scientific_name: finalScientificName,
        common_name: finalCommonNames && finalCommonNames.split(';')[0], // Use first common name
        taxon_id: taxonId,
        chain,
        minting_status: 'pending',
        research_date: new Date().toISOString()
      };
      
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
      
      const initialValues = [
        taxonId,
        walletAddress,
        2, // Default points
        '', // Empty placeholder for ipfs_cid
        transactionHash,
        JSON.stringify(prelimMetadata)
      ];
      
      // Insert record to get global_id
      const insertResult = await nftClient.query(insertQuery, initialValues);
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
        // Use ipfs.io gateway URL directly since it's confirmed to work with this image
        image: "https://ipfs.io/ipfs/bafkreibkta2e54ddqjlrmxmacjvqcpj7w6o3a4oww6ea7hldjazio22c3e",
        
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
        maximum_height: researchData.maximum_height_ai || '',
        maximum_diameter: researchData.maximum_diameter_ai || '',
        lifespan: researchData.lifespan_ai || '',
        maximum_tree_age: researchData.maximum_tree_age_ai || '',
        
        // Stewardship fields
        stewardship_best_practices: researchData.stewardship_best_practices_ai || '',
        planting_recipes: researchData.planting_recipes_ai || '',
        pruning_maintenance: researchData.pruning_maintenance_ai || '',
        disease_pest_management: researchData.disease_pest_management_ai || '',
        fire_management: researchData.fire_management_ai || '',
        cultural_significance: researchData.cultural_significance_ai || '',
        
        // NFT attributes for marketplaces
        attributes: [
          { trait_type: "Species", value: finalScientificName },
          { trait_type: "Researcher", value: walletAddress },
          { trait_type: "Taxon ID", value: taxonId },
          { trait_type: "Chain", value: chain },
          { trait_type: "Research Date", value: new Date().toISOString().split('T')[0] }
        ]
      };
      
      console.log(`Uploading metadata to IPFS...`);
      ipfsCid = await uploadToIPFS(JSON.stringify(formattedData));
      console.log(`Uploaded metadata to IPFS with CID: ${ipfsCid}`);
      
      // Step 5: Update species table with ipfs_cid
      const updateSpeciesQuery = `
        UPDATE species
        SET ipfs_cid = $1
        WHERE taxon_id = $2
      `;
      await nftClient.query(updateSpeciesQuery, [ipfsCid, taxonId]);
      
      // Step 6: Update the NFT record with the IPFS CID
      const updateNftQuery = `
        UPDATE contreebution_nfts
        SET ipfs_cid = $1,
            metadata = jsonb_set(metadata::jsonb, '{ipfs_cid}', $2::jsonb)
        WHERE global_id = $3
        RETURNING *
      `;
      
      await nftClient.query(updateNftQuery, [
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
      
      await nftClient.query(updateAttestationQuery, [
        JSON.stringify(attestationUID),
        globalId
      ]);
      
      // Step 8: Mint NFT
      // Map numeric chain ID to chain key if needed
      const nftChainKey = mapChainIdToKey(chain);
      console.log(`Minting NFT on ${nftChainKey} with tokenId: ${globalId}`);
      
      // Add additional debugging for IPFS CID
      console.log(`DEBUG: Using IPFS CID for NFT metadata: ${attestationData.ipfsCid}`);
      console.log(`DEBUG: IPFS CID length: ${attestationData.ipfsCid.length}`);
      console.log(`DEBUG: IPFS gateway URL for verification: https://gateway.lighthouse.storage/ipfs/${attestationData.ipfsCid}`);
      
      // Try to verify the metadata before minting
      try {
        console.log(`DEBUG: Attempting to fetch metadata before minting to verify accessibility`);
        const testUrl = `https://gateway.lighthouse.storage/ipfs/${attestationData.ipfsCid}`;
        const axios = require('axios');
        const metadataResponse = await axios.get(testUrl, { timeout: 5000 });
        console.log(`DEBUG: Pre-mint metadata verification successful. Status: ${metadataResponse.status}`);
        console.log(`DEBUG: Response contains name field: ${metadataResponse.data.name ? 'yes' : 'no'}`);
      } catch (verifyError) {
        console.warn(`DEBUG: Pre-mint metadata verification failed: ${verifyError.message}`);
        // Continue with minting despite the error - this is just diagnostic
      }
      
      const mintReceipt = await mintNFT(nftChainKey, walletAddress, globalId, attestationData.ipfsCid);
      
      if (mintReceipt.status === 'failed') {
        console.error(`NFT minting failed: ${mintReceipt.error}`);
        await nftClient.query('ROLLBACK');
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
      
      const nftResult = await nftClient.query(updateQuery, [
        mintReceipt.transactionHash,
        JSON.stringify(mintReceipt),
        globalId
      ]);
      
      // Update the NFT record
      nftRecord = nftResult.rows[0];
      
      // Commit the transaction
      await nftClient.query('COMMIT');
    } catch (txError) {
      // Release the client back to the pool on error
      if (nftClient) {
        await nftClient.query('ROLLBACK');
      }
      throw txError;
    } finally {
      nftClient.release();
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
   * GET /research/:taxon_id
   * Get research data for a specific species
   */
  router.get('/:taxon_id', async (req, res) => {
    try {
      const { taxon_id } = req.params;
      
      // Query species table for only AI fields for given taxon_id
      const query = `
        SELECT 
          taxon_id,
          species_scientific_name,
          conservation_status_ai,
          general_description_ai,
          habitat_ai,
          elevation_ranges_ai,
          compatible_soil_types_ai,
          ecological_function_ai,
          native_adapted_habitats_ai,
          agroforestry_use_cases_ai,
          growth_form_ai,
          leaf_type_ai,
          deciduous_evergreen_ai,
          flower_color_ai,
          fruit_type_ai,
          bark_characteristics_ai,
          maximum_height_ai,
          maximum_diameter_ai,
          lifespan_ai,
          maximum_tree_age_ai,
          stewardship_best_practices_ai,
          planting_recipes_ai,
          pruning_maintenance_ai,
          disease_pest_management_ai,
          fire_management_ai,
          cultural_significance_ai
        FROM species
        WHERE taxon_id = $1
      `;
      
      const result = await pool.query(query, [taxon_id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ 
          error: 'Species not found', 
          taxon_id 
        });
      }
      
      const speciesData = result.rows[0];
      
      // Check for research status in the queue
      const queueQuery = `
        SELECT research_status, error_message, updated_at
        FROM species_research_queue 
        WHERE taxon_id = $1
      `;
      
      const queueResult = await pool.query(queueQuery, [taxon_id]);
      
      // If in queue, include the status
      if (queueResult.rows.length > 0) {
        speciesData.research_queue_status = queueResult.rows[0].research_status;
        speciesData.research_updated_at = queueResult.rows[0].updated_at;
        
        // If still being researched, return that info
        if (['queued', 'processing'].includes(queueResult.rows[0].research_status)) {
          return res.json({
            ...speciesData,
            researching: true,
            message: `Research is ${queueResult.rows[0].research_status}. Check back soon!`,
          });
        }
      }
      
      // Check if species has been researched
      // In the updated API, a species is considered researched if it has data in the AI fields
      // We check the presence of critical fields
      const criticalFields = [
        'general_description_ai',
        'ecological_function_ai',
        'habitat_ai'
      ];
      
      let hasResearch = true;
      for (const field of criticalFields) {
        if (!speciesData[field] || speciesData[field].trim() === '') {
          hasResearch = false;
          break;
        }
      }
      
      if (!hasResearch) {
        return res.status(404).json({ 
          error: 'Research not found', 
          message: 'This species has not been researched yet',
          taxon_id 
        });
      }
      
      // Return the data
      res.json(speciesData);
    } catch (error) {
      console.error('Error getting research data:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * POST /research/fund-research
   * Fund research for a species by wallet address
   */
  router.post('/fund-research', async (req, res) => {
    try {
      const { taxon_id, wallet_address, chain, transaction_hash, scientific_name, common_name } = req.body;
      
      console.log(`Received fund-research request for taxon_id=${taxon_id}, wallet=${wallet_address}, chain=${chain}`);
      
      if (!taxon_id || !wallet_address || !chain) {
        return res.status(400).json({ 
          error: 'Missing required fields', 
          required: ['taxon_id', 'wallet_address', 'chain', 'transaction_hash'] 
        });
      }
      
      // Get the species data if transaction hash is provided
      // This can be a background process initiated by frontend or by monitoring
      const processResult = await performResearch(
        pool, 
        taxon_id,
        wallet_address,
        chain,
        transaction_hash || '0x0',  // Allow empty tx hash for testing
        scientific_name,
        common_name
      );
      
      res.json({
        success: true,
        message: 'Research process completed successfully',
        ...processResult
      });
    } catch (error) {
      console.error('Error funding research:', error);
      res.status(500).json({ error: error.message });
    }
  });
  
  /**
   * GET /research/queue/status
   * Get status of the research queue
   */
  router.get('/queue/status', async (req, res) => {
    try {
      // Get queue statistics
      const stats = await pool.query(`
        SELECT 
          research_status, 
          COUNT(*) as count
        FROM species_research_queue
        GROUP BY research_status
      `);
      
      // Get in-progress items
      const inProgress = await pool.query(`
        SELECT 
          taxon_id, 
          species_scientific_name, 
          research_status, 
          added_at, 
          updated_at
        FROM species_research_queue
        WHERE research_status IN ('queued', 'processing')
        ORDER BY added_at ASC
      `);
      
      // Get memory queue status
      const memoryQueueStatus = researchQueue.getStatus();
      
      res.json({
        stats: stats.rows,
        in_progress: inProgress.rows,
        memory_queue: memoryQueueStatus
      });
    } catch (error) {
      console.error('Error getting queue status:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Return both the router and the standalone performResearch function
  return {
    router,
    performResearch
  };
};