-- Treekipedia Database Schema
-- PostgreSQL version: 14.17

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
-- 4.1 Species Table
CREATE TABLE public.species (
    -- Taxonomic Fields
    taxon_id TEXT NOT NULL,
    species VARCHAR(100),
    family VARCHAR(100),
    genus VARCHAR(100),
    subspecies TEXT,
    specific_epithet VARCHAR(100),
    accepted_scientific_name TEXT,
    synonyms TEXT,
    
    -- Common Names and Locations
    common_name TEXT,
    common_countries TEXT,
    countries_introduced TEXT,
    countries_invasive TEXT,
    countries_native TEXT,
    
    -- Ecological Data
    class VARCHAR(100),
    taxonomic_order VARCHAR(100),
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
    successional_stage VARCHAR(50),
    tolerances TEXT,
    forest_layers TEXT,
    
    -- Morphological Characteristics
    growth_form VARCHAR(50),
    leaf_type VARCHAR(50),
    deciduous_evergreen VARCHAR(20),
    flower_color VARCHAR(50),
    fruit_type VARCHAR(50),
    bark_characteristics TEXT,
    maximum_height NUMERIC(10,2),
    maximum_diameter NUMERIC(10,2),
    lifespan VARCHAR(50),
    maximum_tree_age INTEGER,
    
    -- Conservation and Management
    conservation_status VARCHAR(50),
    climate_change_vulnerability VARCHAR(50),
    national_conservation_status TEXT,
    verification_status VARCHAR(20),
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
    default_image VARCHAR(255),
    total_occurrences INTEGER,
    allometric_models TEXT,
    allometric_curve TEXT,
    reference_list TEXT,
    data_sources TEXT,
    ipfs_cid VARCHAR(100),
    last_updated_date TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Primary Key Constraint
    CONSTRAINT species_pkey PRIMARY KEY (taxon_id)
);

COMMENT ON TABLE public.species IS 'Contains comprehensive tree species data';

-- 4.2 Treederboard Tables
-- Users Table
CREATE TABLE public.users (
    id SERIAL PRIMARY KEY,
    wallet_address TEXT UNIQUE NOT NULL,
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

-- 4.4 Triggers and Functions
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

-- 4.5 Indexes
-- Users Table Indexes
CREATE INDEX idx_users_wallet_address ON public.users(wallet_address);

-- Contreebution NFTs Table Indexes
CREATE INDEX idx_contreebution_nfts_wallet_address ON public.contreebution_nfts(wallet_address);
CREATE INDEX idx_contreebution_nfts_taxon_id ON public.contreebution_nfts(taxon_id);

-- Species Table Indexes
CREATE INDEX idx_species_taxon_id ON public.species(taxon_id);
CREATE INDEX idx_species_common_name ON public.species(common_name);
CREATE INDEX idx_species_accepted_scientific_name ON public.species(accepted_scientific_name);