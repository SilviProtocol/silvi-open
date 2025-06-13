-- Migration script to ONLY remove the legacy base fields from species table (keeps researched flag)
-- This script does NOT migrate data (as requested) - just drops the columns

-- Create a backup of the table structure before making changes
DO $$
BEGIN
    EXECUTE 'CREATE TABLE IF NOT EXISTS species_backup_' || to_char(now(), 'YYYYMMDD_HH24MISS') || ' AS TABLE species';
    RAISE NOTICE 'Backup table created';
END $$;

-- Begin transaction
BEGIN;

-- Log the operation
DO $$
BEGIN
    RAISE NOTICE 'Starting removal of legacy base fields at %', NOW();
    RAISE NOTICE 'Skipping data migration as requested - data in base fields will be lost';
END $$;

-- Step 2: Remove all legacy fields
ALTER TABLE public.species
DROP COLUMN IF EXISTS general_description,
DROP COLUMN IF EXISTS habitat,
DROP COLUMN IF EXISTS elevation_ranges,
DROP COLUMN IF EXISTS compatible_soil_types,
DROP COLUMN IF EXISTS ecological_function,
DROP COLUMN IF EXISTS native_adapted_habitats,
DROP COLUMN IF EXISTS agroforestry_use_cases,
DROP COLUMN IF EXISTS growth_form,
DROP COLUMN IF EXISTS leaf_type,
DROP COLUMN IF EXISTS deciduous_evergreen,
DROP COLUMN IF EXISTS flower_color,
DROP COLUMN IF EXISTS fruit_type,
DROP COLUMN IF EXISTS bark_characteristics,
DROP COLUMN IF EXISTS maximum_height,
DROP COLUMN IF EXISTS maximum_diameter,
DROP COLUMN IF EXISTS lifespan,
DROP COLUMN IF EXISTS maximum_tree_age,
DROP COLUMN IF EXISTS stewardship_best_practices,
DROP COLUMN IF EXISTS planting_recipes,
DROP COLUMN IF EXISTS pruning_maintenance,
DROP COLUMN IF EXISTS disease_pest_management,
DROP COLUMN IF EXISTS fire_management,
DROP COLUMN IF EXISTS conservation_status,
DROP COLUMN IF EXISTS cultural_significance;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Legacy base fields removal completed at %', NOW();
END $$;

-- Step 3: Display count of species with AI fields
SELECT 
  'Total species: ' || COUNT(*) as total_species,
  'Researched species: ' || COUNT(*) FILTER (WHERE researched = TRUE) as researched_species,
  'Species with AI description: ' || COUNT(*) FILTER (WHERE general_description_ai IS NOT NULL AND general_description_ai != '') as with_ai_description
FROM species;

-- Commit transaction
COMMIT;