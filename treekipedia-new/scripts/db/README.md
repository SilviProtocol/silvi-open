# Treekipedia Database Scripts

This directory contains database scripts for Treekipedia, including schema updates, SQL migrations, and database utilities.

## Available Scripts

### SQL Scripts

- **fix_schema.sql** - Fixes the VARCHAR column sizes in the species table to handle longer text.
- **update_varchar_fields.sql** - Updates all VARCHAR fields in the species table to VARCHAR(300).
- **updated_species_schema.sql** - Reference schema showing the species table with updated VARCHAR(300) fields.

### Shell Scripts

- **apply_database_updates.sh** - A utility script to apply SQL changes to the database with proper credentials.

## Usage

To apply database updates, navigate to the scripts/db directory and run the apply_database_updates.sh script:

```bash
cd /root/silvi-open/treekipedia-new/scripts/db
./apply_database_updates.sh
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