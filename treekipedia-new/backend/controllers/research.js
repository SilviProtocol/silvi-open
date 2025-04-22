const express = require('express');
const { ethers } = require('ethers');
const { performAIResearch } = require('../services/aiResearch');
const { uploadToIPFS, getFromIPFS } = require('../services/ipfs');
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
      if (!taxon_id || !wallet_address || !chain || !transaction_hash) {
        return res.status(400).json({ 
          error: 'Missing required fields', 
          required: ['taxon_id', 'wallet_address', 'chain', 'transaction_hash'] 
        });
      }

      // Validate chain choice - include both mainnet and testnet chains
      const validChains = [
        'base', 'celo', 'optimism', 'arbitrum',  // Mainnet chains
        'base-sepolia', 'celo-alfajores', 'optimism-sepolia', 'arbitrum-sepolia'  // Testnet chains
      ];
      if (!validChains.includes(chain)) {
        return res.status(400).json({ 
          error: 'Invalid chain selection', 
          valid_chains: validChains 
        });
      }

      // Get species information
      console.log("Querying species information for taxon_id:", taxon_id, "Type:", typeof taxon_id);
      
      // Validate taxon_id to ensure it's properly formatted
      if (!taxon_id || typeof taxon_id !== 'string') {
        console.error("Invalid taxon_id format:", taxon_id);
        return res.status(400).json({ error: 'Invalid taxon_id format', received: taxon_id });
      }
      
      // Logging additional debug info about the request
      console.log("REQUEST BODY:", req.body);
      console.log("HEADERS:", req.headers);
      
      const speciesQuery = `
        SELECT taxon_id, species, species_scientific_name, common_name, accepted_scientific_name 
        FROM species 
        WHERE taxon_id = $1
      `;
      
      // Execute the query with enhanced logging
      let speciesResult;
      try {
        console.log("Executing SQL query with params:", [taxon_id]);
        speciesResult = await pool.query(speciesQuery, [taxon_id]);
        console.log("Query result rows:", speciesResult.rows.length);
        console.log("Query result:", speciesResult.rows);
        
        // Additional check - if rows are empty, try to find by a more flexible search
        if (speciesResult.rows.length === 0) {
          console.log("No results found for exact taxon_id match. Trying to run diagnostic query...");
          
          // Run a diagnostic query to see if the taxon_id exists in different format
          const diagnosticQuery = `
            SELECT taxon_id, species_scientific_name
            FROM species
            WHERE taxon_id LIKE $1
            LIMIT 5
          `;
          const diagnosticResult = await pool.query(diagnosticQuery, [`%${taxon_id}%`]);
          console.log("Diagnostic query found similar taxon_ids:", diagnosticResult.rows);
        }
        
      } catch (queryError) {
        console.error("Error in species query:", queryError);
        throw queryError;
      }
      
      if (speciesResult.rows.length === 0) {
        console.error("Species not found for taxon_id:", taxon_id);
        return res.status(404).json({ error: 'Species not found', taxon_id: taxon_id });
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
      
      // IMPORTANT: Explicitly log the research data to verify it's formatting
      console.log(`Research complete. Result taxon_id: ${researchData.taxon_id}`);
      console.log(`Research data researched flag: ${researchData.researched}`);
      console.log('Research data field sample:', {
        general_description_ai: researchData.general_description_ai ? researchData.general_description_ai.substring(0, 50) + '...' : 'null',
        stewardship_best_practices_ai: researchData.stewardship_best_practices_ai ? researchData.stewardship_best_practices_ai.substring(0, 50) + '...' : 'null'
      });
      
      // CRITICAL: Force the researched flag to be set to true
      if (!researchData.researched) {
        console.log('WARNING: researched flag not set in researchData, explicitly setting it to TRUE');
        researchData.researched = true;
      }
      
      // Step 2: Update species table with research data (using the new AI fields)
      console.log('Updating species table with research data');
      
      // Add detailed debug logging for specific fields
      console.log('RESEARCH DATA FIELD VALUES:');
      console.log(`agroforestry_use_cases_ai: ${researchData.agroforestry_use_cases_ai ? 'PRESENT' : 'NULL'}`);
      console.log(`stewardship_best_practices_ai: ${researchData.stewardship_best_practices_ai ? 'PRESENT' : 'NULL'}`);
      
      // Check if taxon_id matches what's expected
      if (researchData.taxon_id !== taxon_id) {
        console.error(`WARNING: researchData.taxon_id (${researchData.taxon_id}) doesn't match request taxon_id (${taxon_id})`);
        // Ensure we're using the correct one
        console.log('Forcing correct taxon_id for database update');
        researchData.taxon_id = taxon_id;
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
          researched = TRUE,  /* Set researched flag to TRUE */
          updated_at = CURRENT_TIMESTAMP
        WHERE taxon_id = $26
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
        taxon_id
      ];
      
      const updateResult = await pool.query(updateQuery, updateValues);
      
      // Verify the update worked correctly
      if (updateResult.rowCount === 0) {
        console.error(`ERROR: Database update failed - no rows matched taxon_id=${taxon_id}`);
        throw new Error(`Species update failed: No matching record found with taxon_id=${taxon_id}`);
      } else {
        console.log(`SUCCESS: Species with taxon_id=${taxon_id} updated with AI research data fields`);
        
        // MIGRATION FIX: Check if any of the AI fields are still empty but legacy fields have data
        // This helps fix existing records where data might be in the wrong field
        const migrationCheck = await pool.query(`
          SELECT * FROM species WHERE taxon_id = $1
        `, [taxon_id]);
        
        if (migrationCheck.rows.length > 0) {
          const speciesRecord = migrationCheck.rows[0];
          const fieldUpdates = [];
          const fieldParams = [];
          let paramCounter = 1;
          
          // Check each legacy field and corresponding _ai field
          const fieldMappings = [
            ['general_description', 'general_description_ai'],
            ['habitat', 'habitat_ai'],
            ['elevation_ranges', 'elevation_ranges_ai'],
            ['compatible_soil_types', 'compatible_soil_types_ai'],
            ['ecological_function', 'ecological_function_ai'],
            ['native_adapted_habitats', 'native_adapted_habitats_ai'],
            ['agroforestry_use_cases', 'agroforestry_use_cases_ai'],
            ['growth_form', 'growth_form_ai'],
            ['leaf_type', 'leaf_type_ai'],
            ['deciduous_evergreen', 'deciduous_evergreen_ai'],
            ['flower_color', 'flower_color_ai'],
            ['fruit_type', 'fruit_type_ai'],
            ['bark_characteristics', 'bark_characteristics_ai'],
            ['stewardship_best_practices', 'stewardship_best_practices_ai'],
            ['planting_recipes', 'planting_recipes_ai'],
            ['pruning_maintenance', 'pruning_maintenance_ai'],
            ['disease_pest_management', 'disease_pest_management_ai'],
            ['fire_management', 'fire_management_ai'],
            ['cultural_significance', 'cultural_significance_ai'],
            ['conservation_status', 'conservation_status_ai']
          ];
          
          // Build SQL update for each field that needs migration
          for (const [baseField, aiField] of fieldMappings) {
            if (speciesRecord[baseField] && 
                (!speciesRecord[aiField] || speciesRecord[aiField] === '')) {
              console.log(`Migrating data from ${baseField} to ${aiField}`);
              fieldUpdates.push(`${aiField} = $${paramCounter}`);
              fieldParams.push(speciesRecord[baseField]);
              paramCounter++;
            }
          }
          
          // If we found fields to update, run the migration
          if (fieldUpdates.length > 0) {
            // Add taxon_id as the last parameter
            fieldParams.push(taxon_id);
            
            const migrationQuery = `
              UPDATE species
              SET ${fieldUpdates.join(', ')}
              WHERE taxon_id = $${paramCounter}
            `;
            
            console.log(`Running migration for ${fieldUpdates.length} fields`);
            const migrationResult = await pool.query(migrationQuery, fieldParams);
            console.log(`Migration complete: ${migrationResult.rowCount} row updated`);
          }
        }
      }
      
      // Begin transaction to allow rollback if needed
      const client = await pool.connect();
      
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
          species: scientificName,
          chain: chain,
          research_date: new Date().toISOString(),
          minting_status: 'pending'
        };
        
        const initialValues = [
          taxon_id,
          wallet_address,
          2, // Default points
          '', // Empty placeholder for ipfs_cid
          transaction_hash,
          JSON.stringify(prelimMetadata)
        ];
        
        // Insert record to get global_id
        const insertResult = await client.query(insertQuery, initialValues);
        const nftRecord = insertResult.rows[0];
        const globalId = nftRecord.global_id;
        
        console.log(`Generated global_id: ${globalId} for NFT minting`);
        
        // Step 4: Now that we have the global_id, format metadata and upload to IPFS
        console.log('Formatting metadata for NFT standards');
        
        // DETAILED DEBUG: Log ALL keys in the researchData object
        console.log('FULL RESEARCH DATA KEYS:', Object.keys(researchData).join(', '));
        
        // Log the presence and values of stewardship fields
        console.log('STEWARDSHIP FIELDS DETAILED CHECK:');
        console.log('- stewardship_best_practices_ai:', 
                    researchData.stewardship_best_practices_ai ? 
                    `PRESENT (${researchData.stewardship_best_practices_ai.substring(0, 50)}...)` : 
                    'MISSING');
        console.log('- planting_recipes_ai:', 
                    researchData.planting_recipes_ai ? 
                    `PRESENT (${researchData.planting_recipes_ai.substring(0, 50)}...)` : 
                    'MISSING');
        console.log('- pruning_maintenance_ai:', 
                    researchData.pruning_maintenance_ai ? 
                    `PRESENT (${researchData.pruning_maintenance_ai.substring(0, 50)}...)` : 
                    'MISSING');
        console.log('- disease_pest_management_ai:', 
                    researchData.disease_pest_management_ai ? 
                    `PRESENT (${researchData.disease_pest_management_ai.substring(0, 50)}...)` : 
                    'MISSING');
        console.log('- fire_management_ai:', 
                    researchData.fire_management_ai ? 
                    `PRESENT (${researchData.fire_management_ai.substring(0, 50)}...)` : 
                    'MISSING');
        console.log('- cultural_significance_ai:', 
                    researchData.cultural_significance_ai ? 
                    `PRESENT (${researchData.cultural_significance_ai.substring(0, 50)}...)` : 
                    'MISSING');
        
        // Create NFT metadata - in the NFT metadata, store the values with standard field names (no _ai suffix)
        // This is for user-friendliness in NFT viewers, while maintaining internal _ai/_human differentiation
        // REFACTORED & FIXED: Create metadata object with a cleaner approach and explicit field ordering
        // First create core NFT metadata fields
        let formattedData = {
          // NFT standard metadata (always first per standards)
          name: `Research Contreebution #${globalId}`,
          description: "Thank you for sponsoring tree research!",
          image: "ipfs://bafkreibkta2e54ddqjlrmxmacjvqcpj7w6o3a4oww6ea7hldjazio22c3e",
          
          // Core identification
          taxon_id: researchData.taxon_id,
          scientific_name: scientificName,
          
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

        // CRITICAL FIX: Add stewardship fields separately to ensure they appear in the metadata
        // This ensures the fields are explicitly added and properly serialized
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
        
        // Add metadata at the end
        formattedData.research_metadata = {
          researcher_wallet: wallet_address,
          research_date: new Date().toISOString(),
          research_method: "AI-assisted (Perplexity + GPT-4o)",
          verification_status: "unverified"
        };
        
        // Verify the final metadata object has the stewardship fields
        console.log('FINAL METADATA CHECK:');
        console.log('stewardship_best_practices field exists:', formattedData.hasOwnProperty('stewardship_best_practices'));
        console.log('planting_recipes field exists:', formattedData.hasOwnProperty('planting_recipes'));
        console.log('pruning_maintenance field exists:', formattedData.hasOwnProperty('pruning_maintenance'));
        
        // CRITICAL: Log the exact JSON that will be sent to IPFS
        const metadataJson = JSON.stringify(formattedData, null, 2);
        console.log('METADATA JSON KEYS:', Object.keys(JSON.parse(metadataJson)).join(', '));
        console.log('METADATA JSON CONTAINS STEWARDSHIP:', metadataJson.includes('stewardship_best_practices'));
        
        // CRITICAL FIX: Ensure stewardship fields are present by copying directly from researchData
        // This ensures even if database fields are empty, AI-generated fields are used
        console.log('CRITICAL STEWARDSHIP FIELDS CHECK:');
        
        // Check stewardship fields and fallback to researchData fields
        if (!formattedData.stewardship_best_practices && researchData.stewardship_best_practices_ai) {
          console.log('Adding missing stewardship_best_practices from AI data');
          formattedData.stewardship_best_practices = researchData.stewardship_best_practices_ai;
        }
        
        if (!formattedData.planting_recipes && researchData.planting_recipes_ai) {
          console.log('Adding missing planting_recipes from AI data');
          formattedData.planting_recipes = researchData.planting_recipes_ai;
        }
        
        if (!formattedData.pruning_maintenance && researchData.pruning_maintenance_ai) {
          console.log('Adding missing pruning_maintenance from AI data');
          formattedData.pruning_maintenance = researchData.pruning_maintenance_ai;
        }
        
        if (!formattedData.disease_pest_management && researchData.disease_pest_management_ai) {
          console.log('Adding missing disease_pest_management from AI data');
          formattedData.disease_pest_management = researchData.disease_pest_management_ai;
        }
        
        if (!formattedData.fire_management && researchData.fire_management_ai) {
          console.log('Adding missing fire_management from AI data');
          formattedData.fire_management = researchData.fire_management_ai;
        }
        
        if (!formattedData.cultural_significance && researchData.cultural_significance_ai) {
          console.log('Adding missing cultural_significance from AI data');
          formattedData.cultural_significance = researchData.cultural_significance_ai;
        }
        
        // Log stewardship field values to verify content
        if (formattedData.stewardship_best_practices) {
          console.log('Stewardship_best_practices content:', 
                     formattedData.stewardship_best_practices.substring(0, 50) + '...');
        } else {
          console.log('WARNING: stewardship_best_practices still MISSING after fix!');
        }
        
        // Keep metadata size reasonable by checking total size
        const metadataSize = JSON.stringify(formattedData).length;
        console.log(`Metadata size: ${metadataSize} bytes (${Math.round(metadataSize/1024)} KB)`);
        
        // If metadata is too large (>100KB), truncate very long text fields
        if (metadataSize > 100000) {
          console.log('Metadata is large, truncating long text fields');
          Object.keys(formattedData).forEach(key => {
            if (typeof formattedData[key] === 'string' && formattedData[key].length > 2000) {
              formattedData[key] = formattedData[key].substring(0, 2000) + '... (truncated)';
            }
          });
        }
        
        // Create a test object with ONLY the stewardship fields for verification
        const stFields = {
          stewardship_best_practices: formattedData.stewardship_best_practices,
          planting_recipes: formattedData.planting_recipes,
          pruning_maintenance: formattedData.pruning_maintenance
        };
        
        // Log the stringified version to check for JSON issues
        console.log('FINAL STEWARDSHIP FIELDS CHECK:', JSON.stringify(stFields));
        
        console.log('Uploading formatted metadata to IPFS');
        const ipfsCid = await uploadToIPFS(formattedData);
        console.log(`Metadata uploaded to IPFS with CID: ${ipfsCid}`);
        
        // Retrieve from IPFS to verify what was actually stored
        try {
          const retrievedData = await getFromIPFS(ipfsCid);
          console.log('IPFS retrieval test - keys in stored data:', Object.keys(retrievedData).join(', '));
          console.log('IPFS stored stewardship_best_practices?', retrievedData.hasOwnProperty('stewardship_best_practices'));
        } catch (e) {
          console.log('Failed to verify IPFS content:', e.message);
        }
        
        // Step 5: Update species table with ipfs_cid
        const updateSpeciesQuery = `
          UPDATE species
          SET ipfs_cid = $1
          WHERE taxon_id = $2
        `;
        await client.query(updateSpeciesQuery, [ipfsCid, taxon_id]);
        
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
        
        // Step 7: Create EAS attestation with the properly formatted IPFS CID
        console.log(`research.js Creating EAS attestation on ${chain}`);
        
        const attestationData = {
          species: scientificName,
          researcher: wallet_address,
          ipfsCid: ipfsCid,
          taxonId: taxon_id,
          refUID: ethers.ZeroHash // Always use ZeroHash for initial attestation
        };
        
        console.log('Attestation data prepared:', attestationData);
        
        const attestationUID = await createAttestation(chain, attestationData);
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
        
        // Step 8: Mint NFT with proper URI format
        console.log(`research.js Minting NFT on ${chain} with tokenId: ${globalId}`);
        const tokenURI = `ipfs://${attestationData.ipfsCid}`;
        
        const mintReceipt = await mintNFT(chain, wallet_address, globalId, attestationData.ipfsCid);
        
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
        species[key] !== undefined
      );
      
      if (!hasAnyResearchData) {
        return res.status(404).json({ 
          error: 'No research data available for this species',
          species_exists: true,
          taxon_id: taxon_id
        });
      }
      
      // Ensure researched is explicitly true and log a confirmation
      species.researched = true;
      console.log(`GET /research/${req.params.taxon_id} - Returning research data with researched=true`);
      
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