#!/bin/bash

# Apply schema updates for Treekipedia
# Author: Claude
# Date: 2025-04-13

# Set text colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Treekipedia Schema Update Script${NC}"
echo -e "${YELLOW}====================================${NC}"

# Determine root directory and script directory
SCRIPT_DIR="$(dirname "$0")"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Load environment variables from root .env file
if [ -f "$ROOT_DIR/.env" ]; then
  source "$ROOT_DIR/.env"
  echo -e "${GREEN}Loaded database configuration from root .env file${NC}"
elif [ -f "$ROOT_DIR/backend/.env" ]; then
  source "$ROOT_DIR/backend/.env"
  echo -e "${GREEN}Loaded database configuration from backend/.env file${NC}"
fi

# Extract database credentials from DATABASE_URL
if [ -n "$DATABASE_URL" ]; then
  DB_URL=$DATABASE_URL
  DB_USER=$(echo $DB_URL | cut -d':' -f2 | sed 's/\/\///g')
  DB_PASS=$(echo $DB_URL | cut -d':' -f3 | cut -d'@' -f1)
  DB_HOST=$(echo $DB_URL | cut -d'@' -f2 | cut -d':' -f1)
  DB_PORT=$(echo $DB_URL | cut -d':' -f4 | cut -d'/' -f1)
  DB_NAME=$(echo $DB_URL | cut -d'/' -f4)
else
  # Prompt for credentials if DATABASE_URL is not available
  echo -e "${YELLOW}DATABASE_URL not found. Please enter database credentials:${NC}"
  read -p "Database name: " DB_NAME
  read -p "Database user: " DB_USER
  read -s -p "Database password: " DB_PASS
  echo
  read -p "Database host (default: localhost): " DB_HOST
  DB_HOST=${DB_HOST:-localhost}
  read -p "Database port (default: 5432): " DB_PORT
  DB_PORT=${DB_PORT:-5432}
fi

echo "Preparing to update database schema for Treekipedia..."
echo "Host: $DB_HOST"
echo "Database: $DB_NAME"

# Create a backup of the current schema
echo -e "${YELLOW}Creating database backup before schema update...${NC}"
BACKUP_FILE="$SCRIPT_DIR/schema_backup_$(date +%Y%m%d_%H%M%S).sql"
PGPASSWORD=$DB_PASS pg_dump -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -s > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}Schema backup created at: $BACKUP_FILE${NC}"
else
  echo -e "${RED}Warning: Failed to create schema backup. Proceeding anyway...${NC}"
fi

# Apply the schema update
echo -e "${YELLOW}Applying schema updates...${NC}"
PGPASSWORD=$DB_PASS psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -f "$SCRIPT_DIR/schema_update.sql"

# Check for success
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Schema update completed successfully!${NC}"
    echo -e "${YELLOW}The following changes were applied:${NC}"
    echo "1. Added species_scientific_name field (replacing 'species')"
    echo "2. Added AI/human field pairs for research data"
    echo "3. Added researched boolean field"
    echo "4. Added new indexes for performance"
else
    echo -e "${RED}Error applying schema update. Please check the output above for errors.${NC}"
    exit 1
fi

echo -e "${GREEN}Schema update complete.${NC}"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update the research process code to use the new field structure"
echo "2. Update frontend and backend components that reference the old schema"