#!/usr/bin/env node
/**
 * Re-link Images Script for Treekipedia
 * Updates image taxon_ids to match current species table structure
 *
 * Problem: Images were imported with old taxon_ids that no longer exist
 * Solution: Add species_scientific_name column and re-link by scientific name
 */

const { Pool } = require('pg');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function relinkImages() {
  console.log('🔗 Starting image re-linking process...\n');

  try {
    // Step 1: Add species_scientific_name column if it doesn't exist
    console.log('Step 1: Adding species_scientific_name column to images table...');
    await pool.query(`
      ALTER TABLE images
      ADD COLUMN IF NOT EXISTS species_scientific_name VARCHAR(255)
    `);
    console.log('✅ Column added\n');

    // Step 2: Create a temporary mapping table from old taxon_ids to species names
    console.log('Step 2: Finding species names for existing image taxon_ids...');

    // First, let's see if we can extract the species info from somewhere
    // We'll need to check if there's a backup or if we need to parse from URLs
    const sampleResult = await pool.query(`
      SELECT taxon_id, image_url, photographer
      FROM images
      LIMIT 5
    `);

    console.log('Sample images:', sampleResult.rows);

    // Step 3: Check what data we have to work with
    const statsQuery = await pool.query(`
      SELECT
        COUNT(*) as total_images,
        COUNT(DISTINCT taxon_id) as unique_old_taxon_ids
      FROM images
    `);

    console.log('\n📊 Current state:');
    console.log(`  Total images: ${statsQuery.rows[0].total_images}`);
    console.log(`  Unique old taxon_ids: ${statsQuery.rows[0].unique_old_taxon_ids}`);

    console.log('\n⚠️  We need the original species data that matched these taxon_ids.');
    console.log('   Do you have a backup of the species table from before the v9 import?');
    console.log('   Or the original JSON file with species names?');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the script
relinkImages().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
