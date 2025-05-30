#!/bin/bash
# Script to reset researched flags directly using psql

# Database connection information
DB_HOST="localhost"
DB_USER="tree_user"
DB_PASSWORD="Kj9mPx7vLq2wZn4t"
DB_NAME="treekipedia"

# Export the password for psql to use
export PGPASSWORD="$DB_PASSWORD"

echo "Checking current state of researched flags..."
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "
  SELECT
    COUNT(*) as total_marked_as_researched,
    COUNT(*) FILTER (WHERE general_description_ai IS NULL OR general_description_ai = '') as without_ai_description
  FROM species
  WHERE researched = TRUE;
"

echo "Resetting researched flags for species without AI data..."
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "
  UPDATE species
  SET researched = FALSE
  WHERE researched = TRUE
  AND (
    general_description_ai IS NULL OR general_description_ai = ''
  )
  AND (
    habitat_ai IS NULL OR habitat_ai = ''
  )
  AND (
    ecological_function_ai IS NULL OR ecological_function_ai = ''
  )
  AND (
    stewardship_best_practices_ai IS NULL OR stewardship_best_practices_ai = ''
  );
"

echo "Checking final state of researched flags..."
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "
  SELECT 
    COUNT(*) as total_species,
    COUNT(*) FILTER (WHERE researched = TRUE) as researched_species,
    COUNT(*) FILTER (WHERE general_description_ai IS NOT NULL AND general_description_ai != '') as has_ai_description,
    COUNT(*) FILTER (WHERE habitat_ai IS NOT NULL AND habitat_ai != '') as has_ai_habitat,
    COUNT(*) FILTER (WHERE stewardship_best_practices_ai IS NOT NULL AND stewardship_best_practices_ai != '') as has_ai_stewardship
  FROM species;
"

echo "Checking example species..."
psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c "
  SELECT taxon_id, researched, general_description_ai FROM species 
  WHERE taxon_id = 'AngMaFaFb0265-00';
"

echo "Done!"