-- Treekipedia v6 Import Script
-- This script imports data from treekipedia_v6.csv, filtering for main species only
-- and preserving existing AI-generated content

-- First, add the missing columns to the species table if they don't exist
DO $$
BEGIN
    -- Add bioregions column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'species' AND column_name = 'bioregions') THEN
        ALTER TABLE species ADD COLUMN bioregions TEXT;
    END IF;
    
    -- Add commercial_species column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'species' AND column_name = 'commercial_species') THEN
        ALTER TABLE species ADD COLUMN commercial_species TEXT;
    END IF;
END $$;

-- Create temporary table with CSV columns
DROP TABLE IF EXISTS species_import;

-- Create temporary table based on CSV structure
CREATE TEMP TABLE species_import (
    species_scientific_name VARCHAR(500),
    family VARCHAR(500),
    genus VARCHAR(500),
    subspecies TEXT,
    common_name TEXT,
    common_countries TEXT,
    accepted_scientific_name TEXT,
    taxon_id TEXT,
    class VARCHAR(500),
    taxonomic_order VARCHAR(500),
    ecoregions TEXT,
    biomes TEXT,
    general_description_human TEXT,
    ecological_function_human TEXT,
    elevation_ranges_human TEXT,
    compatible_soil_types_human TEXT,
    countries_native TEXT,
    countries_invasive TEXT,
    "ComercialSpecies" TEXT, -- Note: custom column not in target table
    default_image VARCHAR(500),
    habitat_human TEXT,
    total_occurrences INTEGER,
    specific_epithet VARCHAR(500),
    countries_introduced TEXT,
    conservation_status_ai VARCHAR(500),
    general_description_ai TEXT,
    ecological_function_ai TEXT,
    elevation_ranges_ai TEXT,
    compatible_soil_types_ai TEXT,
    habitat_ai TEXT,
    synonyms TEXT,
    forest_type TEXT,
    wetland_type TEXT,
    urban_setting TEXT,
    climate_change_vulnerability VARCHAR(500),
    associated_species TEXT,
    native_adapted_habitats_ai TEXT,
    native_adapted_habitats_human TEXT,
    agroforestry_use_cases_ai TEXT,
    agroforestry_use_cases_human TEXT,
    successional_stage VARCHAR(500),
    tolerances TEXT,
    forest_layers TEXT,
    growth_form_ai VARCHAR(500),
    growth_form_human VARCHAR(500),
    leaf_type_ai VARCHAR(500),
    leaf_type_human VARCHAR(500),
    deciduous_evergreen_ai VARCHAR(500),
    deciduous_evergreen_human VARCHAR(500),
    flower_color_ai VARCHAR(500),
    flower_color_human VARCHAR(500),
    fruit_type_ai VARCHAR(500),
    fruit_type_human VARCHAR(500),
    bark_characteristics_ai TEXT,
    bark_characteristics_human TEXT,
    maximum_height_ai NUMERIC(10,2),
    maximum_height_human NUMERIC(10,2),
    maximum_diameter_ai NUMERIC(10,2),
    maximum_diameter_human NUMERIC(10,2),
    lifespan_ai VARCHAR(500),
    lifespan_human VARCHAR(500),
    maximum_tree_age_ai INTEGER,
    maximum_tree_age_human INTEGER,
    allometric_models TEXT,
    allometric_curve TEXT,
    national_conservation_status TEXT,
    verification_status VARCHAR(500),
    threats TEXT,
    timber_value TEXT,
    non_timber_products TEXT,
    cultural_significance_ai TEXT,
    cultural_significance_human TEXT,
    cultivars TEXT,
    nutritional_caloric_value TEXT,
    cultivation_details TEXT,
    stewardship_best_practices_ai TEXT,
    stewardship_best_practices_human TEXT,
    planting_recipes_ai TEXT,
    planting_recipes_human TEXT,
    pruning_maintenance_ai TEXT,
    pruning_maintenance_human TEXT,
    disease_pest_management_ai TEXT,
    disease_pest_management_human TEXT,
    fire_management_ai TEXT,
    fire_management_human TEXT,
    reference_list TEXT,
    data_sources TEXT,
    ipfs_cid VARCHAR(500),
    last_updated_date TIMESTAMP WITHOUT TIME ZONE,
    researched BOOLEAN,
    associated_media TEXT,
    bioregions TEXT, -- Note: custom column not in target table
    conservation_status_human VARCHAR(500)
);

-- Import CSV data, converting 'NA' values to NULL
\COPY species_import FROM '/root/silvi-open/treekipedia-new/treekipedia_v6.csv' WITH (FORMAT csv, HEADER true, NULL 'NA');

-- Count records before filtering
SELECT COUNT(*) AS total_records_in_csv FROM species_import;

-- Count main species records to be imported
SELECT COUNT(*) AS main_species_to_import FROM species_import WHERE taxon_id LIKE '%-00';

-- Filter and insert only main species, skip updating _ai fields
INSERT INTO species (
    taxon_id, species_scientific_name, family, genus, subspecies, specific_epithet,
    accepted_scientific_name, synonyms, common_name, common_countries,
    countries_introduced, countries_invasive, countries_native,
    class, taxonomic_order, ecoregions, biomes, forest_type,
    wetland_type, urban_setting, associated_species, successional_stage,
    tolerances, forest_layers, climate_change_vulnerability,
    national_conservation_status, verification_status, threats,
    timber_value, non_timber_products, cultivars, nutritional_caloric_value,
    cultivation_details, associated_media, default_image, total_occurrences,
    allometric_models, allometric_curve, reference_list, data_sources,
    
    -- Human-verified fields
    general_description_human, ecological_function_human,
    elevation_ranges_human, compatible_soil_types_human,
    habitat_human, native_adapted_habitats_human, 
    agroforestry_use_cases_human, growth_form_human, leaf_type_human,
    deciduous_evergreen_human, flower_color_human, fruit_type_human,
    bark_characteristics_human, maximum_height_human, maximum_diameter_human,
    lifespan_human, maximum_tree_age_human, cultural_significance_human,
    stewardship_best_practices_human, planting_recipes_human,
    pruning_maintenance_human, disease_pest_management_human,
    fire_management_human, conservation_status_human,
    
    -- New fields
    bioregions, commercial_species
)
SELECT
    taxon_id, species_scientific_name, family, genus, subspecies, specific_epithet,
    accepted_scientific_name, synonyms, common_name, common_countries,
    countries_introduced, countries_invasive, countries_native,
    class, taxonomic_order, ecoregions, biomes, forest_type,
    wetland_type, urban_setting, associated_species, successional_stage,
    tolerances, forest_layers, climate_change_vulnerability,
    national_conservation_status, verification_status, threats,
    timber_value, non_timber_products, cultivars, nutritional_caloric_value,
    cultivation_details, associated_media, default_image, total_occurrences,
    allometric_models, allometric_curve, reference_list, data_sources,
    
    -- Human-verified fields
    general_description_human, ecological_function_human,
    elevation_ranges_human, compatible_soil_types_human,
    habitat_human, native_adapted_habitats_human, 
    agroforestry_use_cases_human, growth_form_human, leaf_type_human,
    deciduous_evergreen_human, flower_color_human, fruit_type_human,
    bark_characteristics_human, maximum_height_human, maximum_diameter_human,
    lifespan_human, maximum_tree_age_human, 
    -- Handle missing cultural_significance_human by defaulting to NULL
    NULLIF(cultural_significance_human, ''),
    stewardship_best_practices_human, planting_recipes_human,
    pruning_maintenance_human, disease_pest_management_human,
    fire_management_human, conservation_status_human,
    
    -- New fields
    bioregions, "ComercialSpecies" as commercial_species
FROM species_import
WHERE taxon_id LIKE '%-00'
ON CONFLICT (taxon_id)
DO UPDATE SET
    species_scientific_name = EXCLUDED.species_scientific_name,
    family = EXCLUDED.family,
    genus = EXCLUDED.genus,
    subspecies = EXCLUDED.subspecies,
    specific_epithet = EXCLUDED.specific_epithet,
    accepted_scientific_name = EXCLUDED.accepted_scientific_name,
    synonyms = EXCLUDED.synonyms,
    common_name = EXCLUDED.common_name,
    common_countries = EXCLUDED.common_countries,
    countries_introduced = EXCLUDED.countries_introduced,
    countries_invasive = EXCLUDED.countries_invasive,
    countries_native = EXCLUDED.countries_native,
    class = EXCLUDED.class,
    taxonomic_order = EXCLUDED.taxonomic_order,
    ecoregions = EXCLUDED.ecoregions,
    biomes = EXCLUDED.biomes,
    forest_type = EXCLUDED.forest_type,
    wetland_type = EXCLUDED.wetland_type,
    urban_setting = EXCLUDED.urban_setting,
    associated_species = EXCLUDED.associated_species,
    successional_stage = EXCLUDED.successional_stage,
    tolerances = EXCLUDED.tolerances,
    forest_layers = EXCLUDED.forest_layers,
    climate_change_vulnerability = EXCLUDED.climate_change_vulnerability,
    national_conservation_status = EXCLUDED.national_conservation_status,
    verification_status = EXCLUDED.verification_status,
    threats = EXCLUDED.threats,
    timber_value = EXCLUDED.timber_value,
    non_timber_products = EXCLUDED.non_timber_products,
    cultivars = EXCLUDED.cultivars,
    nutritional_caloric_value = EXCLUDED.nutritional_caloric_value,
    cultivation_details = EXCLUDED.cultivation_details,
    associated_media = EXCLUDED.associated_media,
    default_image = EXCLUDED.default_image,
    total_occurrences = EXCLUDED.total_occurrences,
    allometric_models = EXCLUDED.allometric_models,
    allometric_curve = EXCLUDED.allometric_curve,
    reference_list = EXCLUDED.reference_list,
    data_sources = EXCLUDED.data_sources,
    
    -- Human-verified fields only
    general_description_human = EXCLUDED.general_description_human,
    ecological_function_human = EXCLUDED.ecological_function_human,
    elevation_ranges_human = EXCLUDED.elevation_ranges_human,
    compatible_soil_types_human = EXCLUDED.compatible_soil_types_human,
    habitat_human = EXCLUDED.habitat_human,
    native_adapted_habitats_human = EXCLUDED.native_adapted_habitats_human,
    agroforestry_use_cases_human = EXCLUDED.agroforestry_use_cases_human,
    growth_form_human = EXCLUDED.growth_form_human,
    leaf_type_human = EXCLUDED.leaf_type_human,
    deciduous_evergreen_human = EXCLUDED.deciduous_evergreen_human,
    flower_color_human = EXCLUDED.flower_color_human,
    fruit_type_human = EXCLUDED.fruit_type_human,
    bark_characteristics_human = EXCLUDED.bark_characteristics_human,
    maximum_height_human = EXCLUDED.maximum_height_human,
    maximum_diameter_human = EXCLUDED.maximum_diameter_human,
    lifespan_human = EXCLUDED.lifespan_human,
    maximum_tree_age_human = EXCLUDED.maximum_tree_age_human,
    cultural_significance_human = EXCLUDED.cultural_significance_human,
    stewardship_best_practices_human = EXCLUDED.stewardship_best_practices_human,
    planting_recipes_human = EXCLUDED.planting_recipes_human,
    pruning_maintenance_human = EXCLUDED.pruning_maintenance_human,
    disease_pest_management_human = EXCLUDED.disease_pest_management_human,
    fire_management_human = EXCLUDED.fire_management_human,
    conservation_status_human = EXCLUDED.conservation_status_human,
    
    -- New fields
    bioregions = EXCLUDED.bioregions,
    commercial_species = EXCLUDED.commercial_species,
    
    -- Update timestamp
    updated_at = CURRENT_TIMESTAMP;

-- Show counts after import
SELECT 
    (SELECT COUNT(*) FROM species) AS total_species_count,
    (SELECT COUNT(*) FROM species_import WHERE taxon_id LIKE '%-00') AS imported_count;

-- Clean up temporary table
DROP TABLE species_import;