#!/bin/bash

# Script to apply the taxon_id fixes to the database

# Set script to exit on error
set -e

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Navigate to project root
cd "$(dirname "$0")/../.."
PROJECT_ROOT=$(pwd)

printf "${YELLOW}========================================================${NC}\n"
printf "${YELLOW}  🧪 Treekipedia Taxon ID Fixer 🧪${NC}\n"
printf "${YELLOW}========================================================${NC}\n"

# Ensure we have psql
if ! command -v psql &> /dev/null; then
  printf "${RED}Error: PostgreSQL client (psql) is not installed or not in PATH${NC}\n"
  exit 1
fi

# Extract database credentials from DATABASE_URL in .env
if [ -f "${PROJECT_ROOT}/.env" ]; then
  printf "${BLUE}Loading database configuration from .env file...${NC}\n"
  source <(grep -v '^#' ${PROJECT_ROOT}/.env | sed -E 's/(.*)=(.*)/export \1="\2"/')
  
  # Parse DATABASE_URL
  if [ ! -z "$DATABASE_URL" ]; then
    printf "${BLUE}Found DATABASE_URL in .env, extracting connection details...${NC}\n"
    
    # Parse connection string postgresql://user:password@host:port/dbname
    # Example: postgres://tree_user:Kj9mPx7vLq2wZn4t@localhost:5432/treekipedia
    DB_USER=$(echo $DATABASE_URL | sed -E 's/^[^:]+:\/\/([^:]+):([^@]+)@([^:]+):([0-9]+)\/(.+)$/\1/')
    DB_PASSWORD=$(echo $DATABASE_URL | sed -E 's/^[^:]+:\/\/([^:]+):([^@]+)@([^:]+):([0-9]+)\/(.+)$/\2/')
    DB_HOST=$(echo $DATABASE_URL | sed -E 's/^[^:]+:\/\/([^:]+):([^@]+)@([^:]+):([0-9]+)\/(.+)$/\3/')
    DB_PORT=$(echo $DATABASE_URL | sed -E 's/^[^:]+:\/\/([^:]+):([^@]+)@([^:]+):([0-9]+)\/(.+)$/\4/')
    DB_NAME=$(echo $DATABASE_URL | sed -E 's/^[^:]+:\/\/([^:]+):([^@]+)@([^:]+):([0-9]+)\/(.+)$/\5/')
    
    printf "${BLUE}DB_HOST: $DB_HOST, DB_PORT: $DB_PORT, DB_NAME: $DB_NAME, DB_USER: $DB_USER${NC}\n"
  else
    printf "${RED}DATABASE_URL not found in .env file. Please check your configuration.${NC}\n"
    exit 1
  fi
else
  printf "${RED}.env file not found. Please create it with the DATABASE_URL variable.${NC}\n"
  exit 1
fi

# Create a timestamp for log filename
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Run the SQL script to fix taxon_ids
printf "${BLUE}Applying taxon_id fixes...${NC}\n"
PGPASSWORD=${DB_PASSWORD} psql -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} -f "${PROJECT_ROOT}/scripts/db/fix_taxon_ids.sql" > "${PROJECT_ROOT}/scripts/db/taxon_id_fix_log_${TIMESTAMP}.log"

if [ $? -ne 0 ]; then
  printf "${RED}Failed to apply taxon_id fixes! See log for details.${NC}\n"
  exit 1
fi

printf "${GREEN}Taxon ID fixes applied successfully!${NC}\n"
printf "${BLUE}Log file: ${PROJECT_ROOT}/scripts/db/taxon_id_fix_log_${TIMESTAMP}.log${NC}\n"
printf "${YELLOW}========================================================${NC}\n"
printf "${GREEN}Process complete. Taxon IDs have been simplified to main species only.${NC}\n"
printf "${YELLOW}The original mappings are stored in the taxon_id_mapping table in the database.${NC}\n"