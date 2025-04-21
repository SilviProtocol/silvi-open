-- SQL script to fix taxon_id field by keeping only the main species taxon_id

-- First, let's create a backup of the current state
CREATE TABLE IF NOT EXISTS species_taxon_id_backup AS 
SELECT taxon_id, species_scientific_name 
FROM species;

-- Log the count of problematic records before fixing
SELECT 
  COUNT(*) AS total_species_count,
  COUNT(*) FILTER (WHERE taxon_id LIKE '%;%') AS compound_taxon_ids,
  COUNT(*) FILTER (WHERE taxon_id NOT LIKE '%;%') AS simple_taxon_ids
FROM species;

-- Log a few examples of compound taxon_ids for verification
SELECT taxon_id, species_scientific_name 
FROM species 
WHERE taxon_id LIKE '%;%'
LIMIT 5;

-- Update all species records to keep only the main species taxon_id
-- We'll extract everything before the first semicolon
UPDATE species
SET taxon_id = TRIM(SUBSTRING(taxon_id FROM 1 FOR POSITION(';' IN taxon_id || ';') - 1))
WHERE taxon_id LIKE '%;%';

-- Verify the changes were applied correctly
SELECT 
  COUNT(*) AS total_species_count,
  COUNT(*) FILTER (WHERE taxon_id LIKE '%;%') AS compound_taxon_ids_remaining,
  COUNT(*) FILTER (WHERE taxon_id NOT LIKE '%;%') AS simple_taxon_ids_now
FROM species;

-- Check Plumeria rubra specifically to confirm its taxon_id was fixed
SELECT taxon_id, species_scientific_name
FROM species
WHERE species_scientific_name = 'Plumeria rubra';

-- Create a reference table with the original compound taxon_ids
-- This will be useful if you need to restore or reference the subspecies later
CREATE TABLE taxon_id_mapping AS
SELECT 
  s.taxon_id AS current_taxon_id,
  b.taxon_id AS original_taxon_id,
  s.species_scientific_name
FROM species s
JOIN species_taxon_id_backup b ON s.species_scientific_name = b.species_scientific_name;

-- Add an index to make lookups faster
CREATE INDEX idx_taxon_id_mapping_current ON taxon_id_mapping(current_taxon_id);
CREATE INDEX idx_taxon_id_mapping_original ON taxon_id_mapping(original_taxon_id);

-- Log summary of the changes
SELECT 
  'Taxon ID cleanup complete. Original mappings stored in taxon_id_mapping table.' AS message,
  (SELECT COUNT(*) FROM taxon_id_mapping) AS mapping_count;