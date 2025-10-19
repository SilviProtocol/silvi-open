#!/usr/bin/env python3
"""
Complete Migration from Blazegraph to Apache Jena Fuseki
For Treekipedia GraphFlow System
"""

import requests
import json
import logging
import os
import sys
import argparse
from datetime import datetime
from typing import Dict, List, Any, Tuple
import time

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class TreekipediaMigrator:
    """Complete migration from Blazegraph to Apache Jena Fuseki"""
    
    def __init__(self, blazegraph_url: str, fuseki_url: str, dataset_name: str = "treekipedia"):
        # Source (Blazegraph)
        self.blazegraph_sparql = blazegraph_url
        
        # Destination (Fuseki)
        self.fuseki_base = fuseki_url.rstrip('/')
        self.dataset_name = dataset_name
        self.fuseki_sparql = f"{self.fuseki_base}/{dataset_name}/sparql"
        self.fuseki_update = f"{self.fuseki_base}/{dataset_name}/update"
        self.fuseki_data = f"{self.fuseki_base}/{dataset_name}/data"
        
        logger.info(f"🔄 Migration Setup:")
        logger.info(f"   Source (Blazegraph): {self.blazegraph_sparql}")
        logger.info(f"   Target (Fuseki): {self.fuseki_sparql}")
    
    def check_blazegraph_connection(self) -> Tuple[bool, str, int]:
        """Check Blazegraph connection and get triple count"""
        try:
            logger.info("📊 Checking Blazegraph connection...")
            
            # Test basic connectivity
            response = requests.get(self.blazegraph_sparql, timeout=10)
            if response.status_code != 200:
                return False, f"HTTP {response.status_code}", 0
            
            # Get triple count
            count_query = "SELECT (COUNT(*) as ?count) WHERE { ?s ?p ?o }"
            count_response = requests.post(
                self.blazegraph_sparql,
                data={'query': count_query},
                headers={'Accept': 'application/sparql-results+json'},
                timeout=30
            )
            
            triple_count = 0
            if count_response.status_code == 200:
                result = count_response.json()
                triple_count = int(result['results']['bindings'][0]['count']['value'])
            
            return True, "Connected", triple_count
            
        except Exception as e:
            return False, str(e), 0
    
    def check_fuseki_connection(self) -> Tuple[bool, str]:
        """Check Fuseki connection and dataset availability"""
        try:
            logger.info("📊 Checking Fuseki connection...")
            
            # Test server ping
            ping_response = requests.get(f"{self.fuseki_base}/$/ping", timeout=10)
            if ping_response.status_code != 200:
                return False, f"Server not accessible (HTTP {ping_response.status_code})"
            
            # Test dataset
            test_query = "SELECT * WHERE { ?s ?p ?o } LIMIT 1"
            query_response = requests.post(
                self.fuseki_sparql,
                data={'query': test_query},
                headers={'Accept': 'application/sparql-results+json'},
                timeout=10
            )
            
            if query_response.status_code in [200, 404]:  # 404 is OK if empty
                return True, "Connected and dataset accessible"
            else:
                return False, f"Dataset access failed (HTTP {query_response.status_code})"
                
        except Exception as e:
            return False, str(e)
    
    def get_blazegraph_graphs(self) -> List[str]:
        """Get list of named graphs from Blazegraph"""
        try:
            logger.info("📋 Getting list of graphs from Blazegraph...")
            
            graphs_query = "SELECT DISTINCT ?graph WHERE { GRAPH ?graph { ?s ?p ?o } }"
            response = requests.post(
                self.blazegraph_sparql,
                data={'query': graphs_query},
                headers={'Accept': 'application/sparql-results+json'},
                timeout=60
            )
            
            graphs = []
            if response.status_code == 200:
                result = response.json()
                graphs = [binding['graph']['value'] for binding in result['results']['bindings']]
            
            logger.info(f"Found {len(graphs)} named graphs")
            return graphs
            
        except Exception as e:
            logger.error(f"Error getting graphs: {e}")
            return []
    
    def export_graph_from_blazegraph(self, graph_uri: str = None) -> Tuple[bool, str]:
        """Export RDF data from Blazegraph"""
        try:
            if graph_uri:
                logger.info(f"📤 Exporting graph: {graph_uri}")
                construct_query = f"CONSTRUCT {{ ?s ?p ?o }} WHERE {{ GRAPH <{graph_uri}> {{ ?s ?p ?o }} }}"
                filename = f"export_graph_{graph_uri.split('/')[-1]}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.rdf"
            else:
                logger.info("📤 Exporting all data from Blazegraph...")
                construct_query = "CONSTRUCT { ?s ?p ?o } WHERE { ?s ?p ?o }"
                filename = f"export_all_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.rdf"
            
            response = requests.post(
                self.blazegraph_sparql,
                data={'query': construct_query},
                headers={'Accept': 'application/rdf+xml'},
                timeout=300,
                stream=True
            )
            
            if response.status_code == 200:
                with open(filename, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        f.write(chunk)
                
                file_size = os.path.getsize(filename)
                logger.info(f"✅ Exported to {filename} ({file_size:,} bytes)")
                return True, filename
            else:
                return False, f"Export failed: HTTP {response.status_code}"
                
        except Exception as e:
            logger.error(f"Export error: {e}")
            return False, str(e)
    
    def import_to_fuseki(self, rdf_file: str, graph_uri: str = None) -> Tuple[bool, str]:
        """Import RDF file to Fuseki"""
        try:
            if graph_uri:
                logger.info(f"📥 Importing to graph: {graph_uri}")
            else:
                logger.info("📥 Importing to default graph...")
            
            # Read RDF file
            with open(rdf_file, 'rb') as f:
                rdf_content = f.read()
            
            if not rdf_content:
                return False, "Empty RDF file"
            
            # Import using HTTP PUT to data endpoint
            headers = {'Content-Type': 'application/rdf+xml'}
            
            if graph_uri:
                params = {'graph': graph_uri}
            else:
                params = {'default': ''}
            
            response = requests.put(
                self.fuseki_data,
                data=rdf_content,
                headers=headers,
                params=params,
                timeout=600
            )
            
            if response.status_code in [200, 201, 204]:
                return True, f"Import successful (HTTP {response.status_code})"
            else:
                return False, f"Import failed (HTTP {response.status_code}): {response.text[:200]}"
                
        except Exception as e:
            logger.error(f"Import error: {e}")
            return False, str(e)
    
    def verify_migration(self) -> Dict[str, Any]:
        """Verify migration by comparing data"""
        try:
            logger.info("🔍 Verifying migration...")
            
            # Count triples in Blazegraph
            blazegraph_count = 0
            try:
                bg_response = requests.post(
                    self.blazegraph_sparql,
                    data={'query': 'SELECT (COUNT(*) as ?count) WHERE { ?s ?p ?o }'},
                    headers={'Accept': 'application/sparql-results+json'},
                    timeout=60
                )
                
                if bg_response.status_code == 200:
                    result = bg_response.json()
                    blazegraph_count = int(result['results']['bindings'][0]['count']['value'])
            except Exception as e:
                logger.warning(f"Could not get Blazegraph count: {e}")
            
            # Count triples in Fuseki
            fuseki_count = 0
            try:
                fuseki_response = requests.post(
                    self.fuseki_sparql,
                    data={'query': 'SELECT (COUNT(*) as ?count) WHERE { ?s ?p ?o }'},
                    headers={'Accept': 'application/sparql-results+json'},
                    timeout=60
                )
                
                if fuseki_response.status_code == 200:
                    result = fuseki_response.json()
                    fuseki_count = int(result['results']['bindings'][0]['count']['value'])
            except Exception as e:
                logger.warning(f"Could not get Fuseki count: {e}")
            
            # Calculate success metrics
            success_rate = (fuseki_count / blazegraph_count * 100) if blazegraph_count > 0 else 100
            migration_complete = fuseki_count > 0
            data_match = blazegraph_count == fuseki_count if blazegraph_count > 0 else fuseki_count > 0
            
            verification = {
                'blazegraph_triples': blazegraph_count,
                'fuseki_triples': fuseki_count,
                'migration_complete': migration_complete,
                'data_match': data_match,
                'success_rate': success_rate,
                'missing_triples': max(0, blazegraph_count - fuseki_count)
            }
            
            logger.info(f"📊 Verification Results:")
            logger.info(f"   Blazegraph: {blazegraph_count:,} triples")
            logger.info(f"   Fuseki: {fuseki_count:,} triples")
            logger.info(f"   Success rate: {success_rate:.1f}%")
            
            return verification
            
        except Exception as e:
            logger.error(f"Verification error: {e}")
            return {'error': str(e), 'migration_complete': False}
    
    def run_migration(self, export_graphs_separately: bool = False) -> Dict[str, Any]:
        """Run complete migration process"""
        try:
            logger.info("🚀 Starting Treekipedia Migration from Blazegraph to Fuseki")
            logger.info("=" * 80)
            
            start_time = datetime.now()
            results = {
                'start_time': start_time.isoformat(),
                'steps': {},
                'success': False,
                'exported_files': []
            }
            
            # Step 1: Check connections
            logger.info("Step 1: Checking connections...")
            
            bg_success, bg_message, bg_triples = self.check_blazegraph_connection()
            results['steps']['blazegraph_check'] = {
                'success': bg_success,
                'message': bg_message,
                'triple_count': bg_triples
            }
            
            if not bg_success:
                results['error'] = f"Cannot connect to Blazegraph: {bg_message}"
                return results
            
            fuseki_success, fuseki_message = self.check_fuseki_connection()
            results['steps']['fuseki_check'] = {
                'success': fuseki_success,
                'message': fuseki_message
            }
            
            if not fuseki_success:
                results['error'] = f"Cannot connect to Fuseki: {fuseki_message}"
                return results
            
            logger.info(f"✅ Blazegraph: {bg_triples:,} triples available")
            logger.info(f"✅ Fuseki: Connected and ready")
            
            # Step 2: Export data
            logger.info("\nStep 2: Exporting data from Blazegraph...")
            
            if export_graphs_separately:
                # Export each graph separately
                graphs = self.get_blazegraph_graphs()
                
                if graphs:
                    logger.info(f"Exporting {len(graphs)} graphs separately...")
                    for graph_uri in graphs:
                        export_success, export_file = self.export_graph_from_blazegraph(graph_uri)
                        if export_success:
                            results['exported_files'].append({
                                'file': export_file,
                                'graph': graph_uri,
                                'success': True
                            })
                        else:
                            results['exported_files'].append({
                                'graph': graph_uri,
                                'success': False,
                                'error': export_file
                            })
                else:
                    # Export all data as single file
                    export_success, export_file = self.export_graph_from_blazegraph()
                    if export_success:
                        results['exported_files'].append({
                            'file': export_file,
                            'graph': 'default',
                            'success': True
                        })
                    else:
                        results['error'] = f"Export failed: {export_file}"
                        return results
            else:
                # Export all data as single file
                export_success, export_file = self.export_graph_from_blazegraph()
                results['steps']['export'] = {
                    'success': export_success,
                    'file': export_file if export_success else None
                }
                
                if not export_success:
                    results['error'] = f"Export failed: {export_file}"
                    return results
                
                results['exported_files'].append({
                    'file': export_file,
                    'graph': 'all_data',
                    'success': True
                })
            
            # Step 3: Import to Fuseki
            logger.info("\nStep 3: Importing data to Fuseki...")
            
            import_results = []
            for export_info in results['exported_files']:
                if not export_info['success']:
                    continue
                
                import_success, import_message = self.import_to_fuseki(
                    export_info['file'],
                    export_info['graph'] if export_info['graph'] != 'all_data' else None
                )
                
                import_results.append({
                    'file': export_info['file'],
                    'graph': export_info['graph'],
                    'success': import_success,
                    'message': import_message
                })
                
                if import_success:
                    logger.info(f"✅ Imported {export_info['file']}")
                else:
                    logger.error(f"❌ Failed to import {export_info['file']}: {import_message}")
            
            results['steps']['import'] = import_results
            
            # Check if any imports succeeded
            successful_imports = [r for r in import_results if r['success']]
            if not successful_imports:
                results['error'] = "All imports failed"
                return results
            
            # Step 4: Verify migration
            logger.info("\nStep 4: Verifying migration...")
            
            # Wait a moment for Fuseki to index
            time.sleep(2)
            
            verification = self.verify_migration()
            results['steps']['verification'] = verification
            
            # Cleanup exported files (optional)
            try:
                for export_info in results['exported_files']:
                    if export_info['success'] and 'file' in export_info:
                        os.remove(export_info['file'])
                        logger.info(f"🧹 Cleaned up {export_info['file']}")
            except Exception as e:
                logger.warning(f"Cleanup warning: {e}")
            
            # Determine overall success
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            
            results['success'] = verification.get('migration_complete', False)
            results['end_time'] = end_time.isoformat()
            results['duration_seconds'] = duration
            
            if results['success']:
                logger.info(f"\n🎉 MIGRATION COMPLETED SUCCESSFULLY!")
                logger.info(f"✅ Migrated {verification.get('fuseki_triples', 0):,} triples")
                logger.info(f"⏱️  Duration: {duration:.1f} seconds")
                logger.info(f"🔗 New Fuseki endpoints:")
                logger.info(f"   SPARQL Query: {self.fuseki_sparql}")
                logger.info(f"   SPARQL Update: {self.fuseki_update}")
                logger.info(f"   Data Upload: {self.fuseki_data}")
                logger.info(f"\n🔧 Next steps:")
                logger.info(f"   1. Update your application configuration")
                logger.info(f"   2. Test SPARQL queries on new endpoint")
                logger.info(f"   3. Update environment variables")
                logger.info(f"   4. Restart your application")
            else:
                logger.error(f"\n❌ Migration completed with issues")
                logger.error(f"Please check the verification results")
            
            return results
            
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            return {
                'success': False,
                'error': str(e),
                'start_time': datetime.now().isoformat()
            }

def main():
    """Main execution function"""
    parser = argparse.ArgumentParser(description='Migrate Treekipedia from Blazegraph to Fuseki')
    parser.add_argument('--blazegraph', 
                       default='http://167.172.143.162:9999/blazegraph/namespace/kb/sparql',
                       help='Blazegraph SPARQL endpoint')
    parser.add_argument('--fuseki', 
                       default='http://167.172.143.162:3030',
                       help='Fuseki server base URL')
    parser.add_argument('--dataset', 
                       default='treekipedia',
                       help='Fuseki dataset name')
    parser.add_argument('--separate-graphs', 
                       action='store_true',
                       help='Export each graph separately')
    parser.add_argument('--dry-run', 
                       action='store_true',
                       help='Check connections only, do not migrate')
    
    args = parser.parse_args()
    
    try:
        migrator = TreekipediaMigrator(args.blazegraph, args.fuseki, args.dataset)
        
        if args.dry_run:
            logger.info("🔍 DRY RUN - Checking connections only")
            
            bg_success, bg_message, bg_triples = migrator.check_blazegraph_connection()
            fuseki_success, fuseki_message = migrator.check_fuseki_connection()
            
            print(f"\n📊 CONNECTION TEST RESULTS")
            print("=" * 40)
            print(f"Blazegraph: {'✅ Connected' if bg_success else '❌ Failed'}")
            if bg_success:
                print(f"  Triples: {bg_triples:,}")
            else:
                print(f"  Error: {bg_message}")
            
            print(f"Fuseki: {'✅ Connected' if fuseki_success else '❌ Failed'}")
            if not fuseki_success:
                print(f"  Error: {fuseki_message}")
            
            if bg_success and fuseki_success:
                print(f"\n✅ Ready for migration!")
                print(f"Run without --dry-run to start migration")
            else:
                print(f"\n❌ Fix connection issues before migration")
                
            sys.exit(0 if (bg_success and fuseki_success) else 1)
        
        # Run actual migration
        result = migrator.run_migration(args.separate_graphs)
        
        # Print final summary
        print(f"\n{'='*80}")
        print(f"MIGRATION SUMMARY")
        print(f"{'='*80}")
        print(f"Success: {'✅ YES' if result['success'] else '❌ NO'}")
        
        if 'verification' in result.get('steps', {}):
            verification = result['steps']['verification']
            print(f"Blazegraph triples: {verification.get('blazegraph_triples', 0):,}")
            print(f"Fuseki triples: {verification.get('fuseki_triples', 0):,}")
            print(f"Success rate: {verification.get('success_rate', 0):.1f}%")
        
        if 'duration_seconds' in result:
            print(f"Duration: {result['duration_seconds']:.1f} seconds")
        
        if 'error' in result:
            print(f"Error: {result['error']}")
        
        print(f"{'='*80}")
        
        sys.exit(0 if result['success'] else 1)
        
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        sys.exit(1)

if __name__ == "__main__":

    main()