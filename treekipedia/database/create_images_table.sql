-- Images Table Migration
-- Creates table for species image management with attribution
-- Date: June 2025

-- Create Images table
CREATE TABLE images (
  id SERIAL PRIMARY KEY,
  taxon_id TEXT NOT NULL REFERENCES species(taxon_id),
  image_url TEXT NOT NULL,
  license TEXT,
  photographer TEXT,
  page_url TEXT,
  source TEXT DEFAULT 'Wikimedia Commons',
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_images_taxon_id ON images(taxon_id);
CREATE INDEX idx_images_primary ON images(is_primary) WHERE is_primary = true;
CREATE INDEX idx_images_source ON images(source);

-- Add constraint to ensure only one primary image per species
CREATE UNIQUE INDEX idx_images_unique_primary_per_species 
ON images(taxon_id) WHERE is_primary = true;

-- Comments for documentation
COMMENT ON TABLE images IS 'Stores image URLs and metadata for tree species with proper attribution';
COMMENT ON COLUMN images.taxon_id IS 'Reference to species.taxon_id';
COMMENT ON COLUMN images.image_url IS 'Full URL to the image file';
COMMENT ON COLUMN images.license IS 'Creative Commons or other license (e.g., CC-BY-SA-3.0)';
COMMENT ON COLUMN images.photographer IS 'Attribution text for photographer (may contain HTML)';
COMMENT ON COLUMN images.page_url IS 'Original source page URL for the image';
COMMENT ON COLUMN images.source IS 'Data source (e.g., Wikimedia Commons)';
COMMENT ON COLUMN images.is_primary IS 'Whether this is the primary/default image for the species';