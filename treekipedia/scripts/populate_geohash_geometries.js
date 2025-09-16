#!/usr/bin/env node

/**
 * Populate geometry columns in geohash_species_tiles table
 * This script converts geohash strings to PostGIS geometry objects
 */

const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function populateGeometries() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking current geometry status...');

    // Check how many tiles need geometry updates
    const statusQuery = `
      SELECT
        COUNT(*) as total_tiles,
        COUNT(CASE WHEN geometry IS NULL THEN 1 END) as null_geometries,
        COUNT(CASE WHEN center_point IS NULL THEN 1 END) as null_centers
      FROM geohash_species_tiles;
    `;

    const statusResult = await client.query(statusQuery);
    const stats = statusResult.rows[0];

    console.log(`📊 Current status:`);
    console.log(`   Total tiles: ${parseInt(stats.total_tiles).toLocaleString()}`);
    console.log(`   Missing geometries: ${parseInt(stats.null_geometries).toLocaleString()}`);
    console.log(`   Missing center points: ${parseInt(stats.null_centers).toLocaleString()}`);

    if (parseInt(stats.null_geometries) === 0 && parseInt(stats.null_centers) === 0) {
      console.log('✅ All geometries are already populated!');
      return;
    }

    console.log('\n🛠️ Starting geometry population...');

    // Update geometries in batches to avoid memory issues
    const batchSize = 10000;
    let processed = 0;
    let hasMore = true;

    while (hasMore) {
      const updateQuery = `
        UPDATE geohash_species_tiles
        SET
          geometry = ST_GeomFromGeoHash(geohash_l7),
          center_point = ST_PointFromGeoHash(geohash_l7)
        WHERE geohash_l7 IN (
          SELECT geohash_l7
          FROM geohash_species_tiles
          WHERE geometry IS NULL OR center_point IS NULL
          LIMIT $1
        );
      `;

      console.log(`   Processing batch starting at ${processed.toLocaleString()}...`);
      const start = Date.now();

      const result = await client.query(updateQuery, [batchSize]);
      const updated = result.rowCount;

      processed += updated;
      const elapsed = Date.now() - start;

      console.log(`   ✅ Updated ${updated.toLocaleString()} tiles in ${elapsed}ms`);

      if (updated < batchSize) {
        hasMore = false;
      }

      // Add a small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`\n🎉 Geometry population complete!`);
    console.log(`   Total processed: ${processed.toLocaleString()} tiles`);

    // Verify the results
    console.log('\n🔍 Verifying results...');
    const verifyResult = await client.query(statusQuery);
    const finalStats = verifyResult.rows[0];

    console.log(`📊 Final status:`);
    console.log(`   Total tiles: ${parseInt(finalStats.total_tiles).toLocaleString()}`);
    console.log(`   Missing geometries: ${parseInt(finalStats.null_geometries).toLocaleString()}`);
    console.log(`   Missing center points: ${parseInt(finalStats.null_centers).toLocaleString()}`);

    if (parseInt(finalStats.null_geometries) === 0 && parseInt(finalStats.null_centers) === 0) {
      console.log('✅ All geometries successfully populated!');

      // Test a sample spatial query
      console.log('\n🧪 Testing spatial query...');
      const testQuery = `
        SELECT COUNT(*) as intersecting_tiles
        FROM geohash_species_tiles
        WHERE ST_Intersects(
          geometry,
          ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-100,30],[-90,30],[-90,40],[-100,40],[-100,30]]]}')
        );
      `;

      const testResult = await client.query(testQuery);
      const intersectingCount = testResult.rows[0].intersecting_tiles;

      console.log(`   Found ${intersectingCount} tiles intersecting test polygon`);

      if (parseInt(intersectingCount) > 0) {
        console.log('🚀 Spatial queries are now working! Your analysis page should function properly.');
      }
    }

  } catch (error) {
    console.error('❌ Error populating geometries:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('🌍 Starting geohash geometry population...\n');
    await populateGeometries();
    console.log('\n✅ Script completed successfully!');
  } catch (error) {
    console.error('\n❌ Script failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { populateGeometries };