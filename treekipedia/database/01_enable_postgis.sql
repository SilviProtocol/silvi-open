-- Enable PostGIS extension for spatial data support
-- This adds geometry types, spatial functions, and geohash conversion utilities
-- Required for geospatial querying capabilities in Treekipedia

-- Check if extension already exists to avoid errors
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify PostGIS installation
SELECT PostGIS_version();

-- List available PostGIS functions for geohash operations
-- These will be used for converting Marina's geohash data
SELECT 
    'ST_GeomFromGeoHash' as function_name, 
    'Converts geohash string to geometry polygon' as description
UNION ALL
SELECT 
    'ST_PointFromGeoHash', 
    'Gets center point of geohash tile'
UNION ALL
SELECT 
    'ST_GeoHash', 
    'Converts geometry to geohash string';