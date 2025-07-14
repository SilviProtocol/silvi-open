const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Import compressed geohash tile data from Marina's processing pipeline
 * Expected input format (JSON or CSV):
 * {
 *   geohash: "dr5ru6j",
 *   species_data: { "12345": 15, "67890": 3 },
 *   datetime: "2024-12-31",  // Latest observation date or processing date
 *   data_source: "gbif",
 *   processing_date: "2025-01-15"
 * }
 */

async function importGeohashTiles(filePath) {
  console.log(`Starting import from: ${filePath}`);
  
  try {
    // Read the input file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    let tiles;
    
    // Handle both JSON and CSV formats
    if (filePath.endsWith('.json')) {
      tiles = JSON.parse(fileContent);
      if (!Array.isArray(tiles)) {
        tiles = [tiles]; // Handle single object
      }
    } else if (filePath.endsWith('.csv')) {
      // CSV parsing would go here
      console.error('CSV parsing not yet implemented. Please use JSON format.');
      return;
    } else {
      console.error('Unsupported file format. Please use .json or .csv');
      return;
    }
    
    console.log(`Found ${tiles.length} tiles to import`);
    
    // Prepare the insert query
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
        processing_date,
        observation_start_date,
        observation_end_date
      ) VALUES (
        $1,  -- geohash_l7
        $2,  -- species_data (JSONB)
        $3,  -- total_occurrences
        $4,  -- species_count
        $5,  -- datetime
        ST_GeomFromGeoHash($1),  -- geometry (auto-generated from geohash)
        ST_PointFromGeoHash($1, 4326),  -- center_point
        $6,  -- data_source
        $7,  -- processing_date
        $8,  -- observation_start_date
        $9   -- observation_end_date
      )
      ON CONFLICT (geohash_l7) 
      DO UPDATE SET
        species_data = EXCLUDED.species_data,
        total_occurrences = EXCLUDED.total_occurrences,
        species_count = EXCLUDED.species_count,
        datetime = EXCLUDED.datetime,
        data_source = EXCLUDED.data_source,
        processing_date = EXCLUDED.processing_date,
        observation_start_date = EXCLUDED.observation_start_date,
        observation_end_date = EXCLUDED.observation_end_date,
        updated_at = NOW()
      RETURNING geohash_l7;
    `;
    
    let successCount = 0;
    let errorCount = 0;
    
    // Process each tile
    for (const tile of tiles) {
      try {
        // Validate required fields
        if (!tile.geohash || !tile.species_data) {
          console.error(`Skipping invalid tile: missing geohash or species_data`, tile);
          errorCount++;
          continue;
        }
        
        // Calculate totals from species_data
        const speciesData = typeof tile.species_data === 'string' 
          ? JSON.parse(tile.species_data) 
          : tile.species_data;
        
        const totalOccurrences = Object.values(speciesData).reduce((sum, count) => sum + count, 0);
        const speciesCount = Object.keys(speciesData).length;
        
        // Determine datetime (STAC compliance)
        const datetime = tile.datetime || tile.observation_end_date || tile.processing_date || new Date().toISOString();
        
        // Execute insert
        const result = await pool.query(insertQuery, [
          tile.geohash,
          JSON.stringify(speciesData),  // Ensure JSONB format
          totalOccurrences,
          speciesCount,
          datetime,
          tile.data_source || 'unknown',
          tile.processing_date || null,
          tile.observation_start_date || null,
          tile.observation_end_date || null
        ]);
        
        successCount++;
        
        if (successCount % 100 === 0) {
          console.log(`Progress: ${successCount} tiles imported...`);
        }
        
      } catch (error) {
        console.error(`Error importing tile ${tile.geohash}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\nImport completed:`);
    console.log(`- Successfully imported: ${successCount} tiles`);
    console.log(`- Errors: ${errorCount} tiles`);
    
    // Show sample queries
    console.log('\n--- Sample Queries ---');
    
    // Query 1: Total tiles and species
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_tiles,
        SUM(species_count) as total_species_occurrences,
        COUNT(DISTINCT jsonb_object_keys(species_data)) as unique_species
      FROM geohash_species_tiles
    `);
    console.log('Database statistics:', statsResult.rows[0]);
    
    // Query 2: Top 5 tiles by occurrence count
    const topTilesResult = await pool.query(`
      SELECT geohash_l7, total_occurrences, species_count
      FROM geohash_species_tiles
      ORDER BY total_occurrences DESC
      LIMIT 5
    `);
    console.log('\nTop 5 tiles by occurrences:', topTilesResult.rows);
    
  } catch (error) {
    console.error('Fatal error during import:', error);
  } finally {
    await pool.end();
  }
}

// Sample data generator for testing
async function generateSampleData(outputPath) {
  const sampleTiles = [
    {
      geohash: "dr5ru6j",
      species_data: { "12345": 15, "67890": 3, "11111": 7 },
      datetime: "2024-12-31T23:59:59Z",
      data_source: "gbif",
      processing_date: "2025-01-15T10:00:00Z",
      observation_start_date: "2024-01-01",
      observation_end_date: "2024-12-31"
    },
    {
      geohash: "dr5ru6k",
      species_data: { "12345": 8, "99999": 12 },
      datetime: "2024-12-30T23:59:59Z",
      data_source: "inaturalist",
      processing_date: "2025-01-15T10:00:00Z"
    },
    {
      geohash: "dr5ru6m",
      species_data: { "67890": 25, "11111": 4, "88888": 9 },
      datetime: "2024-12-29T23:59:59Z",
      data_source: "mixed",
      processing_date: "2025-01-15T10:00:00Z"
    }
  ];
  
  fs.writeFileSync(outputPath, JSON.stringify(sampleTiles, null, 2));
  console.log(`Sample data written to: ${outputPath}`);
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Usage:
  node import_geohash_tiles.js <input_file.json>
  node import_geohash_tiles.js --generate-sample <output_file.json>

Examples:
  node import_geohash_tiles.js marina_tiles.json
  node import_geohash_tiles.js --generate-sample sample_tiles.json

Input format:
  JSON array of tile objects with:
  - geohash: Level 7 geohash string
  - species_data: Object with taxon_id keys and occurrence count values
  - datetime: ISO timestamp (STAC-required temporal field)
  - data_source: Source of the data (optional)
  - processing_date: When data was processed (optional)
  - observation_start_date: Earliest observation (optional)
  - observation_end_date: Latest observation (optional)
    `);
    process.exit(1);
  }
  
  if (args[0] === '--generate-sample' && args[1]) {
    generateSampleData(args[1]);
  } else {
    importGeohashTiles(args[0]);
  }
}

module.exports = { importGeohashTiles };