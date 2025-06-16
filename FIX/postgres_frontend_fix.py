#!/usr/bin/env python3
"""
Complete fix for PostgreSQL frontend issues
Run this script to diagnose and fix all PostgreSQL integration problems
"""

import os
import sys
import json
import psycopg2
import requests
from datetime import datetime

def check_dependencies():
    """Check if required dependencies are installed"""
    print("🔍 Checking dependencies...")
    
    try:
        import psycopg2
        print("   ✅ psycopg2 installed")
    except ImportError:
        print("   ❌ psycopg2 not installed")
        print("   Run: pip install psycopg2-binary")
        return False
    
    try:
        import requests
        print("   ✅ requests installed")
    except ImportError:
        print("   ❌ requests not installed")
        print("   Run: pip install requests")
        return False
    
    return True

def test_postgres_connection():
    """Test PostgreSQL connection with detailed diagnostics"""
    print("\n🔗 Testing PostgreSQL Connection...")
    
    config = {
        'host': '167.172.143.162',
        'database': 'treekipedia',
        'user': 'postgres',
        'password': '9353jeremic',
        'port': 5432
    }
    
    try:
        print(f"   Connecting to: {config['host']}:{config['port']}/{config['database']}")
        
        conn = psycopg2.connect(
            host=config['host'],
            database=config['database'],
            user=config['user'],
            password=config['password'],
            port=config['port'],
            connect_timeout=10
        )
        
        cursor = conn.cursor()
        
        # Test basic connection
        cursor.execute("SELECT current_database(), current_user, version()")
        db, user, version = cursor.fetchone()
        
        print(f"   ✅ Connected successfully!")
        print(f"   Database: {db}")
        print(f"   User: {user}")
        print(f"   PostgreSQL version: {version.split(',')[0]}")
        
        # Check available tables
        cursor.execute("""
            SELECT table_name, 
                   (SELECT COUNT(*) FROM information_schema.columns 
                    WHERE table_name = t.table_name AND table_schema = 'public') as column_count
            FROM information_schema.tables t
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name
        """)
        
        tables = cursor.fetchall()
        print(f"\n   📊 Found {len(tables)} tables:")
        
        total_rows = 0
        for table_name, col_count in tables:
            try:
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                row_count = cursor.fetchone()[0]
                total_rows += row_count
                print(f"      • {table_name}: {row_count:,} rows ({col_count} columns)")
            except Exception as e:
                print(f"      • {table_name}: Error counting rows - {str(e)}")
        
        print(f"   📈 Total records: {total_rows:,}")
        
        cursor.close()
        conn.close()
        return True
        
    except psycopg2.OperationalError as e:
        print(f"   ❌ Connection failed: {str(e)}")
        print("   Check:")
        print("   - Network connectivity to 167.172.143.162:5432")
        print("   - Database credentials")
        print("   - Database 'treekipedia' exists")
        return False
    except Exception as e:
        print(f"   ❌ Unexpected error: {str(e)}")
        return False

def test_blazegraph_connection():
    """Test Blazegraph connection"""
    print("\n🔥 Testing Blazegraph Connection...")
    
    endpoint = "http://167.172.143.162:9999/blazegraph/namespace/kb/sparql"
    
    try:
        print(f"   Connecting to: {endpoint}")
        
        # Test basic connectivity
        response = requests.get("http://167.172.143.162:9999/blazegraph", timeout=10)
        
        if response.status_code == 200:
            print("   ✅ Blazegraph server accessible")
            
            # Test SPARQL endpoint
            test_query = "SELECT (COUNT(*) as ?count) WHERE { ?s ?p ?o }"
            sparql_response = requests.post(
                endpoint,
                headers={
                    'Content-Type': 'application/sparql-query',
                    'Accept': 'application/sparql-results+json'
                },
                data=test_query,
                timeout=10
            )
            
            if sparql_response.status_code == 200:
                result = sparql_response.json()
                if result.get('results', {}).get('bindings'):
                    triple_count = result['results']['bindings'][0]['count']['value']
                    print(f"   ✅ SPARQL endpoint working")
                    print(f"   📊 Current triples: {int(triple_count):,}")
                else:
                    print("   ⚠️  SPARQL endpoint accessible but no data")
                return True
            else:
                print(f"   ❌ SPARQL endpoint error: HTTP {sparql_response.status_code}")
                return False
        else:
            print(f"   ❌ Blazegraph not accessible: HTTP {response.status_code}")
            return False
            
    except requests.exceptions.ConnectError:
        print("   ❌ Cannot connect to Blazegraph server")
        print("   Check: Network connectivity to 167.172.143.162:9999")
        return False
    except requests.exceptions.Timeout:
        print("   ❌ Connection timeout")
        return False
    except Exception as e:
        print(f"   ❌ Unexpected error: {str(e)}")
        return False

def create_config_files():
    """Create necessary configuration files"""
    print("\n📝 Creating configuration files...")
    
    # Create working config
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
    
    with open('working_treekipedia_config.json', 'w') as f:
        json.dump(config, f, indent=2)
    
    print("   ✅ Created working_treekipedia_config.json")
    
    return True

def check_flask_routes():
    """Check if Flask app has required routes"""
    print("\n🌐 Checking Flask routes...")
    
    required_routes = [
        '/postgres-monitor',
        '/system-status',
        '/postgres-tables',
        '/postgres-changes',
        '/postgres-generate-rdf',
        '/run-postgres-automation',
        '/postgres-automation-status'
    ]
    
    base_url = "http://localhost:5001"  # Adjust if your Flask app runs on different port
    
    for route in required_routes:
        try:
            response = requests.get(f"{base_url}{route}", timeout=5)
            if response.status_code in [200, 405]:  # 405 for POST-only routes
                print(f"   ✅ {route}")
            else:
                print(f"   ❌ {route} - HTTP {response.status_code}")
        except requests.exceptions.ConnectionError:
            print(f"   ⚠️  Flask app not running or wrong port")
            break
        except Exception as e:
            print(f"   ❌ {route} - {str(e)}")

def generate_app_fixes():
    """Generate fixes for app.py"""
    print("\n🔧 Generating app.py fixes...")
    
    fixes = '''
# Add these fixes to your app.py file:

# 1. Update imports at the top of app.py
import psycopg2
from datetime import timedelta

# 2. Update PostgreSQL configuration
app.config['POSTGRESQL_ENABLED'] = True
app.config['POSTGRESQL_CONFIG'] = {
    'db_connection': {
        'host': '167.172.143.162',
        'database': 'treekipedia',  # Make sure this is 'treekipedia', not 'biodiversity'
        'user': 'postgres',
        'password': '9353jeremic',
        'port': 5432
    }
}

# 3. Add the route for postgres-monitor template
@app.route('/postgres-monitor')
def postgres_monitor():
    """Render PostgreSQL monitoring dashboard."""
    if not app.config['POSTGRESQL_ENABLED']:
        flash('PostgreSQL integration is not enabled.', 'error')
        return redirect(url_for('index'))
    
    return render_template('postgres_monitor.html', 
                         blazegraph_status=check_blazegraph_status() if app.config['BLAZEGRAPH_ENABLED'] else False)

# 4. Make sure you have the postgres_monitor.html template in your templates folder
'''
    
    with open('app_fixes.txt', 'w') as f:
        f.write(fixes)
    
    print("   ✅ Created app_fixes.txt with required changes")
    
    return True

def run_diagnosis():
    """Run complete diagnosis"""
    print("🩺 PostgreSQL Frontend Diagnosis")
    print("=" * 50)
    
    success = True
    
    # Check dependencies
    if not check_dependencies():
        success = False
    
    # Test connections
    postgres_ok = test_postgres_connection()
    blazegraph_ok = test_blazegraph_connection()
    
    if not postgres_ok:
        success = False
    
    # Create config files
    create_config_files()
    
    # Check Flask routes
    check_flask_routes()
    
    # Generate fixes
    generate_app_fixes()
    
    print("\n" + "=" * 50)
    print("📋 DIAGNOSIS SUMMARY")
    print("=" * 50)
    
    print(f"PostgreSQL Connection: {'✅ OK' if postgres_ok else '❌ FAILED'}")
    print(f"Blazegraph Connection: {'✅ OK' if blazegraph_ok else '❌ FAILED'}")
    print(f"Dependencies: {'✅ OK' if check_dependencies() else '❌ MISSING'}")
    
    if success:
        print("\n🎉 All checks passed! Your PostgreSQL frontend should work.")
    else:
        print("\n⚠️  Issues found. Please fix the errors above and try again.")
    
    print("\n🔧 NEXT STEPS:")
    print("1. Apply the fixes from app_fixes.txt to your app.py")
    print("2. Make sure postgres_monitor.html is in your templates folder")
    print("3. Restart your Flask application")
    print("4. Visit http://localhost:5001/postgres-monitor")
    
    return success

if __name__ == "__main__":
    try:
        success = run_diagnosis()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n❌ Diagnosis interrupted")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        sys.exit(1)