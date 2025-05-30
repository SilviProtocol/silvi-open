// Database field check script
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { Pool } = require('pg');

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkDatabaseFields() {
  try {
    console.log('Checking database fields for stewardship data...');
    
    // Get taxon_id from command line or use default test taxon
    const taxonId = process.argv[2] || 'AngNAParc36603-00';
    
    console.log(`Checking species record for taxon_id: ${taxonId}`);
    
    // Query the database for all fields
    const query = `
      SELECT 
        taxon_id,
        species_scientific_name,
        researched,
        stewardship_best_practices,
        stewardship_best_practices_ai,
        stewardship_best_practices_human,
        planting_recipes,
        planting_recipes_ai,
        planting_recipes_human,
        pruning_maintenance,
        pruning_maintenance_ai,
        pruning_maintenance_human,
        disease_pest_management,
        disease_pest_management_ai,
        disease_pest_management_human,
        fire_management,
        fire_management_ai,
        fire_management_human,
        cultural_significance,
        cultural_significance_ai,
        cultural_significance_human,
        ipfs_cid
      FROM species 
      WHERE taxon_id = $1
    `;
    
    const result = await pool.query(query, [taxonId]);
    
    if (result.rows.length === 0) {
      console.error(`No record found for taxon_id: ${taxonId}`);
      return;
    }
    
    const species = result.rows[0];
    console.log(`\nResults for ${species.species_scientific_name} (${taxonId}):`);
    
    // Check researched flag
    console.log(`\nResearched status: ${species.researched ? 'YES' : 'NO'}`);
    
    // Check IPFS CID
    console.log(`IPFS CID: ${species.ipfs_cid || 'Not set'}`);
    
    // Check all stewardship fields
    console.log('\n=== STEWARDSHIP FIELDS CHECK ===');
    const fieldsToCheck = [
      'stewardship_best_practices',
      'planting_recipes',
      'pruning_maintenance',
      'disease_pest_management',
      'fire_management',
      'cultural_significance'
    ];
    
    let hasAnyStewFields = false;
    let hasAnyStewAiFields = false;
    
    fieldsToCheck.forEach(baseField => {
      const aiField = `${baseField}_ai`;
      const humanField = `${baseField}_human`;
      
      // Check if fields have content
      const baseContent = !!species[baseField];
      const aiContent = !!species[aiField];
      const humanContent = !!species[humanField];
      
      console.log(`\n${baseField.toUpperCase()}:`);
      console.log(`  Base field: ${baseContent ? 'PRESENT' : 'EMPTY'}`);
      console.log(`  AI field: ${aiContent ? 'PRESENT' : 'EMPTY'}`);
      console.log(`  Human field: ${humanContent ? 'PRESENT' : 'EMPTY'}`);
      
      if (aiContent) {
        console.log(`  Sample AI content: ${species[aiField].substring(0, 50)}...`);
        hasAnyStewAiFields = true;
      }
      
      if (baseContent) {
        hasAnyStewFields = true;
      }
    });
    
    console.log('\n=== SUMMARY ===');
    console.log(`Any base stewardship fields present: ${hasAnyStewFields ? 'YES' : 'NO'}`);
    console.log(`Any AI stewardship fields present: ${hasAnyStewAiFields ? 'YES' : 'NO'}`);
    
    console.log('\nDIAGNOSIS:');
    if (!hasAnyStewAiFields) {
      console.log('❌ AI stewardship fields are NOT being saved to the database.');
      console.log('   This is likely the root cause of missing stewardship fields in IPFS.');
    } else if (!hasAnyStewFields) {
      console.log('⚠️ Base stewardship fields are missing, but AI fields are present.');
      console.log('   The fix needs to ensure AI field data is copied to base fields for IPFS.');
    } else {
      console.log('✅ Both base and AI stewardship fields are present in the database.');
      console.log('   Focus on ensuring they are included in the IPFS upload process.');
    }
    
  } catch (error) {
    console.error('Error checking database fields:', error);
  } finally {
    // Close the pool when done
    pool.end();
  }
}

checkDatabaseFields();