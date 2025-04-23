#!/bin/bash
# Script to run the Treekipedia v6 import

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load environment variables from .env
if [ -f "$PROJECT_ROOT/.env" ]; then
  source "$PROJECT_ROOT/.env"
else
  echo "Error: .env file not found at $PROJECT_ROOT/.env"
  exit 1
fi

# Check if DATABASE_URL is available
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL not found in .env file"
  exit 1
fi

echo "Starting Treekipedia v6 import..."
echo "Making backup before import..."

# Create a backup directory if it doesn't exist
BACKUP_DIR="$SCRIPT_DIR/backups"
mkdir -p "$BACKUP_DIR"

# Create a backup with timestamp
BACKUP_FILE="$BACKUP_DIR/treekipedia_backup_$(date +%Y%m%d_%H%M%S).sql"
echo "Creating backup at $BACKUP_FILE..."
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

# Run the import script
echo "Running import script..."
psql "$DATABASE_URL" -f "$SCRIPT_DIR/import_treekipedia_v6.sql"

echo "Import completed."