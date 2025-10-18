-- Treekipedia v8 Import Script with TaxonID Fix
-- This script imports data from v8 chunks, fixes malformed taxon_ids,
-- updates existing main species with new v8 data, and creates separate subspecies records

-- Add any missing v8 columns to the species table
DO $$
BEGIN
    -- Add new v8 soil data fields if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'species' AND column_name = 'soil_texture_all') THEN
        ALTER TABLE species ADD COLUMN soil_texture_all TEXT;
        ALTER TABLE species ADD COLUMN soil_texture_dominant TEXT;
        ALTER TABLE species ADD COLUMN soil_texture_prefered TEXT;
        ALTER TABLE species ADD COLUMN soil_texture_tolerated TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'species' AND column_name = 'ph_all') THEN
        ALTER TABLE species ADD COLUMN ph_all TEXT;
        ALTER TABLE species ADD COLUMN ph_dominant TEXT;
        ALTER TABLE species ADD COLUMN ph_prefered TEXT;
        ALTER TABLE species ADD COLUMN ph_tolerated TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'species' AND column_name = 'oc_all') THEN
        ALTER TABLE species ADD COLUMN oc_all TEXT;
        ALTER TABLE species ADD COLUMN oc_dominant TEXT;
        ALTER TABLE species ADD COLUMN oc_prefered TEXT;
        ALTER TABLE species ADD COLUMN oc_tolerated TEXT;
    END IF;
    
    -- Add new v8 ecosystem fields if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'species' AND column_name = 'present_intact_forest') THEN
        ALTER TABLE species ADD COLUMN present_intact_forest TEXT;
        ALTER TABLE species ADD COLUMN "functional_ecosystem_groups.x" TEXT;
        ALTER TABLE species ADD COLUMN "functional_ecosystem_groups.y" TEXT;
        ALTER TABLE species ADD COLUMN vegetationtype TEXT;
    END IF;
    
    -- Ensure legacy_taxon_id exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'species' AND column_name = 'legacy_taxon_id') THEN
        ALTER TABLE species ADD COLUMN legacy_taxon_id TEXT;
    END IF;
END $$;

-- Create comprehensive table matching v8 CSV structure (110 columns)
DROP TABLE IF EXISTS species_v8_import;

CREATE TABLE species_v8_import (
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
    "ComercialSpecies" TEXT, -- Note: misspelled in CSV
    default_image VARCHAR(500),
    habitat_human TEXT,
    total_occurrences INTEGER,
    specific_epithet VARCHAR(500),
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
    bioregions TEXT,
    conservation_status_human VARCHAR(500),
    -- NEW v8 Soil Data Fields
    "Soil_texture_all" TEXT,
    "Soil_texture_dominant" TEXT,
    "Soil_texture_prefered" TEXT, -- Note: misspelled in CSV
    "Soil_texture_tolerated" TEXT,
    "pH_all" TEXT,
    "pH_dominant" TEXT,
    "pH_prefered" TEXT, -- Note: misspelled in CSV
    "pH_tolerated" TEXT,
    "OC_all" TEXT,
    "OC_dominant" TEXT,
    "OC_prefered" TEXT, -- Note: misspelled in CSV
    "OC_tolerated" TEXT,
    countries_native TEXT,
    countries_invasive TEXT,
    countries_introduced TEXT,
    -- NEW v8 Ecosystem Fields
    "Present_Intact_Forest" TEXT,
    "functional_ecosystem_groups.x" TEXT,
    "functional_ecosystem_groups.y" TEXT,
    "vegetationType" TEXT,
    "comercialSpecies" TEXT -- Note: duplicate misspelled field
);

SELECT 'Import table created. Ready for CSV import.' AS status;

-- Note: Helper columns will be added after CSV import

-- Function to process taxon_ids and assign proper IDs
-- This will be called after all CSV data is loaded

CREATE OR REPLACE FUNCTION process_v8_taxon_ids() 
RETURNS TABLE(processed_count INTEGER, main_species_count INTEGER, subspecies_count INTEGER) 
LANGUAGE plpgsql AS $$
DECLARE 
    rec RECORD;
    base_taxon_id TEXT;
    subspecies_counter INTEGER;
BEGIN
    processed_count := 0;
    main_species_count := 0;
    subspecies_count := 0;
    
    -- Add helper columns after CSV import
    ALTER TABLE species_v8_import ADD COLUMN IF NOT EXISTS new_taxon_id TEXT;
    ALTER TABLE species_v8_import ADD COLUMN IF NOT EXISTS legacy_taxon_id_value TEXT;
    ALTER TABLE species_v8_import ADD COLUMN IF NOT EXISTS is_main_species BOOLEAN DEFAULT FALSE;
    ALTER TABLE species_v8_import ADD COLUMN IF NOT EXISTS row_number_within_species INTEGER;
    
    -- Mark main species vs subspecies
    UPDATE species_v8_import 
    SET is_main_species = (subspecies IS NULL OR subspecies = '' OR subspecies = 'NA');
    
    -- Store original taxon_id as legacy
    UPDATE species_v8_import 
    SET legacy_taxon_id_value = taxon_id;
    
    -- Process each species group
    FOR rec IN 
        SELECT DISTINCT species_scientific_name 
        FROM species_v8_import 
        ORDER BY species_scientific_name
    LOOP
        -- Get base taxon_id (extract from first occurrence, remove -XX suffix)
        SELECT regexp_replace(trim(split_part(taxon_id, ';', 1)), '-[0-9]+$', '') 
        INTO base_taxon_id
        FROM species_v8_import 
        WHERE species_scientific_name = rec.species_scientific_name 
        LIMIT 1;
        
        -- Add row numbers within each species group (main first, then subspecies alphabetically)
        WITH numbered_rows AS (
            SELECT ctid, 
                   ROW_NUMBER() OVER (
                       ORDER BY is_main_species DESC, subspecies
                   ) as rn
            FROM species_v8_import 
            WHERE species_scientific_name = rec.species_scientific_name
        )
        UPDATE species_v8_import 
        SET row_number_within_species = numbered_rows.rn
        FROM numbered_rows 
        WHERE species_v8_import.ctid = numbered_rows.ctid;
        
        -- Assign new taxon_ids
        subspecies_counter := 1;
        
        FOR rec IN 
            SELECT ctid, is_main_species, row_number_within_species
            FROM species_v8_import 
            WHERE species_scientific_name = rec.species_scientific_name
            ORDER BY row_number_within_species
        LOOP
            IF rec.is_main_species THEN
                -- Main species gets -00
                UPDATE species_v8_import 
                SET new_taxon_id = base_taxon_id || '-00'
                WHERE ctid = rec.ctid;
                main_species_count := main_species_count + 1;
            ELSE
                -- Subspecies get sequential -01, -02, -03
                UPDATE species_v8_import 
                SET new_taxon_id = base_taxon_id || '-' || LPAD(subspecies_counter::TEXT, 2, '0')
                WHERE ctid = rec.ctid;
                subspecies_counter := subspecies_counter + 1;
                subspecies_count := subspecies_count + 1;
            END IF;
            
            processed_count := processed_count + 1;
        END LOOP;
    END LOOP;
    
    RETURN QUERY SELECT processed_count, main_species_count, subspecies_count;
END $$;

-- Import function to update/insert species data
CREATE OR REPLACE FUNCTION import_v8_species_data() 
RETURNS TABLE(updated_count INTEGER, inserted_count INTEGER) 
LANGUAGE plpgsql AS $$
DECLARE
    update_count INTEGER := 0;
    insert_count INTEGER := 0;
BEGIN
    -- Update existing main species with v8 data + legacy_taxon_id
    WITH updated AS (
        UPDATE species 
        SET 
            -- Update all v8 fields while preserving AI research
            species_scientific_name = COALESCE(v8.species_scientific_name, species.species_scientific_name),
            family = COALESCE(v8.family, species.family),
            genus = COALESCE(v8.genus, species.genus),
            specific_epithet = COALESCE(v8.specific_epithet, species.specific_epithet),
            accepted_scientific_name = COALESCE(v8.accepted_scientific_name, species.accepted_scientific_name),
            synonyms = COALESCE(v8.synonyms, species.synonyms),
            common_name = COALESCE(v8.common_name, species.common_name),
            common_countries = COALESCE(v8.common_countries, species.common_countries),
            countries_introduced = COALESCE(v8.countries_introduced, species.countries_introduced),
            countries_invasive = COALESCE(v8.countries_invasive, species.countries_invasive),
            countries_native = COALESCE(v8.countries_native, species.countries_native),
            class = COALESCE(v8.class, species.class),
            taxonomic_order = COALESCE(v8.taxonomic_order, species.taxonomic_order),
            ecoregions = COALESCE(v8.ecoregions, species.ecoregions),
            biomes = COALESCE(v8.biomes, species.biomes),
            forest_type = COALESCE(v8.forest_type, species.forest_type),
            wetland_type = COALESCE(v8.wetland_type, species.wetland_type),
            urban_setting = COALESCE(v8.urban_setting, species.urban_setting),
            associated_species = COALESCE(v8.associated_species, species.associated_species),
            successional_stage = COALESCE(v8.successional_stage, species.successional_stage),
            tolerances = COALESCE(v8.tolerances, species.tolerances),
            forest_layers = COALESCE(v8.forest_layers, species.forest_layers),
            climate_change_vulnerability = COALESCE(v8.climate_change_vulnerability, species.climate_change_vulnerability),
            national_conservation_status = COALESCE(v8.national_conservation_status, species.national_conservation_status),
            verification_status = COALESCE(v8.verification_status, species.verification_status),
            threats = COALESCE(v8.threats, species.threats),
            timber_value = COALESCE(v8.timber_value, species.timber_value),
            non_timber_products = COALESCE(v8.non_timber_products, species.non_timber_products),
            cultivars = COALESCE(v8.cultivars, species.cultivars),
            nutritional_caloric_value = COALESCE(v8.nutritional_caloric_value, species.nutritional_caloric_value),
            cultivation_details = COALESCE(v8.cultivation_details, species.cultivation_details),
            total_occurrences = COALESCE(v8.total_occurrences, species.total_occurrences),
            allometric_models = COALESCE(v8.allometric_models, species.allometric_models),
            allometric_curve = COALESCE(v8.allometric_curve, species.allometric_curve),
            reference_list = COALESCE(v8.reference_list, species.reference_list),
            data_sources = COALESCE(v8.data_sources, species.data_sources),
            
            -- Human-verified fields (update with v8 human data)
            general_description_human = COALESCE(v8.general_description_human, species.general_description_human),
            ecological_function_human = COALESCE(v8.ecological_function_human, species.ecological_function_human),
            elevation_ranges_human = COALESCE(v8.elevation_ranges_human, species.elevation_ranges_human),
            compatible_soil_types_human = COALESCE(v8.compatible_soil_types_human, species.compatible_soil_types_human),
            habitat_human = COALESCE(v8.habitat_human, species.habitat_human),
            native_adapted_habitats_human = COALESCE(v8.native_adapted_habitats_human, species.native_adapted_habitats_human),
            agroforestry_use_cases_human = COALESCE(v8.agroforestry_use_cases_human, species.agroforestry_use_cases_human),
            growth_form_human = COALESCE(v8.growth_form_human, species.growth_form_human),
            leaf_type_human = COALESCE(v8.leaf_type_human, species.leaf_type_human),
            deciduous_evergreen_human = COALESCE(v8.deciduous_evergreen_human, species.deciduous_evergreen_human),
            flower_color_human = COALESCE(v8.flower_color_human, species.flower_color_human),
            fruit_type_human = COALESCE(v8.fruit_type_human, species.fruit_type_human),
            bark_characteristics_human = COALESCE(v8.bark_characteristics_human, species.bark_characteristics_human),
            maximum_height_human = COALESCE(v8.maximum_height_human, species.maximum_height_human),
            maximum_diameter_human = COALESCE(v8.maximum_diameter_human, species.maximum_diameter_human),
            lifespan_human = COALESCE(v8.lifespan_human, species.lifespan_human),
            maximum_tree_age_human = COALESCE(v8.maximum_tree_age_human, species.maximum_tree_age_human),
            cultural_significance_human = COALESCE(v8.cultural_significance_human, species.cultural_significance_human),
            stewardship_best_practices_human = COALESCE(v8.stewardship_best_practices_human, species.stewardship_best_practices_human),
            planting_recipes_human = COALESCE(v8.planting_recipes_human, species.planting_recipes_human),
            pruning_maintenance_human = COALESCE(v8.pruning_maintenance_human, species.pruning_maintenance_human),
            disease_pest_management_human = COALESCE(v8.disease_pest_management_human, species.disease_pest_management_human),
            fire_management_human = COALESCE(v8.fire_management_human, species.fire_management_human),
            conservation_status_human = COALESCE(v8.conservation_status_human, species.conservation_status_human),
            
            -- PRESERVE existing AI fields (don't overwrite with v8 AI data)
            -- Only update if current field is empty
            conservation_status_ai = COALESCE(species.conservation_status_ai, v8.conservation_status_ai),
            general_description_ai = COALESCE(species.general_description_ai, v8.general_description_ai),
            ecological_function_ai = COALESCE(species.ecological_function_ai, v8.ecological_function_ai),
            elevation_ranges_ai = COALESCE(species.elevation_ranges_ai, v8.elevation_ranges_ai),
            compatible_soil_types_ai = COALESCE(species.compatible_soil_types_ai, v8.compatible_soil_types_ai),
            habitat_ai = COALESCE(species.habitat_ai, v8.habitat_ai),
            native_adapted_habitats_ai = COALESCE(species.native_adapted_habitats_ai, v8.native_adapted_habitats_ai),
            agroforestry_use_cases_ai = COALESCE(species.agroforestry_use_cases_ai, v8.agroforestry_use_cases_ai),
            growth_form_ai = COALESCE(species.growth_form_ai, v8.growth_form_ai),
            leaf_type_ai = COALESCE(species.leaf_type_ai, v8.leaf_type_ai),
            deciduous_evergreen_ai = COALESCE(species.deciduous_evergreen_ai, v8.deciduous_evergreen_ai),
            flower_color_ai = COALESCE(species.flower_color_ai, v8.flower_color_ai),
            fruit_type_ai = COALESCE(species.fruit_type_ai, v8.fruit_type_ai),
            bark_characteristics_ai = COALESCE(species.bark_characteristics_ai, v8.bark_characteristics_ai),
            maximum_height_ai = COALESCE(species.maximum_height_ai, v8.maximum_height_ai),
            maximum_diameter_ai = COALESCE(species.maximum_diameter_ai, v8.maximum_diameter_ai),
            lifespan_ai = COALESCE(species.lifespan_ai, v8.lifespan_ai),
            maximum_tree_age_ai = COALESCE(species.maximum_tree_age_ai, v8.maximum_tree_age_ai),
            stewardship_best_practices_ai = COALESCE(species.stewardship_best_practices_ai, v8.stewardship_best_practices_ai),
            planting_recipes_ai = COALESCE(species.planting_recipes_ai, v8.planting_recipes_ai),
            pruning_maintenance_ai = COALESCE(species.pruning_maintenance_ai, v8.pruning_maintenance_ai),
            disease_pest_management_ai = COALESCE(species.disease_pest_management_ai, v8.disease_pest_management_ai),
            fire_management_ai = COALESCE(species.fire_management_ai, v8.fire_management_ai),
            cultural_significance_ai = COALESCE(species.cultural_significance_ai, v8.cultural_significance_ai),
            
            -- Existing fields
            bioregions = COALESCE(v8.bioregions, species.bioregions),
            commercial_species = COALESCE(
                NULLIF(v8."ComercialSpecies", ''), 
                NULLIF(v8."comercialSpecies", ''), 
                species.commercial_species
            ),
            
            -- NEW v8 Soil Data Fields
            soil_texture_all = v8."Soil_texture_all",
            soil_texture_dominant = v8."Soil_texture_dominant",
            soil_texture_prefered = v8."Soil_texture_prefered",
            soil_texture_tolerated = v8."Soil_texture_tolerated",
            ph_all = v8."pH_all",
            ph_dominant = v8."pH_dominant",
            ph_prefered = v8."pH_prefered",
            ph_tolerated = v8."pH_tolerated",
            oc_all = v8."OC_all",
            oc_dominant = v8."OC_dominant",
            oc_prefered = v8."OC_prefered",
            oc_tolerated = v8."OC_tolerated",
            
            -- NEW v8 Ecosystem Fields
            present_intact_forest = v8."Present_Intact_Forest",
            "functional_ecosystem_groups.x" = v8."functional_ecosystem_groups.x",
            "functional_ecosystem_groups.y" = v8."functional_ecosystem_groups.y",
            vegetationtype = v8."vegetationType",
            
            -- Legacy taxon_id for geohash mapping
            legacy_taxon_id = v8.legacy_taxon_id_value,
            
            -- Update timestamp
            updated_at = CURRENT_TIMESTAMP
            
        FROM species_v8_import v8
        WHERE species.taxon_id = v8.new_taxon_id 
          AND v8.is_main_species = TRUE
        RETURNING 1
    )
    SELECT COUNT(*) INTO update_count FROM updated;
    
    -- Insert new subspecies records
    INSERT INTO species (
        taxon_id, species_scientific_name, family, genus, subspecies,
        specific_epithet, accepted_scientific_name, synonyms, common_name,
        common_countries, countries_introduced, countries_invasive, countries_native,
        class, taxonomic_order, ecoregions, biomes, forest_type,
        wetland_type, urban_setting, associated_species, successional_stage,
        tolerances, forest_layers, climate_change_vulnerability,
        national_conservation_status, verification_status, threats,
        timber_value, non_timber_products, cultivars, nutritional_caloric_value,
        cultivation_details, total_occurrences, allometric_models, allometric_curve,
        reference_list, data_sources,
        
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
        
        -- AI fields (from v8)
        conservation_status_ai, general_description_ai, ecological_function_ai,
        elevation_ranges_ai, compatible_soil_types_ai, habitat_ai,
        native_adapted_habitats_ai, agroforestry_use_cases_ai, growth_form_ai,
        leaf_type_ai, deciduous_evergreen_ai, flower_color_ai, fruit_type_ai,
        bark_characteristics_ai, maximum_height_ai, maximum_diameter_ai,
        lifespan_ai, maximum_tree_age_ai, stewardship_best_practices_ai,
        planting_recipes_ai, pruning_maintenance_ai, disease_pest_management_ai,
        fire_management_ai, cultural_significance_ai,
        
        -- Existing fields
        bioregions, commercial_species, researched, legacy_taxon_id,
        
        -- NEW v8 Soil Data Fields
        soil_texture_all, soil_texture_dominant, soil_texture_prefered, soil_texture_tolerated,
        ph_all, ph_dominant, ph_prefered, ph_tolerated,
        oc_all, oc_dominant, oc_prefered, oc_tolerated,
        
        -- NEW v8 Ecosystem Fields
        present_intact_forest, "functional_ecosystem_groups.x", "functional_ecosystem_groups.y", vegetationtype,
        
        created_at, updated_at
    )
    SELECT 
        new_taxon_id, species_scientific_name, family, genus, subspecies,
        specific_epithet, accepted_scientific_name, synonyms, common_name,
        common_countries, countries_introduced, countries_invasive, countries_native,
        class, taxonomic_order, ecoregions, biomes, forest_type,
        wetland_type, urban_setting, associated_species, successional_stage,
        tolerances, forest_layers, climate_change_vulnerability,
        national_conservation_status, verification_status, threats,
        timber_value, non_timber_products, cultivars, nutritional_caloric_value,
        cultivation_details, total_occurrences, allometric_models, allometric_curve,
        reference_list, data_sources,
        
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
        
        -- AI fields (from v8)
        conservation_status_ai, general_description_ai, ecological_function_ai,
        elevation_ranges_ai, compatible_soil_types_ai, habitat_ai,
        native_adapted_habitats_ai, agroforestry_use_cases_ai, growth_form_ai,
        leaf_type_ai, deciduous_evergreen_ai, flower_color_ai, fruit_type_ai,
        bark_characteristics_ai, maximum_height_ai, maximum_diameter_ai,
        lifespan_ai, maximum_tree_age_ai, stewardship_best_practices_ai,
        planting_recipes_ai, pruning_maintenance_ai, disease_pest_management_ai,
        fire_management_ai, cultural_significance_ai,
        
        -- Existing fields
        bioregions,
        COALESCE(NULLIF("ComercialSpecies", ''), NULLIF("comercialSpecies", '')) as commercial_species,
        researched,
        legacy_taxon_id_value,
        
        -- NEW v8 Soil Data Fields
        "Soil_texture_all", "Soil_texture_dominant", "Soil_texture_prefered", "Soil_texture_tolerated",
        "pH_all", "pH_dominant", "pH_prefered", "pH_tolerated",
        "OC_all", "OC_dominant", "OC_prefered", "OC_tolerated",
        
        -- NEW v8 Ecosystem Fields
        "Present_Intact_Forest", "functional_ecosystem_groups.x", "functional_ecosystem_groups.y", "vegetationType",
        
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    FROM species_v8_import
    WHERE is_main_species = FALSE;
    
    GET DIAGNOSTICS insert_count = ROW_COUNT;
    
    RETURN QUERY SELECT update_count, insert_count;
END $$;

SELECT 'V8 import script ready. Next steps:' AS status;
SELECT '1. Load CSV chunks into species_v8_import table' AS step;
SELECT '2. Run: SELECT * FROM process_v8_taxon_ids();' AS step;
SELECT '3. Run: SELECT * FROM import_v8_species_data();' AS step;