-- Treekipedia Database Reset Script for Launch
-- WARNING: This script permanently deletes data with no backups

BEGIN;

-- 1. Delete all users
TRUNCATE TABLE users CASCADE;
\echo 'All users deleted';

-- 2. Delete all sponsorships and related data
TRUNCATE TABLE sponsorships CASCADE;
\echo 'All sponsorships deleted';

-- 3. Delete all ContreebutionNFT records
TRUNCATE TABLE contreebution_nfts CASCADE;
\echo 'All NFT records deleted';

-- 4. Reset global_id sequence to start from 1
ALTER SEQUENCE global_id_seq RESTART WITH 1;
\echo 'Global ID sequence reset to 1';

-- 5. Reset all AI fields in the species table
UPDATE species SET
    conservation_status_ai = NULL,
    general_description_ai = NULL,
    habitat_ai = NULL,
    elevation_ranges_ai = NULL,
    compatible_soil_types_ai = NULL,
    ecological_function_ai = NULL,
    native_adapted_habitats_ai = NULL,
    agroforestry_use_cases_ai = NULL,
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
    stewardship_best_practices_ai = NULL,
    planting_recipes_ai = NULL,
    pruning_maintenance_ai = NULL,
    disease_pest_management_ai = NULL,
    fire_management_ai = NULL,
    cultural_significance_ai = NULL;
\echo 'All AI research fields reset';

-- 6. Set all species "researched" flag to false
UPDATE species SET researched = FALSE;
\echo 'All species researched flags set to FALSE';

-- 7. Verification queries
SELECT 'Users remaining: ' || COUNT(*) FROM users;
SELECT 'Species with AI data: ' || COUNT(*) FROM species WHERE general_description_ai IS NOT NULL;
SELECT 'Species marked researched: ' || COUNT(*) FROM species WHERE researched = TRUE;
SELECT 'Next global_id value: ' || nextval('global_id_seq') AS next_id;
SELECT setval('global_id_seq', 1, false);
SELECT 'Sponsorships remaining: ' || COUNT(*) FROM sponsorships;
SELECT 'NFT records remaining: ' || COUNT(*) FROM contreebution_nfts;

COMMIT;
\echo 'Database reset completed successfully';