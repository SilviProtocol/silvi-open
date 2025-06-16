#!/usr/bin/env python3
"""
Test PostgreSQL to RDF conversion with real Treekipedia data
"""

import psycopg2
import json
import os
import sys
from datetime import datetime

def test_treekipedia_connection_and_data():
    """Test connection and explore real Treekipedia data"""
    
    print("🌳 Testing Real Treekipedia PostgreSQL to RDF Conversion")
    print("=" * 60)
    
    # Get password
    password = os.environ.get('POSTGRES_PASSWORD')
    if not password:
        password = input("Enter PostgreSQL password: ").strip()
        if not password:
            print("❌ Password required")
            return False
    
    try:
        # Connect to VM PostgreSQL
        print("🔌 Connecting to Treekipedia on VM...")
        conn = psycopg2.connect(
            host='167.172.143.162',
            port=5432,
            database='treekipedia',
            user='postgres',
            password=password,
            connect_timeout=10
        )
        
        cursor = conn.cursor()
        print("✅ Connected to real Treekipedia database!")
        
        # Get database info
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        print(f"📊 PostgreSQL: {version[:50]}...")
        
        print("\n🔍 Analyzing Real Treekipedia Data")
        print("-" * 40)
        
        # Analyze each table
        tables_info = {}
        
        # Get all tables
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        all_tables = [row[0] for row in cursor.fetchall()]
        print(f"📋 Found {len(all_tables)} tables: {', '.join(all_tables)}")
        
        # Focus on main Treekipedia tables
        main_tables = ['species', 'users', 'sponsorships', 'sponsorship_items', 'contreebution_nfts']
        
        for table in main_tables:
            if table in all_tables:
                try:
                    # Get count
                    cursor.execute(f"SELECT COUNT(*) FROM {table};")
                    count = cursor.fetchone()[0]
                    
                    # Get column info
                    cursor.execute(f"""
                        SELECT column_name, data_type 
                        FROM information_schema.columns 
                        WHERE table_name = '{table}' 
                        ORDER BY ordinal_position;
                    """)
                    columns = cursor.fetchall()
                    
                    # Get sample data
                    cursor.execute(f"SELECT * FROM {table} LIMIT 3;")
                    sample_data = cursor.fetchall()
                    
                    tables_info[table] = {
                        'count': count,
                        'columns': columns,
                        'sample_data': sample_data
                    }
                    
                    print(f"\n🌳 {table.upper()} TABLE:")
                    print(f"   Records: {count:,}")
                    print(f"   Columns: {len(columns)} ({', '.join([col[0] for col in columns[:5]])}{'...' if len(columns) > 5 else ''})")
                    
                except Exception as e:
                    print(f"   ❌ Error analyzing {table}: {str(e)}")
        
        # Focus on species table (most important for RDF)
        if 'species' in tables_info:
            print(f"\n🔬 SPECIES TABLE DEEP DIVE")
            print("-" * 30)
            
            species_info = tables_info['species']
            print(f"Total species: {species_info['count']:,}")
            
            # Show column structure
            print("Columns:")
            for col_name, col_type in species_info['columns']:
                print(f"   - {col_name}: {col_type}")
            
            # Show sample species data
            if species_info['sample_data']:
                print("\nSample species data:")
                col_names = [col[0] for col in species_info['columns']]
                for i, row in enumerate(species_info['sample_data'][:2], 1):
                    print(f"   Species {i}:")
                    for j, value in enumerate(row):
                        if j < len(col_names):
                            print(f"     {col_names[j]}: {value}")
        
        print(f"\n🔗 RDF CONVERSION POTENTIAL")
        print("-" * 35)
        
        # Calculate RDF potential
        total_records = sum(info['count'] for info in tables_info.values())
        estimated_triples = 0
        
        for table, info in tables_info.items():
            # Estimate triples per record (each column = 1 triple, plus type triples)
            triples_per_record = len(info['columns']) + 2  # +2 for rdf:type and additional metadata
            table_triples = info['count'] * triples_per_record
            estimated_triples += table_triples
            
            print(f"   {table}: {info['count']:,} records × {triples_per_record} triples = {table_triples:,} triples")
        
        print(f"\n🎯 TOTAL ESTIMATED RDF OUTPUT:")
        print(f"   📊 Records: {total_records:,}")
        print(f"   🔗 Triples: {estimated_triples:,}")
        print(f"   💾 Size: ~{estimated_triples * 100 / 1024 / 1024:.1f} MB")
        
        # Test specific automation queries
        print(f"\n🧪 TESTING AUTOMATION QUERIES")
        print("-" * 35)
        
        automation_queries = [
            ("Recent species updates", f"SELECT COUNT(*) FROM species WHERE updated_at > NOW() - INTERVAL '7 days';"),
            ("Active sponsorships", f"SELECT COUNT(*) FROM sponsorships WHERE status = 'active';"),
            ("Total NFTs minted", f"SELECT COUNT(*) FROM contreebution_nfts WHERE is_burned = false;"),
        ]
        
        for name, query in automation_queries:
            try:
                cursor.execute(query)
                result = cursor.fetchone()[0]
                print(f"   ✅ {name}: {result:,}")
            except Exception as e:
                print(f"   ⚠️  {name}: Query failed ({str(e)})")
        
        cursor.close()
        conn.close()
        
        # Create optimized configuration for real data
        create_treekipedia_config(password, tables_info)
        
        return True
        
    except psycopg2.OperationalError as e:
        if "authentication failed" in str(e):
            print("❌ Authentication failed - check password")
        elif "no password supplied" in str(e):
            print("❌ No password supplied")
            print("   Run: export POSTGRES_PASSWORD=your_password")
        else:
            print(f"❌ Connection failed: {str(e)}")
        return False
        
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

def create_treekipedia_config(password, tables_info):
    """Create optimized configuration for real Treekipedia data"""
    
    # Get list of tables that actually exist and have data
    valid_tables = [table for table, info in tables_info.items() if info['count'] > 0]
    
    config = {
        "postgresql": {
            "enabled": True,
            "db_connection": {
                "host": "167.172.143.162",
                "database": "treekipedia",
                "user": "postgres",
                "password": password,
                "port": 5432,
                "connect_timeout": 10,
                "sslmode": "prefer"
            },
            "tables_to_monitor": valid_tables,
            "automation": {
                "check_interval_seconds": 300,
                "max_records_per_query": 1000,
                "enable_change_detection": True
            }
        },
        "blazegraph": {
            "enabled": True,
            "endpoint": "http://167.172.143.162:9999/blazegraph/namespace/kb/sparql",
            "timeout": 30,
            "max_retries": 3,
            "named_graph_prefix": "http://treekipedia.org/data"
        },
        "rdf_generation": {
            "ontology_base_uri": "http://treekipedia.org/ontology/",
            "data_base_uri": "http://treekipedia.org/data/",
            "output_format": "rdf/xml",
            "validate_output": True
        },
        "treekipedia_metadata": {
            "total_species": tables_info.get('species', {}).get('count', 0),
            "total_users": tables_info.get('users', {}).get('count', 0),
            "total_sponsorships": tables_info.get('sponsorships', {}).get('count', 0),
            "total_nfts": tables_info.get('contreebution_nfts', {}).get('count', 0),
            "last_analyzed": datetime.now().isoformat()
        }
    }
    
    # Save configuration
    config_file = "treekipedia_production_config.json"
    with open(config_file, 'w') as f:
        json.dump(config, f, indent=2)
    
    print(f"\n💾 Created optimized config: {config_file}")
    print(f"🚀 Ready to test automation:")
    print(f"   python3 postgres_automation.py --config {config_file} --once")

def test_blazegraph_connectivity():
    """Test if Blazegraph is accessible"""
    print(f"\n🔥 Testing Blazegraph Connectivity")
    print("-" * 35)
    
    import requests
    
    try:
        blazegraph_url = "http://167.172.143.162:9999/blazegraph"
        response = requests.get(blazegraph_url, timeout=10)
        
        if response.status_code == 200:
            print("✅ Blazegraph is accessible!")
            print(f"   URL: {blazegraph_url}")
            
            # Test SPARQL endpoint
            sparql_url = "http://167.172.143.162:9999/blazegraph/namespace/kb/sparql"
            test_query = "SELECT (COUNT(*) as ?count) WHERE { ?s ?p ?o }"
            
            response = requests.post(
                sparql_url,
                headers={'Content-Type': 'application/sparql-query', 'Accept': 'application/sparql-results+json'},
                data=test_query,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                triple_count = result['results']['bindings'][0]['count']['value'] if result['results']['bindings'] else 0
                print(f"   Current triples in Blazegraph: {triple_count}")
                print("✅ SPARQL endpoint is working!")
                return True
            else:
                print(f"⚠️  SPARQL endpoint returned {response.status_code}")
                return False
        else:
            print(f"❌ Blazegraph returned {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Blazegraph connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    try:
        print("🌳 Treekipedia PostgreSQL to RDF Test")
        print("=" * 50)
        
        # Test PostgreSQL connection and analyze data
        if test_treekipedia_connection_and_data():
            # Test Blazegraph connectivity
            blazegraph_ok = test_blazegraph_connectivity()
            
            print(f"\n🎉 SUMMARY")
            print("-" * 20)
            print("✅ PostgreSQL: Connected to real Treekipedia data")
            print(f"{'✅' if blazegraph_ok else '❌'} Blazegraph: {'Ready for RDF import' if blazegraph_ok else 'Connection issues'}")
            
            if blazegraph_ok:
                print(f"\n🚀 READY FOR FULL AUTOMATION!")
                print("Your Treekipedia data can be converted to RDF and imported to Blazegraph!")
                print("\nNext step: Run the automation script with the generated config")
            else:
                print(f"\n⚠️  Fix Blazegraph connectivity before proceeding")
        else:
            print(f"\n❌ Fix PostgreSQL connection first")
            
    except KeyboardInterrupt:
        print("\n\n⏹️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Fatal error: {str(e)}")
        sys.exit(1)