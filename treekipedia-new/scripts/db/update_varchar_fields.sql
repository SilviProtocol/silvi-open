-- Treekipedia Update Script - Increase VARCHAR fields to VARCHAR(300)
-- This script updates all VARCHAR fields in the species table to VARCHAR(300)

-- Update taxonomic fields
ALTER TABLE public.species ALTER COLUMN species TYPE VARCHAR(300);
ALTER TABLE public.species ALTER COLUMN family TYPE VARCHAR(300);
ALTER TABLE public.species ALTER COLUMN genus TYPE VARCHAR(300);
ALTER TABLE public.species ALTER COLUMN specific_epithet TYPE VARCHAR(300);

-- Update ecological data fields
ALTER TABLE public.species ALTER COLUMN class TYPE VARCHAR(300);
ALTER TABLE public.species ALTER COLUMN taxonomic_order TYPE VARCHAR(300);
ALTER TABLE public.species ALTER COLUMN successional_stage TYPE VARCHAR(300);

-- Update morphological characteristics fields
ALTER TABLE public.species ALTER COLUMN growth_form TYPE VARCHAR(300);
ALTER TABLE public.species ALTER COLUMN leaf_type TYPE VARCHAR(300);
ALTER TABLE public.species ALTER COLUMN deciduous_evergreen TYPE VARCHAR(300);
ALTER TABLE public.species ALTER COLUMN flower_color TYPE VARCHAR(300);
ALTER TABLE public.species ALTER COLUMN fruit_type TYPE VARCHAR(300);
ALTER TABLE public.species ALTER COLUMN lifespan TYPE VARCHAR(300);

-- Update conservation and management fields
ALTER TABLE public.species ALTER COLUMN conservation_status TYPE VARCHAR(300);
ALTER TABLE public.species ALTER COLUMN climate_change_vulnerability TYPE VARCHAR(300);
ALTER TABLE public.species ALTER COLUMN verification_status TYPE VARCHAR(300);

-- Update scientific and metadata fields
ALTER TABLE public.species ALTER COLUMN default_image TYPE VARCHAR(300);
ALTER TABLE public.species ALTER COLUMN ipfs_cid TYPE VARCHAR(300);

-- Update completed message - Add timestamp
DO $$
BEGIN
    RAISE NOTICE 'VARCHAR fields updated to 300 characters at %', now();
END $$;