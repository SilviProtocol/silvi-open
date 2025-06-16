#!/usr/bin/env python3
"""
Create all the diagnostic and setup scripts as actual files
"""

import os

# Network diagnostic script
network_diagnostic = '''#!/bin/bash

echo "🌐 Network Connectivity Diagnostic for 167.172.143.162"
echo "======================================================"

HOST="167.172.143.162"
POSTGRES_PORT="5432"
BLAZEGRAPH_PORT="9999"

echo "🔍 Testing Basic Connectivity"
echo "------------------------------"

# Test if host is reachable at all
echo "Testing ping to $HOST..."
if ping -c 3 -W 3000 $HOST >/dev/null 2>&1; then
    echo "✅ Host $HOST is reachable via ping"
else
    echo "❌ Host $HOST is not reachable via ping"
    echo "   This could indicate:"
    echo "   - Server is down"
    echo "   - ICMP is blocked"
    echo "   - Network routing issues"
fi

echo ""
echo "🔌 Testing Port Connectivity"
echo "----------------------------"

# Test PostgreSQL port
echo "Testing PostgreSQL port $POSTGRES_PORT..."
if command -v nc >/dev/null 2>&1; then
    if timeout 10 nc -z $HOST $POSTGRES_PORT 2>/dev/null; then
        echo "✅ Port $POSTGRES_PORT is open and accepting connections"
    else
        echo "❌ Port $POSTGRES_PORT is not accessible"
        echo "   Possible reasons:"
        echo "   - PostgreSQL is not running"
        echo "   - Firewall blocking port $POSTGRES_PORT"
        echo "   - PostgreSQL not configured to accept external connections"
    fi
else
    echo "⚠️  netcat (nc) not available - cannot test port connectivity"
    echo "   Install with: brew install netcat (on macOS)"
fi

# Test Blazegraph port
echo ""
echo "Testing Blazegraph port $BLAZEGRAPH_PORT..."
if command -v nc >/dev/null 2>&1; then
    if timeout 10 nc -z $HOST $BLAZEGRAPH_PORT 2>/dev/null; then
        echo "✅ Port $BLAZEGRAPH_PORT is open (Blazegraph might be running)"
    else
        echo "❌ Port $BLAZEGRAPH_PORT is not accessible"
    fi
fi

echo ""
echo "🌍 Testing HTTP Services"
echo "------------------------"

# Test if Blazegraph web interface is accessible
echo "Testing Blazegraph web interface..."
if command -v curl >/dev/null 2>&1; then
    if curl -s --connect-timeout 10 "http://$HOST:$BLAZEGRAPH_PORT/blazegraph" >/dev/null 2>&1; then
        echo "✅ Blazegraph web interface is accessible"
        echo "   URL: http://$HOST:$BLAZEGRAPH_PORT/blazegraph"
    else
        echo "❌ Blazegraph web interface is not accessible"
    fi
else
    echo "⚠️  curl not available - cannot test HTTP services"
fi

echo ""
echo "🔧 Suggested Solutions"
echo "----------------------"

echo "1. Contact the server administrator to:"
echo "   - Verify PostgreSQL is running on port $POSTGRES_PORT"
echo "   - Check firewall rules for port $POSTGRES_PORT"
echo "   - Confirm postgresql.conf allows external connections"
echo "   - Verify pg_hba.conf allows your IP address"

echo ""
echo "2. Alternative connection methods to try:"
echo "   - VPN connection if required"
echo "   - SSH tunnel: ssh -L 5432:localhost:5432 user@$HOST"
echo "   - Different ports if PostgreSQL runs on non-standard port"

echo ""
echo "3. Set up local development environment:"
echo "   - Install PostgreSQL locally"
echo "   - Import sample Treekipedia data"
echo "   - Use for development until remote access is resolved"

echo ""
echo "======================================================"
echo "🏁 Diagnostic Complete"
echo "======================================================"
'''

# Local PostgreSQL setup script
local_setup = '''#!/bin/bash

echo "🌳 Setting Up Local PostgreSQL for Treekipedia Development"
echo "=========================================================="

# Check if PostgreSQL is installed
if command -v psql >/dev/null 2>&1; then
    echo "✅ PostgreSQL is already installed"
    psql --version
else
    echo "❌ PostgreSQL not found. Installing..."
    
    # Install based on platform
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        if command -v brew >/dev/null 2>&1; then
            echo "Installing PostgreSQL via Homebrew..."
            brew install postgresql@15
            brew services start postgresql@15
        else
            echo "❌ Homebrew not found. Please install Homebrew first:"
            echo "   /bin/bash -c \\"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\\""
            exit 1
        fi
    else
        echo "❌ This script is optimized for macOS. For other systems:"
        echo "   - Linux: sudo apt-get install postgresql postgresql-contrib"
        echo "   - Windows: Download from https://www.postgresql.org/download/"
        exit 1
    fi
fi

echo ""
echo "🔧 Setting Up Treekipedia Database"
echo "----------------------------------"

# Create treekipedia database
echo "Creating treekipedia database..."
if createdb treekipedia 2>/dev/null; then
    echo "✅ Database 'treekipedia' created successfully"
else
    echo "⚠️  Database 'treekipedia' might already exist or there was an error"
    echo "   Continuing with table creation..."
fi

# Connect and create basic schema
echo ""
echo "Creating Treekipedia tables..."

psql treekipedia <<EOF
-- Create species table
CREATE TABLE IF NOT EXISTS species (
    id SERIAL PRIMARY KEY,
    scientific_name VARCHAR(255) UNIQUE NOT NULL,
    common_name VARCHAR(255),
    family VARCHAR(255),
    genus VARCHAR(255),
    conservation_status VARCHAR(50),
    native_region VARCHAR(255),
    tree_type VARCHAR(100),
    max_height_meters DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sponsorships table
CREATE TABLE IF NOT EXISTS sponsorships (
    id SERIAL PRIMARY KEY,
    sponsor_name VARCHAR(255) NOT NULL,
    sponsor_email VARCHAR(255),
    amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'USD',
    tree_count INTEGER DEFAULT 0,
    sponsorship_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create sponsorship_items table
CREATE TABLE IF NOT EXISTS sponsorship_items (
    id SERIAL PRIMARY KEY,
    sponsorship_id INTEGER REFERENCES sponsorships(id),
    species_id INTEGER REFERENCES species(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(8,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    registration_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create contreebution_nfts table
CREATE TABLE IF NOT EXISTS contreebution_nfts (
    id SERIAL PRIMARY KEY,
    token_id VARCHAR(100) UNIQUE NOT NULL,
    species_id INTEGER REFERENCES species(id),
    owner_address VARCHAR(42),
    minted_date DATE DEFAULT CURRENT_DATE,
    metadata_uri VARCHAR(500),
    is_burned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

\\echo '✅ Tables created successfully'
EOF

echo ""
echo "🌱 Inserting Sample Treekipedia Data"
echo "------------------------------------"

# Insert sample data
psql treekipedia <<EOF
-- Insert sample species data
INSERT INTO species (scientific_name, common_name, family, genus, conservation_status, native_region, tree_type, max_height_meters) VALUES
('Acacia acuminata', 'Raspberry Jam Wattle', 'Fabaceae', 'Acacia', 'Least Concern', 'Australia', 'Deciduous', 8.0),
('Eucalyptus globulus', 'Tasmanian Blue Gum', 'Myrtaceae', 'Eucalyptus', 'Least Concern', 'Australia', 'Evergreen', 55.0),
('Banksia integrifolia', 'Coast Banksia', 'Proteaceae', 'Banksia', 'Least Concern', 'Australia', 'Evergreen', 25.0),
('Quercus robur', 'English Oak', 'Fagaceae', 'Quercus', 'Least Concern', 'Europe', 'Deciduous', 40.0),
('Sequoia sempervirens', 'Coast Redwood', 'Cupressaceae', 'Sequoia', 'Endangered', 'North America', 'Evergreen', 115.0),
('Baobab digitata', 'African Baobab', 'Malvaceae', 'Adansonia', 'Least Concern', 'Africa', 'Deciduous', 25.0),
('Ceiba pentandra', 'Kapok Tree', 'Malvaceae', 'Ceiba', 'Least Concern', 'Tropical America', 'Deciduous', 70.0),
('Pinus sylvestris', 'Scots Pine', 'Pinaceae', 'Pinus', 'Least Concern', 'Europe', 'Evergreen', 35.0),
('Ginkgo biloba', 'Maidenhair Tree', 'Ginkgoaceae', 'Ginkgo', 'Endangered', 'China', 'Deciduous', 40.0),
('Mangifera indica', 'Mango Tree', 'Anacardiaceae', 'Mangifera', 'Least Concern', 'South Asia', 'Evergreen', 30.0)
ON CONFLICT (scientific_name) DO NOTHING;

-- Insert sample users
INSERT INTO users (username, email, first_name, last_name) VALUES
('eco_warrior', 'eco@treekipedia.org', 'Emma', 'Green'),
('tree_lover', 'trees@treekipedia.org', 'Oliver', 'Forest'),
('nature_guardian', 'nature@treekipedia.org', 'Sophia', 'Woods'),
('forest_friend', 'forest@treekipedia.org', 'Liam', 'Branch'),
('green_thumb', 'green@treekipedia.org', 'Ava', 'Leaf')
ON CONFLICT (username) DO NOTHING;

-- Insert sample sponsorships
INSERT INTO sponsorships (sponsor_name, sponsor_email, amount, tree_count) VALUES
('EcoFund Foundation', 'contact@ecofund.org', 5000.00, 100),
('GreenTech Corp', 'sustainability@greentech.com', 10000.00, 250),
('Nature Lovers Society', 'info@naturelovers.org', 2500.00, 50),
('Forest Future Inc', 'hello@forestfuture.com', 7500.00, 150),
('TreeSave Alliance', 'support@treesave.org', 3000.00, 75);

-- Insert sample sponsorship items
INSERT INTO sponsorship_items (sponsorship_id, species_id, quantity, unit_price) VALUES
(1, 1, 30, 50.00),
(1, 2, 20, 75.00),
(1, 3, 50, 25.00),
(2, 4, 100, 40.00),
(2, 5, 50, 150.00),
(3, 6, 25, 100.00),
(3, 7, 25, 75.00),
(4, 8, 75, 50.00),
(4, 9, 25, 200.00),
(5, 10, 75, 40.00);

-- Insert sample NFTs
INSERT INTO contreebution_nfts (token_id, species_id, owner_address, metadata_uri) VALUES
('TRE001', 1, '0x1234567890123456789012345678901234567890', 'ipfs://QmExample1'),
('TRE002', 2, '0x2345678901234567890123456789012345678901', 'ipfs://QmExample2'),
('TRE003', 3, '0x3456789012345678901234567890123456789012', 'ipfs://QmExample3'),
('TRE004', 4, '0x4567890123456789012345678901234567890123', 'ipfs://QmExample4'),
('TRE005', 5, '0x5678901234567890123456789012345678901234', 'ipfs://QmExample5');

\\echo '✅ Sample data inserted successfully'
EOF

echo ""
echo "🔧 Creating Local Configuration"
echo "------------------------------"

# Create local configuration file
cat > local_postgres_config.json <<EOFCONFIG
{
  "postgresql": {
    "enabled": true,
    "db_connection": {
      "host": "localhost",
      "database": "treekipedia",
      "user": "$(whoami)",
      "password": null,
      "port": 5432,
      "connect_timeout": 10,
      "sslmode": "prefer"
    },
    "tables_to_monitor": [
      "species",
      "sponsorships", 
      "sponsorship_items",
      "contreebution_nfts",
      "users"
    ]
  },
  "blazegraph": {
    "enabled": false,
    "endpoint": "http://localhost:9999/blazegraph/namespace/kb/sparql"
  },
  "development": {
    "mode": "local",
    "sample_data": true
  }
}
EOFCONFIG

echo "✅ Created local_postgres_config.json"

echo ""
echo "🧪 Testing Local Connection"
echo "---------------------------"

# Test the connection
python3 -c "
import psycopg2
import json
import sys

try:
    # Test connection
    conn = psycopg2.connect(
        host='localhost',
        database='treekipedia',
        user='$(whoami)'
    )
    cursor = conn.cursor()
    
    # Test queries
    cursor.execute('SELECT COUNT(*) FROM species;')
    species_count = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM sponsorships;')
    sponsorship_count = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM users;')
    user_count = cursor.fetchone()[0]
    
    cursor.execute('SELECT COUNT(*) FROM contreebution_nfts;')
    nft_count = cursor.fetchone()[0]
    
    print(f'✅ Local connection successful!')
    print(f'   Species: {species_count} records')
    print(f'   Sponsorships: {sponsorship_count} records')
    print(f'   Users: {user_count} records')
    print(f'   NFTs: {nft_count} records')
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f'❌ Connection failed: {str(e)}')
    print(f'   Make sure PostgreSQL is running and accessible')
    sys.exit(1)
"

echo ""
echo "🎉 Local PostgreSQL Setup Complete!"
echo "===================================="
echo ""
echo "📋 What's been set up:"
echo "  ✅ Local PostgreSQL database 'treekipedia'"
echo "  ✅ All required tables created"
echo "  ✅ Sample data inserted (10 species, 5 users, etc.)"
echo "  ✅ Configuration file created"
echo ""
echo "🚀 Next steps:"
echo "  1. Test your automation script:"
echo "     python3 postgres_automation.py --config local_postgres_config.json --once"
echo ""
echo "  2. Run your Flask app:"
echo "     python3 app.py"
echo ""
echo "🔗 Connection details:"
echo "  Host: localhost"
echo "  Database: treekipedia"
echo "  User: $(whoami)"
echo "  Password: (none required)"
echo "  Port: 5432"
'''

# Quick setup script for immediate use
quick_setup = '''#!/bin/bash

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
'''

def create_file(filename, content):
    """Create a file with the given content"""
    try:
        with open(filename, 'w') as f:
            f.write(content)
        os.chmod(filename, 0o755)  # Make executable
        print(f"✅ Created: {filename}")
    except Exception as e:
        print(f"❌ Error creating {filename}: {str(e)}")

def main():
    print("🔧 Creating Setup Scripts")
    print("=" * 30)
    
    # Create all the scripts
    create_file("network_diagnostic.sh", network_diagnostic)
    create_file("local_postgres_setup.sh", local_setup)
    create_file("quick_setup.sh", quick_setup)
    
    print("\n🎉 All scripts created!")
    print("\nChoose your approach:")
    print("1. 🌐 Network diagnostic:     ./network_diagnostic.sh")
    print("2. 🌳 Full local setup:       ./local_postgres_setup.sh") 
    print("3. ⚡ Quick local setup:      ./quick_setup.sh")

if __name__ == "__main__":
    main()