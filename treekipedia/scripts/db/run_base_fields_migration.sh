#!/bin/bash

# Script to remove legacy base fields while keeping the researched flag
# This script will safely migrate data and remove base fields without touching the researched flag

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f ../../.env ]; then
  source ../../.env
  echo -e "${BLUE}Loaded environment variables from ../../.env${NC}"
else
  echo -e "${RED}Error: .env file not found${NC}"
  exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo -e "${RED}Error: DATABASE_URL environment variable not set${NC}"
  exit 1
fi

# Extract database connection details from DATABASE_URL
# Format: postgres://username:password@hostname:port/database
DB_USER=$(echo $DATABASE_URL | sed -n 's/postgres:\/\/\([^:]*\):.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/postgres:\/\/[^:]*:[^@]*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/postgres:\/\/[^:]*:[^@]*@[^:]*:\([^\/]*\).*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/postgres:\/\/[^:]*:[^@]*@[^:]*:[^\/]*\/\(.*\)/\1/p')

echo -e "${BLUE}Database connection details:${NC}"
echo -e "User: ${DB_USER}"
echo -e "Host: ${DB_HOST}"
echo -e "Port: ${DB_PORT}"
echo -e "Database: ${DB_NAME}"

# Create a backup before making changes
echo -e "${YELLOW}Creating database backup...${NC}"
BACKUP_FILE="schema_backup_$(date +%Y%m%d_%H%M%S).sql"
PGPASSWORD=$(echo $DATABASE_URL | sed -n 's/postgres:\/\/[^:]*:\([^@]*\)@.*/\1/p') pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -s > $BACKUP_FILE
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Backup created successfully: $BACKUP_FILE${NC}"
else
  echo -e "${RED}Error creating backup${NC}"
  exit 1
fi

# Apply the migration
echo -e "${YELLOW}Applying base fields migration (keeping researched flag)...${NC}"
PGPASSWORD=$(echo $DATABASE_URL | sed -n 's/postgres:\/\/[^:]*:\([^@]*\)@.*/\1/p') psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f remove_base_fields_only.sql
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Migration applied successfully!${NC}"
else
  echo -e "${RED}Error applying migration${NC}"
  echo -e "${YELLOW}You can restore from backup if needed with:${NC}"
  echo -e "PGPASSWORD=your_password psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $BACKUP_FILE"
  exit 1
fi

echo -e "${GREEN}Database schema has been updated to remove legacy base fields while keeping the researched flag.${NC}"
echo -e "${BLUE}This will ensure stewardship fields are properly included in IPFS metadata.${NC}"