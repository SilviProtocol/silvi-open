#!/usr/bin/env node
/**
 * Re-link Images by Species Scientific Name
 * Updates image taxon_ids to match current species table using the original JSON mapping
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function relinkImages() {
  console.log('🔗 Re-linking images to current species taxon_ids...\n');

  try {
    // Step 1: Load the original images JSON
    console.log('Step 1: Loading original images JSON...');
    const jsonPath = path.join(__dirname, '../database/treekipedia_images_full.json');
    const imagesData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log(`✅ Loaded ${imagesData.length} image records\n`);

    // Step 2: Create a mapping of image_url -> species_scientific_name
    console.log('Step 2: Creating URL to species name mapping...');
    const urlToSpecies = new Map();
    imagesData.forEach(img => {
      urlToSpecies.set(img.image_url, img.species);
    });
    console.log(`✅ Created mapping for ${urlToSpecies.size} unique URLs\n`);

    // Step 3: Update species_scientific_name in images table
    console.log('Step 3: Updating species_scientific_name column...');

    let updated = 0;
    let notFound = 0;

    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get all images
      const { rows: images } = await client.query('SELECT id, image_url FROM images');

      for (const image of images) {
        const speciesName = urlToSpecies.get(image.image_url);
        if (speciesName) {
          await client.query(
            'UPDATE images SET species_scientific_name = $1 WHERE id = $2',
            [speciesName, image.id]
          );
          updated++;
        } else {
          notFound++;
        }

        if (updated % 1000 === 0) {
          console.log(`  Progress: ${updated} images updated...`);
        }
      }

      await client.query('COMMIT');
      console.log(`✅ Updated ${updated} images, ${notFound} not found in JSON\n`);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    // Step 4: Update taxon_ids to match current species table (species-level only)
    console.log('Step 4: Updating taxon_ids to match current species table...');

    const updateResult = await pool.query(`
      UPDATE images i
      SET taxon_id = s.taxon_id
      FROM species s
      WHERE i.species_scientific_name = s.species_scientific_name
        AND s.subspecies = 'NA'
    `);

    console.log(`✅ Updated ${updateResult.rowCount} image taxon_ids\n`);

    // Step 5: Verify results
    console.log('Step 5: Verifying re-linking results...');

    const stats = await pool.query(`
      SELECT
        COUNT(*) as total_images,
        COUNT(DISTINCT i.taxon_id) as unique_taxon_ids,
        COUNT(CASE WHEN s.taxon_id IS NOT NULL THEN 1 END) as matched_to_species,
        COUNT(CASE WHEN s.taxon_id IS NULL THEN 1 END) as unmatched
      FROM images i
      LEFT JOIN species s ON i.taxon_id = s.taxon_id
    `);

    console.log('📊 Final Results:');
    console.log(`  Total images: ${stats.rows[0].total_images}`);
    console.log(`  Unique taxon_ids: ${stats.rows[0].unique_taxon_ids}`);
    console.log(`  Matched to species: ${stats.rows[0].matched_to_species}`);
    console.log(`  Unmatched: ${stats.rows[0].unmatched}`);

    const matchRate = ((stats.rows[0].matched_to_species / stats.rows[0].total_images) * 100).toFixed(1);
    console.log(`\n✅ Match rate: ${matchRate}%`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

relinkImages().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
