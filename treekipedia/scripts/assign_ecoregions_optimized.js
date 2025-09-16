#!/usr/bin/env node

/**
 * Optimized batch process to assign ecoregion data to geohash tiles
 * Reduces memory load on PostgreSQL through:
 * - Smaller batch sizes
 * - Simpler queries
 * - Transaction management
 * - Connection pooling
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'tree_user',
  database: process.env.DB_NAME || 'treekipedia',
  password: process.env.DB_PASSWORD || 'Kj9mPx7vLq2wZn4t',
  max: 2, // Limit concurrent connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

console.log('🌍 Optimized Ecoregion Assignment Script');
console.log('========================================');

async function assignEcoregionsOptimized() {
  let client;
  
  try {
    // Use a dedicated client for better connection management
    client = await pool.connect();
    
    // Get total count first
    const countResult = await client.query(
      'SELECT COUNT(*) as total FROM geohash_species_tiles WHERE eco_id IS NULL'
    );
    const totalTiles = parseInt(countResult.rows[0].total);
    console.log(`📊 Total tiles to process: ${totalTiles.toLocaleString()}`);

    if (totalTiles === 0) {
      console.log('✅ All tiles already have ecoregion assignments!');
      return;
    }

    // OPTIMIZATION 1: Much smaller batch size to reduce memory usage
    const batchSize = 1000; // Reduced from 10000
    let processed = 0;
    let successfulBatches = 0;
    let failedBatches = 0;

    // OPTIMIZATION 2: Process ecoregions one at a time to reduce join complexity
    console.log('\n🔄 Phase 1: Processing by ecoregion (memory efficient)...');
    
    // Get all ecoregion IDs
    const ecoResult = await client.query('SELECT eco_id FROM ecoregions ORDER BY eco_id');
    const ecoregions = ecoResult.rows;
    
    for (let i = 0; i < ecoregions.length; i++) {
      const eco_id = ecoregions[i].eco_id;
      
      try {
        // OPTIMIZATION 3: Simple update for tiles whose center falls in this ecoregion
        // No complex joins, just one ecoregion at a time
        const updateResult = await client.query(`
          UPDATE geohash_species_tiles t
          SET 
            eco_id = e.eco_id,
            eco_name = e.eco_name,
            biome_name = e.biome_name,
            realm = e.realm
          FROM ecoregions e
          WHERE t.eco_id IS NULL
            AND e.eco_id = $1
            AND ST_Contains(e.geom, t.center_point::geometry)
        `, [eco_id]);
        
        const updated = updateResult.rowCount;
        if (updated > 0) {
          processed += updated;
          console.log(`   ✓ Ecoregion ${eco_id}: ${updated.toLocaleString()} tiles assigned`);
        }
        
        // OPTIMIZATION 4: Commit after each ecoregion to free memory
        await client.query('COMMIT');
        
        // Small delay to prevent overload
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (err) {
        console.error(`   ✗ Ecoregion ${eco_id} failed:`, err.message);
        await client.query('ROLLBACK');
        failedBatches++;
      }
      
      // Progress report every 50 ecoregions
      if ((i + 1) % 50 === 0) {
        console.log(`📈 Progress: ${i + 1}/${ecoregions.length} ecoregions, ${processed.toLocaleString()} tiles assigned`);
      }
    }

    console.log(`\n✅ Phase 1 Complete: ${processed.toLocaleString()} tiles assigned by center point`);

    // OPTIMIZATION 5: Handle boundary tiles in smaller chunks
    console.log('\n🔄 Phase 2: Processing boundary tiles...');
    
    // Count remaining tiles
    const remainingResult = await client.query(
      'SELECT COUNT(*) as remaining FROM geohash_species_tiles WHERE eco_id IS NULL'
    );
    const remainingTiles = parseInt(remainingResult.rows[0].remaining);
    console.log(`📊 Boundary tiles to process: ${remainingTiles.toLocaleString()}`);

    if (remainingTiles > 0) {
      // Process boundary tiles in very small batches
      const boundaryBatchSize = 100;
      let boundaryProcessed = 0;
      
      while (boundaryProcessed < remainingTiles) {
        try {
          // OPTIMIZATION 6: Use LIMIT to process small chunks
          const boundaryResult = await client.query(`
            WITH unassigned AS (
              SELECT geohash_l7, geometry
              FROM geohash_species_tiles
              WHERE eco_id IS NULL
              LIMIT $1
            )
            UPDATE geohash_species_tiles t
            SET 
              eco_id = sub.eco_id,
              eco_name = sub.eco_name,
              biome_name = sub.biome_name,
              realm = sub.realm
            FROM (
              SELECT DISTINCT ON (u.geohash_l7)
                u.geohash_l7,
                e.eco_id,
                e.eco_name,
                e.biome_name,
                e.realm,
                ST_Area(ST_Intersection(e.geom, u.geometry)) as intersection_area
              FROM unassigned u
              CROSS JOIN LATERAL (
                SELECT * FROM ecoregions e2
                WHERE ST_Intersects(e2.geom, u.geometry)
                ORDER BY ST_Area(ST_Intersection(e2.geom, u.geometry)) DESC
                LIMIT 1
              ) e
            ) sub
            WHERE t.geohash_l7 = sub.geohash_l7
          `, [boundaryBatchSize]);
          
          const updated = boundaryResult.rowCount;
          boundaryProcessed += updated;
          
          if (updated > 0) {
            console.log(`   ✓ Boundary batch: ${updated} tiles assigned (${boundaryProcessed.toLocaleString()} total)`);
          } else {
            break; // No more tiles to process
          }
          
          // Commit after each batch
          await client.query('COMMIT');
          
          // Longer delay for boundary processing (more complex)
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (err) {
          console.error(`   ✗ Boundary batch failed:`, err.message);
          await client.query('ROLLBACK');
          boundaryProcessed += boundaryBatchSize; // Skip this batch
        }
      }
      
      console.log(`✅ Phase 2 Complete: ${boundaryProcessed.toLocaleString()} boundary tiles processed`);
    }

    // Final statistics
    const finalStats = await client.query(`
      SELECT 
        COUNT(*) as total_tiles,
        COUNT(eco_id) as assigned_tiles,
        COUNT(DISTINCT eco_id) as unique_ecoregions,
        COUNT(DISTINCT biome_name) as unique_biomes,
        COUNT(DISTINCT realm) as unique_realms
      FROM geohash_species_tiles
    `);

    const stats = finalStats.rows[0];
    console.log('\n📊 Final Statistics:');
    console.log(`   Total tiles: ${parseInt(stats.total_tiles).toLocaleString()}`);
    console.log(`   Assigned tiles: ${parseInt(stats.assigned_tiles).toLocaleString()}`);
    console.log(`   Assignment rate: ${(parseInt(stats.assigned_tiles)/parseInt(stats.total_tiles)*100).toFixed(1)}%`);
    console.log(`   Unique ecoregions: ${parseInt(stats.unique_ecoregions).toLocaleString()}`);
    console.log(`   Unique biomes: ${parseInt(stats.unique_biomes).toLocaleString()}`);
    console.log(`   Unique realms: ${parseInt(stats.unique_realms).toLocaleString()}`);

    console.log('\n✅ Optimized ecoregion assignment complete!');

  } catch (error) {
    console.error('❌ Error during batch processing:', error);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
  console.log('\n⚠️ Received interrupt signal, cleaning up...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️ Received termination signal, cleaning up...');
  await pool.end();
  process.exit(0);
});

// Run if called directly
if (require.main === module) {
  assignEcoregionsOptimized();
}

module.exports = { assignEcoregionsOptimized };