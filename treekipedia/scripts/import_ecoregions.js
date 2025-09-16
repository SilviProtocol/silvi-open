#!/usr/bin/env node

/**
 * Import WWF Terrestrial Ecoregions shapefile into PostGIS
 * This script imports the Ecoregions2017 shapefile and creates spatial indexes
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Database connection parameters
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'tree_user';
const DB_NAME = process.env.DB_NAME || 'treekipedia';
const DB_PASSWORD = process.env.DB_PASSWORD;

// File paths
const SHAPEFILE_PATH = path.join(__dirname, '..', 'Ecoregions2017.shp');
const TABLE_NAME = 'ecoregions';

console.log('🌍 WWF Terrestrial Ecoregions Import Script');
console.log('==========================================');

// Check if shapefile exists
if (!fs.existsSync(SHAPEFILE_PATH)) {
  console.error('❌ Shapefile not found:', SHAPEFILE_PATH);
  process.exit(1);
}

console.log('📁 Found shapefile:', SHAPEFILE_PATH);

// Build PostgreSQL connection string
const PG_CONNECTION = `PG:host=${DB_HOST} user=${DB_USER} dbname=${DB_NAME}${DB_PASSWORD ? ` password=${DB_PASSWORD}` : ''}`;

// Import command using ogr2ogr
const importCommand = 'ogr2ogr';
const importArgs = [
  '-f', 'PostgreSQL',
  PG_CONNECTION,
  SHAPEFILE_PATH,
  '-nln', TABLE_NAME,           // New layer name
  '-s_srs', 'EPSG:4326',        // Source SRS
  '-t_srs', 'EPSG:4326',        // Target SRS (same as source)
  '-overwrite',                 // Overwrite existing table
  '-progress',                  // Show progress
  '-lco', 'GEOMETRY_NAME=geom', // Geometry column name
  '-lco', 'SPATIAL_INDEX=YES',  // Create spatial index
  '--config', 'PG_USE_COPY', 'YES' // Use COPY for faster import
];

console.log('🚀 Starting import with ogr2ogr...');
console.log('Command:', importCommand, importArgs.join(' '));

const importProcess = spawn(importCommand, importArgs);

importProcess.stdout.on('data', (data) => {
  process.stdout.write(data);
});

importProcess.stderr.on('data', (data) => {
  process.stderr.write(data);
});

importProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Shapefile import completed successfully!');
    console.log('📊 Next steps:');
    console.log('   1. Run optimization queries to create additional indexes');
    console.log('   2. Cross-reference with geohash tiles');
    console.log('   3. Add ecoregion columns to geohash_species_tiles');
    
    // Show sample queries
    console.log('\n🔍 Sample queries to test the import:');
    console.log(`   SELECT count(*) FROM ${TABLE_NAME};`);
    console.log(`   SELECT eco_name, biome_name, realm FROM ${TABLE_NAME} LIMIT 5;`);
    console.log(`   SELECT ST_Area(geom::geography)/1000000 as area_km2, eco_name FROM ${TABLE_NAME} ORDER BY area_km2 DESC LIMIT 5;`);
    
  } else {
    console.error('❌ Import failed with code:', code);
    console.error('💡 Troubleshooting tips:');
    console.error('   - Ensure ogr2ogr is installed (apt install gdal-bin)');
    console.error('   - Check database connection parameters');
    console.error('   - Verify PostGIS extension is enabled');
  }
});

importProcess.on('error', (error) => {
  console.error('❌ Failed to start import process:', error.message);
  if (error.code === 'ENOENT') {
    console.error('💡 ogr2ogr not found. Install with: sudo apt install gdal-bin');
  }
});