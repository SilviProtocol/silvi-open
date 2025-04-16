-- Migration script to update species table schema
-- Author: Claude
-- Date: 2025-04-13

-- Step 1: Add new fields with _ai and _human suffixes
-- First, alter the table to add new fields

ALTER TABLE public.species 
-- Rename 'species' to 'species_scientific_name'
ADD COLUMN species_scientific_name VARCHAR(300),

-- Removed researched boolean field

-- Add new fields with _ai and _human suffixes for existing fields
-- Conservation and description fields
ADD COLUMN conservation_status_ai VARCHAR(50),
ADD COLUMN conservation_status_human VARCHAR(50),
ADD COLUMN general_description_ai TEXT,
ADD COLUMN general_description_human TEXT,

-- Ecological function fields
ADD COLUMN ecological_function_ai TEXT,
ADD COLUMN ecological_function_human TEXT,

-- Habitat-related fields
ADD COLUMN habitat_ai TEXT,
ADD COLUMN habitat_human TEXT,
ADD COLUMN elevation_ranges_ai TEXT,
ADD COLUMN elevation_ranges_human TEXT,
ADD COLUMN compatible_soil_types_ai TEXT,
ADD COLUMN compatible_soil_types_human TEXT,
ADD COLUMN native_adapted_habitats_ai TEXT,
ADD COLUMN native_adapted_habitats_human TEXT,
ADD COLUMN agroforestry_use_cases_ai TEXT,
ADD COLUMN agroforestry_use_cases_human TEXT,

-- Morphological characteristics fields
ADD COLUMN growth_form_ai VARCHAR(50),
ADD COLUMN growth_form_human VARCHAR(50),
ADD COLUMN leaf_type_ai VARCHAR(50),
ADD COLUMN leaf_type_human VARCHAR(50),
ADD COLUMN deciduous_evergreen_ai VARCHAR(20),
ADD COLUMN deciduous_evergreen_human VARCHAR(20),
ADD COLUMN flower_color_ai VARCHAR(50),
ADD COLUMN flower_color_human VARCHAR(50),
ADD COLUMN fruit_type_ai VARCHAR(50),
ADD COLUMN fruit_type_human VARCHAR(50),
ADD COLUMN bark_characteristics_ai TEXT,
ADD COLUMN bark_characteristics_human TEXT,
ADD COLUMN maximum_height_ai NUMERIC(10,2),
ADD COLUMN maximum_height_human NUMERIC(10,2),
ADD COLUMN maximum_diameter_ai NUMERIC(10,2),
ADD COLUMN maximum_diameter_human NUMERIC(10,2),
ADD COLUMN lifespan_ai VARCHAR(50),
ADD COLUMN lifespan_human VARCHAR(50),
ADD COLUMN maximum_tree_age_ai INTEGER,
ADD COLUMN maximum_tree_age_human INTEGER,

-- Stewardship practices
ADD COLUMN stewardship_best_practices_ai TEXT,
ADD COLUMN stewardship_best_practices_human TEXT,
ADD COLUMN planting_recipes_ai TEXT,
ADD COLUMN planting_recipes_human TEXT,
ADD COLUMN pruning_maintenance_ai TEXT,
ADD COLUMN pruning_maintenance_human TEXT,
ADD COLUMN disease_pest_management_ai TEXT,
ADD COLUMN disease_pest_management_human TEXT,
ADD COLUMN fire_management_ai TEXT,
ADD COLUMN fire_management_human TEXT,
ADD COLUMN cultural_significance_ai TEXT,
ADD COLUMN cultural_significance_human TEXT;

-- Step 2: Initialize species_scientific_name from current species field
UPDATE public.species SET species_scientific_name = species;

-- Step 3: Update indexes for the new fields
CREATE INDEX idx_species_species_scientific_name ON public.species(species_scientific_name);
DROP INDEX IF EXISTS idx_species_accepted_scientific_name;
CREATE INDEX idx_species_accepted_scientific_name ON public.species(accepted_scientific_name);
-- Removed researched index

-- Step 4: Create a complete schema update that we can use for a fresh install
-- This is a separate SQL file that we'll generate as a reference
-- for future database reinstalls

-- Done! Applied all schema changes to support AI research and human verification