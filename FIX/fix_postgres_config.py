# Create a fixed configuration file - save as 'fix_postgres_config.py'

import json
import os

def create_working_config():
    """Create a working configuration file for Treekipedia"""
    
    config = {
        'postgresql': {
            'enabled': True,
            'db_connection': {
                'host': '167.172.143.162',
                'database': 'treekipedia',
                'user': 'postgres',
                'password': '9353jeremic',
                'port': 5432
            }
        },
        'blazegraph': {
            'enabled': True,
            'endpoint': 'http://167.172.143.162:9999/blazegraph/namespace/kb/sparql'
        },
        'automation': {
            'check_interval_minutes': 15,
            'tables_to_monitor': [
                'species',
                'users', 
                'sponsorships',
                'sponsorship_items',
                'contreebution_nfts'
            ]
        }
    }
    
    # Save configuration
    with open('working_treekipedia_config.json', 'w') as f:
        json.dump(config, f, indent=2)
    
    print("✅ Created working_treekipedia_config.json")
    return config

def update_app_config():
    """Update app.py configuration for PostgreSQL"""
    
    config_updates = """
# Add these updates to your app.py configuration section:

# Update PostgreSQL configuration
app.config['POSTGRESQL_ENABLED'] = True
app.config['POSTGRESQL_CONFIG'] = {
    'db_connection': {
        'host': '167.172.143.162',
        'database': 'treekipedia',  # Changed from 'biodiversity' to 'treekipedia'
        'user': 'postgres',
        'password': '9353jeremic',  # Make sure this password is correct
        'port': 5432
    }
}

# Import required modules at the top of app.py
import psycopg2
from datetime import timedelta
"""
    
    print("📝 Configuration updates needed in app.py:")
    print(config_updates)

def test_postgres_connection():
    """Test the PostgreSQL connection"""
    import psycopg2
    
    try:
        conn = psycopg2.connect(
            host='167.172.143.162',
            database='treekipedia',
            user='postgres',
            password='9353jeremic',
            port=5432,
            connect_timeout=10
        )
        
        cursor = conn.cursor()
        cursor.execute("SELECT current_database(), current_user, version()")
        result = cursor.fetchone()
        
        print(f"✅ PostgreSQL Connection Successful!")
        print(f"   Database: {result[0]}")
        print(f"   User: {result[1]}")
        print(f"   Version: {result[2][:50]}...")
        
        # Check available tables
        cursor.execute("""
            SELECT table_name, 
                   (SELECT COUNT(*) FROM information_schema.columns 
                    WHERE table_name = t.table_name) as column_count
            FROM information_schema.tables t
            WHERE table_schema = 'public'
            ORDER BY table_name
        """)
        
        tables = cursor.fetchall()
        print(f"\n📊 Available Tables ({len(tables)}):")
        for table_name, col_count in tables:
            print(f"   • {table_name} ({col_count} columns)")
        
        cursor.close()
        conn.close()
        
        return True
        
    except Exception as e:
        print(f"❌ PostgreSQL Connection Failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🔧 Setting up Treekipedia PostgreSQL Configuration")
    print("=" * 50)
    
    # Create config file
    create_working_config()
    
    # Test connection
    print("\n🔍 Testing PostgreSQL Connection...")
    test_postgres_connection()
    
    # Show what needs to be updated
    print("\n" + "=" * 50)
    update_app_config()
    
    print("\n🚀 Next Steps:")
    print("1. Update your app.py with the configuration changes above")
    print("2. Make sure psycopg2 is installed: pip install psycopg2-binary")
    print("3. Restart your Flask application")
    print("4. Visit /postgres-monitor to test the interface")