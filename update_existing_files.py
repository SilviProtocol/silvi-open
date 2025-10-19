#!/usr/bin/env python3
"""
Simple script to update your existing files for Fuseki migration
Run this after setting up Fuseki to update your configurations
"""

import os
import json
import re

def update_config_files():
    """Update configuration files to use Fuseki endpoints"""
    
    files_updated = []
    
    # 1. Update any JSON config files
    config_files = [
        'automation_config.json',
        'working_treekipedia_config.json', 
        'treekipedia_config.json'
    ]
    
    for config_file in config_files:
        if os.path.exists(config_file):
            try:
                with open(config_file, 'r') as f:
                    config = json.load(f)
                
                # Backup original
                backup_name = f"{config_file}.backup"
                with open(backup_name, 'w') as f:
                    json.dump(config, f, indent=2)
                
                # Update Blazegraph endpoint to Fuseki
                if 'blazegraph_endpoint' in config:
                    old_endpoint = config['blazegraph_endpoint']
                    if '9999' in old_endpoint:  # Old Blazegraph port
                        config['blazegraph_endpoint'] = 'http://167.172.143.162:3030/treekipedia/sparql'
                        
                        # Add Fuseki-specific config
                        config['fuseki'] = {
                            'base_url': 'http://167.172.143.162:3030',
                            'dataset': 'treekipedia',
                            'sparql_endpoint': 'http://167.172.143.162:3030/treekipedia/sparql',
                            'update_endpoint': 'http://167.172.143.162:3030/treekipedia/update',
                            'data_endpoint': 'http://167.172.143.162:3030/treekipedia/data'
                        }
                        
                        config['triplestore_type'] = 'fuseki'
                
                # Save updated config
                with open(config_file, 'w') as f:
                    json.dump(config, f, indent=2)
                
                files_updated.append(f"{config_file} (backed up to {backup_name})")
                print(f"✅ Updated {config_file}")
                
            except Exception as e:
                print(f"❌ Error updating {config_file}: {e}")
    
    # 2. Create new Fuseki config if no config files exist
    if not files_updated:
        fuseki_config = {
            "service_account_file": "service_account.json",
            "spreadsheet_names": ["Your Spreadsheet Name Here"],
            "triplestore_type": "fuseki",
            "fuseki": {
                "base_url": "http://167.172.143.162:3030",
                "dataset": "treekipedia",
                "sparql_endpoint": "http://167.172.143.162:3030/treekipedia/sparql",
                "update_endpoint": "http://167.172.143.162:3030/treekipedia/update",
                "data_endpoint": "http://167.172.143.162:3030/treekipedia/data"
            },
            "blazegraph_endpoint": "http://167.172.143.162:3030/treekipedia/sparql",
            "postgresql": {
                "enabled": True,
                "db_connection": {
                    "host": "167.172.143.162",
                    "database": "treekipedia", 
                    "user": "postgres",
                    "password": "9353jeremic",
                    "port": 5432
                }
            },
            "auto_update_version": True,
            "version_update_user": "Automation System (Fuseki)"
        }
        
        with open('fuseki_config.json', 'w') as f:
            json.dump(fuseki_config, f, indent=2)
        
        files_updated.append('fuseki_config.json (new file created)')
        print("✅ Created fuseki_config.json")
    
    return files_updated

def update_shell_scripts():
    """Update shell scripts to point to Fuseki"""
    
    shell_files = [
        'combined_automation.sh',
        'run_automation.sh'
    ]
    
    files_updated = []
    
    for shell_file in shell_files:
        if os.path.exists(shell_file):
            try:
                with open(shell_file, 'r') as f:
                    content = f.read()
                
                # Backup original
                backup_name = f"{shell_file}.backup"
                with open(backup_name, 'w') as f:
                    f.write(content)
                
                # Update Blazegraph references
                updated_content = content
                updated_content = re.sub(
                    r'9999/blazegraph',
                    '3030/treekipedia', 
                    updated_content
                )
                updated_content = re.sub(
                    r'blazegraph.*sparql',
                    'treekipedia/sparql',
                    updated_content
                )
                
                # Add Fuseki comments
                if 'Blazegraph' in updated_content and 'Fuseki' not in updated_content:
                    updated_content = updated_content.replace(
                        'Blazegraph',
                        'Apache Jena Fuseki (migrated from Blazegraph)'
                    )
                
                # Save updated script
                with open(shell_file, 'w') as f:
                    f.write(updated_content)
                
                files_updated.append(f"{shell_file} (backed up to {backup_name})")
                print(f"✅ Updated {shell_file}")
                
            except Exception as e:
                print(f"❌ Error updating {shell_file}: {e}")
    
    return files_updated

def test_fuseki_connection():
    """Test connection to Fuseki"""
    import requests
    
    try:
        # Test ping endpoint
        ping_url = "http://167.172.143.162:3030/$/ping"
        response = requests.get(ping_url, timeout=5)
        
        if response.status_code == 200:
            print("✅ Fuseki server is accessible")
            
            # Test SPARQL endpoint
            sparql_url = "http://167.172.143.162:3030/treekipedia/sparql"
            test_query = "SELECT * WHERE { ?s ?p ?o } LIMIT 1"
            
            sparql_response = requests.post(
                sparql_url,
                data={'query': test_query},
                headers={'Accept': 'application/sparql-results+json'},
                timeout=5
            )
            
            if sparql_response.status_code in [200, 404]:  # 404 OK if no data
                print("✅ Fuseki SPARQL endpoint is working")
                print(f"   Endpoint: {sparql_url}")
                return True
            else:
                print(f"⚠️  SPARQL endpoint returned HTTP {sparql_response.status_code}")
                return False
        else:
            print(f"❌ Fuseki server not accessible: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Cannot connect to Fuseki: {e}")
        print("   Make sure Fuseki is running on port 3030")
        return False

def main():
    """Main execution"""
    print("🔄 Updating Existing Files for Fuseki Migration")
    print("=" * 50)
    
    # Test Fuseki first
    print("\n1. Testing Fuseki Connection:")
    fuseki_accessible = test_fuseki_connection()
    
    if not fuseki_accessible:
        print("\n⚠️  Fuseki is not accessible. Please:")
        print("   1. Install and start Fuseki first")
        print("   2. Run the Fuseki setup script")
        print("   3. Then run this update script")
        return False
    
    # Update config files
    print("\n2. Updating Configuration Files:")
    config_updates = update_config_files()
    
    # Update shell scripts
    print("\n3. Updating Shell Scripts:")
    script_updates = update_shell_scripts()
    
    # Summary
    print(f"\n✅ MIGRATION UPDATE COMPLETE")
    print("=" * 30)
    
    all_updates = config_updates + script_updates
    if all_updates:
        print("Files updated:")
        for update in all_updates:
            print(f"   • {update}")
    else:
        print("No files needed updating")
    
    print(f"\n🚀 Next Steps:")
    print("   1. Test your automation:")
    print("      python3 automation_script.py --config fuseki_config.json --force")
    print("   2. Test the pipeline:")
    print("      python3 treekipedia_pipeline.py --once")
    print("   3. Access Fuseki web UI:")
    print("      http://167.172.143.162:3030")
    
    return True

if __name__ == "__main__":
    main()