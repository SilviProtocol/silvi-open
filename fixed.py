#!/usr/bin/env python3
"""
Fixed Bulk Species Sync - Auto-detects primary key
Works with any column structure
"""

import psycopg2
import requests
import json
import logging
import time
from datetime import datetime
from typing import Dict, List, Any, Tuple, Optional

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FixedBulkSpeciesSync:
    """Fixed bulk sync that auto-detects the correct primary key"""
    
    def __init__(self):
        # PostgreSQL configuration
        self.postgres_config = {
            'host': '167.172.143.162',
            'database': 'treekipedia',
            'user': 'postgres',
            'password': '9353jeremic',
            'port': 5432
        }
        
        # Blazegraph configuration  
        self.blazegraph_sparql = 'http://167.172.143.162:9999/blazegraph/namespace/kb/sparql'
        self.blazegraph_data = 'http://167.172.143.162:9999/blazegraph/namespace/kb/data'
        
        # Base URIs
        self.base_uris = {
            'species': 'http://treekipedia.org/species/',
            'ontology': 'http://treekipedia.org/ontology/',
            'property': 'http://treekipedia.org/property/'
        }
        
        # Will be detected automatically
        self.primary_key_column = None
        self.species_columns = None
    
    def connect_postgres(self) -> psycopg2.extensions.connection:
        """Connect to PostgreSQL database"""
        try:
            conn = psycopg2.connect(**self.postgres_config)
            logger.info("✅ Connected to PostgreSQL")
            return conn
        except Exception as e:
            logger.error(f"❌ PostgreSQL connection failed: {e}")
            raise
    
    def detect_species_schema(self, conn: psycopg2.extensions.connection) -> bool:
        """Auto-detect the species table schema and primary key"""
        try:
            cursor = conn.cursor()
            
            # Get column information
            cursor.execute("""
                SELECT column_name, data_type, ordinal_position
                FROM information_schema.columns 
                WHERE table_name = 'species' AND table_schema = 'public'
                ORDER BY ordinal_position
            """)
            
            columns_info = cursor.fetchall()
            self.species_columns = [col[0] for col in columns_info]
            
            # Try to find actual primary key
            cursor.execute("""
                SELECT a.attname
                FROM pg_index i
                JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
                WHERE i.indrelid = 'species'::regclass AND i.indisprimary;
            """)
            
            actual_pk = cursor.fetchall()
            
            if actual_pk:
                self.primary_key_column = actual_pk[0][0]
                logger.info(f"✅ Found primary key: {self.primary_key_column}")
            else:
                # Look for likely candidates
                pk_candidates = []
                for col_name in self.species_columns:
                    if any(keyword in col_name.lower() for keyword in ['id', 'key', 'taxon']):
                        pk_candidates.append(col_name)
                
                if pk_candidates:
                    self.primary_key_column = pk_candidates[0]
                    logger.info(f"✅ Using likely primary key: {self.primary_key_column}")
                else:
                    # Use first column as fallback
                    self.primary_key_column = self.species_columns[0] if self.species_columns else None
                    logger.warning(f"⚠️ No clear primary key found, using: {self.primary_key_column}")
            
            # Test the primary key with a small query
            if self.primary_key_column:
                try:
                    cursor.execute(f"SELECT {self.primary_key_column} FROM species ORDER BY {self.primary_key_column} LIMIT 1")
                    test_result = cursor.fetchone()
                    if test_result:
                        logger.info(f"✅ Primary key {self.primary_key_column} works for ordering")
                    else:
                        logger.warning(f"⚠️ Primary key {self.primary_key_column} returned no results")
                except Exception as e:
                    logger.error(f"❌ Primary key {self.primary_key_column} failed test: {e}")
                    # Fallback to no ordering
                    self.primary_key_column = None
            
            cursor.close()
            
            logger.info(f"📊 Species table schema detected:")
            logger.info(f"   Columns: {len(self.species_columns)}")
            logger.info(f"   Primary key: {self.primary_key_column}")
            logger.info(f"   First few columns: {self.species_columns[:5]}")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Error detecting schema: {e}")
            return False
    
    def get_species_count(self, conn: psycopg2.extensions.connection) -> int:
        """Get total species count in PostgreSQL"""
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM species")
            count = cursor.fetchone()[0]
            cursor.close()
            return count
        except Exception as e:
            logger.error(f"Error getting species count: {e}")
            return 0
    
    def get_blazegraph_species_count(self) -> int:
        """Get current species count in Blazegraph"""
        try:
            query = "SELECT (COUNT(*) as ?count) WHERE { ?s a <http://treekipedia.org/ontology/Species> }"
            
            response = requests.post(
                self.blazegraph_sparql,
                data={'query': query},
                headers={'Accept': 'application/sparql-results+json'},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                count = int(result['results']['bindings'][0]['count']['value'])
                return count
            else:
                return 0
                
        except Exception as e:
            logger.error(f"Error counting Blazegraph species: {e}")
            return 0
    
    def get_species_batch(self, conn: psycopg2.extensions.connection, offset: int, limit: int) -> List[Dict]:
        """Get a batch of species data with offset"""
        try:
            cursor = conn.cursor()
            
            # Build query based on whether we have a reliable primary key
            if self.primary_key_column:
                query = f"SELECT * FROM species ORDER BY {self.primary_key_column} OFFSET {offset} LIMIT {limit}"
            else:
                # Fallback to OFFSET without ORDER BY (less reliable but works)
                query = f"SELECT * FROM species OFFSET {offset} LIMIT {limit}"
                logger.warning(f"⚠️ Using OFFSET without ORDER BY - results may be inconsistent")
            
            cursor.execute(query)
            rows = cursor.fetchall()
            
            # Convert to list of dictionaries
            data = []
            for row in rows:
                record = {}
                for i, value in enumerate(row):
                    if i < len(self.species_columns):
                        record[self.species_columns[i]] = value
                data.append(record)
            
            cursor.close()
            return data
            
        except Exception as e:
            logger.error(f"❌ Error getting species batch: {e}")
            return []
    
    def convert_species_to_rdf(self, species_data: List[Dict]) -> str:
        """Convert species data to RDF N-Triples format"""
        rdf_triples = []
        
        base_uri = self.base_uris['species']
        entity_type = f"{self.base_uris['ontology']}Species"
        
        for i, species in enumerate(species_data):
            try:
                # Create entity URI - try multiple ID fields
                species_id = None
                for id_field in [self.primary_key_column, 'taxon_id', 'id', 'species_id']:
                    if id_field and id_field in species and species[id_field] is not None:
                        species_id = species[id_field]
                        break
                
                # Fallback to generating an ID
                if species_id is None:
                    species_id = f"species_{i}_{hash(str(species)) % 1000000}"
                
                entity_uri = f"<{base_uri}{species_id}>"
                
                # Add type declaration
                rdf_triples.append(f"{entity_uri} <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <{entity_type}> .")
                
                # Convert each column to RDF property
                for column, value in species.items():
                    if value is not None and value != '':
                        property_uri = f"<{self.base_uris['property']}{column}>"
                        
                        # Handle different data types with proper escaping
                        if isinstance(value, str):
                            # Comprehensive escaping for strings
                            escaped_value = (value
                                .replace('\\', '\\\\')  # Escape backslashes first
                                .replace('"', '\\"')    # Escape quotes
                                .replace('\n', '\\n')   # Escape newlines
                                .replace('\r', '\\r')   # Escape carriage returns
                                .replace('\t', '\\t'))  # Escape tabs
                            rdf_value = f'"{escaped_value}"'
                        elif isinstance(value, int):
                            rdf_value = f'"{value}"^^<http://www.w3.org/2001/XMLSchema#integer>'
                        elif isinstance(value, float):
                            rdf_value = f'"{value}"^^<http://www.w3.org/2001/XMLSchema#decimal>'
                        elif isinstance(value, bool):
                            rdf_value = f'"{str(value).lower()}"^^<http://www.w3.org/2001/XMLSchema#boolean>'
                        else:
                            # Convert to string for other types
                            escaped_value = str(value).replace('"', '\\"').replace('\n', '\\n').replace('\r', '\\r')
                            rdf_value = f'"{escaped_value}"'
                        
                        rdf_triples.append(f"{entity_uri} {property_uri} {rdf_value} .")
                        
            except Exception as e:
                logger.warning(f"Error converting species {i}: {e}")
                continue
        
        return '\n'.join(rdf_triples)
    
    def upload_rdf_batch(self, rdf_content: str) -> Tuple[bool, str]:
        """Upload RDF batch to Blazegraph"""
        try:
            response = requests.post(
                self.blazegraph_data,
                data=rdf_content.encode('utf-8'),
                headers={'Content-Type': 'application/n-triples; charset=utf-8'},
                timeout=300
            )
            
            if response.status_code in [200, 201, 204]:
                return True, f"Success (HTTP {response.status_code})"
            else:
                return False, f"HTTP {response.status_code}: {response.text[:200]}"
                
        except Exception as e:
            return False, f"Error: {str(e)}"
    
    def sync_species_bulk_fixed(self, target_count: int = 50000, batch_size: int = 1000, skip_existing: bool = True) -> bool:
        """Fixed bulk sync with proper schema detection"""
        logger.info(f"🚀 FIXED BULK SPECIES SYNC - Target: {target_count:,} species")
        logger.info("=" * 60)
        
        try:
            # Connect to PostgreSQL
            conn = self.connect_postgres()
            
            # Detect schema first
            if not self.detect_species_schema(conn):
                logger.error("❌ Failed to detect species table schema")
                return False
            
            # Get current counts
            pg_total = self.get_species_count(conn)
            bg_current = self.get_blazegraph_species_count()
            
            logger.info(f"📊 PostgreSQL total species: {pg_total:,}")
            logger.info(f"📊 Blazegraph current species: {bg_current:,}")
            logger.info(f"🎯 Target species: {target_count:,}")
            
            if pg_total < target_count:
                logger.warning(f"⚠️ PostgreSQL only has {pg_total:,} species, target is {target_count:,}")
                target_count = pg_total
            
            if skip_existing and bg_current >= target_count:
                logger.info(f"✅ Already have {bg_current:,} species, target reached!")
                return True
            
            # Calculate what we need to sync
            if skip_existing:
                start_offset = bg_current
                remaining = target_count - bg_current
            else:
                start_offset = 0
                remaining = target_count
            
            logger.info(f"📋 Will sync {remaining:,} species starting from offset {start_offset:,}")
            
            # Process in batches
            total_batches = (remaining + batch_size - 1) // batch_size
            successful_batches = 0
            total_species_synced = 0
            
            start_time = datetime.now()
            
            for batch_num in range(total_batches):
                current_offset = start_offset + (batch_num * batch_size)
                current_batch_size = min(batch_size, remaining - (batch_num * batch_size))
                
                logger.info(f"📦 Batch {batch_num + 1}/{total_batches}: Processing {current_batch_size} species (offset: {current_offset:,})")
                
                # Get batch data
                batch_data = self.get_species_batch(conn, current_offset, current_batch_size)
                
                if not batch_data:
                    logger.warning(f"⚠️ No data in batch {batch_num + 1}")
                    continue
                
                logger.info(f"   Retrieved {len(batch_data)} species records")
                
                # Convert to RDF
                rdf_content = self.convert_species_to_rdf(batch_data)
                
                if not rdf_content.strip():
                    logger.warning(f"⚠️ Batch {batch_num + 1} produced no RDF")
                    continue
                
                logger.info(f"   Generated {rdf_content.count('.')} RDF triples")
                
                # Upload
                success, message = self.upload_rdf_batch(rdf_content)
                
                if success:
                    successful_batches += 1
                    total_species_synced += len(batch_data)
                    
                    # Progress tracking
                    elapsed = (datetime.now() - start_time).total_seconds()
                    rate = total_species_synced / elapsed if elapsed > 0 else 0
                    remaining_species = remaining - total_species_synced
                    eta_seconds = remaining_species / rate if rate > 0 else 0
                    eta_minutes = eta_seconds / 60
                    
                    logger.info(f"✅ Batch {batch_num + 1}: {len(batch_data)} species uploaded")
                    logger.info(f"📈 Progress: {total_species_synced:,}/{remaining:,} ({total_species_synced/remaining*100:.1f}%) | Rate: {rate:.1f} species/sec | ETA: {eta_minutes:.1f} min")
                    
                    # Brief pause to avoid overwhelming Blazegraph
                    time.sleep(0.5)
                    
                else:
                    logger.error(f"❌ Batch {batch_num + 1} failed: {message}")
                    # Don't stop completely, try next batch
                    continue
            
            conn.close()
            
            # Final verification
            final_count = self.get_blazegraph_species_count()
            total_time = (datetime.now() - start_time).total_seconds()
            
            logger.info(f"\n📊 BULK SYNC SUMMARY")
            logger.info(f"Batches processed: {successful_batches}/{total_batches}")
            logger.info(f"Species synced: {total_species_synced:,}")
            logger.info(f"Final species count: {final_count:,}")
            logger.info(f"Total time: {total_time:.1f} seconds")
            if total_time > 0:
                logger.info(f"Average rate: {total_species_synced/total_time:.1f} species/second")
            
            if final_count >= target_count * 0.9:  # Allow 10% tolerance
                print(f"\n🎉 BULK SYNC SUCCESS!")
                print(f"✅ Target reached: {final_count:,} species in Blazegraph")
                if total_time > 0:
                    print(f"⚡ Sync rate: {total_species_synced/total_time:.1f} species/second")
                print(f"🔗 Query your data at: {self.blazegraph_sparql}")
                return True
            else:
                print(f"\n⚠️ PARTIAL SYNC: {final_count:,}/{target_count:,} species")
                return False
                
        except Exception as e:
            logger.error(f"❌ Bulk sync failed: {e}")
            return False

def main():
    """Main execution"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Fixed Bulk Species Sync for Treekipedia')
    parser.add_argument('--target', type=int, default=50000, help='Target number of species to sync')
    parser.add_argument('--batch-size', type=int, default=1000, help='Batch size for processing')
    parser.add_argument('--schema', action='store_true', help='Show species table schema only')
    parser.add_argument('--skip-existing', action='store_true', default=True, help='Skip already synced species')
    parser.add_argument('--force-restart', action='store_true', help='Start from beginning (ignore existing)')
    
    args = parser.parse_args()
    
    try:
        syncer = FixedBulkSpeciesSync()
        
        if args.schema:
            # Just show schema
            conn = syncer.connect_postgres()
            syncer.detect_species_schema(conn)
            conn.close()
        else:
            # Run bulk sync
            skip_existing = not args.force_restart if args.force_restart else args.skip_existing
            
            success = syncer.sync_species_bulk_fixed(
                target_count=args.target,
                batch_size=args.batch_size,
                skip_existing=skip_existing
            )
            
            exit(0 if success else 1)
            
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        exit(1)

if __name__ == '__main__':
    main()