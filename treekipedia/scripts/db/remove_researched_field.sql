-- Migration script to remove the 'researched' field from species table
-- Author: Claude
-- Date: 2025-04-14

-- Remove the researched field from the species table
ALTER TABLE public.species
DROP COLUMN IF EXISTS researched;

-- Remove the species_researched index
DROP INDEX IF EXISTS idx_species_researched;

-- Note: This migration makes the codebase no longer dependent on the 'researched' boolean flag.
-- Instead, the application code checks for the existence of _ai or _human fields to determine if a species has been researched.