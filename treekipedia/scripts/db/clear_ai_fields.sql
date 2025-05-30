-- Script to clear all _ai fields in the species table
-- This script will:
-- 1. Set all _ai fields to NULL
-- 2. Reset the 'researched' flag to FALSE for all species
-- 
-- Usage: psql -d your_database_name -f clear_ai_fields.sql
--   or via the pool.query method in Node.js

BEGIN;

-- Update all species records to set _ai fields to NULL
UPDATE species
SET 
  -- Ecology fields
  conservation_status_ai = NULL,
  general_description_ai = NULL,
  ecological_function_ai = NULL,
  habitat_ai = NULL,
  elevation_ranges_ai = NULL,
  compatible_soil_types_ai = NULL,
  native_adapted_habitats_ai = NULL,
  agroforestry_use_cases_ai = NULL,
  
  -- Physical characteristics
  growth_form_ai = NULL,
  leaf_type_ai = NULL,
  deciduous_evergreen_ai = NULL,
  flower_color_ai = NULL,
  fruit_type_ai = NULL,
  bark_characteristics_ai = NULL,
  maximum_height_ai = NULL,
  maximum_diameter_ai = NULL,
  lifespan_ai = NULL,
  maximum_tree_age_ai = NULL,
  
  -- Stewardship fields
  stewardship_best_practices_ai = NULL,
  planting_recipes_ai = NULL,
  pruning_maintenance_ai = NULL,
  disease_pest_management_ai = NULL,
  fire_management_ai = NULL,
  cultural_significance_ai = NULL,
  
  -- Reset researched flag
  researched = FALSE;

-- Verify count of updated records
SELECT COUNT(*) AS records_updated FROM species;

COMMIT;