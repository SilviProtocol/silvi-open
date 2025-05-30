/**
 * Script to process incomplete sponsorships
 * 
 * This script finds sponsorships with confirmed payment but incomplete research
 * and manually triggers the research process for each one.
 */
require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Correct way to import the performResearch function
const researchController = require('../backend/controllers/research')(pool);
const performResearch = researchController.performResearch;

async function processIncompleteSponshorships() {
  console.log('Starting to process incomplete sponsorships...');
  
  try {
    // Get all confirmed sponsorships with incomplete research
    const query = `
      SELECT s.id, s.wallet_address, s.transaction_hash, s.chain, 
             si.taxon_id, si.research_status, si.id as item_id,
             sp.species_scientific_name, sp.common_name
      FROM sponsorships s
      JOIN sponsorship_items si ON s.id = si.sponsorship_id
      JOIN species sp ON si.taxon_id = sp.taxon_id
      WHERE s.status = 'confirmed' 
      AND si.research_status != 'completed'
      ORDER BY s.id
    `;
    
    const result = await pool.query(query);
    
    if (result.rows.length === 0) {
      console.log('No incomplete sponsorships found.');
      return;
    }
    
    console.log(`Found ${result.rows.length} incomplete sponsorship items to process.`);
    
    // Process each incomplete sponsorship
    for (const [index, item] of result.rows.entries()) {
      console.log(`\n[${index + 1}/${result.rows.length}] Processing sponsorship ID ${item.id}, item ID ${item.item_id}`);
      console.log(`Species: ${item.species_scientific_name} (${item.taxon_id})`);
      console.log(`Wallet: ${item.wallet_address}, Chain: ${item.chain}`);
      console.log(`Transaction: ${item.transaction_hash}`);
      
      try {
        // First, update the research status to ensure it's not stuck
        await pool.query(
          `UPDATE sponsorship_items SET research_status = 'pending' WHERE id = $1`,
          [item.item_id]
        );
        
        // Check species_research_queue and reset if needed
        const queueResult = await pool.query(
          `SELECT research_status FROM species_research_queue WHERE taxon_id = $1`,
          [item.taxon_id]
        );
        
        if (queueResult.rows.length > 0) {
          console.log(`Resetting queue status for ${item.taxon_id} from ${queueResult.rows[0].research_status} to 'pending'`);
          await pool.query(
            `UPDATE species_research_queue SET research_status = 'pending', updated_at = NOW() WHERE taxon_id = $1`,
            [item.taxon_id]
          );
        }
        
        console.log(`Triggering research process for ${item.taxon_id}...`);
        
        // Call the performResearch function to process the item
        const result = await performResearch(
          pool,
          item.taxon_id,
          item.wallet_address,
          item.chain,
          item.transaction_hash,
          item.species_scientific_name,
          item.common_name
        );
        
        console.log(`Research process completed successfully for ${item.taxon_id}`);
        console.log(`IPFS CID: ${result.ipfs_cid}`);
        console.log(`Attestation UID: ${result.attestation_uid}`);
        
        // Wait a bit between items to not overload APIs
        if (index < result.rows.length - 1) {
          console.log('Waiting 5 seconds before processing the next item...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      } catch (error) {
        console.error(`Error processing ${item.taxon_id}:`, error.message);
        console.log('Continuing with next item...');
      }
    }
    
    console.log('\nAll incomplete sponsorships have been processed.');
    
  } catch (error) {
    console.error('Error in processIncompleteSponshorships:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the script
processIncompleteSponshorships().catch(console.error);