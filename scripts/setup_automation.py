# Create automated pipeline setup
automation_script = '''#!/usr/bin/env python3

import json
import logging
import os
import sys
import time
from datetime import datetime, timedelta
from postgres_rdf_converter import PostgreSQLRDFConverter
import requests

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TreekipediaPipeline:
    def __init__(self, config_path):
        self.config_path = config_path
        self.config = self.load_config()
        self.converter = PostgreSQLRDFConverter(self.config['postgresql'])
        self.state_file = "pipeline_state.json"
        
    def load_config(self):
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
                },
                'blazegraph': {
                    'endpoint': 'http://167.172.143.162:9999/blazegraph/namespace/kb/sparql'
                },
                'automation': {
                    'check_interval_minutes': 15
                }
            }
    
    def load_state(self):
        try:
            if os.path.exists(self.state_file):
                with open(self.state_file, 'r') as f:
                    return json.load(f)
        except:
            pass
        return {'last_check': None}
    
    def save_state(self, state):
        with open(self.state_file, 'w') as f:
            json.dump(state, f, indent=2, default=str)
    
    def detect_changes(self):
        """Detect new or updated records"""
        if not self.converter.connect_to_database():
            return False
        
        try:
            state = self.load_state()
            last_check = state.get('last_check')
            
            cursor = self.converter.connection.cursor()
            
            if last_check:
                cursor.execute("""
                    SELECT COUNT(*) FROM species 
                    WHERE updated_at > %s OR created_at > %s
                """, (last_check, last_check))
            else:
                cursor.execute("SELECT COUNT(*) FROM species LIMIT 100")
            
            change_count = cursor.fetchone()[0]
            cursor.close()
            
            logger.info(f"🔍 Found {change_count} records to process")
            return change_count > 0
            
        finally:
            self.converter.close_connection()
    
    def process_updates(self):
        """Process updated records"""
        if not self.converter.connect_to_database():
            return False
        
        try:
            state = self.load_state()
            last_check = state.get('last_check')
            
            if last_check:
                last_check_dt = datetime.fromisoformat(last_check)
            else:
                last_check_dt = None
            
            # Get updated records (limit to 100 for testing)
            data = self.converter.get_table_changes('species', last_check_dt)[:100]
            
            if not data:
                logger.info("✅ No new data to process")
                return True
            
            logger.info(f"🔄 Processing {len(data)} species records")
            
            # Generate and import RDF
            rdf_file = self.generate_rdf(data)
            success = self.import_to_blazegraph(rdf_file)
            
            if success:
                state['last_check'] = datetime.now().isoformat()
                state['last_processed_count'] = len(data)
                self.save_state(state)
                logger.info(f"✅ Successfully processed {len(data)} records")
            
            return success
            
        finally:
            self.converter.close_connection()
    
    def generate_rdf(self, species_data):
        """Generate RDF from species data"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        rdf_file = f"auto_update_{timestamp}.rdf"
        
        rdf_content = """<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
         xmlns:tree="http://treekipedia.org/ontology/">

"""
        
        for species in species_data:
            taxon_id = species.get('taxon_id', f'species_{species.get("id")}')
            species_uri = f"http://treekipedia.org/data/species/{taxon_id}"
            
            rdf_content += f'  <tree:TreeSpecies rdf:about="{species_uri}">\\n'
            
            if species.get('species'):
                rdf_content += f'    <tree:scientificName>{species["species"]}</tree:scientificName>\\n'
            if species.get('family'):
                rdf_content += f'    <tree:family>{species["family"]}</tree:family>\\n'
            if species.get('genus'):
                rdf_content += f'    <tree:genus>{species["genus"]}</tree:genus>\\n'
            
            rdf_content += f'    <tree:taxonId>{taxon_id}</tree:taxonId>\\n'
            rdf_content += f'    <tree:autoUpdated>{datetime.now().isoformat()}</tree:autoUpdated>\\n'
            rdf_content += f'  </tree:TreeSpecies>\\n\\n'
        
        rdf_content += '</rdf:RDF>'
        
        with open(rdf_file, 'w', encoding='utf-8') as f:
            f.write(rdf_content)
        
        return rdf_file
    
    def import_to_blazegraph(self, rdf_file):
        """Import RDF to Blazegraph"""
        try:
            with open(rdf_file, 'rb') as f:
                rdf_data = f.read()
            
            response = requests.post(
                self.config['blazegraph']['endpoint'],
                headers={'Content-Type': 'application/rdf+xml'},
                data=rdf_data,
                timeout=60
            )
            
            if response.status_code == 200:
                logger.info(f"✅ Imported {rdf_file}")
                os.remove(rdf_file)
                return True
            else:
                logger.error(f"❌ Import failed: {response.status_code}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Import error: {e}")
            return False
    
    def run_cycle(self):
        """Run automation cycle"""
        logger.info("🤖 Starting automation cycle")
        
        if self.detect_changes():
            return self.process_updates()
        else:
            logger.info("✅ No changes detected")
            return True

def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--config', default='working_treekipedia_config.json')
    parser.add_argument('--once', action='store_true')
    args = parser.parse_args()
    
    pipeline = TreekipediaPipeline(args.config)
    
    if args.once:
        success = pipeline.run_cycle()
        print(f"\\n{'✅ SUCCESS' if success else '❌ FAILED'}")
        sys.exit(0 if success else 1)
    else:
        pipeline.run_cycle()

if __name__ == '__main__':
    main()
'''

with open('treekipedia_pipeline.py', 'w') as f:
    f.write(automation_script)

import os
os.chmod('treekipedia_pipeline.py', 0o755)
print('✅ Created treekipedia_pipeline.py')
