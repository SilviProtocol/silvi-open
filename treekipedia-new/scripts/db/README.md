# Treekipedia Database Scripts

This directory contains database scripts for Treekipedia, including schema updates, SQL migrations, and database utilities.

## Recent Fixes

### Researched Flag and Legacy Field Migration (2025-04-15)

We've identified and fixed several issues with the database schema and field handling:

1. **Issue:** Some species have legacy fields (e.g., `general_description`) with data but their corresponding AI fields (e.g., `general_description_ai`) are empty, causing the frontend to show "Awaiting research" even though research data exists.

2. **Issue:** The `researched` flag is not being set correctly for species with research data, causing the frontend to show incorrect research status.

3. **Fix Scripts:**
   - **`fix_target_species.sql`** - Fixes the specific species that was reported as problematic.
   - **`fix_all_researched_flags.sql`** - Sets researched=TRUE for all species with content.
   - **`remove_legacy_fields.sql`** - (Optional) Migrates data from legacy fields to AI fields and removes legacy fields.

## Available Scripts

### SQL Scripts

- **fix_schema.sql** - Fixes the VARCHAR column sizes in the species table to handle longer text.
- **update_varchar_fields.sql** - Updates all VARCHAR fields in the species table to VARCHAR(300).
- **updated_species_schema.sql** - Reference schema showing the species table with updated VARCHAR(300) fields.
- **schema_update.sql** - Major update to add AI/human field pairs, rename species field, and add researched flag.
- **fix_target_species.sql** - Fixes researched flag for specific problematic species.
- **fix_all_researched_flags.sql** - Updates researched flag for all species with content.
- **remove_legacy_fields.sql** - Migrates data from legacy fields to AI fields and removes them.

### Shell Scripts

- **apply_database_updates.sh** - A utility script to apply SQL changes to the database with proper credentials.
- **apply_schema_update.sh** - Specific script for applying the major schema update (AI/human fields).

## Latest Schema Update

The newest update (`schema_update.sql`) makes the following changes:

1. **Field Renaming**: 
   - `species` field remains (for backward compatibility)
   - Added new `species_scientific_name` field (to replace references to `species`)

2. **Added AI/Human Field Pairs**:
   - `conservation_status_ai` / `conservation_status_human`
   - `general_description_ai` / `general_description_human` 
   - `habitat_ai` / `habitat_human`
   - And many more field pairs for ecological, morphological, and stewardship data

3. **Research Status**:
   - Added `researched` boolean field (default: false)

4. **Indexes**:
   - Added index on `species_scientific_name`
   - Added index on `researched`

### For New Installations

A complete updated schema file is available at `/database/updated_schema.sql` for fresh installations.

## How to Apply the Update

To apply the latest schema update:

```bash
cd /root/silvi-open/treekipedia-new/scripts/db
chmod +x apply_schema_update.sh
./apply_schema_update.sh
```

## Database Connection

The scripts support connecting to the database in multiple ways:

1. Using the `DATABASE_URL` environment variable
2. Using database credentials from a `.env` file
3. Manual entry of database credentials when prompted

## Schema Changes

When making schema changes:

1. Create a new SQL script in this directory
2. Update the apply_database_updates.sh script to include the new SQL file
3. Run the apply_database_updates.sh script to apply the changes
4. Update the SPEC_SHEET.md document to reflect the schema changes

## Next Steps

After applying the schema update, you'll need to update:
1. The research process code to use the new field structure
2. Frontend and backend components that reference the old schema