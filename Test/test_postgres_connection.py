#!/usr/bin/env python3
"""
Test PostgreSQL connection to Treekipedia database
"""

import os
from postgres_rdf_converter import PostgreSQLRDFConverter

def main():
    print("🔍 Testing PostgreSQL Connection to Treekipedia")
    print("=" * 50)
    
    # Configuration
    config = {
        'db_connection': {
            'host': os.environ.get('POSTGRES_HOST', '167.172.143.162'),
            'database': os.environ.get('POSTGRES_DB', 'treekipedia'),
            'user': os.environ.get('POSTGRES_USER', 'postgres'),
            'password': os.environ.get('POSTGRES_PASSWORD', ''),
            'port': int(os.environ.get('POSTGRES_PORT', 5432))
        }
    }
    
    print(f"Host: {config['db_connection']['host']}")
    print(f"Database: {config['db_connection']['database']}")
    print(f"User: {config['db_connection']['user']}")
    print(f"Port: {config['db_connection']['port']}")
    print("-" * 50)
    
    # Test connection
    converter = PostgreSQLRDFConverter(config)
    
    if converter.connect_to_database():
        print("✅ Connection successful!")
        
        # Test getting data from species table
        try:
            species_data = converter.get_table_changes('species')
            print(f"✅ Retrieved {len(species_data)} species records")
            
            if species_data:
                print("📊 Sample species data:")
                sample = species_data[0]
                for key, value in list(sample.items())[:5]:  # Show first 5 fields
                    print(f"   • {key}: {value}")
        
        except Exception as e:
            print(f"⚠️  Could not retrieve species data: {e}")
        
        converter.close_connection()
        print("✅ Test completed successfully!")
        
    else:
        print("❌ Connection failed!")
        print("\n🔧 Troubleshooting:")
        print("1. Set environment variables:")
        print("   export POSTGRES_PASSWORD=your_actual_password")
        print("2. Check if PostgreSQL allows remote connections")
        print("3. Verify firewall settings on the remote server")

if __name__ == '__main__':
    main()