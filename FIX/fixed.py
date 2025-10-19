#!/usr/bin/env python3
"""
Fixed PostgreSQL RDF Converter - Based on Working Bulk Sync
Uses the same successful approach as your working bulk sync script
"""

import psycopg2
import requests
import logging
import time
from typing import Dict, List, Any, Tuple, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

class FixedPostgreSQLRDFConverter:
    """Fixed RDF converter using the same successful approach as bulk sync"""
    
    def __init__(self, postgres_config: Dict[str, Any]):
        self.postgres_config = postgres_config
        
        # Use same URIs as working bulk sync
        self.base_uris = {
            'species': 'http://treekipedia.org/species/',
            'ontology': 'http://treekipedia.org/ontology/',
            'property': 'http://treekipedia.org/property/'
        }
        
        # Blazegraph endpoints - use data endpoint like bulk sync
        self.blazegraph_sparql = 'http://167.172.143.162:9999/blazegraph/namespace/kb/sparql'
        self.blazegraph_data = 'http://167.172.143.162:9999/blazegraph/namespace/kb/data'
        
        self.connection = None
        self.table_schemas = {}
    
    def connect_to_database(self) -> bool:
        """Connect to PostgreSQL database"""
        try:
            self.connection = psycopg2.connect(**self.postgres_config)
            logger.info("✅ Connected to PostgreSQL")
            return True
        except Exception as e:
            logger.error(f"❌ PostgreSQL connection failed: {e}")
            return False
    
    def close_connection(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            self.connection = None
    
    def detect_table_schema(self, table_name: str) -> bool:
        """Detect table schema and primary key like bulk sync"""
        try:
            cursor = self.connection.cursor()
            
            # Get column information
            cursor.execute("""
                SELECT column_name, data_type, ordinal_position
                FROM information_schema.columns 
                WHERE table_name = %s AND table_schema = 'public'
                ORDER BY ordinal_position
            """, (table_name,))
            
            columns_info = cursor.fetchall()
            columns = [col[0] for col in columns_info]
            
            # Try to find primary key
            cursor.execute("""
                SELECT a.attname
                FROM pg_index i
                JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
                WHERE i.indrelid = %s::regclass AND i.indisprimary;
            """, (table_name,))
            
            actual_pk = cursor.fetchall()
            primary_key = actual_pk[0][0] if actual_pk else None
            
            # Store schema info
            self.table_schemas[table_name] = {
                'columns': columns,
                'primary_key': primary_key
            }
            
            cursor.close()
            logger.info(f"✅ Detected schema for {table_name}: {len(columns)} columns, PK: {primary_key}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Error detecting schema for {table_name}: {e}")
            return False
    
    def get_table_data(self, table_name: str, limit: int = 1000) -> List[Dict[str, Any]]:
        """Get table data using same method as bulk sync"""
        try:
            if table_name not in self.table_schemas:
                if not self.detect_table_schema(table_name):
                    return []
            
            cursor = self.connection.cursor()
            schema = self.table_schemas[table_name]
            columns = schema['columns']
            primary_key = schema['primary_key']
            
            # Build query with proper ordering if we have primary key
            if primary_key:
                query = f"SELECT * FROM {table_name} ORDER BY {primary_key} LIMIT {limit}"
            else:
                query = f"SELECT * FROM {table_name} LIMIT {limit}"
            
            cursor.execute(query)
            rows = cursor.fetchall()
            
            # Convert to dictionaries
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
    
    def convert_table_to_rdf(self, table_name: str, table_data: List[Dict[str, Any]]) -> str:
        """Convert table data to RDF using same format as working bulk sync"""
        rdf_triples = []
        
        # Use same URI patterns as bulk sync
        if table_name == 'species':
            base_uri = self.base_uris['species']
            entity_type = f"{self.base_uris['ontology']}Species"
        else:
            base_uri = f"{self.base_uris['ontology']}{table_name}/"
            entity_type = f"{self.base_uris['ontology']}{table_name.title()}"
        
        for i, record in enumerate(table_data):
            try:
                # Create entity URI - same logic as bulk sync
                entity_id = None
                
                # Try different ID fields
                schema = self.table_schemas.get(table_name, {})
                primary_key = schema.get('primary_key')
                
                for id_field in [primary_key, 'taxon_id', 'id', f'{table_name}_id']:
                    if id_field and id_field in record and record[id_field] is not None:
                        entity_id = record[id_field]
                        break
                
                # Fallback to generating an ID
                if entity_id is None:
                    entity_id = f"{table_name}_{i}_{hash(str(record)) % 1000000}"
                
                entity_uri = f"<{base_uri}{entity_id}>"
                
                # Add type declaration
                rdf_triples.append(f"{entity_uri} <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <{entity_type}> .")
                
                # Convert each column to RDF property - SAME AS BULK SYNC
                for column, value in record.items():
                    if value is not None and value != '':
                        property_uri = f"<{self.base_uris['property']}{column}>"
                        
                        # Handle different data types with proper escaping - EXACT SAME AS BULK SYNC
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
                logger.warning(f"Error converting record {i} from {table_name}: {e}")
                continue
        
        rdf_content = '\n'.join(rdf_triples)
        logger.info(f"✅ Generated {len(rdf_triples)} RDF triples for {table_name}")
        return rdf_content
    
    def upload_rdf_to_blazegraph(self, rdf_content: str) -> Tuple[bool, str]:
        """Upload RDF to Blazegraph using SAME method as working bulk sync"""
        try:
            # Use EXACT same method as bulk sync - N-Triples format to data endpoint
            response = requests.post(
                self.blazegraph_data,  # Use data endpoint, not SPARQL endpoint
                data=rdf_content.encode('utf-8'),
                headers={'Content-Type': 'application/n-triples; charset=utf-8'},  # Same headers
                timeout=300
            )
            
            if response.status_code in [200, 201, 204]:
                logger.info(f"✅ RDF uploaded successfully: HTTP {response.status_code}")
                return True, f"Success (HTTP {response.status_code})"
            else:
                logger.error(f"❌ Upload failed: HTTP {response.status_code}")
                logger.error(f"Response: {response.text[:200]}")
                return False, f"HTTP {response.status_code}: {response.text[:200]}"
                
        except Exception as e:
            logger.error(f"❌ Upload error: {e}")
            return False, f"Error: {str(e)}"
    
    def generate_and_upload_rdf(self, table_name: str, limit: int = 1000, push_to_blazegraph: bool = True) -> Dict[str, Any]:
        """Generate RDF from table and optionally upload to Blazegraph"""
        try:
            logger.info(f"🔄 Processing table: {table_name}")
            
            # Get table data
            table_data = self.get_table_data(table_name, limit)
            
            if not table_data:
                return {
                    'success': False,
                    'error': f'No data found in table {table_name}',
                    'records_processed': 0,
                    'rdf_triples': 0
                }
            
            # Convert to RDF
            rdf_content = self.convert_table_to_rdf(table_name, table_data)
            
            if not rdf_content.strip():
                return {
                    'success': False,
                    'error': 'No RDF content generated',
                    'records_processed': len(table_data),
                    'rdf_triples': 0
                }
            
            rdf_triple_count = rdf_content.count('.')
            
            result = {
                'success': True,
                'table_name': table_name,
                'records_processed': len(table_data),
                'rdf_triples': rdf_triple_count,
                'blazegraph': {'success': False, 'message': 'Not attempted'}
            }
            
            # Upload to Blazegraph if requested
            if push_to_blazegraph:
                upload_success, upload_message = self.upload_rdf_to_blazegraph(rdf_content)
                result['blazegraph'] = {
                    'success': upload_success,
                    'message': upload_message
                }
            
            logger.info(f"✅ Processed {table_name}: {len(table_data)} records → {rdf_triple_count} triples")
            return result
            
        except Exception as e:
            logger.error(f"❌ Error processing {table_name}: {e}")
            return {
                'success': False,
                'error': str(e),
                'records_processed': 0,
                'rdf_triples': 0
            }

# Convenience function for routes_api.py
def generate_rdf_from_table(table_name: str, postgres_config: Dict[str, Any], push_to_blazegraph: bool = True, limit: int = 1000) -> Dict[str, Any]:
    """Generate RDF from PostgreSQL table using fixed converter"""
    converter = FixedPostgreSQLRDFConverter(postgres_config)
    
    try:
        if not converter.connect_to_database():
            return {
                'success': False,
                'error': 'Could not connect to PostgreSQL'
            }
        
        result = converter.generate_and_upload_rdf(table_name, limit, push_to_blazegraph)
        return result
        
    finally:
        converter.close_connection()