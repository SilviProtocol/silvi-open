-- Fix for the specific species AngNAParc36603-00
-- This will set researched=TRUE if the species has either:
-- 1. Legacy description field data or
-- 2. AI field data

UPDATE species
SET researched = TRUE
WHERE taxon_id = 'AngNAParc36603-00' AND
      (
        (general_description IS NOT NULL AND general_description != '') OR
        (general_description_ai IS NOT NULL AND general_description_ai != '') OR
        (habitat_ai IS NOT NULL AND habitat_ai != '') OR
        (ecological_function_ai IS NOT NULL AND ecological_function_ai != '')
      );

-- Then check the result
SELECT taxon_id, species_scientific_name, researched, 
       (general_description IS NOT NULL AND general_description != '') AS has_legacy_desc,
       (general_description_ai IS NOT NULL AND general_description_ai != '') AS has_ai_desc
FROM species
WHERE taxon_id = 'AngNAParc36603-00';