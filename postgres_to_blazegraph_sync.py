#!/usr/bin/env python3
"""
Complete PostgreSQL to Blazegraph Sync
Sync all tables from Treekipedia PostgreSQL to Blazegraph RDF
"""

import psycopg2
import requests
import json
import logging
import os
from datetime import datetime
from typing import Dict, List, Any, Tuple

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PostgreSQLBlazegraphSync:
    """Complete sync from PostgreSQL to Blazegraph"""
    
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
        self.blazegraph_endpoint = 'http://167.172.143.162:9999/blazegraph/namespace/kb/sparql'
        self.blazegraph_data = 'http://167.172.143.162:9999/blazegraph/namespace/kb/data'
        
        # Base URIs for different entity types
        self.base_uris = {
            'species': 'http://treekipedia.org/species/',
            'users': 'http://treekipedia.org/users/',
            'sponsorships': 'http://treekipedia.org/sponsorships/',
            'sponsorship_items': 'http://treekipedia.org/sponsorship_items/',
            'contreebution_nfts': 'http://treekipedia.org/nfts/',
            'ontology': 'http://treekipedia.org/ontology/',
            'property': 'http://treekipedia.org/property/'
        }
    
    def connect_postgres(self) -> psycopg2.extensions.connection:
        """Connect to PostgreSQL database"""
        try:
            conn = psycopg2.connect(**self.postgres_config)
            logger.info("✅ Connected to PostgreSQL")
            return conn
        except Exception as e:
            logger.error(f"❌ PostgreSQL connection failed: {e}")
            raise
    
    def get_table_info(self, conn: psycopg2.extensions.connection) -> List[Dict]:
        """Get information about all tables"""
        try:
            cursor = conn.cursor()
            
            # Get tables with column info
            cursor.execute("""
                SELECT 
                    t.table_name,
                    array_agg(c.column_name ORDER BY c.ordinal_position) as columns,
                    array_agg(c.data_type ORDER BY c.ordinal_position) as types
                FROM information_schema.tables t
                JOIN information_schema.columns c ON t.table_name = c.table_name
                WHERE t.table_schema = 'public' 
                AND t.table_type = 'BASE TABLE'
                GROUP BY t.table_name
                ORDER BY t.table_name
            """)
            
            tables = []
            for table_name, columns, types in cursor.fetchall():
                # Get row count
                cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
                row_count = cursor.fetchone()[0]
                
                tables.append({
                    'name': table_name,
                    'columns': columns,
                    'types': types,
                    'row_count': row_count
                })
            
            cursor.close()
            logger.info(f"✅ Found {len(tables)} tables")
            return tables
            
        except Exception as e:
            logger.error(f"❌ Error getting table info: {e}")
            return []
    
    def get_table_data(self, conn: psycopg2.extensions.connection, table_name: str, limit: int = None) -> List[Dict]:
        """Get data from a specific table"""
        try:
            cursor = conn.cursor()
            
            # Get column names
            cursor.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = %s AND table_schema = 'public'
                ORDER BY ordinal_position
            """, (table_name,))
            
            columns = [row[0] for row in cursor.fetchall()]
            
            # Get data
            query = f"SELECT * FROM {table_name}"
            if limit:
                query += f" LIMIT {limit}"
            
            cursor.execute(query)
            rows = cursor.fetchall()
            
            # Convert to list of dictionaries
            data = []
            for row in rows:
                record = {}
                for i, value in enumerate(row):
                    if i < len(columns):
                        record[columns[i]] = value
                data.append(record)
            
            cursor.close()
            logger.info(f"✅ Retrieved {len(data)} records from {table_name}")
            return data
            
        except Exception as e:
            logger.error(f"❌ Error getting data from {table_name}: {e}")
            return []
    
    def convert_table_to_rdf(self, table_name: str, data: List[Dict]) -> str:
        """Convert table data to RDF N-Triples format"""
        logger.info(f"🔄 Converting {table_name} to RDF...")
        
        rdf_triples = []
        
        # Determine base URI and entity type
        base_uri = self.base_uris.get(table_name, f'http://treekipedia.org/{table_name}/')
        entity_type = f"<{self.base_uris['ontology']}{table_name.title()}>"
        
        for i, record in enumerate(data):
            # Create entity URI (use primary key if available, otherwise use index)
            entity_id = record.get('id') or record.get(f'{table_name}_id') or i
            entity_uri = f"<{base_uri}{entity_id}>"
            
            # Add type declaration
            rdf_triples.append(f"{entity_uri} <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> {entity_type} .")
            
            # Convert each column to RDF property
            for column, value in record.items():
                if value is not None and value != '':
                    property_uri = f"<{self.base_uris['property']}{column}>"
                    
                    # Handle different data types
                    if isinstance(value, str):
                        # Escape quotes and handle special characters
                        escaped_value = value.replace('"', '\\"').replace('\n', '\\n').replace('\r', '\\r')
                        rdf_value = f'"{escaped_value}"'
                    elif isinstance(value, (int, float)):
                        rdf_value = f'"{value}"^^<http://www.w3.org/2001/XMLSchema#decimal>'
                    elif isinstance(value, bool):
                        rdf_value = f'"{str(value).lower()}"^^<http://www.w3.org/2001/XMLSchema#boolean>'
                    else:
                        # Convert to string for other types
                        escaped_value = str(value).replace('"', '\\"').replace('\n', '\\n').replace('\r', '\\r')
                        rdf_value = f'"{escaped_value}"'
                    
                    rdf_triples.append(f"{entity_uri} {property_uri} {rdf_value} .")
        
        rdf_content = '\n'.join(rdf_triples)
        logger.info(f"✅ Converted {table_name}: {len(data)} records → {len(rdf_triples)} triples")
        
        return rdf_content
    
    def upload_rdf_to_blazegraph(self, rdf_content: str, graph_uri: str) -> Tuple[bool, str]:
        """Upload RDF content to Blazegraph"""
        try:
            logger.info(f"🔄 Uploading to Blazegraph graph: {graph_uri}")
            
            # Upload to specific graph using data endpoint
            response = requests.post(
                self.blazegraph_data,
                data=rdf_content.encode('utf-8'),
                headers={'Content-Type': 'application/n-triples; charset=utf-8'},
                params={'context-uri': graph_uri},
                timeout=300
            )
            
            if response.status_code in [200, 201, 204]:
                return True, f"Success (HTTP {response.status_code})"
            else:
                return False, f"HTTP {response.status_code}: {response.text[:100]}"
                
        except Exception as e:
            return False, str(e)
    
    def verify_upload(self, graph_uri: str) -> Tuple[bool, int]:
        """Verify upload by counting triples in graph"""
        try:
            query = f"SELECT (COUNT(*) as ?count) WHERE {{ GRAPH <{graph_uri}> {{ ?s ?p ?o }} }}"
            
            response = requests.post(
                self.blazegraph_endpoint,
                data={'query': query},
                headers={'Accept': 'application/sparql-results+json'},
                timeout=30
            )
            
            if response.status_code == 200:
                result = response.json()
                count = int(result['results']['bindings'][0]['count']['value'])
                return True, count
            else:
                return False, 0
                
        except Exception as e:
            logger.error(f"Error verifying upload: {e}")
            return False, 0
    
    def sync_table(self, conn: psycopg2.extensions.connection, table_name: str, batch_size: int = 1000) -> bool:
        """Sync a single table to Blazegraph"""
        logger.info(f"🔄 Syncing table: {table_name}")
        
        try:
            # Get table data
            data = self.get_table_data(conn, table_name)
            
            if not data:
                logger.warning(f"⚠️ No data found in {table_name}")
                return True
            
            # Process in batches if table is large
            total_records = len(data)
            batches = [data[i:i + batch_size] for i in range(0, total_records, batch_size)]
            
            logger.info(f"Processing {total_records} records in {len(batches)} batches")
            
            total_triples = 0
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            for batch_num, batch_data in enumerate(batches):
                # Convert batch to RDF
                rdf_content = self.convert_table_to_rdf(table_name, batch_data)
                
                # Create graph URI for this batch
                graph_uri = f"http://treekipedia.org/{table_name}/{timestamp}_batch_{batch_num + 1}"
                
                # Upload to Blazegraph
                success, message = self.upload_rdf_to_blazegraph(rdf_content, graph_uri)
                
                if success:
                    # Verify upload
                    verified, triple_count = self.verify_upload(graph_uri)
                    if verified:
                        total_triples += triple_count
                        logger.info(f"✅ Batch {batch_num + 1}/{len(batches)}: {triple_count:,} triples")
                    else:
                        logger.warning(f"⚠️ Batch {batch_num + 1} upload verification failed")
                else:
                    logger.error(f"❌ Batch {batch_num + 1} upload failed: {message}")
                    return False
            
            logger.info(f"✅ {table_name} sync complete: {total_triples:,} triples uploaded")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error syncing {table_name}: {e}")
            return False
    
    def run_full_sync(self, tables_to_sync: List[str] = None, batch_size: int = 1000) -> bool:
        """Run complete sync of all tables"""
        logger.info("🚀 COMPLETE POSTGRESQL TO BLAZEGRAPH SYNC")
        logger.info("=" * 60)
        
        try:
            # Connect to PostgreSQL
            conn = self.connect_postgres()
            
            # Get table information
            all_tables = self.get_table_info(conn)
            
            if not all_tables:
                logger.error("❌ No tables found!")
                return False
            
            # Filter tables if specified
            if tables_to_sync:
                all_tables = [t for t in all_tables if t['name'] in tables_to_sync]
            
            logger.info(f"📊 Tables to sync: {len(all_tables)}")
            for table in all_tables:
                logger.info(f"  • {table['name']}: {table['row_count']:,} rows")
            
            # Sync each table
            successful_syncs = 0
            total_records = 0
            
            for table in all_tables:
                table_name = table['name']
                row_count = table['row_count']
                
                logger.info(f"\n🔄 Processing {table_name} ({row_count:,} rows)...")
                
                if self.sync_table(conn, table_name, batch_size):
                    successful_syncs += 1
                    total_records += row_count
                    logger.info(f"✅ {table_name} completed")
                else:
                    logger.error(f"❌ {table_name} failed")
            
            conn.close()
            
            # Summary
            logger.info(f"\n📊 SYNC SUMMARY")
            logger.info(f"Tables processed: {successful_syncs}/{len(all_tables)}")
            logger.info(f"Records processed: {total_records:,}")
            
            if successful_syncs == len(all_tables):
                print(f"\n🎉 COMPLETE SYNC SUCCESS!")
                print(f"✅ All {len(all_tables)} tables synced to Blazegraph")
                print(f"📊 Total records: {total_records:,}")
                print(f"🔗 Blazegraph endpoint: {self.blazegraph_endpoint}")
                print(f"\n💡 Query your data:")
                print(f"   SELECT ?type (COUNT(?item) as ?count)")
                print(f"   WHERE {{ ?item a ?type }}")
                print(f"   GROUP BY ?type ORDER BY DESC(?count)")
                return True
            else:
                print(f"\n⚠️ PARTIAL SYNC: {successful_syncs}/{len(all_tables)} tables completed")
                return False
                
        except Exception as e:
            logger.error(f"❌ Sync failed: {e}")
            return False

def main():
    """Main execution"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Sync PostgreSQL to Blazegraph')
    parser.add_argument('--tables', nargs='+', help='Specific tables to sync (default: all)')
    parser.add_argument('--batch-size', type=int, default=1000, help='Batch size for large tables')
    parser.add_argument('--preview', action='store_true', help='Preview tables without syncing')
    
    args = parser.parse_args()
    
    try:
        syncer = PostgreSQLBlazegraphSync()
        
        if args.preview:
            # Preview mode - just show table info
            conn = syncer.connect_postgres()
            tables = syncer.get_table_info(conn)
            conn.close()
            
            print(f"\n📊 TREEKIPEDIA DATABASE TABLES")
            print("=" * 40)
            total_rows = 0
            for table in tables:
                print(f"  {table['name']}: {table['row_count']:,} rows")
                total_rows += table['row_count']
            print(f"\nTotal records: {total_rows:,}")
            print(f"\nTo sync all tables: python3 {__file__}")
            print(f"To sync specific tables: python3 {__file__} --tables species users")
            
        else:
            # Run the sync
            success = syncer.run_full_sync(args.tables, args.batch_size)
            exit(0 if success else 1)
            
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        exit(1)

if __name__ == '__main__':
    main()