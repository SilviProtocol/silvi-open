-- Ecoregions Integration with PostGIS
-- This script sets up ecoregions table optimization and cross-referencing

-- After importing with ogr2ogr, optimize the ecoregions table
-- The import creates a basic table - we'll add optimizations

-- 1. Create optimized indexes for common queries
-- (Spatial index is already created by ogr2ogr with SPATIAL_INDEX=YES)

-- Index on ecoregion name for filtering
CREATE INDEX IF NOT EXISTS idx_ecoregions_eco_name ON ecoregions(eco_name);

-- Index on biome for biome-based queries  
CREATE INDEX IF NOT EXISTS idx_ecoregions_biome_name ON ecoregions(biome_name);

-- Index on realm for continental-scale queries
CREATE INDEX IF NOT EXISTS idx_ecoregions_realm ON ecoregions(realm);

-- Index on eco_id for joins
CREATE INDEX IF NOT EXISTS idx_ecoregions_eco_id ON ecoregions(eco_id);

-- 2. Add ecoregion information to geohash tiles
-- This pre-computes the spatial join for better performance

ALTER TABLE geohash_species_tiles 
ADD COLUMN IF NOT EXISTS eco_id INTEGER,
ADD COLUMN IF NOT EXISTS eco_name VARCHAR(150),
ADD COLUMN IF NOT EXISTS biome_name VARCHAR(254),
ADD COLUMN IF NOT EXISTS realm VARCHAR(254);

-- Create indexes on the new columns
CREATE INDEX IF NOT EXISTS idx_tiles_eco_id ON geohash_species_tiles(eco_id);
CREATE INDEX IF NOT EXISTS idx_tiles_eco_name ON geohash_species_tiles(eco_name);
CREATE INDEX IF NOT EXISTS idx_tiles_biome_name ON geohash_species_tiles(biome_name);
CREATE INDEX IF NOT EXISTS idx_tiles_realm ON geohash_species_tiles(realm);

-- 3. Update geohash tiles with ecoregion data
-- This query finds which ecoregion each tile center falls into
-- Using center_point for performance (most tiles will be entirely within one ecoregion)

UPDATE geohash_species_tiles 
SET 
    eco_id = e.eco_id,
    eco_name = e.eco_name,
    biome_name = e.biome_name,
    realm = e.realm
FROM ecoregions e
WHERE ST_Contains(e.geom, geohash_species_tiles.center_point::geometry);

-- 4. Handle tiles that cross ecoregion boundaries
-- For tiles not updated above (center point on boundary), use intersection
UPDATE geohash_species_tiles 
SET 
    eco_id = e.eco_id,
    eco_name = e.eco_name,
    biome_name = e.biome_name,
    realm = e.realm
FROM ecoregions e
WHERE geohash_species_tiles.eco_id IS NULL
  AND ST_Intersects(e.geom, geohash_species_tiles.geometry)
  -- Use the largest intersection for boundary tiles
  AND ST_Area(ST_Intersection(e.geom, geohash_species_tiles.geometry)) = (
    SELECT MAX(ST_Area(ST_Intersection(e2.geom, geohash_species_tiles.geometry)))
    FROM ecoregions e2
    WHERE ST_Intersects(e2.geom, geohash_species_tiles.geometry)
  );

-- 5. Create summary statistics view
CREATE OR REPLACE VIEW ecoregion_species_summary AS
SELECT 
    e.eco_id,
    e.eco_name,
    e.biome_name,
    e.realm,
    COUNT(DISTINCT t.geohash_l7) as tile_count,
    COUNT(DISTINCT jsonb_object_keys(t.species_data)) as unique_species,
    SUM(t.total_occurrences) as total_occurrences,
    ST_Area(e.geom::geography) / 1000000 as area_km2
FROM ecoregions e
LEFT JOIN geohash_species_tiles t ON t.eco_id = e.eco_id
GROUP BY e.eco_id, e.eco_name, e.biome_name, e.realm, e.geom
ORDER BY unique_species DESC;

-- 6. Create biome-level summary
CREATE OR REPLACE VIEW biome_species_summary AS
SELECT 
    biome_name,
    realm,
    COUNT(DISTINCT eco_id) as ecoregion_count,
    COUNT(DISTINCT t.geohash_l7) as tile_count,
    COUNT(DISTINCT jsonb_object_keys(t.species_data)) as unique_species,
    SUM(t.total_occurrences) as total_occurrences,
    SUM(ST_Area(e.geom::geography)) / 1000000 as total_area_km2
FROM ecoregions e
LEFT JOIN geohash_species_tiles t ON t.eco_id = e.eco_id
GROUP BY biome_name, realm
ORDER BY unique_species DESC;

-- Add helpful comments
COMMENT ON TABLE ecoregions IS 'WWF Terrestrial Ecoregions 2017 - global ecoregion boundaries for ecological analysis';
COMMENT ON COLUMN ecoregions.eco_name IS 'Unique name of the ecoregion (e.g., "Amazon Basin moist forests")';
COMMENT ON COLUMN ecoregions.biome_name IS 'Biome classification (e.g., "Tropical & Subtropical Moist Broadleaf Forests")';
COMMENT ON COLUMN ecoregions.realm IS 'Biogeographic realm (e.g., "Neotropical", "Palearctic")';

COMMENT ON VIEW ecoregion_species_summary IS 'Species diversity statistics by ecoregion';
COMMENT ON VIEW biome_species_summary IS 'Species diversity statistics aggregated by biome';

-- 7. Sample analytical queries for reference

/*
-- Find most biodiverse ecoregions
SELECT eco_name, biome_name, unique_species, area_km2,
       unique_species::float / (area_km2 / 1000) as species_per_1000km2
FROM ecoregion_species_summary 
WHERE unique_species > 100
ORDER BY species_per_1000km2 DESC
LIMIT 20;

-- Compare biome diversity
SELECT biome_name, 
       ecoregion_count, 
       unique_species,
       total_area_km2,
       unique_species::float / ecoregion_count as avg_species_per_ecoregion
FROM biome_species_summary 
ORDER BY unique_species DESC;

-- Find species in a specific ecoregion
SELECT DISTINCT jsonb_object_keys(species_data) as taxon_id
FROM geohash_species_tiles 
WHERE eco_name = 'Atlantic forests';

-- Species overlap between ecoregions
SELECT 
    t1.eco_name as ecoregion_1,
    t2.eco_name as ecoregion_2,
    COUNT(DISTINCT s1.taxon_id) as shared_species
FROM (
    SELECT eco_name, jsonb_object_keys(species_data) as taxon_id
    FROM geohash_species_tiles 
    WHERE eco_name = 'Amazon Basin moist forests'
) s1
JOIN (
    SELECT eco_name, jsonb_object_keys(species_data) as taxon_id  
    FROM geohash_species_tiles
    WHERE eco_name = 'Atlantic forests'
) s2 ON s1.taxon_id = s2.taxon_id
CROSS JOIN geohash_species_tiles t1, geohash_species_tiles t2
WHERE t1.eco_name = 'Amazon Basin moist forests' 
  AND t2.eco_name = 'Atlantic forests'
GROUP BY t1.eco_name, t2.eco_name;
*/