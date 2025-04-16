#!/bin/bash

# Apply database updates for Treekipedia
# This script applies the VARCHAR field updates to the database

# Set text colors
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Treekipedia Database Update Script${NC}"
echo -e "${YELLOW}====================================${NC}"

# Check if DATABASE_URL environment variable is set
if [ -z "$DATABASE_URL" ]; then
  # If not set, try to get it from .env file
  if [ -f ".env" ]; then
    source .env
    echo -e "${GREEN}Loaded database configuration from .env file${NC}"
  elif [ -f "backend/.env" ]; then
    source backend/.env
    echo -e "${GREEN}Loaded database configuration from backend/.env file${NC}"
  else
    echo -e "${RED}ERROR: DATABASE_URL environment variable not set and no .env file found${NC}"
    echo "Please set DATABASE_URL or provide database credentials when prompted"
  fi
fi

# Function to run SQL file with credentials
run_sql_file() {
  local file=$1
  
  if [ -n "$DATABASE_URL" ]; then
    # Use DATABASE_URL if available
    echo -e "${YELLOW}Running SQL from $file using DATABASE_URL...${NC}"
    psql "$DATABASE_URL" -f "$file" && return 0
  fi
  
  # If DATABASE_URL didn't work or isn't set, prompt for credentials
  echo -e "${YELLOW}Please enter database credentials:${NC}"
  read -p "Database name: " DB_NAME
  read -p "Database user: " DB_USER
  read -p "Database host (default: localhost): " DB_HOST
  DB_HOST=${DB_HOST:-localhost}
  read -p "Database port (default: 5432): " DB_PORT
  DB_PORT=${DB_PORT:-5432}
  
  # Run the SQL file with provided credentials
  echo -e "${YELLOW}Running SQL from $file...${NC}"
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$file"
}

# Define script directory
SCRIPT_DIR="$(dirname "$0")"

# Apply the VARCHAR updates
echo -e "${YELLOW}Applying VARCHAR field updates to species table...${NC}"
if run_sql_file "${SCRIPT_DIR}/update_varchar_fields.sql"; then
  echo -e "${GREEN}Successfully updated VARCHAR fields to 300 characters${NC}"
else
  echo -e "${RED}Error applying VARCHAR updates${NC}"
  exit 1
fi

# Apply the researched flag fix
echo -e "${YELLOW}Fixing researched flags for all species...${NC}"
if run_sql_file "${SCRIPT_DIR}/fix_all_researched_flags.sql"; then
  echo -e "${GREEN}Successfully fixed researched flags for all species${NC}"
else
  echo -e "${RED}Error fixing researched flags${NC}"
  # Don't exit, continue with other updates
fi

# Optional: Ask if user wants to remove legacy fields
echo -e "${YELLOW}Do you want to remove legacy fields and migrate data to _ai fields? (y/n)${NC}"
read -p "This is a more invasive change: " REMOVE_LEGACY
if [[ "$REMOVE_LEGACY" == "y" || "$REMOVE_LEGACY" == "Y" ]]; then
  echo -e "${YELLOW}Migrating and removing legacy fields...${NC}"
  if run_sql_file "${SCRIPT_DIR}/remove_legacy_fields.sql"; then
    echo -e "${GREEN}Successfully migrated and removed legacy fields${NC}"
  else
    echo -e "${RED}Error removing legacy fields${NC}"
  fi
fi

echo -e "${GREEN}Database updates completed successfully!${NC}"
echo -e "${YELLOW}Note: You can use ${SCRIPT_DIR}/updated_species_schema.sql as reference for future schema changes${NC}"