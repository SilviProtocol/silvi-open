-- Script to update VARCHAR field lengths and ensure consistent column types
-- This fixes issues with field length limitations during the research process

-- Conservation status fields
ALTER TABLE species ALTER COLUMN conservation_status_ai TYPE VARCHAR(300);
ALTER TABLE species ALTER COLUMN conservation_status_human TYPE VARCHAR(300);

-- Fix other short varchar fields
ALTER TABLE species ALTER COLUMN growth_form_ai TYPE VARCHAR(100);
ALTER TABLE species ALTER COLUMN growth_form_human TYPE VARCHAR(100);
ALTER TABLE species ALTER COLUMN leaf_type_ai TYPE VARCHAR(100);
ALTER TABLE species ALTER COLUMN leaf_type_human TYPE VARCHAR(100);
ALTER TABLE species ALTER COLUMN deciduous_evergreen_ai TYPE VARCHAR(50);
ALTER TABLE species ALTER COLUMN deciduous_evergreen_human TYPE VARCHAR(50);
ALTER TABLE species ALTER COLUMN flower_color_ai TYPE VARCHAR(100);
ALTER TABLE species ALTER COLUMN flower_color_human TYPE VARCHAR(100);
ALTER TABLE species ALTER COLUMN fruit_type_ai TYPE VARCHAR(100);
ALTER TABLE species ALTER COLUMN fruit_type_human TYPE VARCHAR(100);
ALTER TABLE species ALTER COLUMN lifespan_ai TYPE VARCHAR(100);
ALTER TABLE species ALTER COLUMN lifespan_human TYPE VARCHAR(100);

-- Ensure numeric fields can be null (needed for empty values)
ALTER TABLE species ALTER COLUMN maximum_height_ai DROP NOT NULL;
ALTER TABLE species ALTER COLUMN maximum_diameter_ai DROP NOT NULL;
ALTER TABLE species ALTER COLUMN maximum_tree_age_ai DROP NOT NULL;
ALTER TABLE species ALTER COLUMN maximum_height_human DROP NOT NULL;
ALTER TABLE species ALTER COLUMN maximum_diameter_human DROP NOT NULL;
ALTER TABLE species ALTER COLUMN maximum_tree_age_human DROP NOT NULL;