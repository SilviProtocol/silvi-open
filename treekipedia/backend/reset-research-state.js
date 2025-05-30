// Reset the research state for a specific species
// Usage: node reset-research-state.js [taxon_id]

const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Setup database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function resetResearchState() {
  const taxonId = process.argv[2];
  
  if (!taxonId) {
    console.error('Error: Please provide a taxon_id as an argument');
    console.log('Usage: node reset-research-state.js [taxon_id]');
    return;
  }
  
  try {
    console.log(`Resetting research state for taxon_id: ${taxonId}`);
    
    // First check if the species exists
    const checkQuery = 'SELECT taxon_id, researched FROM species WHERE taxon_id = $1';
    const checkResult = await pool.query(checkQuery, [taxonId]);
    
    if (checkResult.rows.length === 0) {
      console.error(`Error: Species with taxon_id ${taxonId} not found`);
      return;
    }
    
    console.log(`Current state: ${JSON.stringify(checkResult.rows[0])}`);
    
    // Reset all AI fields and the researched flag
    const resetQuery = `
      UPDATE species
      SET 
        conservation_status_ai = NULL,
        general_description_ai = NULL,
        habitat_ai = NULL,
        elevation_ranges_ai = NULL,
        compatible_soil_types_ai = NULL,
        ecological_function_ai = NULL,
        native_adapted_habitats_ai = NULL,
        agroforestry_use_cases_ai = NULL,
        growth_form_ai = NULL,
        leaf_type_ai = NULL,
        deciduous_evergreen_ai = NULL,
        flower_color_ai = NULL,
        fruit_type_ai = NULL,
        bark_characteristics_ai = NULL,
        maximum_height_ai = NULL,
        maximum_diameter_ai = NULL,
        lifespan_ai = NULL,
        maximum_tree_age_ai = NULL,
        stewardship_best_practices_ai = NULL,
        planting_recipes_ai = NULL,
        pruning_maintenance_ai = NULL,
        disease_pest_management_ai = NULL,
        fire_management_ai = NULL,
        cultural_significance_ai = NULL,
        researched = FALSE,
        updated_at = CURRENT_TIMESTAMP
      WHERE taxon_id = $1
      RETURNING taxon_id, researched
    `;
    
    const resetResult = await pool.query(resetQuery, [taxonId]);
    
    if (resetResult.rows.length > 0) {
      console.log(`Success! New state: ${JSON.stringify(resetResult.rows[0])}`);
    } else {
      console.error(`Error: Failed to reset research state for taxon_id ${taxonId}`);
    }
  } catch (error) {
    console.error('Error resetting research state:', error);
  } finally {
    await pool.end();
  }
}

resetResearchState().catch(console.error);