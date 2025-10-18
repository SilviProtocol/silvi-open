#!/usr/bin/env node
/**
 * Re-link Images by Extracting Species Names from URLs
 * Extracts species scientific names from Wikimedia Commons URLs and re-links to current taxon_ids
 */

const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

/**
 * Extract species name from Wikimedia Commons URL
 * Pattern: First two words after last / (genus + species epithet)
 * Example: .../Eucalyptus_spathulata.JPG -> Eucalyptus spathulata
 */
function extractSpeciesNameFromUrl(url) {
  try {
    // Get the filename part after last /
    const filename = url.split('/').pop();

    // Remove file extension
    const nameWithoutExt = filename.replace(/\.(jpg|jpeg|png|gif|webp|JPG|JPEG|PNG|GIF|WEBP)$/i, '');

    // Replace underscores with spaces
    const withSpaces = nameWithoutExt.replace(/_/g, ' ');

    // Extract first two words (genus + species)
    const parts = withSpaces.split(/\s+/);

    if (parts.length >= 2) {
      const genus = parts[0];
      const species = parts[1];

      // Basic validation: genus should start with capital, species with lowercase
      if (/^[A-Z][a-z]+$/.test(genus) && /^[a-z]+$/.test(species)) {
        return `${genus} ${species}`;
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

async function relinkImages() {
  console.log('🔗 Re-linking images by extracting species names from URLs...\n');

  try {
    // Step 1: Get all images and extract species names
    console.log('Step 1: Extracting species names from image URLs...');

    const { rows: images } = await pool.query('SELECT id, image_url, taxon_id FROM images');
    console.log(`  Processing ${images.length} images...\n`);

    let extracted = 0;
    let failed = 0;
    const updates = [];

    for (const image of images) {
      const speciesName = extractSpeciesNameFromUrl(image.image_url);

      if (speciesName) {
        updates.push({ id: image.id, species: speciesName });
        extracted++;
      } else {
        failed++;
      }
    }

    console.log(`✅ Extracted ${extracted} species names`);
    console.log(`❌ Failed to extract ${failed} species names\n`);

    // Show some examples
    console.log('Sample extractions:');
    updates.slice(0, 10).forEach(u => {
      console.log(`  ${u.species}`);
    });
    console.log('');

    // Step 2: Update species_scientific_name in database
    console.log('Step 2: Updating species_scientific_name in database...');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const update of updates) {
        await client.query(
          'UPDATE images SET species_scientific_name = $1 WHERE id = $2',
          [update.species, update.id]
        );
      }

      await client.query('COMMIT');
      console.log(`✅ Updated ${updates.length} records\n`);

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    // Step 3: Match to current species table
    console.log('Step 3: Matching species names to current species table...');

    const matchStats = await pool.query(`
      SELECT
        COUNT(DISTINCT i.species_scientific_name) as unique_extracted_species,
        COUNT(DISTINCT CASE WHEN s.taxon_id IS NOT NULL THEN i.species_scientific_name END) as matched_species,
        COUNT(DISTINCT CASE WHEN s.taxon_id IS NULL THEN i.species_scientific_name END) as unmatched_species
      FROM images i
      LEFT JOIN species s ON i.species_scientific_name = s.species_scientific_name
      WHERE i.species_scientific_name IS NOT NULL
    `);

    console.log('Match statistics:');
    console.log(`  Unique extracted species: ${matchStats.rows[0].unique_extracted_species}`);
    console.log(`  Matched to species table: ${matchStats.rows[0].matched_species}`);
    console.log(`  Unmatched: ${matchStats.rows[0].unmatched_species}\n`);

    // Step 4: Drop the unique constraint temporarily
    console.log('Step 4: Dropping unique primary image constraint temporarily...');
    await pool.query('DROP INDEX IF EXISTS idx_images_unique_primary_per_species');
    console.log('✅ Constraint dropped\n');

    // Step 5: Update taxon_ids for matched species (species-level only)
    console.log('Step 5: Updating taxon_ids to current species table...');

    const updateResult = await pool.query(`
      UPDATE images i
      SET taxon_id = s.taxon_id
      FROM species s
      WHERE i.species_scientific_name = s.species_scientific_name
        AND s.subspecies = 'NA'
        AND i.species_scientific_name IS NOT NULL
    `);

    console.log(`✅ Updated ${updateResult.rowCount} image taxon_ids\n`);

    // Step 6: Fix duplicate primary images - keep only the first one per taxon_id
    console.log('Step 6: Fixing duplicate primary images...');

    await pool.query(`
      UPDATE images
      SET is_primary = false
      WHERE id IN (
        SELECT id
        FROM (
          SELECT id,
                 ROW_NUMBER() OVER (PARTITION BY taxon_id ORDER BY id) as rn
          FROM images
          WHERE is_primary = true
        ) t
        WHERE rn > 1
      )
    `);

    const dupCheck = await pool.query(`
      SELECT COUNT(*) as duplicate_primaries
      FROM (
        SELECT taxon_id, COUNT(*) as cnt
        FROM images
        WHERE is_primary = true
        GROUP BY taxon_id
        HAVING COUNT(*) > 1
      ) d
    `);

    console.log(`✅ Fixed duplicates (remaining: ${dupCheck.rows[0].duplicate_primaries})\n`);

    // Step 7: Re-create the unique constraint
    console.log('Step 7: Re-creating unique primary image constraint...');
    await pool.query(`
      CREATE UNIQUE INDEX idx_images_unique_primary_per_species
      ON images (taxon_id)
      WHERE is_primary = true
    `);
    console.log('✅ Constraint re-created\n');

    // Step 8: Final verification
    console.log('Step 8: Final verification...');

    const finalStats = await pool.query(`
      SELECT
        COUNT(*) as total_images,
        COUNT(CASE WHEN i.species_scientific_name IS NOT NULL THEN 1 END) as with_species_name,
        COUNT(CASE WHEN s.taxon_id IS NOT NULL THEN 1 END) as linked_to_current_species,
        COUNT(CASE WHEN s.taxon_id IS NULL AND i.species_scientific_name IS NOT NULL THEN 1 END) as name_extracted_but_no_match,
        COUNT(CASE WHEN i.species_scientific_name IS NULL THEN 1 END) as failed_extraction
      FROM images i
      LEFT JOIN species s ON i.taxon_id = s.taxon_id
    `);

    console.log('📊 Final Results:');
    console.log(`  Total images: ${finalStats.rows[0].total_images}`);
    console.log(`  Species name extracted: ${finalStats.rows[0].with_species_name}`);
    console.log(`  Linked to current species: ${finalStats.rows[0].linked_to_current_species}`);
    console.log(`  Name extracted but no match: ${finalStats.rows[0].name_extracted_but_no_match}`);
    console.log(`  Failed extraction: ${finalStats.rows[0].failed_extraction}`);

    const successRate = ((finalStats.rows[0].linked_to_current_species / finalStats.rows[0].total_images) * 100).toFixed(1);
    console.log(`\n✅ Success rate: ${successRate}%`);

    // Show some unmatched species for debugging
    if (finalStats.rows[0].name_extracted_but_no_match > 0) {
      console.log('\nSample unmatched species names:');
      const unmatched = await pool.query(`
        SELECT DISTINCT i.species_scientific_name
        FROM images i
        LEFT JOIN species s ON i.species_scientific_name = s.species_scientific_name
        WHERE i.species_scientific_name IS NOT NULL
          AND s.taxon_id IS NULL
        LIMIT 10
      `);
      unmatched.rows.forEach(row => {
        console.log(`  - ${row.species_scientific_name}`);
      });
    }

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
