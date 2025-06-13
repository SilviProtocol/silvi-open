/**
 * One-time script to fix migrated species data
 * 
 * This script:
 * 1. Sets researched=TRUE for any species with legacy field data
 * 2. Migrates data from legacy fields to _ai fields if they exist
 */

// Configuration
require('dotenv').config();
const { Pool } = require('pg');

// Create a connection pool to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/treekipedia',
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Field mappings from legacy to AI fields
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

async function fixMigratedSpecies() {
  // Get the client from the pool
  const client = await pool.connect();
  
  try {
    // Start a transaction
    await client.query('BEGIN');
    
    // Step 1: Mark species with legacy fields as researched
    const markResearchedQuery = `
      UPDATE species
      SET researched = TRUE
      WHERE researched = FALSE AND (
        general_description IS NOT NULL AND general_description != '' OR
        habitat IS NOT NULL AND habitat != '' OR
        ecological_function IS NOT NULL AND ecological_function != ''
      )
      RETURNING taxon_id;
    `;
    
    const markedSpecies = await client.query(markResearchedQuery);
    console.log(`Marked ${markedSpecies.rowCount} species as researched`);
    
    // Step 2: Migrate data from legacy fields to _ai fields
    // Find species with legacy fields but no _ai fields
    const speciesToMigrateQuery = `
      SELECT taxon_id 
      FROM species
      WHERE 
        (general_description IS NOT NULL AND general_description != '' AND
         (general_description_ai IS NULL OR general_description_ai = ''))
        OR
        (habitat IS NOT NULL AND habitat != '' AND
         (habitat_ai IS NULL OR habitat_ai = ''))
        OR
        (ecological_function IS NOT NULL AND ecological_function != '' AND
         (ecological_function_ai IS NULL OR ecological_function_ai = ''))
      LIMIT 100;
    `;
    
    const speciesToMigrate = await client.query(speciesToMigrateQuery);
    console.log(`Found ${speciesToMigrate.rowCount} species to migrate`);
    
    // Process each species
    for (const row of speciesToMigrate.rows) {
      const taxonId = row.taxon_id;
      console.log(`\nMigrating species ${taxonId}`);
      
      // Get the species data
      const speciesQuery = `SELECT * FROM species WHERE taxon_id = $1;`;
      const speciesResult = await client.query(speciesQuery, [taxonId]);
      const species = speciesResult.rows[0];
      
      // Build update query
      const updateFields = [];
      const updateValues = [];
      let paramCounter = 1;
      
      for (const [legacyField, aiField] of fieldMappings) {
        if (species[legacyField] && (!species[aiField] || species[aiField] === '')) {
          updateFields.push(`${aiField} = $${paramCounter}`);
          updateValues.push(species[legacyField]);
          paramCounter++;
          console.log(`  Migrating ${legacyField} -> ${aiField}`);
        }
      }
      
      if (updateFields.length > 0) {
        // Also ensure researched=TRUE
        updateFields.push(`researched = TRUE`);
        
        // Add taxon_id as the last parameter
        updateValues.push(taxonId);
        
        const updateQuery = `
          UPDATE species
          SET ${updateFields.join(', ')}
          WHERE taxon_id = $${paramCounter}
        `;
        
        await client.query(updateQuery, updateValues);
        console.log(`  Updated ${updateFields.length} fields for species ${taxonId}`);
      } else {
        console.log(`  No fields to migrate for ${taxonId}`);
      }
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('\nMigration completed successfully!');
    
    // Show stats after migration
    const statsQuery = `
      SELECT 
        COUNT(*) AS total_species,
        COUNT(*) FILTER (WHERE researched = TRUE) AS researched_species,
        COUNT(*) FILTER (WHERE general_description_ai IS NOT NULL AND general_description_ai != '') AS with_description_ai,
        COUNT(*) FILTER (WHERE habitat_ai IS NOT NULL AND habitat_ai != '') AS with_habitat_ai,
        COUNT(*) FILTER (WHERE stewardship_best_practices_ai IS NOT NULL AND stewardship_best_practices_ai != '') AS with_stewardship_ai
      FROM species;
    `;
    
    const statsResult = await client.query(statsQuery);
    const stats = statsResult.rows[0];
    
    console.log('\nDatabase Stats:');
    console.log(`Total species: ${stats.total_species}`);
    console.log(`Researched species: ${stats.researched_species}`);
    console.log(`Species with AI description: ${stats.with_description_ai}`);
    console.log(`Species with AI habitat: ${stats.with_habitat_ai}`);
    console.log(`Species with AI stewardship: ${stats.with_stewardship_ai}`);
    
  } catch (err) {
    // Rollback the transaction in case of any errors
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
  } finally {
    // Release the client back to the pool
    client.release();
    pool.end();
  }
}

// Run the migration
fixMigratedSpecies().catch(err => {
  console.error('Script error:', err);
  process.exit(1);
});