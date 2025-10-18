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

/**
 * Import Marina's compressed geohash CSV data
 * CSV format:
 * "geohash","species_data","total_occurrences","species_count"
 * "1cn5qqf","{""AngNAParc45391-01"":1,...}",1,1
 */
async function importGeohashCSV(filePath) {
  console.log(`Starting CSV import from: ${filePath}`);
  console.log(`Batch size: ${BATCH_SIZE}, Log interval: ${LOG_INTERVAL}`);
  
  const startTime = Date.now();
  let processedCount = 0;
  let successCount = 0;
  let errorCount = 0;
  let batch = [];
  
  try {
    // Check file exists
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
    const fileStats = fs.statSync(filePath);
    console.log(`File size: ${(fileStats.size / 1024 / 1024).toFixed(2)} MB`);
    
    // Create a transform stream to process rows
    const processRow = new Transform({
      objectMode: true,
      transform(row, encoding, callback) {
        try {
          // Parse the species_data JSON
          let speciesData;
          try {
            speciesData = JSON.parse(row.species_data);
          } catch (e) {
            console.error(`Invalid JSON in row ${processedCount + 1}:`, row.species_data);
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
          const totalOccurrences = parseInt(row.total_occurrences) || 0;
          const speciesCount = parseInt(row.species_count) || 0;
          
          // Verify totals match (data integrity check)
          const calculatedTotal = Object.values(speciesData).reduce((sum, count) => sum + count, 0);
          const calculatedSpeciesCount = Object.keys(speciesData).length;
          
          if (calculatedTotal !== totalOccurrences) {
            console.warn(`Total mismatch in ${row.geohash}: CSV=${totalOccurrences}, calculated=${calculatedTotal}`);
          }
          if (calculatedSpeciesCount !== speciesCount) {
            console.warn(`Species count mismatch in ${row.geohash}: CSV=${speciesCount}, calculated=${calculatedSpeciesCount}`);
          }
          
          // Add to batch
          batch.push({
            geohash: row.geohash,
            species_data: speciesData,
            total_occurrences: totalOccurrences,
            species_count: speciesCount,
            datetime: new Date().toISOString(), // Use current date as processing date
            data_source: 'marina_compressed',
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
    
    // Prepare the bulk insert query
    const insertQuery = `
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
      ) VALUES ${Array(BATCH_SIZE).fill('(?, ?, ?, ?, ?, ST_GeomFromGeoHash(?), ST_PointFromGeoHash(?, 4326), ?, ?)').join(', ')}
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
    
    // Function to insert a batch
    async function insertBatch(tiles) {
      const values = [];
      const actualBatchSize = tiles.length;
      
      // Build the query with the actual batch size
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
        successCount += actualBatchSize;
      } catch (error) {
        console.error(`Error inserting batch of ${actualBatchSize} tiles:`, error.message);
        errorCount += actualBatchSize;
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
    console.log(`\n=== Import completed in ${totalTime.toFixed(1)} seconds ===`);
    console.log(`Total rows processed: ${processedCount.toLocaleString()}`);
    console.log(`Successfully imported: ${successCount.toLocaleString()}`);
    console.log(`Errors: ${errorCount.toLocaleString()}`);
    console.log(`Average rate: ${(processedCount / totalTime).toFixed(0)} rows/second`);
    
    // Verify import and show statistics
    console.log('\n=== Database statistics ===');
    
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_tiles,
        SUM(total_occurrences) as total_occurrences,
        SUM(species_count) as total_species_references,
        COUNT(DISTINCT jsonb_object_keys(species_data)) as unique_species
      FROM geohash_species_tiles
      WHERE data_source = 'marina_compressed'
    `);
    console.log('Import statistics:', statsResult.rows[0]);
    
    // Show sample data
    const sampleResult = await pool.query(`
      SELECT geohash_l7, total_occurrences, species_count
      FROM geohash_species_tiles
      WHERE data_source = 'marina_compressed'
      ORDER BY total_occurrences DESC
      LIMIT 5
    `);
    console.log('\nTop 5 tiles by occurrences:', sampleResult.rows);
    
    // Show species distribution
    const speciesDistResult = await pool.query(`
      SELECT 
        COUNT(*) as tiles_with_species,
        MIN(species_count) as min_species_per_tile,
        AVG(species_count)::numeric(10,2) as avg_species_per_tile,
        MAX(species_count) as max_species_per_tile
      FROM geohash_species_tiles
      WHERE data_source = 'marina_compressed'
    `);
    console.log('\nSpecies distribution:', speciesDistResult.rows[0]);
    
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
  node import_geohash_csv.js <input_file.csv>

Example:
  node import_geohash_csv.js Treekipedia_geohash_15djuly.csv

This script imports Marina's compressed geohash occurrence data from CSV format.
The CSV should have columns: geohash, species_data, total_occurrences, species_count

Features:
- Streaming CSV parsing for large files
- Batch inserts for performance (${BATCH_SIZE} rows per batch)
- Progress logging every ${LOG_INTERVAL.toLocaleString()} rows
- Data validation and integrity checks
- Automatic PostGIS geometry generation from geohash
    `);
    process.exit(1);
  }
  
  importGeohashCSV(args[0]);
}

module.exports = { importGeohashCSV };