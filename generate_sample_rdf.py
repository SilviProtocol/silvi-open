#!/usr/bin/env python3

import json
import os
from datetime import datetime

def generate_species_rdf(species_data, output_file="treekipedia_sample_10.rdf"):
    print("🔗 Generating RDF from Treekipedia Species Data")
    print("=" * 50)
    
    # RDF Header
    rdf_content = '''<?xml version="1.0" encoding="UTF-8"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
         xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
         xmlns:tree="http://treekipedia.org/ontology/"
         xmlns:data="http://treekipedia.org/data/">

  <!-- Treekipedia Species Ontology -->
  <tree:TreeSpecies rdf:about="http://treekipedia.org/ontology/TreeSpecies">
    <rdfs:label>Tree Species</rdfs:label>
    <rdfs:comment>A tree species in the Treekipedia database</rdfs:comment>
  </tree:TreeSpecies>

'''
    
    triple_count = 0
    
    # Process each species
    for i, species in enumerate(species_data, 1):
        taxon_id = species.get('taxon_id', f'species_{i}')
        species_uri = f"http://treekipedia.org/data/species/{taxon_id}"
        
        rdf_content += f'  <!-- Species {i}: {species.get("species", "Unknown")} -->\n'
        rdf_content += f'  <tree:TreeSpecies rdf:about="{species_uri}">\n'
        triple_count += 1
        
        # Add properties that have data
        if species.get('species'):
            rdf_content += f'    <tree:scientificName>{species["species"]}</tree:scientificName>\n'
            triple_count += 1
        
        if species.get('family'):
            rdf_content += f'    <tree:family>{species["family"]}</tree:family>\n'
            triple_count += 1
        
        if species.get('genus'):
            rdf_content += f'    <tree:genus>{species["genus"]}</tree:genus>\n'
            triple_count += 1
        
        if species.get('habitat_human'):
            rdf_content += f'    <tree:habitat>{species["habitat_human"]}</tree:habitat>\n'
            triple_count += 1
        
        if species.get('common_countries'):
            rdf_content += f'    <tree:countries>{species["common_countries"]}</tree:countries>\n'
            triple_count += 1
        
        rdf_content += f'    <tree:taxonId>{taxon_id}</tree:taxonId>\n'
        rdf_content += f'    <tree:source>Treekipedia Database</tree:source>\n'
        triple_count += 2
        
        rdf_content += f'  </tree:TreeSpecies>\n\n'
    
    rdf_content += '</rdf:RDF>'
    
    # Save to file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(rdf_content)
    
    file_size = os.path.getsize(output_file)
    
    print(f"✅ RDF Generated Successfully!")
    print(f"   File: {output_file}")
    print(f"   Species: {len(species_data)}")
    print(f"   Triples: {triple_count:,}")
    print(f"   Size: {file_size:,} bytes ({file_size/1024:.1f} KB)")
    
    return output_file, triple_count

def test_blazegraph_import(rdf_file):
    print(f"\n🔥 Testing Blazegraph Import")
    print("-" * 30)
    
    try:
        import requests
        
        with open(rdf_file, 'rb') as f:
            rdf_data = f.read()
        
        endpoint = "http://167.172.143.162:9999/blazegraph/namespace/kb/sparql"
        graph_uri = "http://treekipedia.org/data/test_10_species"
        
        response = requests.post(
            endpoint,
            headers={'Content-Type': 'application/rdf+xml'},
            params={'context-uri': graph_uri},
            data=rdf_data,
            timeout=30
        )
        
        if response.status_code == 200:
            print("✅ Successfully imported to Blazegraph!")
            print(f"   Graph URI: {graph_uri}")
            
            # Test query
            query = f'''
            SELECT ?species ?family WHERE {{
                GRAPH <{graph_uri}> {{
                    ?s <http://treekipedia.org/ontology/scientificName> ?species .
                    ?s <http://treekipedia.org/ontology/family> ?family .
                }}
            }} LIMIT 5
            '''
            
            query_response = requests.post(
                endpoint,
                headers={'Content-Type': 'application/sparql-query', 'Accept': 'application/sparql-results+json'},
                data=query,
                timeout=10
            )
            
            if query_response.status_code == 200:
                result = query_response.json()
                print(f"\n📊 SPARQL Query Results:")
                for binding in result['results']['bindings']:
                    species = binding.get('species', {}).get('value', 'Unknown')
                    family = binding.get('family', {}).get('value', 'Unknown')
                    print(f"   • {species} ({family})")
            
            return True
        else:
            print(f"❌ Import failed: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Import failed: {str(e)}")
        return False

if __name__ == "__main__":
    if os.path.exists('treekipedia_sample_10_species.json'):
        with open('treekipedia_sample_10_species.json', 'r') as f:
            sample_data = json.load(f)
        
        species_data = sample_data['species_data']
        rdf_file, triple_count = generate_species_rdf(species_data)
        success = test_blazegraph_import(rdf_file)
        
        print(f"\n🎉 TEST COMPLETE!")
        print(f"✅ RDF Generated: {triple_count} triples")
        print(f"{'✅' if success else '❌'} Blazegraph: {'Success' if success else 'Failed'}")
        
        if success:
            print(f"\n🚀 READY FOR FULL 50,922 SPECIES DATASET!")
    else:
        print("❌ Run the species extraction test first")
