const { performAIResearch } = require('./services/aiResearch');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Setup database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testResearchProcess() {
  const taxonId = 'AngMaFaFb48996-00';
  const scientificName = 'Malpighia faginea';
  const commonName = 'Chaparro';
  const walletAddress = '0x1234567890123456789012345678901234567890';

  try {
    console.log('======== TEST RESEARCH PROCESS ========');
    // Step 1: Check if species exists
    console.log(`\n1. Checking if species ${taxonId} exists in database...`);
    const speciesQuery = 'SELECT taxon_id, species_scientific_name, researched FROM species WHERE taxon_id = $1';
    const speciesResult = await pool.query(speciesQuery, [taxonId]);
    
    if (speciesResult.rows.length === 0) {
      console.error(`Species ${taxonId} not found in database`);
      return;
    }
    
    console.log(`Found species: ${JSON.stringify(speciesResult.rows[0])}`);
    console.log(`Initial researched status: ${speciesResult.rows[0].researched}`);

    // Step 2: Perform AI Research
    console.log('\n2. Performing AI research...');
    const researchData = await performAIResearch(
      taxonId,
      scientificName,
      commonName,
      walletAddress
    );
    
    console.log(`Research complete. Result taxon_id: ${researchData.taxon_id}`);
    console.log(`Research data contains researched flag: ${researchData.researched}`);
    console.log(`Research data sample fields:`, {
      general_description_ai: researchData.general_description_ai ? 
        researchData.general_description_ai.substring(0, 50) + '...' : 'null',
      conservation_status_ai: researchData.conservation_status_ai
    });

    // Step 3: Update species record
    console.log('\n3. Updating species record with research data...');
    console.log(`Using taxon_id: ${taxonId}`);
    
    // CRITICAL: Print out the data we're trying to store
    console.log('Conservation status length:', researchData.conservation_status_ai ? researchData.conservation_status_ai.length : 0);
    console.log('Growth form length:', researchData.growth_form_ai ? researchData.growth_form_ai.length : 0);
    
    const updateQuery = `
      UPDATE species
      SET 
        conservation_status_ai = $1,
        general_description_ai = $2,
        habitat_ai = $3,
        elevation_ranges_ai = $4,
        compatible_soil_types_ai = $5,
        ecological_function_ai = $6,
        native_adapted_habitats_ai = $7,
        agroforestry_use_cases_ai = $8,
        growth_form_ai = $9,
        leaf_type_ai = $10,
        deciduous_evergreen_ai = $11,
        flower_color_ai = $12,
        fruit_type_ai = $13,
        bark_characteristics_ai = $14,
        maximum_height_ai = NULLIF($15, '')::NUMERIC,
        maximum_diameter_ai = NULLIF($16, '')::NUMERIC,
        lifespan_ai = $17,
        maximum_tree_age_ai = NULLIF($18, '')::INTEGER,
        stewardship_best_practices_ai = $19,
        planting_recipes_ai = $20,
        pruning_maintenance_ai = $21,
        disease_pest_management_ai = $22,
        fire_management_ai = $23,
        cultural_significance_ai = $24,
        researched = TRUE, /* EXPLICITLY setting researched flag to TRUE */
        updated_at = CURRENT_TIMESTAMP
      WHERE taxon_id = $25
      RETURNING researched, taxon_id
    `;
    
    const updateValues = [
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
      console.error(`ERROR: Database update failed - no rows matched taxon_id=${taxonId}`);
    } else {
      console.log(`SUCCESS: Species with taxon_id=${taxonId} updated with AI research data`);
      console.log(`Updated record:`, updateResult.rows[0]);
    }

    // Step 4: Verify the update
    console.log('\n4. Verifying database update...');
    const verifyQuery = 'SELECT taxon_id, researched, general_description_ai FROM species WHERE taxon_id = $1';
    const verifyResult = await pool.query(verifyQuery, [taxonId]);
    
    if (verifyResult.rows.length > 0) {
      const verifiedRecord = verifyResult.rows[0];
      console.log(`Verification Result:`);
      console.log(`  taxon_id: ${verifiedRecord.taxon_id}`);
      console.log(`  researched: ${verifiedRecord.researched}`);
      console.log(`  general_description_ai: ${verifiedRecord.general_description_ai ? 
        verifiedRecord.general_description_ai.substring(0, 50) + '...' : 'null'}`);
    } else {
      console.error(`ERROR: Could not verify the update - species record not found after update!`);
    }

  } catch (error) {
    console.error('Error during research test process:', error);
  } finally {
    await pool.end();
  }
}

testResearchProcess().catch(console.error);