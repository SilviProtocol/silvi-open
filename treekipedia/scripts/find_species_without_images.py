#!/usr/bin/env python3

import psycopg2
import csv
import os
from urllib.parse import urlparse

# Database connection from environment variable
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    print("Error: DATABASE_URL environment variable not set")
    print("Please set it using: export DATABASE_URL='your_database_url'")
    exit(1)

# Parse database URL
url = urlparse(DATABASE_URL)
db_config = {
    'dbname': url.path[1:],
    'user': url.username,
    'password': url.password,
    'host': url.hostname,
    'port': url.port
}

def find_species_without_images():
    try:
        # Connect to database
        conn = psycopg2.connect(**db_config)
        cursor = conn.cursor()
        
        # Query to find species without images
        query = """
        SELECT 
            s.taxon_id,
            s.species_scientific_name,
            s.species,
            s.genus,
            s.family
        FROM species s
        LEFT JOIN images i ON s.taxon_id = i.taxon_id
        WHERE i.id IS NULL
        ORDER BY s.species_scientific_name;
        """
        
        cursor.execute(query)
        results = cursor.fetchall()
        
        # Write to CSV
        output_file = 'species_without_images.csv'
        with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
            csvwriter = csv.writer(csvfile)
            # Write header
            csvwriter.writerow(['taxon_id', 'species_scientific_name', 'species', 'genus', 'family'])
            # Write data
            csvwriter.writerows(results)
        
        print(f"Found {len(results)} species without images")
        print(f"Results saved to {output_file}")
        
        # Close connection
        cursor.close()
        conn.close()
        
        return len(results)
        
    except Exception as e:
        print(f"Error: {e}")
        return None

if __name__ == "__main__":
    find_species_without_images()