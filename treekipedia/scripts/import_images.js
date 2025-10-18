#!/usr/bin/env node
/**
 * Image Import Script for Treekipedia
 * Imports image data from JSON file into the images table
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables from ../.env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

/**
 * Find taxon_id by matching species_scientific_name and check if images exist
 */
async function findTaxonIdBySpeciesName(species_name) {
  const query = `
    SELECT s.taxon_id, 
           CASE WHEN COUNT(i.taxon_id) > 0 THEN true ELSE false END as has_images
    FROM species s 
    LEFT JOIN images i ON s.taxon_id = i.taxon_id
    WHERE s.species_scientific_name = $1
    GROUP BY s.taxon_id
    LIMIT 1
  `;
  
  try {
    const result = await pool.query(query, [species_name]);
    if (result.rows[0]) {
      return {
        taxon_id: result.rows[0].taxon_id,
        has_images: result.rows[0].has_images
      };
    }
    return null;
  } catch (error) {
    console.error(`Error querying species ${species_name}:`, error.message);
    return null;
  }
}

/**
 * Insert image record into images table
 */
async function importImageRecord(taxon_id, image_data, is_primary = false, dry_run = true) {
  const insert_query = `
    INSERT INTO images (taxon_id, image_url, license, photographer, page_url, source, is_primary)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `;
  
  if (dry_run) {
    console.log(`  [DRY RUN] Would import: ${image_data.image_url} (primary: ${is_primary})`);
    return true;
  }
  
  try {
    await pool.query(insert_query, [
      taxon_id,
      image_data.image_url,
      image_data.license || null,
      image_data.photographer || null,
      image_data.page_url || null,
      image_data.source || 'Wikimedia Commons',
      is_primary
    ]);
    return true;
  } catch (error) {
    console.error(`Error inserting image for taxon_id ${taxon_id}:`, error.message);
    return false;
  }
}

/**
 * Process images JSON and import to database
 */
async function processImagesJson(json_file_path, dry_run = true, skip_existing = true) {
  const stats = {
    total_entries: 0,
    matched_species: 0,
    unmatched_species: 0,
    skipped_existing: 0,
    imported_images: 0,
    failed_imports: 0,
    species_with_primary: 0,
    unmatched_list: [],
    skipped_list: []
  };
  
  // Load JSON data
  let image_data;
  try {
    const fileContent = fs.readFileSync(json_file_path, 'utf8');
    image_data = JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error loading JSON file: ${error.message}`);
    return stats;
  }
  
  console.log(`Loaded ${image_data.length} image entries from ${json_file_path}`);
  stats.total_entries = image_data.length;
  
  // Group images by species to handle primary designation
  const species_images = {};
  for (const image of image_data) {
    const species_name = image.species;
    if (!species_images[species_name]) {
      species_images[species_name] = [];
    }
    species_images[species_name].push(image);
  }
  
  console.log(`Found images for ${Object.keys(species_images).length} unique species`);
  
  // Process each species
  for (const [species_name, images] of Object.entries(species_images)) {
    // Find corresponding taxon_id and check if images exist
    const species_info = await findTaxonIdBySpeciesName(species_name);
    
    if (species_info) {
      const { taxon_id, has_images } = species_info;
      
      if (skip_existing && has_images) {
        stats.skipped_existing++;
        stats.skipped_list.push(species_name);
        console.log(`⏭️  Skipping ${species_name} - already has images (${images.length} available)`);
        continue;
      }
      
      stats.matched_species++;
      const status = has_images ? "(replacing existing)" : "(new)";
      console.log(`✓ Found taxon_id ${taxon_id} for ${species_name} ${status} (${images.length} images)`);
      
      // Import images for this species
      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        const is_primary = (i === 0); // First image is primary
        
        const success = await importImageRecord(taxon_id, image, is_primary, dry_run);
        if (success) {
          stats.imported_images++;
          if (is_primary) {
            stats.species_with_primary++;
          }
        } else {
          stats.failed_imports++;
        }
      }
    } else {
      stats.unmatched_species++;
      stats.unmatched_list.push(species_name);
      console.log(`✗ No match found for species: ${species_name}`);
    }
  }
  
  if (!dry_run) {
    console.log('\n✅ Database changes committed');
  } else {
    console.log('\n🧪 DRY RUN - No database changes made');
  }
  
  return stats;
}

/**
 * Print summary of import results
 */
function printImportSummary(stats) {
  console.log('\n' + '='.repeat(50));
  console.log('IMPORT SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total JSON entries:     ${stats.total_entries}`);
  console.log(`Matched species:        ${stats.matched_species}`);
  console.log(`Unmatched species:      ${stats.unmatched_species}`);
  console.log(`Skipped existing:       ${stats.skipped_existing}`);
  console.log(`Images imported:        ${stats.imported_images}`);
  console.log(`Failed imports:         ${stats.failed_imports}`);
  console.log(`Species with primary:   ${stats.species_with_primary}`);
  
  if (stats.unmatched_species > 0) {
    const total_species = stats.matched_species + stats.unmatched_species + stats.skipped_existing;
    const match_rate = ((stats.matched_species + stats.skipped_existing) / total_species) * 100;
    console.log(`\nMatch rate: ${match_rate.toFixed(1)}%`);
    
    console.log('\nFirst 10 unmatched species:');
    for (let i = 0; i < Math.min(10, stats.unmatched_list.length); i++) {
      console.log(`  - ${stats.unmatched_list[i]}`);
    }
    
    if (stats.unmatched_list.length > 10) {
      console.log(`  ... and ${stats.unmatched_list.length - 10} more`);
    }
  }
  
  if (stats.skipped_existing > 0) {
    console.log(`\nSkipped ${stats.skipped_existing} species that already have images.`);
    console.log('Use --force flag to override and import anyway.');
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: node import_images.js <json_file> [--execute] [--force]');
    console.log('  --execute: Actually perform the import (default is dry run)');
    console.log('  --force: Import images even for species that already have images');
    process.exit(1);
  }
  
  const json_file = args[0];
  const dry_run = !args.includes('--execute');
  const skip_existing = !args.includes('--force');
  
  if (!fs.existsSync(json_file)) {
    console.error(`Error: JSON file ${json_file} not found`);
    process.exit(1);
  }
  
  if (dry_run) {
    console.log('🧪 DRY RUN MODE - No database changes will be made');
    console.log('Add --execute flag to actually import data');
  } else {
    console.log('⚠️  EXECUTE MODE - Database will be modified');
  }
  
  if (skip_existing) {
    console.log('📋 SKIP EXISTING MODE - Will skip species that already have images');
    console.log('Add --force flag to import for all species');
  } else {
    console.log('🔄 FORCE MODE - Will import for all matched species (may replace existing)');
  }
  
  console.log(`Processing: ${json_file}`);
  
  try {
    const stats = await processImagesJson(json_file, dry_run, skip_existing);
    printImportSummary(stats);
  } catch (error) {
    console.error('Import failed:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  main().catch(console.error);
}