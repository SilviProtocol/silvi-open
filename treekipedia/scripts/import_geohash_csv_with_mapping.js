const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const csv = require('csv-parser');
const { Transform } = require('stream');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Batch settings for efficient insertion
const BATCH_SIZE = 1000;
const LOG_INTERVAL = 10000;
const MAPPING_CACHE_SIZE = 50000; // Cache for legacy->current taxon_id mapping

// Cache for legacy_taxon_id -> current taxon_id mapping
let taxonIdMapping = new Map();
let mappingCacheLoaded = false;

/**
 * Load legacy_taxon_id to current taxon_id mapping into cache
 * This prevents repeated database queries during import
 */
async function loadTaxonIdMapping() {
  console.log('Loading taxon_id mapping cache...');
  
  try {
    const result = await pool.query(`
      SELECT taxon_id, legacy_taxon_id 
      FROM species 
      WHERE legacy_taxon_id IS NOT NULL 
      AND legacy_taxon_id != ''
    `);
    
    for (const row of result.rows) {
      taxonIdMapping.set(row.legacy_taxon_id, row.taxon_id);
    }
    
    console.log(`Loaded ${taxonIdMapping.size} taxon_id mappings into cache`);
    mappingCacheLoaded = true;
    
  } catch (error) {
    console.error('Error loading taxon_id mapping:', error);
    throw error;
  }
}

/**
 * Map legacy taxon_ids in species_data to current taxon_ids
 */
function mapSpeciesData(legacySpeciesData, stats) {
  const mappedSpeciesData = {};
  let mappedCount = 0;
  let unmappedCount = 0;
  
  for (const [legacyTaxonId, occurrenceCount] of Object.entries(legacySpeciesData)) {
    const currentTaxonId = taxonIdMapping.get(legacyTaxonId);
    
    if (currentTaxonId) {
      mappedSpeciesData[currentTaxonId] = occurrenceCount;
      mappedCount++;
    } else {
      // Keep original for debugging, but track as unmapped
      mappedSpeciesData[legacyTaxonId] = occurrenceCount;
      unmappedCount++;
      stats.unmappedTaxonIds.add(legacyTaxonId);
    }
  }
  
  stats.totalMappedSpecies += mappedCount;
  stats.totalUnmappedSpecies += unmappedCount;
  
  return mappedSpeciesData;
}

/**
 * Import Marina's compressed geohash CSV data with legacy taxon_id mapping
 * CSV format:
 * "geohash","species_data","total_occurrences","species_count"
 * "1cn5qqf","{""AngNAParc45391-01"":1,...}",1,1
 */
async function importGeohashCSV(filePath, dryRun = false) {
  console.log(`Starting CSV import from: ${filePath}`);
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'EXECUTE'}`);
  console.log(`Batch size: ${BATCH_SIZE}, Log interval: ${LOG_INTERVAL}`);
  
  const startTime = Date.now();
  let processedCount = 0;
  let successCount = 0;
  let errorCount = 0;
  let batch = [];
  
  // Import statistics
  const stats = {
    totalMappedSpecies: 0,
    totalUnmappedSpecies: 0,
    unmappedTaxonIds: new Set(),
    tilesWithUnmappedSpecies: 0,
    totalOriginalOccurrences: 0,
    totalMappedOccurrences: 0
  };
  
  try {
    // Check file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const fileStats = fs.statSync(filePath);
    console.log(`File size: ${(fileStats.size / 1024 / 1024 / 1024).toFixed(2)} GB`);
    
    // Load taxon_id mapping cache
    if (!mappingCacheLoaded) {
      await loadTaxonIdMapping();
    }
    
    // Create a transform stream to process rows
    const processRow = new Transform({
      objectMode: true,
      transform(row, encoding, callback) {
        try {
          // Parse the species_data JSON
          let legacySpeciesData;
          try {
            legacySpeciesData = JSON.parse(row.species_data);
          } catch (e) {
            console.error(`Invalid JSON in row ${processedCount + 1}:`, row.species_data.substring(0, 100) + '...');
            errorCount++;
            callback();
            return;
          }
          
          // Validate geohash
          if (!row.geohash || row.geohash.length !== 7) {
            console.error(`Invalid geohash in row ${processedCount + 1}:`, row.geohash);
            errorCount++;
            callback();
            return;
          }
          
          // Parse numeric values
          const originalTotalOccurrences = parseInt(row.total_occurrences) || 0;
          const originalSpeciesCount = parseInt(row.species_count) || 0;
          
          // Map legacy taxon_ids to current taxon_ids
          const mappedSpeciesData = mapSpeciesData(legacySpeciesData, stats);
          
          // Calculate new totals after mapping
          const mappedTotalOccurrences = Object.values(mappedSpeciesData).reduce((sum, count) => sum + count, 0);
          const mappedSpeciesCount = Object.keys(mappedSpeciesData).length;
          
          // Track unmapped species tiles
          if (stats.totalUnmappedSpecies > 0) {
            stats.tilesWithUnmappedSpecies++;
          }
          
          // Update global stats
          stats.totalOriginalOccurrences += originalTotalOccurrences;
          stats.totalMappedOccurrences += mappedTotalOccurrences;
          
          // Verify totals match original CSV (data integrity check)
          const calculatedOriginalTotal = Object.values(legacySpeciesData).reduce((sum, count) => sum + count, 0);
          const calculatedOriginalSpeciesCount = Object.keys(legacySpeciesData).length;
          
          if (calculatedOriginalTotal !== originalTotalOccurrences) {
            console.warn(`Total mismatch in ${row.geohash}: CSV=${originalTotalOccurrences}, calculated=${calculatedOriginalTotal}`);
          }
          if (calculatedOriginalSpeciesCount !== originalSpeciesCount) {
            console.warn(`Species count mismatch in ${row.geohash}: CSV=${originalSpeciesCount}, calculated=${calculatedOriginalSpeciesCount}`);
          }
          
          // Add to batch (use mapped data)
          batch.push({
            geohash: row.geohash,
            species_data: mappedSpeciesData,
            total_occurrences: mappedTotalOccurrences,
            species_count: mappedSpeciesCount,
            datetime: new Date().toISOString(),
            data_source: 'marina_compressed_mapped',
            processing_date: new Date().toISOString()
          });
          
          processedCount++;
          
          // Process batch when it reaches the size limit
          if (batch.length >= BATCH_SIZE) {
            this.push(batch);
            batch = [];
          }
          
          // Log progress
          if (processedCount % LOG_INTERVAL === 0) {
            const elapsed = (Date.now() - startTime) / 1000;
            const rate = processedCount / elapsed;
            console.log(`Progress: ${processedCount.toLocaleString()} rows processed (${rate.toFixed(0)} rows/sec)`);
            console.log(`  Mapped species: ${stats.totalMappedSpecies.toLocaleString()}, Unmapped: ${stats.totalUnmappedSpecies.toLocaleString()}`);
          }
          
          callback();
        } catch (error) {
          console.error(`Error processing row ${processedCount + 1}:`, error.message);
          errorCount++;
          callback();
        }
      },
      flush(callback) {
        // Push any remaining items in the batch
        if (batch.length > 0) {
          this.push(batch);
        }
        callback();
      }
    });
    
    // Function to insert a batch
    async function insertBatch(tiles) {
      if (dryRun) {
        console.log(`[DRY RUN] Would insert batch of ${tiles.length} tiles`);
        successCount += tiles.length;
        return;
      }
      
      const values = [];
      const placeholders = [];
      let paramIndex = 1;
      
      for (const tile of tiles) {
        placeholders.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, ST_GeomFromGeoHash($${paramIndex + 5}), ST_PointFromGeoHash($${paramIndex + 6}, 4326), $${paramIndex + 7}, $${paramIndex + 8})`);
        
        values.push(
          tile.geohash,
          JSON.stringify(tile.species_data),
          tile.total_occurrences,
          tile.species_count,
          tile.datetime,
          tile.geohash, // For ST_GeomFromGeoHash
          tile.geohash, // For ST_PointFromGeoHash
          tile.data_source,
          tile.processing_date
        );
        
        paramIndex += 9;
      }
      
      const batchQuery = `
        INSERT INTO geohash_species_tiles (
          geohash_l7,
          species_data,
          total_occurrences,
          species_count,
          datetime,
          geometry,
          center_point,
          data_source,
          processing_date
        ) VALUES ${placeholders.join(', ')}
        ON CONFLICT (geohash_l7) 
        DO UPDATE SET
          species_data = EXCLUDED.species_data,
          total_occurrences = EXCLUDED.total_occurrences,
          species_count = EXCLUDED.species_count,
          datetime = EXCLUDED.datetime,
          data_source = EXCLUDED.data_source,
          processing_date = EXCLUDED.processing_date,
          updated_at = NOW()
      `;
      
      try {
        await pool.query(batchQuery, values);
        successCount += tiles.length;
      } catch (error) {
        console.error(`Error inserting batch of ${tiles.length} tiles:`, error.message);
        errorCount += tiles.length;
        throw error;
      }
    }
    
    // Create a promise to track completion
    await new Promise((resolve, reject) => {
      // Create the stream pipeline
      const stream = fs.createReadStream(filePath)
        .pipe(csv())
        .pipe(processRow);
      
      // Handle batch processing
      stream.on('data', async (batch) => {
        stream.pause();
        try {
          await insertBatch(batch);
        } catch (error) {
          console.error('Batch insert failed:', error);
        }
        stream.resume();
      });
      
      stream.on('end', resolve);
      stream.on('error', reject);
    });
    
    // Final statistics
    const totalTime = (Date.now() - startTime) / 1000;
    console.log(`\n=== Import completed in ${(totalTime / 60).toFixed(1)} minutes ===`);
    console.log(`Total rows processed: ${processedCount.toLocaleString()}`);
    console.log(`Successfully imported: ${successCount.toLocaleString()}`);
    console.log(`Errors: ${errorCount.toLocaleString()}`);
    console.log(`Average rate: ${(processedCount / totalTime).toFixed(0)} rows/second`);
    
    // Taxon mapping statistics
    console.log(`\n=== Taxon ID Mapping Statistics ===`);
    console.log(`Total species mappings applied: ${stats.totalMappedSpecies.toLocaleString()}`);
    console.log(`Unmapped legacy taxon_ids: ${stats.totalUnmappedSpecies.toLocaleString()}`);
    console.log(`Tiles with unmapped species: ${stats.tilesWithUnmappedSpecies.toLocaleString()}`);
    console.log(`Original total occurrences: ${stats.totalOriginalOccurrences.toLocaleString()}`);
    console.log(`Mapped total occurrences: ${stats.totalMappedOccurrences.toLocaleString()}`);
    
    if (stats.unmappedTaxonIds.size > 0) {
      console.log(`\nFirst 10 unmapped legacy taxon_ids:`);
      const unmappedArray = Array.from(stats.unmappedTaxonIds).slice(0, 10);
      unmappedArray.forEach(id => console.log(`  ${id}`));
      if (stats.unmappedTaxonIds.size > 10) {
        console.log(`  ... and ${stats.unmappedTaxonIds.size - 10} more`);
      }
    }
    
    if (!dryRun) {
      // Verify import and show database statistics
      console.log(`\n=== Database Statistics ===`);
      
      const statsResult = await pool.query(`
        SELECT 
          COUNT(*) as total_tiles,
          SUM(total_occurrences) as total_occurrences,
          SUM(species_count) as total_species_references,
          AVG(species_count)::numeric(10,2) as avg_species_per_tile
        FROM geohash_species_tiles
        WHERE data_source = 'marina_compressed_mapped'
      `);
      console.log('Database statistics:', statsResult.rows[0]);
      
      // Show sample tiles
      const sampleResult = await pool.query(`
        SELECT geohash_l7, total_occurrences, species_count
        FROM geohash_species_tiles
        WHERE data_source = 'marina_compressed_mapped'
        ORDER BY total_occurrences DESC
        LIMIT 5
      `);
      console.log('\nTop 5 tiles by occurrences:', sampleResult.rows);
    }
    
  } catch (error) {
    console.error('Fatal error during import:', error);
  } finally {
    await pool.end();
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Usage:
  node import_geohash_csv_with_mapping.js <input_file.csv> [--dry-run]

Example:
  node import_geohash_csv_with_mapping.js geohash.csv --dry-run
  node import_geohash_csv_with_mapping.js geohash.csv

This script imports Marina's compressed geohash occurrence data with legacy taxon_id mapping.
The CSV should have columns: geohash, species_data, total_occurrences, species_count

Features:
- Streaming CSV parsing for large files (3GB+)
- Legacy taxon_id to current taxon_id mapping
- Batch inserts for performance (${BATCH_SIZE} rows per batch)
- Progress logging every ${LOG_INTERVAL.toLocaleString()} rows  
- Data validation and integrity checks
- Automatic PostGIS geometry generation from geohash
- Comprehensive mapping statistics
    `);
    process.exit(1);
  }
  
  const csvFile = args[0];
  const dryRun = args.includes('--dry-run');
  
  importGeohashCSV(csvFile, dryRun);
}

module.exports = { importGeohashCSV };