# Treekipedia Scripts

This directory contains utility scripts for the Treekipedia project, organized by category.

## Directory Structure

- **db/** - Database-related scripts (schema updates, migrations, etc.)
- **tests/** - Test scripts for backend services and API endpoints
- **deploy.js** - Script for deploying contracts to blockchain networks

## Running Scripts

Most scripts are executable Bash scripts. To run them:

1. Navigate to the project root:
   ```bash
   cd /root/silvi-open/treekipedia-new
   ```

2. Execute the desired script:
   ```bash
   ./scripts/tests/tests_ai_research_only.sh
   ```
   
   or
   
   ```bash
   ./scripts/db/apply_database_updates.sh
   ```

## Adding New Scripts

When adding new scripts:

1. Place the script in the appropriate subdirectory
2. Make sure the script is executable (`chmod +x script_name.sh`)
3. Update the README.md file in the subdirectory
4. Use relative paths in the script to reference other files in the project

## Script Standards

- All Bash scripts should include proper error handling
- SQL scripts should be idempotent when possible
- Include descriptive comments at the top of each script
- Use echo statements with colors to indicate progress and errors
- Test scripts should validate prerequisites before running