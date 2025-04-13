-- Treekipedia Database Updated Schema
-- PostgreSQL version: 14.17
-- Last updated: 2025-04-13

-- Drop tables if they exist (for clean reinstalls)
DROP TABLE IF EXISTS public.contreebution_nfts;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.species;

-- Drop sequences if they exist
DROP SEQUENCE IF EXISTS public.global_id_seq;

-- Drop triggers if they exist
DROP TRIGGER IF EXISTS trigger_update_user_points ON public.contreebution_nfts;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS public.update_user_points();

-- Create sequences
CREATE SEQUENCE public.global_id_seq
    INCREMENT 1
    START 0
    MINVALUE 0
    MAXVALUE 9223372036854775807
    CACHE 1;

COMMENT ON SEQUENCE public.global_id_seq IS 'Generates unique global_id values for contreebution_nfts';

-- Create tables
-- Species Table
CREATE TABLE public.species (
    -- Taxonomic Fields
    taxon_id TEXT NOT NULL,
    species VARCHAR(300), -- Kept for backward compatibility
    species_scientific_name VARCHAR(300), -- New field replacing 'species'
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
    habitat TEXT, -- Original field
    habitat_ai TEXT, -- AI-generated content
    habitat_human TEXT, -- Human-verified content
    forest_type TEXT,
    wetland_type TEXT,
    urban_setting TEXT,
    elevation_ranges TEXT, -- Original field
    elevation_ranges_ai TEXT, -- AI-generated content
    elevation_ranges_human TEXT, -- Human-verified content
    compatible_soil_types TEXT, -- Original field
    compatible_soil_types_ai TEXT, -- AI-generated content
    compatible_soil_types_human TEXT, -- Human-verified content
    associated_species TEXT,
    native_adapted_habitats TEXT, -- Original field
    native_adapted_habitats_ai TEXT, -- AI-generated content
    native_adapted_habitats_human TEXT, -- Human-verified content
    agroforestry_use_cases TEXT, -- Original field
    agroforestry_use_cases_ai TEXT, -- AI-generated content
    agroforestry_use_cases_human TEXT, -- Human-verified content
    successional_stage VARCHAR(300),
    tolerances TEXT,
    forest_layers TEXT,
    
    -- Morphological Characteristics
    growth_form VARCHAR(300), -- Original field
    growth_form_ai VARCHAR(300), -- AI-generated content
    growth_form_human VARCHAR(300), -- Human-verified content
    leaf_type VARCHAR(300), -- Original field
    leaf_type_ai VARCHAR(300), -- AI-generated content
    leaf_type_human VARCHAR(300), -- Human-verified content
    deciduous_evergreen VARCHAR(300), -- Original field
    deciduous_evergreen_ai VARCHAR(300), -- AI-generated content
    deciduous_evergreen_human VARCHAR(300), -- Human-verified content
    flower_color VARCHAR(300), -- Original field
    flower_color_ai VARCHAR(300), -- AI-generated content
    flower_color_human VARCHAR(300), -- Human-verified content
    fruit_type VARCHAR(300), -- Original field
    fruit_type_ai VARCHAR(300), -- AI-generated content
    fruit_type_human VARCHAR(300), -- Human-verified content
    bark_characteristics TEXT, -- Original field
    bark_characteristics_ai TEXT, -- AI-generated content
    bark_characteristics_human TEXT, -- Human-verified content
    maximum_height NUMERIC(10,2), -- Original field
    maximum_height_ai NUMERIC(10,2), -- AI-generated content
    maximum_height_human NUMERIC(10,2), -- Human-verified content
    maximum_diameter NUMERIC(10,2), -- Original field
    maximum_diameter_ai NUMERIC(10,2), -- AI-generated content
    maximum_diameter_human NUMERIC(10,2), -- Human-verified content
    lifespan VARCHAR(300), -- Original field
    lifespan_ai VARCHAR(300), -- AI-generated content
    lifespan_human VARCHAR(300), -- Human-verified content
    maximum_tree_age INTEGER, -- Original field
    maximum_tree_age_ai INTEGER, -- AI-generated content
    maximum_tree_age_human INTEGER, -- Human-verified content
    
    -- Conservation and Management
    conservation_status VARCHAR(300), -- Original field
    conservation_status_ai VARCHAR(300), -- AI-generated content
    conservation_status_human VARCHAR(300), -- Human-verified content
    climate_change_vulnerability VARCHAR(300),
    national_conservation_status TEXT,
    verification_status VARCHAR(300),
    threats TEXT,
    timber_value TEXT,
    non_timber_products TEXT,
    cultural_significance TEXT, -- Original field
    cultural_significance_ai TEXT, -- AI-generated content
    cultural_significance_human TEXT, -- Human-verified content
    cultivars TEXT,
    nutritional_caloric_value TEXT,
    cultivation_details TEXT,
    stewardship_best_practices TEXT, -- Original field
    stewardship_best_practices_ai TEXT, -- AI-generated content
    stewardship_best_practices_human TEXT, -- Human-verified content
    planting_recipes TEXT, -- Original field
    planting_recipes_ai TEXT, -- AI-generated content
    planting_recipes_human TEXT, -- Human-verified content
    pruning_maintenance TEXT, -- Original field
    pruning_maintenance_ai TEXT, -- AI-generated content
    pruning_maintenance_human TEXT, -- Human-verified content
    disease_pest_management TEXT, -- Original field
    disease_pest_management_ai TEXT, -- AI-generated content
    disease_pest_management_human TEXT, -- Human-verified content
    fire_management TEXT, -- Original field
    fire_management_ai TEXT, -- AI-generated content
    fire_management_human TEXT, -- Human-verified content
    
    -- Scientific and Metadata
    general_description TEXT, -- Original field
    general_description_ai TEXT, -- AI-generated content
    general_description_human TEXT, -- Human-verified content
    associated_media TEXT,
    ecological_function TEXT, -- Original field
    ecological_function_ai TEXT, -- AI-generated content
    ecological_function_human TEXT, -- Human-verified content
    default_image VARCHAR(300),
    total_occurrences INTEGER,
    allometric_models TEXT,
    allometric_curve TEXT,
    reference_list TEXT,
    data_sources TEXT,
    ipfs_cid VARCHAR(300),
    
    -- Research status
    researched BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    last_updated_date TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Primary Key Constraint
    CONSTRAINT species_pkey PRIMARY KEY (taxon_id)
);

COMMENT ON TABLE public.species IS 'Contains comprehensive tree species data with separate AI and human-verified fields';
COMMENT ON COLUMN public.species.species IS 'Legacy field, kept for backward compatibility';
COMMENT ON COLUMN public.species.species_scientific_name IS 'Scientific name of the species (replaces old species field)';
COMMENT ON COLUMN public.species.researched IS 'Whether this species has been researched by AI';

-- Treederboard Tables
-- Users Table
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
    display_name TEXT,
    total_points INTEGER DEFAULT 0,
    first_contribution_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_contribution_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    contribution_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.users IS 'Stores user information and their total accumulated points';
COMMENT ON COLUMN public.users.wallet_address IS 'Unique blockchain wallet address of the user';
COMMENT ON COLUMN public.users.total_points IS 'Total points accumulated by the user across all contributions';
COMMENT ON COLUMN public.users.contribution_count IS 'Total number of contributions made by the user';

-- Contreebution NFTs Table
CREATE TABLE public.contreebution_nfts (
    id SERIAL PRIMARY KEY,
    global_id BIGINT UNIQUE NOT NULL DEFAULT nextval('global_id_seq'),
    taxon_id TEXT NOT NULL,
    wallet_address TEXT NOT NULL,
    points INTEGER DEFAULT 2,
    ipfs_cid TEXT,
    transaction_hash TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE public.contreebution_nfts IS 'Tracks all Contreebution NFTs minted for users';
COMMENT ON COLUMN public.contreebution_nfts.global_id IS 'Unique sequential identifier for the NFT';
COMMENT ON COLUMN public.contreebution_nfts.taxon_id IS 'References treekipedia.species.taxon_id';
COMMENT ON COLUMN public.contreebution_nfts.wallet_address IS 'Wallet address of the NFT recipient';
COMMENT ON COLUMN public.contreebution_nfts.points IS 'Points awarded for this contribution, default is 2';
COMMENT ON COLUMN public.contreebution_nfts.ipfs_cid IS 'IPFS CID of the NFT metadata';
COMMENT ON COLUMN public.contreebution_nfts.transaction_hash IS 'Blockchain transaction hash from minting';
COMMENT ON COLUMN public.contreebution_nfts.metadata IS 'Additional JSON metadata for the NFT';

-- Triggers and Functions
-- Function to update user points
CREATE OR REPLACE FUNCTION update_user_points()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (wallet_address, total_points, contribution_count, last_contribution_at)
  VALUES (NEW.wallet_address, NEW.points, 1, CURRENT_TIMESTAMP)
  ON CONFLICT (wallet_address) 
  DO UPDATE SET 
    total_points = users.total_points + NEW.points,
    contribution_count = users.contribution_count + 1,
    last_contribution_at = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.update_user_points() IS 'Updates users table when a new NFT is inserted';

-- Trigger to update user points
CREATE TRIGGER trigger_update_user_points
AFTER INSERT ON public.contreebution_nfts
FOR EACH ROW EXECUTE FUNCTION update_user_points();

-- Indexes
-- Users Table Indexes
CREATE INDEX idx_users_wallet_address ON public.users(wallet_address);

-- Contreebution NFTs Table Indexes
CREATE INDEX idx_contreebution_nfts_wallet_address ON public.contreebution_nfts(wallet_address);
CREATE INDEX idx_contreebution_nfts_taxon_id ON public.contreebution_nfts(taxon_id);

-- Species Table Indexes
CREATE INDEX idx_species_taxon_id ON public.species(taxon_id);
CREATE INDEX idx_species_common_name ON public.species(common_name);
CREATE INDEX idx_species_species_scientific_name ON public.species(species_scientific_name);
CREATE INDEX idx_species_accepted_scientific_name ON public.species(accepted_scientific_name);
CREATE INDEX idx_species_researched ON public.species(researched);