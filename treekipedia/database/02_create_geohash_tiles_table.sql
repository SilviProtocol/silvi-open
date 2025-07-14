-- Create STAC-compliant geohash species tiles table
-- This table stores Marina's compressed occurrence data in geohash tiles
-- Each tile contains aggregated species counts (no individual occurrences)
-- STAC compliance ensures future interoperability with geospatial tools

-- Drop table if exists for clean migration
DROP TABLE IF EXISTS geohash_species_tiles;

-- Create the main geohash tiles table
CREATE TABLE geohash_species_tiles (
    -- Primary key
    geohash_l7 VARCHAR(7) PRIMARY KEY,
    
    -- Species occurrence data
    species_data JSONB NOT NULL,          -- Format: {"taxon_id": count, "taxon_id": count, ...}
    total_occurrences INTEGER NOT NULL,    -- Sum of all species counts in this tile
    species_count INTEGER NOT NULL,        -- Number of unique species in this tile
    
    -- STAC required temporal field
    datetime TIMESTAMP NOT NULL,           -- Latest observation date or processing date
    
    -- Spatial fields (auto-generated from geohash)
    geometry GEOMETRY(Polygon, 4326),      -- Tile boundary as polygon
    center_point GEOGRAPHY(Point, 4326),   -- Tile center for distance queries
    
    -- Metadata fields
    data_source VARCHAR(100),              -- e.g., 'gbif', 'inaturalist', 'mixed'
    processing_date TIMESTAMP,             -- When Marina processed this tile
    observation_start_date DATE,           -- Earliest observation in tile (optional)
    observation_end_date DATE,             -- Latest observation in tile (optional)
    
    -- Audit fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_geohash_geometry ON geohash_species_tiles USING GIST(geometry);
CREATE INDEX idx_geohash_center_point ON geohash_species_tiles USING GIST(center_point);
CREATE INDEX idx_species_data ON geohash_species_tiles USING GIN(species_data);
CREATE INDEX idx_datetime ON geohash_species_tiles(datetime);
CREATE INDEX idx_species_count ON geohash_species_tiles(species_count);
CREATE INDEX idx_total_occurrences ON geohash_species_tiles(total_occurrences);

-- Create composite index for common query patterns
CREATE INDEX idx_datetime_geometry ON geohash_species_tiles(datetime, geometry);

-- Add comments for documentation
COMMENT ON TABLE geohash_species_tiles IS 'STAC-compliant table storing compressed species occurrence data in level 7 geohash tiles (~150m resolution)';
COMMENT ON COLUMN geohash_species_tiles.geohash_l7 IS 'Level 7 geohash string (7 characters, ~150m x 150m at equator)';
COMMENT ON COLUMN geohash_species_tiles.species_data IS 'JSONB object with taxon_id as keys and occurrence counts as values';
COMMENT ON COLUMN geohash_species_tiles.datetime IS 'STAC-required temporal field - represents latest observation date in tile or processing date';
COMMENT ON COLUMN geohash_species_tiles.geometry IS 'PostGIS polygon representing the geohash tile boundary';
COMMENT ON COLUMN geohash_species_tiles.center_point IS 'Geographic center point of the geohash tile for distance calculations';

-- Create update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_geohash_species_tiles_updated_at 
    BEFORE UPDATE ON geohash_species_tiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create helper view for STAC-formatted output
CREATE OR REPLACE VIEW geohash_tiles_stac AS
SELECT 
    geohash_l7 as id,
    'Feature' as type,
    ST_AsGeoJSON(geometry)::json as geometry,
    json_build_object(
        'datetime', datetime,
        'species_count', species_count,
        'total_occurrences', total_occurrences,
        'data_source', data_source,
        'processing_date', processing_date,
        'observation_start_date', observation_start_date,
        'observation_end_date', observation_end_date
    ) as properties,
    json_build_object(
        'self', json_build_object(
            'href', '/api/tiles/' || geohash_l7,
            'type', 'application/json'
        )
    ) as links,
    json_build_array('species-occurrences') as collections
FROM geohash_species_tiles;

COMMENT ON VIEW geohash_tiles_stac IS 'STAC Item formatted view of geohash tiles for API responses';

-- Sample query functions
-- Example: Find all species in tiles near a point
/*
SELECT DISTINCT jsonb_object_keys(species_data) as taxon_id
FROM geohash_species_tiles
WHERE ST_DWithin(
    center_point, 
    ST_MakePoint(-122.4194, 37.7749)::geography,  -- San Francisco
    5000  -- 5km radius
);
*/

-- Example: Get species distribution for a specific taxon
/*
SELECT 
    geohash_l7,
    (species_data->>'12345')::int as occurrence_count,
    ST_AsGeoJSON(geometry) as tile_geojson
FROM geohash_species_tiles
WHERE species_data ? '12345'
ORDER BY occurrence_count DESC;
*/