-- Script to update VARCHAR field lengths and ensure consistent column types
-- This fixes issues with field length limitations during the research process

DO $$
BEGIN
    RAISE NOTICE 'VARCHAR fields updated to 500 characters at %', NOW();
END $$;

-- Set all VARCHAR fields to 500 characters
ALTER TABLE species ALTER COLUMN conservation_status_ai TYPE VARCHAR(500);
ALTER TABLE species ALTER COLUMN conservation_status_human TYPE VARCHAR(500);
ALTER TABLE species ALTER COLUMN conservation_status TYPE VARCHAR(500);

ALTER TABLE species ALTER COLUMN growth_form_ai TYPE VARCHAR(500);
ALTER TABLE species ALTER COLUMN growth_form_human TYPE VARCHAR(500);
ALTER TABLE species ALTER COLUMN growth_form TYPE VARCHAR(500);

ALTER TABLE species ALTER COLUMN leaf_type_ai TYPE VARCHAR(500);
ALTER TABLE species ALTER COLUMN leaf_type_human TYPE VARCHAR(500);
ALTER TABLE species ALTER COLUMN leaf_type TYPE VARCHAR(500);

ALTER TABLE species ALTER COLUMN deciduous_evergreen_ai TYPE VARCHAR(500);
ALTER TABLE species ALTER COLUMN deciduous_evergreen_human TYPE VARCHAR(500);
ALTER TABLE species ALTER COLUMN deciduous_evergreen TYPE VARCHAR(500);

ALTER TABLE species ALTER COLUMN flower_color_ai TYPE VARCHAR(500);
ALTER TABLE species ALTER COLUMN flower_color_human TYPE VARCHAR(500);
ALTER TABLE species ALTER COLUMN flower_color TYPE VARCHAR(500);

ALTER TABLE species ALTER COLUMN fruit_type_ai TYPE VARCHAR(500);
ALTER TABLE species ALTER COLUMN fruit_type_human TYPE VARCHAR(500);
ALTER TABLE species ALTER COLUMN fruit_type TYPE VARCHAR(500);

ALTER TABLE species ALTER COLUMN lifespan_ai TYPE VARCHAR(500);
ALTER TABLE species ALTER COLUMN lifespan_human TYPE VARCHAR(500);
ALTER TABLE species ALTER COLUMN lifespan TYPE VARCHAR(500);

-- Other common schema fields
ALTER TABLE species ALTER COLUMN species TYPE VARCHAR(500);
ALTER TABLE species ALTER COLUMN species_scientific_name TYPE VARCHAR(500);
ALTER TABLE species ALTER COLUMN genus TYPE VARCHAR(500);
ALTER TABLE species ALTER COLUMN family TYPE VARCHAR(500);
ALTER TABLE species ALTER COLUMN specific_epithet TYPE VARCHAR(500);
ALTER TABLE species ALTER COLUMN class TYPE VARCHAR(500);
ALTER TABLE species ALTER COLUMN taxonomic_order TYPE VARCHAR(500);
ALTER TABLE species ALTER COLUMN verification_status TYPE VARCHAR(500);
ALTER TABLE species ALTER COLUMN ipfs_cid TYPE VARCHAR(500);
ALTER TABLE species ALTER COLUMN default_image TYPE VARCHAR(500);
ALTER TABLE species ALTER COLUMN climate_change_vulnerability TYPE VARCHAR(500);
ALTER TABLE species ALTER COLUMN successional_stage TYPE VARCHAR(500);

-- Ensure numeric fields can be null (needed for empty values)
ALTER TABLE species ALTER COLUMN maximum_height_ai DROP NOT NULL;
ALTER TABLE species ALTER COLUMN maximum_diameter_ai DROP NOT NULL;
ALTER TABLE species ALTER COLUMN maximum_tree_age_ai DROP NOT NULL;
ALTER TABLE species ALTER COLUMN maximum_height_human DROP NOT NULL;
ALTER TABLE species ALTER COLUMN maximum_diameter_human DROP NOT NULL;
ALTER TABLE species ALTER COLUMN maximum_tree_age_human DROP NOT NULL;