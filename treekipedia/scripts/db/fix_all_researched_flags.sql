-- Fix researched flags for all species
-- This script sets researched=TRUE for any species with AI content
-- or legacy content fields

-- Step 1: Set researched=TRUE for any species with AI data
UPDATE species
SET researched = TRUE
WHERE (
  general_description_ai IS NOT NULL AND general_description_ai != '' OR
  habitat_ai IS NOT NULL AND habitat_ai != '' OR
  ecological_function_ai IS NOT NULL AND ecological_function_ai != '' OR
  stewardship_best_practices_ai IS NOT NULL AND stewardship_best_practices_ai != '' OR
  growth_form_ai IS NOT NULL AND growth_form_ai != '' OR
  compatible_soil_types_ai IS NOT NULL AND compatible_soil_types_ai != ''
);

-- Step 2: Also set researched=TRUE for species with legacy data
-- (but don't have AI data yet)
UPDATE species
SET researched = TRUE
WHERE researched = FALSE AND (
  general_description IS NOT NULL AND general_description != '' OR
  habitat IS NOT NULL AND habitat != '' OR
  ecological_function IS NOT NULL AND ecological_function != '' OR
  stewardship_best_practices IS NOT NULL AND stewardship_best_practices != '' OR
  growth_form IS NOT NULL AND growth_form != '' OR
  compatible_soil_types IS NOT NULL AND compatible_soil_types != '' 
);

-- Step 3: Get database statistics
SELECT 
  COUNT(*) as total_species,
  COUNT(*) FILTER (WHERE researched = TRUE) as researched_species,
  COUNT(*) FILTER (WHERE general_description_ai IS NOT NULL AND general_description_ai != '') as has_ai_description,
  COUNT(*) FILTER (WHERE habitat_ai IS NOT NULL AND habitat_ai != '') as has_ai_habitat,
  COUNT(*) FILTER (WHERE stewardship_best_practices_ai IS NOT NULL AND stewardship_best_practices_ai != '') as has_ai_stewardship
FROM species;