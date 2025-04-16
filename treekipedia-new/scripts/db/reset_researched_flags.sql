-- Reset incorrectly set researched flags
-- This script sets researched=FALSE for any species WITHOUT AI content

-- First, check how many species are incorrectly marked as researched
SELECT
  COUNT(*) as total_marked_as_researched,
  COUNT(*) FILTER (WHERE general_description_ai IS NULL OR general_description_ai = '') as without_ai_description
FROM species
WHERE researched = TRUE;

-- Reset the researched flag to FALSE for all species without AI data
UPDATE species
SET researched = FALSE
WHERE researched = TRUE
AND (
  general_description_ai IS NULL OR general_description_ai = ''
)
AND (
  habitat_ai IS NULL OR habitat_ai = ''
)
AND (
  ecological_function_ai IS NULL OR ecological_function_ai = ''
)
AND (
  stewardship_best_practices_ai IS NULL OR stewardship_best_practices_ai = ''
);

-- Show the results after the update
SELECT 
  COUNT(*) as total_species,
  COUNT(*) FILTER (WHERE researched = TRUE) as researched_species,
  COUNT(*) FILTER (WHERE general_description_ai IS NOT NULL AND general_description_ai != '') as has_ai_description,
  COUNT(*) FILTER (WHERE habitat_ai IS NOT NULL AND habitat_ai != '') as has_ai_habitat,
  COUNT(*) FILTER (WHERE stewardship_best_practices_ai IS NOT NULL AND stewardship_best_practices_ai != '') as has_ai_stewardship
FROM species;