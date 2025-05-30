// Script to reset incorrectly set researched flags
// This will set researched=FALSE for all species without AI content

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function resetResearchedFlags() {
  try {
    console.log('Connecting to database...');
    
    // Use the DATABASE_URL from .env or specify directly
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgres://tree_user:Kj9mPx7vLq2wZn4t@localhost:5432/treekipedia',
    });
    
    // First, check how many species are incorrectly marked as researched
    console.log('Checking current state of researched flags...');
    const checkQuery = `
      SELECT
        COUNT(*) as total_marked_as_researched,
        COUNT(*) FILTER (WHERE general_description_ai IS NULL OR general_description_ai = '') as without_ai_description
      FROM species
      WHERE researched = TRUE;
    `;
    
    const checkResult = await pool.query(checkQuery);
    console.log('Current state:', checkResult.rows[0]);
    
    // Reset the researched flag to FALSE for all species without AI data
    console.log('Resetting researched flags for species without AI data...');
    const updateQuery = `
      UPDATE species
      SET researched = FALSE
      WHERE researched = TRUE
      AND (
        general_description_ai IS NULL OR general_description_ai = ''
      )
      AND (
        habitat_ai IS NULL OR habitat_ai = ''
      )
      AND (
        ecological_function_ai IS NULL OR ecological_function_ai = ''
      )
      AND (
        stewardship_best_practices_ai IS NULL OR stewardship_best_practices_ai = ''
      );
    `;
    
    const updateResult = await pool.query(updateQuery);
    console.log(`Updated ${updateResult.rowCount} rows, setting researched=FALSE`);
    
    // Show the results after the update
    console.log('Checking final state of researched flags...');
    const finalQuery = `
      SELECT 
        COUNT(*) as total_species,
        COUNT(*) FILTER (WHERE researched = TRUE) as researched_species,
        COUNT(*) FILTER (WHERE general_description_ai IS NOT NULL AND general_description_ai != '') as has_ai_description,
        COUNT(*) FILTER (WHERE habitat_ai IS NOT NULL AND habitat_ai != '') as has_ai_habitat,
        COUNT(*) FILTER (WHERE stewardship_best_practices_ai IS NOT NULL AND stewardship_best_practices_ai != '') as has_ai_stewardship
      FROM species;
    `;
    
    const finalResult = await pool.query(finalQuery);
    console.log('Final state:', finalResult.rows[0]);
    
    // Check specific species as an example
    const specificQuery = `
      SELECT taxon_id, researched, general_description_ai FROM species 
      WHERE taxon_id = 'AngMaFaFb0265-00';
    `;
    
    const specificResult = await pool.query(specificQuery);
    if (specificResult.rows.length > 0) {
      console.log('Example species AngMaFaFb0265-00:', specificResult.rows[0]);
    }
    
    console.log('Done!');
    await pool.end();
    
  } catch (error) {
    console.error('Error updating researched flags:', error);
  }
}

resetResearchedFlags();