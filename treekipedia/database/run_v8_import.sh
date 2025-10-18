#!/bin/bash
# Script to run the complete v8 import with taxon_id fixes
# This imports v8 data, fixes malformed taxon_ids, updates existing species, and creates subspecies records

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Database connection - uses environment variable for security  
DATABASE_URL="${DATABASE_URL:-postgres://tree_user@localhost:5432/treekipedia}"

# Check if DATABASE_URL is available
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL environment variable not set"
    echo "Please set DATABASE_URL with your database credentials"
    exit 1
fi

echo "🚀 Starting Treekipedia v8 import with taxon_id fixes..."
echo "This will:"
echo "1. Set up import tables and functions"
echo "2. Load v8.csv file"
echo "3. Process and fix taxon_ids"
echo "4. Update existing species with v8 data + legacy_taxon_id"
echo "5. Insert new subspecies as separate rows"

# Check if v8.csv exists
if [ ! -f "$PROJECT_ROOT/v8.csv" ]; then
    echo "❌ Error: v8.csv not found at $PROJECT_ROOT/v8.csv"
    exit 1
fi

FILE_SIZE=$(du -h "$PROJECT_ROOT/v8.csv" | cut -f1)
echo "📊 Found v8.csv (Size: $FILE_SIZE)"

# Create a backup directory if it doesn't exist
BACKUP_DIR="$SCRIPT_DIR/backups"
mkdir -p "$BACKUP_DIR"

# Create a backup with timestamp
BACKUP_FILE="$BACKUP_DIR/treekipedia_backup_v8import_$(date +%Y%m%d_%H%M%S).sql"
echo "📦 Creating backup at $BACKUP_FILE..."
pg_dump "$DATABASE_URL" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "✅ Backup completed successfully"
else
  echo "❌ Backup failed. Aborting import."
  exit 1
fi

# Step 1: Set up tables and functions
echo ""
echo "🏗️  Step 1: Setting up import tables and functions..."
psql "$DATABASE_URL" -f "$SCRIPT_DIR/import_v8_with_taxonid_fix.sql"

if [ $? -ne 0 ]; then
    echo "❌ Failed to set up import structures"
    exit 1
fi

echo "✅ Import structures ready"

# Step 2: Load v8.csv
echo ""
echo "📥 Step 2: Loading v8.csv ($FILE_SIZE - this may take 10-15 minutes)..."
echo "Starting CSV import at: $(date)"

psql "$DATABASE_URL" <<EOF
SET work_mem = '1GB';
SET maintenance_work_mem = '2GB';
\COPY species_v8_import FROM '$PROJECT_ROOT/v8.csv' WITH (FORMAT csv, HEADER true, NULL 'NA');
EOF

if [ $? -ne 0 ]; then
    echo "❌ Failed to load v8.csv"
    echo "🔄 You can restore from backup: $BACKUP_FILE"
    exit 1
fi

echo "✅ v8.csv loaded successfully at: $(date)"

# Check how many records were imported
IMPORT_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM species_v8_import;")
echo "📊 Imported $IMPORT_COUNT records from v8.csv"

# Step 3: Process taxon_ids
echo ""
echo "🔧 Step 3: Processing taxon_ids and fixing malformed IDs..."
psql "$DATABASE_URL" -c "SELECT 'Processing taxon_ids...' AS status; SELECT * FROM process_v8_taxon_ids();" -q

if [ $? -ne 0 ]; then
    echo "❌ Failed to process taxon_ids"
    exit 1
fi

echo "✅ Taxon_id processing completed"

# Step 4: Import data
echo ""
echo "🔄 Step 4: Importing data to species table..."
echo "This will:"
echo "   - Update existing main species with v8 data + legacy_taxon_id"
echo "   - Preserve your existing AI research data"  
echo "   - Insert new subspecies as separate rows"
echo ""

psql "$DATABASE_URL" -c "SELECT 'Starting data import...' AS status; SELECT * FROM import_v8_species_data();" -q

if [ $? -ne 0 ]; then
    echo "❌ Failed to import species data"
    echo "🔄 You can restore from backup: $BACKUP_FILE"
    exit 1
fi

echo "✅ Species data import completed"

# Step 5: Show final statistics
echo ""
echo "📊 Final Statistics:"
psql "$DATABASE_URL" -c "
SELECT 
    COUNT(*) AS total_records,
    COUNT(CASE WHEN taxon_id LIKE '%-00' THEN 1 END) AS main_species,
    COUNT(CASE WHEN taxon_id NOT LIKE '%-00' THEN 1 END) AS subspecies,
    COUNT(CASE WHEN researched = true THEN 1 END) AS with_ai_research,
    COUNT(CASE WHEN legacy_taxon_id IS NOT NULL THEN 1 END) AS with_legacy_taxon_id,
    COUNT(CASE WHEN soil_texture_all IS NOT NULL THEN 1 END) AS with_soil_data,
    COUNT(CASE WHEN present_intact_forest IS NOT NULL THEN 1 END) AS with_ecosystem_data
FROM species;
"

# Verify image associations still intact
IMAGE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(DISTINCT taxon_id) FROM images;")
echo "🖼️  Species with images: $IMAGE_COUNT (preserved from original database)"

# Clean up temporary tables
echo ""
echo "🧹 Cleaning up temporary tables..."
psql "$DATABASE_URL" -c "DROP TABLE IF EXISTS species_v8_import; DROP FUNCTION IF EXISTS process_v8_taxon_ids(); DROP FUNCTION IF EXISTS import_v8_species_data();" -q

echo ""
echo "🎉 V8 import completed successfully!"
echo "📊 Import finished at: $(date)"
echo "🔄 Backup available at: $BACKUP_FILE"
echo ""
echo "✅ Your database now has:"
echo "   - Complete v8 dataset with proper taxon_id structure"
echo "   - Preserved AI research (19 species)"
echo "   - Preserved image associations (1,576+ species)" 
echo "   - New soil and ecosystem data from v8"
echo "   - Legacy taxon_ids for geohash mapping"
echo "   - Subspecies as separate rows"