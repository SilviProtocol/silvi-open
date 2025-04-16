-- Migration script to remove legacy fields
-- Author: Claude
-- Date: 2025-04-15

-- Step 1: Migrate any data from legacy fields to AI fields if needed
-- For species without existing AI fields but with legacy field data

-- General description
UPDATE species
SET general_description_ai = general_description, researched = TRUE
WHERE general_description IS NOT NULL 
  AND general_description != '' 
  AND (general_description_ai IS NULL OR general_description_ai = '');

-- Habitat
UPDATE species
SET habitat_ai = habitat, researched = TRUE
WHERE habitat IS NOT NULL 
  AND habitat != '' 
  AND (habitat_ai IS NULL OR habitat_ai = '');

-- Ecological function
UPDATE species
SET ecological_function_ai = ecological_function, researched = TRUE
WHERE ecological_function IS NOT NULL 
  AND ecological_function != '' 
  AND (ecological_function_ai IS NULL OR ecological_function_ai = '');

-- Compatible soil types
UPDATE species
SET compatible_soil_types_ai = compatible_soil_types, researched = TRUE
WHERE compatible_soil_types IS NOT NULL 
  AND compatible_soil_types != '' 
  AND (compatible_soil_types_ai IS NULL OR compatible_soil_types_ai = '');

-- Native adapted habitats
UPDATE species
SET native_adapted_habitats_ai = native_adapted_habitats, researched = TRUE
WHERE native_adapted_habitats IS NOT NULL 
  AND native_adapted_habitats != '' 
  AND (native_adapted_habitats_ai IS NULL OR native_adapted_habitats_ai = '');

-- Agroforestry use cases
UPDATE species
SET agroforestry_use_cases_ai = agroforestry_use_cases, researched = TRUE
WHERE agroforestry_use_cases IS NOT NULL 
  AND agroforestry_use_cases != '' 
  AND (agroforestry_use_cases_ai IS NULL OR agroforestry_use_cases_ai = '');

-- Stewardship best practices
UPDATE species
SET stewardship_best_practices_ai = stewardship_best_practices, researched = TRUE
WHERE stewardship_best_practices IS NOT NULL 
  AND stewardship_best_practices != '' 
  AND (stewardship_best_practices_ai IS NULL OR stewardship_best_practices_ai = '');

-- Elevation ranges
UPDATE species
SET elevation_ranges_ai = elevation_ranges, researched = TRUE
WHERE elevation_ranges IS NOT NULL 
  AND elevation_ranges != '' 
  AND (elevation_ranges_ai IS NULL OR elevation_ranges_ai = '');

-- Growth form
UPDATE species
SET growth_form_ai = growth_form, researched = TRUE
WHERE growth_form IS NOT NULL 
  AND growth_form != '' 
  AND (growth_form_ai IS NULL OR growth_form_ai = '');

-- Leaf type
UPDATE species
SET leaf_type_ai = leaf_type, researched = TRUE
WHERE leaf_type IS NOT NULL 
  AND leaf_type != '' 
  AND (leaf_type_ai IS NULL OR leaf_type_ai = '');

-- Deciduous/evergreen
UPDATE species
SET deciduous_evergreen_ai = deciduous_evergreen, researched = TRUE
WHERE deciduous_evergreen IS NOT NULL 
  AND deciduous_evergreen != '' 
  AND (deciduous_evergreen_ai IS NULL OR deciduous_evergreen_ai = '');

-- Flower color
UPDATE species
SET flower_color_ai = flower_color, researched = TRUE
WHERE flower_color IS NOT NULL 
  AND flower_color != '' 
  AND (flower_color_ai IS NULL OR flower_color_ai = '');

-- Fruit type
UPDATE species
SET fruit_type_ai = fruit_type, researched = TRUE
WHERE fruit_type IS NOT NULL 
  AND fruit_type != '' 
  AND (fruit_type_ai IS NULL OR fruit_type_ai = '');

-- Bark characteristics
UPDATE species
SET bark_characteristics_ai = bark_characteristics, researched = TRUE
WHERE bark_characteristics IS NOT NULL 
  AND bark_characteristics != '' 
  AND (bark_characteristics_ai IS NULL OR bark_characteristics_ai = '');

-- Maximum height
UPDATE species
SET maximum_height_ai = maximum_height, researched = TRUE
WHERE maximum_height IS NOT NULL 
  AND (maximum_height_ai IS NULL);

-- Maximum diameter
UPDATE species
SET maximum_diameter_ai = maximum_diameter, researched = TRUE
WHERE maximum_diameter IS NOT NULL 
  AND (maximum_diameter_ai IS NULL);

-- Lifespan
UPDATE species
SET lifespan_ai = lifespan, researched = TRUE
WHERE lifespan IS NOT NULL 
  AND lifespan != '' 
  AND (lifespan_ai IS NULL OR lifespan_ai = '');

-- Maximum tree age
UPDATE species
SET maximum_tree_age_ai = maximum_tree_age, researched = TRUE
WHERE maximum_tree_age IS NOT NULL 
  AND (maximum_tree_age_ai IS NULL);

-- Conservation status
UPDATE species
SET conservation_status_ai = conservation_status, researched = TRUE
WHERE conservation_status IS NOT NULL 
  AND conservation_status != '' 
  AND (conservation_status_ai IS NULL OR conservation_status_ai = '');

-- Cultural significance
UPDATE species
SET cultural_significance_ai = cultural_significance, researched = TRUE
WHERE cultural_significance IS NOT NULL 
  AND cultural_significance != '' 
  AND (cultural_significance_ai IS NULL OR cultural_significance_ai = '');

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
DROP COLUMN IF EXISTS conservation_status,
DROP COLUMN IF EXISTS cultural_significance;

-- Step 3: Display count of species with AI fields
SELECT 
  'Total species: ' || COUNT(*) as total_species,
  'Researched species: ' || COUNT(*) FILTER (WHERE researched = TRUE) as researched_species,
  'Species with AI description: ' || COUNT(*) FILTER (WHERE general_description_ai IS NOT NULL AND general_description_ai != '') as with_ai_description
FROM species;