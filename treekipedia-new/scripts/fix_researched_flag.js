/**
 * Script to fix the researched flag for all species with AI data
 */
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Create database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/treekipedia',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixResearchedFlag() {
  try {
    console.log('Connecting to database...');
    const client = await pool.connect();
    
    try {
      console.log('Setting researched=TRUE for species with AI fields...');
      
      // Start transaction
      await client.query('BEGIN');
      
      // Set researched=TRUE for species with AI content
      const updateAiQuery = `
        UPDATE species
        SET researched = TRUE
        WHERE (
          general_description_ai IS NOT NULL AND general_description_ai != '' OR
          ecological_function_ai IS NOT NULL AND ecological_function_ai != '' OR
          habitat_ai IS NOT NULL AND habitat_ai != '' OR
          stewardship_best_practices_ai IS NOT NULL AND stewardship_best_practices_ai != '' OR
          compatible_soil_types_ai IS NOT NULL AND compatible_soil_types_ai != '' OR
          growth_form_ai IS NOT NULL AND growth_form_ai != ''
        ) AND (researched IS NULL OR researched = FALSE)
        RETURNING taxon_id;
      `;
      
      const updateResult = await client.query(updateAiQuery);
      console.log(`Updated ${updateResult.rowCount} species to researched=TRUE`);
      
      // Get a report of all species with researched status
      const statsQuery = `
        SELECT 
          COUNT(*) as total_species,
          COUNT(*) FILTER (WHERE researched = TRUE) as researched_species,
          COUNT(*) FILTER (WHERE general_description_ai IS NOT NULL AND general_description_ai != '') as has_description,
          COUNT(*) FILTER (WHERE habitat_ai IS NOT NULL AND habitat_ai != '') as has_habitat,
          COUNT(*) FILTER (WHERE stewardship_best_practices_ai IS NOT NULL AND stewardship_best_practices_ai != '') as has_stewardship
        FROM species;
      `;
      
      const statsResult = await client.query(statsQuery);
      const stats = statsResult.rows[0];
      
      console.log('\nDatabase Statistics:');
      console.log(`Total species: ${stats.total_species}`);
      console.log(`Researched species: ${stats.researched_species}`);
      console.log(`Species with AI description: ${stats.has_description}`);
      console.log(`Species with AI habitat: ${stats.has_habitat}`);
      console.log(`Species with AI stewardship: ${stats.has_stewardship}`);
      
      // Check the specific species we were investigating
      const targetQuery = `
        SELECT taxon_id, species_scientific_name, researched, 
               (general_description_ai IS NOT NULL AND general_description_ai != '') as has_description,
               (habitat_ai IS NOT NULL AND habitat_ai != '') as has_habitat,
               (stewardship_best_practices_ai IS NOT NULL AND stewardship_best_practices_ai != '') as has_stewardship
        FROM species
        WHERE taxon_id = 'AngNAParc36603-00';
      `;
      
      const targetResult = await client.query(targetQuery);
      console.log('\nSpecific Species Check:');
      console.log(targetResult.rows[0]);
      
      // Commit the changes
      await client.query('COMMIT');
      console.log('\nChanges committed successfully.');
      
    } catch (err) {
      // Rollback on error
      await client.query('ROLLBACK');
      console.error('Error executing queries:', err);
    } finally {
      // Release the client
      client.release();
    }
  } catch (err) {
    console.error('Database connection error:', err);
  } finally {
    // End the pool
    await pool.end();
    console.log('Database connection closed.');
  }
}

// Run the script
console.log('Starting researched flag fix script...');
fixResearchedFlag().catch(err => {
  console.error('Error running script:', err);
  process.exit(1);
});