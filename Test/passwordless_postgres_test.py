#!/usr/bin/env python3
"""
Test PostgreSQL connection without password
Tests various passwordless authentication methods
"""

import psycopg2
import logging
import sys
import json
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_passwordless_connection():
    """Test various passwordless connection methods"""
    
    host = "167.172.143.162"
    port = 5432
    
    # Different configurations to try
    test_configs = [
        # No password at all
        {
            "host": host,
            "port": port,
            "user": "postgres",
            "database": "treekipedia"
        },
        # Empty password string
        {
            "host": host,
            "port": port,
            "user": "postgres",
            "database": "treekipedia",
            "password": ""
        },
        # Try postgres database instead
        {
            "host": host,
            "port": port,
            "user": "postgres",
            "database": "postgres"
        },
        # Try different users
        {
            "host": host,
            "port": port,
            "user": "treekipedia",
            "database": "treekipedia"
        },
        {
            "host": host,
            "port": port,
            "user": "admin",
            "database": "treekipedia"
        },
        # Try public user
        {
            "host": host,
            "port": port,
            "user": "public",
            "database": "treekipedia"
        }
    ]
    
    print("🔍 Testing Passwordless PostgreSQL Connections")
    print("=" * 50)
    print(f"Target: {host}:{port}")
    print("=" * 50)
    
    successful_configs = []
    
    for i, config in enumerate(test_configs, 1):
        print(f"\n🔄 Test {i}: {config}")
        
        try:
            # Try to connect
            conn = psycopg2.connect(
                connect_timeout=10,
                **config
            )
            
            print("✅ CONNECTION SUCCESSFUL!")
            
            # Test basic queries
            cursor = conn.cursor()
            
            # Get PostgreSQL version
            cursor.execute("SELECT version();")
            version = cursor.fetchone()[0]
            print(f"   📊 PostgreSQL Version: {version[:50]}...")
            
            # List databases
            cursor.execute("SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname;")
            databases = [row[0] for row in cursor.fetchall()]
            print(f"   🗃️  Available Databases: {', '.join(databases)}")
            
            # If we're connected to treekipedia, list tables
            if config.get('database') == 'treekipedia':
                try:
                    cursor.execute("""
                        SELECT table_name 
                        FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        ORDER BY table_name;
                    """)
                    tables = [row[0] for row in cursor.fetchall()]
                    print(f"   📋 Tables in treekipedia: {', '.join(tables)}")
                    
                    # Check specific treekipedia tables
                    expected_tables = ['species', 'sponsorships', 'sponsorship_items', 'contreebution_nfts', 'users']
                    found_tables = []
                    
                    for table in expected_tables:
                        try:
                            cursor.execute(f"SELECT COUNT(*) FROM {table};")
                            count = cursor.fetchone()[0]
                            print(f"   🌳 {table}: {count:,} records")
                            found_tables.append(table)
                        except Exception as e:
                            print(f"   ❌ {table}: Not accessible ({str(e)})")
                    
                    if found_tables:
                        print(f"   ✅ Found Treekipedia tables: {', '.join(found_tables)}")
                    
                except Exception as e:
                    print(f"   ⚠️  Could not list tables: {str(e)}")
            
            cursor.close()
            conn.close()
            
            successful_configs.append(config)
            print(f"   🎉 This configuration works!")
            
        except psycopg2.OperationalError as e:
            if "timeout expired" in str(e):
                print(f"   ⏱️  Connection timeout - network issue")
            elif "authentication failed" in str(e):
                print(f"   🔐 Authentication failed - password required")
            elif "database" in str(e) and "does not exist" in str(e):
                print(f"   📁 Database does not exist")
            elif "role" in str(e) and "does not exist" in str(e):
                print(f"   👤 User does not exist")
            else:
                print(f"   ❌ Connection failed: {str(e)}")
        except Exception as e:
            print(f"   ❌ Unexpected error: {str(e)}")
    
    print("\n" + "=" * 50)
    print("📋 SUMMARY")
    print("=" * 50)
    
    if successful_configs:
        print(f"✅ SUCCESS! Found {len(successful_configs)} working configuration(s):")
        for i, config in enumerate(successful_configs, 1):
            print(f"   {i}. {config}")
        
        # Save working config
        if successful_configs:
            best_config = successful_configs[0]  # Use the first working one
            
            # Create full configuration
            full_config = {
                "postgresql": {
                    "enabled": True,
                    "db_connection": {
                        **best_config,
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
                    "enabled": True,
                    "endpoint": "http://167.172.143.162:9999/blazegraph/namespace/kb/sparql"
                }
            }
            
            # Save to config file
            config_file = "working_postgres_config.json"
            try:
                with open(config_file, 'w') as f:
                    json.dump(full_config, f, indent=2)
                print(f"\n💾 Saved working configuration to: {config_file}")
                print("   You can now use: --config working_postgres_config.json")
            except Exception as e:
                print(f"\n❌ Could not save config: {str(e)}")
        
        print(f"\n🚀 Next steps:")
        print("   1. Use the working configuration above")
        print("   2. Update your automation scripts to use these settings")
        print("   3. Test your postgres_automation.py script")
        
    else:
        print("❌ No working configurations found")
        print("\nPossible issues:")
        print("   🔥 Firewall blocking port 5432")
        print("   🔐 Authentication required (password needed)")
        print("   🛑 PostgreSQL server not running")
        print("   🌐 Network connectivity issues")
        print("\n💡 Try these commands manually:")
        print(f"   telnet {host} {port}")
        print(f"   psql -h {host} -p {port} -U postgres")
    
    return successful_configs

def test_specific_treekipedia_data(config):
    """Test specific Treekipedia data if connection works"""
    try:
        print("\n🌳 Testing Treekipedia-specific data...")
        
        conn = psycopg2.connect(**config)
        cursor = conn.cursor()
        
        # Test specific queries that your automation would run
        test_queries = [
            ("Species count", "SELECT COUNT(*) FROM species"),
            ("Recent species", "SELECT scientific_name, common_name FROM species LIMIT 5"),
            ("Sponsorships count", "SELECT COUNT(*) FROM sponsorships"),
            ("Users count", "SELECT COUNT(*) FROM users"),
            ("NFTs count", "SELECT COUNT(*) FROM contreebution_nfts")
        ]
        
        for name, query in test_queries:
            try:
                cursor.execute(query)
                result = cursor.fetchall()
                print(f"   ✅ {name}: {result}")
            except Exception as e:
                print(f"   ❌ {name}: {str(e)}")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"   ❌ Error testing Treekipedia data: {str(e)}")

if __name__ == "__main__":
    try:
        successful_configs = test_passwordless_connection()
        
        # If we found a working config for treekipedia, test specific data
        treekipedia_configs = [c for c in successful_configs if c.get('database') == 'treekipedia']
        if treekipedia_configs:
            test_specific_treekipedia_data(treekipedia_configs[0])
            
    except KeyboardInterrupt:
        print("\n\nTest interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\nFatal error: {str(e)}")
        sys.exit(1)