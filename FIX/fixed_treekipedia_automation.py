#!/usr/bin/env python3

import json
import logging
import os
import sys
import argparse
from datetime import datetime
from postgres_rdf_converter import PostgreSQLRDFConverter, RDFValidator

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FixedTreekipediaAutomation:
    def __init__(self, config_path: str):
        self.config_path = config_path
        self.config = self.load_config()
        if self.config.get('postgresql', {}).get('enabled', False):
            self.converter = PostgreSQLRDFConverter(self.config['postgresql'])
        else:
            self.converter = None
    
    def load_config(self) -> dict:
        try:
            with open(self.config_path, 'r') as f:
                return json.load(f)
        except:
            return {
                'postgresql': {
                    'enabled': True,
                    'db_connection': {
                        'host': '167.172.143.162',
                        'database': 'treekipedia',
                        'user': 'postgres',
                        'password': '9353jeremic',
                        'port': 5432
                    }
                }
            }
    
    def run_automation_cycle(self):
        if not self.converter or not self.converter.connect_to_database():
            print("❌ Database connection failed")
            return False
        
        try:
            print("🌳 REAL TREEKIPEDIA DATA ANALYSIS")
            print("=" * 40)
            
            tables = ['species', 'users', 'sponsorships', 'sponsorship_items', 'contreebution_nfts']
            total_records = 0
            total_triples = 0
            
            for table in tables:
                try:
                    # Get total count
                    cursor = self.converter.connection.cursor()
                    cursor.execute(f"SELECT COUNT(*) FROM {table}")
                    count = cursor.fetchone()[0]
                    cursor.close()
                    
                    # Estimate triples per table
                    if table == 'species':
                        triples = count * 100  # Rich species data
                    else:
                        triples = count * 10   # Other tables
                    
                    total_records += count
                    total_triples += triples
                    
                    print(f"  {table}: {count:,} records → {triples:,} triples")
                    
                except Exception as e:
                    print(f"  {table}: Error - {e}")
            
            print(f"\n📊 TOTALS:")
            print(f"  Records: {total_records:,}")
            print(f"  Estimated triples: {total_triples:,}")
            print(f"  Estimated size: ~{total_triples * 150 / 1024 / 1024:.1f} MB")
            
            # Test Blazegraph
            print(f"\n🔥 BLAZEGRAPH TEST:")
            try:
                import requests
                response = requests.post(
                    'http://167.172.143.162:9999/blazegraph/namespace/kb/sparql',
                    headers={'Content-Type': 'application/sparql-query', 'Accept': 'application/sparql-results+json'},
                    data='SELECT (COUNT(*) as ?count) WHERE { ?s ?p ?o }',
                    timeout=10
                )
                if response.status_code == 200:
                    result = response.json()
                    current = result['results']['bindings'][0]['count']['value']
                    print(f"  ✅ Accessible - {current} triples currently stored")
                else:
                    print(f"  ❌ HTTP {response.status_code}")
            except Exception as e:
                print(f"  ❌ Connection failed: {e}")
            
            return True
            
        finally:
            self.converter.close_connection()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', default='working_treekipedia_config.json')
    parser.add_argument('--once', action='store_true')
    args = parser.parse_args()
    
    automation = FixedTreekipediaAutomation(args.config)
    automation.run_automation_cycle()

if __name__ == '__main__':
    main()
