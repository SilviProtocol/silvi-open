-- Populate geometry columns in geohash_species_tiles table
-- This converts geohash strings to PostGIS geometry objects

BEGIN;

-- Show progress
\echo 'Starting geometry population for geohash_species_tiles...'

-- Update geometries in batches
\echo 'Updating geometry and center_point columns...'

UPDATE geohash_species_tiles
SET
  geometry = ST_GeomFromGeoHash(geohash_l7),
  center_point = ST_PointFromGeoHash(geohash_l7)
WHERE geometry IS NULL OR center_point IS NULL;

-- Verify results
\echo 'Verifying results...'

SELECT
  COUNT(*) as total_tiles,
  COUNT(CASE WHEN geometry IS NULL THEN 1 END) as null_geometries,
  COUNT(CASE WHEN center_point IS NULL THEN 1 END) as null_centers,
  COUNT(CASE WHEN geometry IS NOT NULL THEN 1 END) as populated_geometries
FROM geohash_species_tiles;

-- Test a sample spatial query
\echo 'Testing spatial query...'

SELECT COUNT(*) as intersecting_tiles
FROM geohash_species_tiles
WHERE ST_Intersects(
  geometry,
  ST_GeomFromGeoJSON('{"type":"Polygon","coordinates":[[[-100,30],[-90,30],[-90,40],[-100,40],[-100,30]]]}')
);

COMMIT;

\echo 'Geometry population complete!'