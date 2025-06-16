#!/bin/bash

echo "🚀 Quick Local Treekipedia Setup"
echo "================================"

# Install PostgreSQL if needed (macOS only)
if ! command -v psql >/dev/null 2>&1; then
    echo "Installing PostgreSQL..."
    if command -v brew >/dev/null 2>&1; then
        brew install postgresql@15
        brew services start postgresql@15
    else
        echo "❌ Please install Homebrew first or install PostgreSQL manually"
        exit 1
    fi
fi

# Create database and basic setup
createdb treekipedia 2>/dev/null || echo "Database might already exist"

# Create a simple test
psql treekipedia -c "
CREATE TABLE IF NOT EXISTS species (
    id SERIAL PRIMARY KEY,
    scientific_name VARCHAR(255) UNIQUE NOT NULL,
    common_name VARCHAR(255)
);

INSERT INTO species (scientific_name, common_name) VALUES 
('Eucalyptus globulus', 'Tasmanian Blue Gum'),
('Acacia acuminata', 'Raspberry Jam Wattle')
ON CONFLICT (scientific_name) DO NOTHING;

SELECT 'Setup complete! Species count:' as message, COUNT(*) as count FROM species;
"

# Create minimal config
cat > quick_config.json <<EOF
{
  "postgresql": {
    "enabled": true,
    "db_connection": {
      "host": "localhost",
      "database": "treekipedia",
      "user": "$(whoami)",
      "password": null,
      "port": 5432
    }
  }
}
EOF

echo "✅ Quick setup complete!"
echo "Test with: python3 postgres_automation.py --config quick_config.json --once"
