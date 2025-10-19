#!/usr/bin/env python3
"""
Blazegraph Data Cleaner - Safe Reset Script
Safely clears all data from Blazegraph to test fresh data import
"""

import requests
import json
import time
from datetime import datetime

class BlazegraphCleaner:
    """Safely clean Blazegraph data for testing"""
    
    def __init__(self, blazegraph_endpoint="http://167.172.143.162:9999/blazegraph/namespace/kb/sparql"):
        self.blazegraph_endpoint = blazegraph_endpoint
        self.backup_data = []
    
    def check_blazegraph_status(self):
        """Check if Blazegraph is accessible"""
        try:
            response = requests.get(
                self.blazegraph_endpoint.replace('/sparql', ''),
                timeout=10
            )
            if response.status_code == 200:
                print("✅ Blazegraph is accessible")
                return True
            else:
                print(f"❌ Blazegraph returned status {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Cannot connect to Blazegraph: {e}")
            return False
    
    def get_current_data_stats(self):
        """Get current statistics about data in Blazegraph"""
        try:
            print("\n📊 Getting current data statistics...")
            
            stats = {}
            
            # Count all triples
            count_query = "SELECT (COUNT(*) as ?count) WHERE { ?s ?p ?o }"
            response = requests.post(
                self.blazegraph_endpoint,
                data={'query': count_query},
                headers={'Accept': 'application/sparql-results+json'},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                stats['total_triples'] = int(result['results']['bindings'][0]['count']['value'])
            
            # Count classes
            classes_query = """
            PREFIX owl: <http://www.w3.org/2002/07/owl#>
            SELECT (COUNT(DISTINCT ?class) as ?count) WHERE {
                ?class a owl:Class
            }
            """
            response = requests.post(
                self.blazegraph_endpoint,
                data={'query': classes_query},
                headers={'Accept': 'application/sparql-results+json'},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                stats['classes'] = int(result['results']['bindings'][0]['count']['value'])
            
            # Count individuals
            individuals_query = """
            PREFIX owl: <http://www.w3.org/2002/07/owl#>
            SELECT (COUNT(DISTINCT ?individual) as ?count) WHERE {
                ?individual a owl:NamedIndividual
            }
            """
            response = requests.post(
                self.blazegraph_endpoint,
                data={'query': individuals_query},
                headers={'Accept': 'application/sparql-results+json'},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                stats['individuals'] = int(result['results']['bindings'][0]['count']['value'])
            
            # Count data properties
            data_props_query = """
            PREFIX owl: <http://www.w3.org/2002/07/owl#>
            SELECT (COUNT(DISTINCT ?prop) as ?count) WHERE {
                ?prop a owl:DatatypeProperty
            }
            """
            response = requests.post(
                self.blazegraph_endpoint,
                data={'query': data_props_query},
                headers={'Accept': 'application/sparql-results+json'},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                stats['data_properties'] = int(result['results']['bindings'][0]['count']['value'])
            
            print(f"   📈 Total triples: {stats.get('total_triples', 0):,}")
            print(f"   🏗️  Classes: {stats.get('classes', 0)}")
            print(f"   📊 Data properties: {stats.get('data_properties', 0)}")
            print(f"   👥 Individuals: {stats.get('individuals', 0):,}")
            
            return stats
            
        except Exception as e:
            print(f"❌ Error getting statistics: {e}")
            return {}
    
    def create_minimal_backup(self):
        """Create a minimal backup of ontology structure (classes and properties only)"""
        try:
            print("\n💾 Creating minimal backup of ontology structure...")
            
            # Backup classes
            classes_query = """
            PREFIX owl: <http://www.w3.org/2002/07/owl#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            SELECT ?class ?label ?comment WHERE {
                ?class a owl:Class .
                OPTIONAL { ?class rdfs:label ?label }
                OPTIONAL { ?class rdfs:comment ?comment }
            }
            """
            
            response = requests.post(
                self.blazegraph_endpoint,
                data={'query': classes_query},
                headers={'Accept': 'application/sparql-results+json'},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                classes_backup = result['results']['bindings']
                print(f"   ✅ Backed up {len(classes_backup)} classes")
                
                # Save backup to file
                backup_data = {
                    'timestamp': datetime.now().isoformat(),
                    'classes': classes_backup,
                    'stats_before_clear': self.get_current_data_stats()
                }
                
                with open(f'blazegraph_backup_{int(time.time())}.json', 'w') as f:
                    json.dump(backup_data, f, indent=2)
                
                print(f"   💾 Backup saved to blazegraph_backup_{int(time.time())}.json")
                return True
            
        except Exception as e:
            print(f"❌ Error creating backup: {e}")
            return False
    
    def clear_all_data(self, confirm=True):
        """Clear ALL data from Blazegraph"""
        if confirm:
            current_stats = self.get_current_data_stats()
            total_triples = current_stats.get('total_triples', 0)
            
            print(f"\n⚠️  WARNING: This will delete ALL {total_triples:,} triples from Blazegraph!")
            print("   This includes:")
            print(f"   • {current_stats.get('classes', 0)} ontology classes")
            print(f"   • {current_stats.get('data_properties', 0)} data properties") 
            print(f"   • {current_stats.get('individuals', 0):,} individuals")
            print("   • All other RDF data")
            
            confirmation = input("\n❓ Type 'DELETE ALL DATA' to confirm: ")
            if confirmation != 'DELETE ALL DATA':
                print("❌ Operation cancelled")
                return False
        
        try:
            print("\n🗑️  Clearing all data from Blazegraph...")
            
            # Clear everything with a simple DELETE query
            clear_query = """
            PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
            PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
            PREFIX owl: <http://www.w3.org/2002/07/owl#>
            PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
            
            DELETE WHERE {
                ?s ?p ?o .
            }
            """
            
            response = requests.post(
                self.blazegraph_endpoint,
                data=clear_query,
                headers={'Content-Type': 'application/sparql-update'},
                timeout=300  # 5 minutes timeout for large deletions
            )
            
            if response.status_code in [200, 204]:
                print("✅ All data cleared from Blazegraph")
                
                # Verify it's empty
                time.sleep(2)  # Give Blazegraph a moment
                final_stats = self.get_current_data_stats()
                
                if final_stats.get('total_triples', 0) == 0:
                    print("✅ Verification: Blazegraph is now empty")
                    return True
                else:
                    print(f"⚠️  Warning: {final_stats.get('total_triples', 0)} triples still remain")
                    return False
            else:
                print(f"❌ Clear operation failed: HTTP {response.status_code}")
                print(f"Response: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Error clearing data: {e}")
            return False
    
    def verify_empty_state(self):
        """Verify Blazegraph is completely empty"""
        try:
            print("\n🔍 Verifying empty state...")
            
            stats = self.get_current_data_stats()
            
            if stats.get('total_triples', 0) == 0:
                print("✅ SUCCESS: Blazegraph is completely empty")
                print("   Ready for fresh data import testing!")
                return True
            else:
                print(f"⚠️  Warning: {stats.get('total_triples', 0)} triples still exist")
                return False
                
        except Exception as e:
            print(f"❌ Error verifying state: {e}")
            return False

def main():
    """Main execution function"""
    print("🌳 Treekipedia Blazegraph Data Cleaner")
    print("=" * 50)
    
    cleaner = BlazegraphCleaner()
    
    # Check Blazegraph status
    if not cleaner.check_blazegraph_status():
        print("❌ Cannot proceed: Blazegraph not accessible")
        return
    
    # Get current stats
    print("\n📊 CURRENT BLAZEGRAPH STATUS:")
    print("-" * 30)
    current_stats = cleaner.get_current_data_stats()
    
    if current_stats.get('total_triples', 0) == 0:
        print("ℹ️  Blazegraph is already empty!")
        return
    
    # Create backup
    print("\n💾 BACKUP PHASE:")
    print("-" * 15)
    backup_success = cleaner.create_minimal_backup()
    
    if not backup_success:
        print("❌ Cannot proceed without backup")
        return
    
    # Clear data
    print("\n🗑️  CLEARING PHASE:")
    print("-" * 16)
    clear_success = cleaner.clear_all_data()
    
    if clear_success:
        # Verify empty
        cleaner.verify_empty_state()
        
        print("\n🎯 NEXT STEPS:")
        print("-" * 12)
        print("1. Go to your PostgreSQL Monitor: http://localhost:5001/postgres-monitor")
        print("2. Click 'Run Automation' to test automation pipeline")
        print("3. Or click 'Generate RDF' for specific tables")
        print("4. Watch your frontend interface populate Blazegraph from scratch!")
        print("\n✨ Your system is ready for fresh data import testing!")
    else:
        print("❌ Clear operation failed - check logs above")

if __name__ == "__main__":
    main()