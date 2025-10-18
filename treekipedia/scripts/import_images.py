#!/usr/bin/env python3
"""
Image Import Script for Treekipedia
Imports image data from JSON file into the images table
"""

import json
import psycopg2
import os
import sys
from typing import Dict, List, Tuple, Optional

# Database configuration
DATABASE_URL = "postgres://tree_user:Kj9mPx7vLq2wZn4t@localhost:5432/treekipedia"

def connect_to_database():
    """Establish database connection"""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"Error connecting to database: {e}")
        sys.exit(1)

def find_taxon_id_by_species_name(cursor, species_name: str) -> Optional[str]:
    """
    Find taxon_id by matching species_scientific_name
    
    Args:
        cursor: Database cursor
        species_name: Scientific name from JSON (e.g., "Abies alba")
    
    Returns:
        taxon_id if found, None otherwise
    """
    query = """
    SELECT taxon_id FROM species 
    WHERE species_scientific_name = %s
    LIMIT 1
    """
    
    try:
        cursor.execute(query, (species_name,))
        result = cursor.fetchone()
        return result[0] if result else None
    except Exception as e:
        print(f"Error querying species {species_name}: {e}")
        return None

def import_image_record(cursor, taxon_id: str, image_data: Dict, is_primary: bool = False) -> bool:
    """
    Insert image record into images table
    
    Args:
        cursor: Database cursor
        taxon_id: Species taxon_id
        image_data: Image data from JSON
        is_primary: Whether this is the primary image for the species
    
    Returns:
        True if successful, False otherwise
    """
    insert_query = """
    INSERT INTO images (taxon_id, image_url, license, photographer, page_url, source, is_primary)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    
    try:
        cursor.execute(insert_query, (
            taxon_id,
            image_data['image_url'],
            image_data.get('license'),
            image_data.get('photographer'),
            image_data.get('page_url'),
            image_data.get('source', 'Wikimedia Commons'),
            is_primary
        ))
        return True
    except Exception as e:
        print(f"Error inserting image for taxon_id {taxon_id}: {e}")
        return False

def process_images_json(json_file_path: str, dry_run: bool = True) -> Dict:
    """
    Process images JSON and import to database
    
    Args:
        json_file_path: Path to the JSON file
        dry_run: If True, don't actually insert data
    
    Returns:
        Dictionary with import statistics
    """
    stats = {
        'total_entries': 0,
        'matched_species': 0,
        'unmatched_species': 0,
        'imported_images': 0,
        'failed_imports': 0,
        'species_with_primary': 0,
        'unmatched_list': []
    }
    
    # Load JSON data
    try:
        with open(json_file_path, 'r') as f:
            image_data = json.load(f)
    except Exception as e:
        print(f"Error loading JSON file: {e}")
        return stats
    
    print(f"Loaded {len(image_data)} image entries from {json_file_path}")
    stats['total_entries'] = len(image_data)
    
    # Connect to database
    conn = connect_to_database()
    cursor = conn.cursor()
    
    # Group images by species to handle primary designation
    species_images = {}
    for image in image_data:
        species_name = image['species']
        if species_name not in species_images:
            species_images[species_name] = []
        species_images[species_name].append(image)
    
    print(f"Found images for {len(species_images)} unique species")
    
    # Process each species
    for species_name, images in species_images.items():
        # Find corresponding taxon_id
        taxon_id = find_taxon_id_by_species_name(cursor, species_name)
        
        if taxon_id:
            stats['matched_species'] += 1
            print(f"✓ Found taxon_id {taxon_id} for {species_name} ({len(images)} images)")
            
            # Import images for this species
            for i, image in enumerate(images):
                is_primary = (i == 0)  # First image is primary
                
                if not dry_run:
                    success = import_image_record(cursor, taxon_id, image, is_primary)
                    if success:
                        stats['imported_images'] += 1
                        if is_primary:
                            stats['species_with_primary'] += 1
                    else:
                        stats['failed_imports'] += 1
                else:
                    print(f"  [DRY RUN] Would import: {image['image_url']} (primary: {is_primary})")
                    stats['imported_images'] += 1
                    if is_primary:
                        stats['species_with_primary'] += 1
        else:
            stats['unmatched_species'] += 1
            stats['unmatched_list'].append(species_name)
            print(f"✗ No match found for species: {species_name}")
    
    if not dry_run:
        conn.commit()
        print("\n✅ Database changes committed")
    else:
        print("\n🧪 DRY RUN - No database changes made")
    
    cursor.close()
    conn.close()
    
    return stats

def print_import_summary(stats: Dict):
    """Print summary of import results"""
    print("\n" + "="*50)
    print("IMPORT SUMMARY")
    print("="*50)
    print(f"Total JSON entries:     {stats['total_entries']}")
    print(f"Matched species:        {stats['matched_species']}")
    print(f"Unmatched species:      {stats['unmatched_species']}")
    print(f"Images imported:        {stats['imported_images']}")
    print(f"Failed imports:         {stats['failed_imports']}")
    print(f"Species with primary:   {stats['species_with_primary']}")
    
    if stats['unmatched_species'] > 0:
        print(f"\nMatch rate: {(stats['matched_species'] / (stats['matched_species'] + stats['unmatched_species'])) * 100:.1f}%")
        
        print(f"\nFirst 10 unmatched species:")
        for species in stats['unmatched_list'][:10]:
            print(f"  - {species}")
        
        if len(stats['unmatched_list']) > 10:
            print(f"  ... and {len(stats['unmatched_list']) - 10} more")

def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage: python import_images.py <json_file> [--execute]")
        print("  --execute: Actually perform the import (default is dry run)")
        sys.exit(1)
    
    json_file = sys.argv[1]
    dry_run = "--execute" not in sys.argv
    
    if not os.path.exists(json_file):
        print(f"Error: JSON file {json_file} not found")
        sys.exit(1)
    
    if dry_run:
        print("🧪 DRY RUN MODE - No database changes will be made")
        print("Add --execute flag to actually import data")
    else:
        print("⚠️  EXECUTE MODE - Database will be modified")
    
    print(f"Processing: {json_file}")
    
    stats = process_images_json(json_file, dry_run=dry_run)
    print_import_summary(stats)

if __name__ == "__main__":
    main()