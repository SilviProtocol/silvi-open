#!/usr/bin/env node

/**
 * Batch process to assign ecoregion data to geohash tiles
 * Processes tiles in smaller batches for better performance
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'tree_user',
  database: process.env.DB_NAME || 'treekipedia',
  password: process.env.DB_PASSWORD || 'Kj9mPx7vLq2wZn4t',
});

console.log('🌍 Batch Ecoregion Assignment Script');
console.log('===================================');

async function assignEcoregionsBatch() {
  try {
    // Get total count first
    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM geohash_species_tiles WHERE eco_id IS NULL'
    );
    const totalTiles = parseInt(countResult.rows[0].total);
    console.log(`📊 Total tiles to process: ${totalTiles.toLocaleString()}`);

    if (totalTiles === 0) {
      console.log('✅ All tiles already have ecoregion assignments!');
      return;
    }

    const batchSize = 10000;
    let processed = 0;
    let offset = 0;

    while (offset < totalTiles) {
      const startTime = Date.now();
      
      console.log(`\n🔄 Processing batch ${Math.floor(offset/batchSize) + 1}/${Math.ceil(totalTiles/batchSize)}`);
      console.log(`   Tiles ${offset.toLocaleString()} - ${Math.min(offset + batchSize, totalTiles).toLocaleString()}`);

      // Update batch using center point containment (fastest method)
      const result = await pool.query(`
        WITH batch_tiles AS (
          SELECT geohash_l7, center_point
          FROM geohash_species_tiles 
          WHERE eco_id IS NULL
          ORDER BY geohash_l7
          LIMIT $1 OFFSET $2
        )
        UPDATE geohash_species_tiles 
        SET 
          eco_id = e.eco_id,
          eco_name = e.eco_name,
          biome_name = e.biome_name,
          realm = e.realm
        FROM ecoregions e, batch_tiles bt
        WHERE geohash_species_tiles.geohash_l7 = bt.geohash_l7
          AND ST_Contains(e.geom, bt.center_point::geometry)
      `, [batchSize, offset]);

      const batchUpdated = result.rowCount;
      processed += batchUpdated;
      const elapsed = Date.now() - startTime;
      
      console.log(`   ✅ Updated: ${batchUpdated.toLocaleString()} tiles in ${elapsed}ms`);
      console.log(`   📈 Progress: ${processed.toLocaleString()}/${totalTiles.toLocaleString()} (${(processed/totalTiles*100).toFixed(1)}%)`);

      offset += batchSize;
      
      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Handle remaining tiles that might be on boundaries using intersection
    console.log('\n🔄 Processing boundary tiles with intersection method...');
    const boundaryResult = await pool.query(`
      UPDATE geohash_species_tiles 
      SET 
        eco_id = e.eco_id,
        eco_name = e.eco_name,
        biome_name = e.biome_name,
        realm = e.realm
      FROM ecoregions e
      WHERE geohash_species_tiles.eco_id IS NULL
        AND ST_Intersects(e.geom, geohash_species_tiles.geometry)
        AND ST_Area(ST_Intersection(e.geom, geohash_species_tiles.geometry)) = (
          SELECT MAX(ST_Area(ST_Intersection(e2.geom, geohash_species_tiles.geometry)))
          FROM ecoregions e2
          WHERE ST_Intersects(e2.geom, geohash_species_tiles.geometry)
        )
    `);

    console.log(`🎯 Boundary tiles updated: ${boundaryResult.rowCount.toLocaleString()}`);

    // Final statistics
    const finalStats = await pool.query(`
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

    console.log('\n✅ Ecoregion assignment complete!');

  } catch (error) {
    console.error('❌ Error during batch processing:', error);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  assignEcoregionsBatch();
}

module.exports = { assignEcoregionsBatch };