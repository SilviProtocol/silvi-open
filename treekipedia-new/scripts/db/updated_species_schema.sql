-- Updated Treekipedia Species Table Schema with VARCHAR(300)
CREATE TABLE public.species (
    -- Taxonomic Fields
    taxon_id TEXT NOT NULL,
    species VARCHAR(300),
    family VARCHAR(300),
    genus VARCHAR(300),
    subspecies TEXT,
    specific_epithet VARCHAR(300),
    accepted_scientific_name TEXT,
    synonyms TEXT,
    
    -- Common Names and Locations
    common_name TEXT,
    common_countries TEXT,
    countries_introduced TEXT,
    countries_invasive TEXT,
    countries_native TEXT,
    
    -- Ecological Data
    class VARCHAR(300),
    taxonomic_order VARCHAR(300),
    ecoregions TEXT,
    biomes TEXT,
    habitat TEXT,
    forest_type TEXT,
    wetland_type TEXT,
    urban_setting TEXT,
    elevation_ranges TEXT,
    compatible_soil_types TEXT,
    associated_species TEXT,
    native_adapted_habitats TEXT,
    agroforestry_use_cases TEXT,
    successional_stage VARCHAR(300),
    tolerances TEXT,
    forest_layers TEXT,
    
    -- Morphological Characteristics
    growth_form VARCHAR(300),
    leaf_type VARCHAR(300),
    deciduous_evergreen VARCHAR(300),
    flower_color VARCHAR(300),
    fruit_type VARCHAR(300),
    bark_characteristics TEXT,
    maximum_height NUMERIC(10,2),
    maximum_diameter NUMERIC(10,2),
    lifespan VARCHAR(300),
    maximum_tree_age INTEGER,
    
    -- Conservation and Management
    conservation_status VARCHAR(300),
    climate_change_vulnerability VARCHAR(300),
    national_conservation_status TEXT,
    verification_status VARCHAR(300),
    threats TEXT,
    timber_value TEXT,
    non_timber_products TEXT,
    cultural_significance TEXT,
    cultivars TEXT,
    nutritional_caloric_value TEXT,
    cultivation_details TEXT,
    stewardship_best_practices TEXT,
    planting_recipes TEXT,
    pruning_maintenance TEXT,
    disease_pest_management TEXT,
    fire_management TEXT,
    
    -- Scientific and Metadata
    general_description TEXT,
    associated_media TEXT,
    ecological_function TEXT,
    default_image VARCHAR(300),
    total_occurrences INTEGER,
    allometric_models TEXT,
    allometric_curve TEXT,
    reference_list TEXT,
    data_sources TEXT,
    ipfs_cid VARCHAR(300),
    last_updated_date TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Primary Key Constraint
    CONSTRAINT species_pkey PRIMARY KEY (taxon_id)
);