import csv
import os
from owlready2 import *

# Set Owlready2 to store the ontology in memory
onto_path.append(".")
ONTOLOGY_IRI = "http://www.example.org/biodiversity-ontology"

def create_ontology():
    """Creates a new ontology with the basic structure"""
    print("Creating new ontology...")
    onto = get_ontology(ONTOLOGY_IRI)
    
    with onto:
        # Create base classes
        class Organism(Thing): pass
        class TaxonomicRank(Organism): pass
        class Habitat(Thing): pass
        class GeographicRegion(Thing): pass
        
        # Create taxonomic rank classes
        class Class(TaxonomicRank): pass
        class Order(TaxonomicRank): pass
        class Family(TaxonomicRank): pass
        class Genus(TaxonomicRank): pass
        class Species(TaxonomicRank): pass
        class Species_Individual(Organism): pass
        
        # Create habitat classes
        class Biome(Habitat): pass
        class Ecoregion(Habitat): pass
        
        # Create geographic classes
        class Country(GeographicRegion): pass
        class Continent(GeographicRegion): pass
        
        # Create annotation properties
        class hasCountryCode(AnnotationProperty): pass
        class inContinent(AnnotationProperty): pass
    
    return onto

def add_object_properties(onto):
    """Adds object properties from CSV file"""
    print("Adding object properties...")
    
    with onto:
        # Check if object_properties.csv exists
        if not os.path.exists('object_properties.csv'):
            print("Warning: object_properties.csv file not found.")
            return onto
            
        # Read object properties from CSV
        with open('object_properties.csv', mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                # Create the property
                property_name = row['property_name']
                domain_name = row['domain']
                range_name = row['range']
                
                # Get or create domain and range classes
                domain_class = None
                range_class = None
                
                for cls in onto.classes():
                    if cls.name == domain_name:
                        domain_class = cls
                    if cls.name == range_name:
                        range_class = cls
                
                if domain_class is None:
                    print(f"Creating domain class: {domain_name}")
                    domain_class = types.new_class(domain_name, (Thing,))
                
                if range_class is None:
                    print(f"Creating range class: {range_name}")
                    range_class = types.new_class(range_name, (Thing,))
                
                # Create the property
                new_prop = types.new_class(property_name, (ObjectProperty,))
                new_prop.domain.append(domain_class)
                new_prop.range.append(range_class)
                
                # Add characteristics using the correct approach
                if 'is_transitive' in row and row['is_transitive'].upper() == 'TRUE':
                    new_prop.is_a.append(TransitiveProperty)
                
                if 'is_functional' in row and row['is_functional'].upper() == 'TRUE':
                    new_prop.is_a.append(FunctionalProperty)
                
                # Add description annotation if available
                if 'description' in row and row['description']:
                    new_prop.comment.append(row['description'])
                
                # Create inverse property if specified
                if 'inverse_property' in row and row['inverse_property']:
                    inv_prop_name = row['inverse_property']
                    inv_prop = None
                    
                    # Check if inverse property already exists
                    for prop in onto.object_properties():
                        if prop.name == inv_prop_name:
                            inv_prop = prop
                            break
                    
                    if inv_prop is None:
                        inv_prop = types.new_class(inv_prop_name, (ObjectProperty,))
                        inv_prop.domain.append(range_class)
                        inv_prop.range.append(domain_class)
                    
                    # Set inverse properties
                    new_prop.inverse_property = inv_prop
                    inv_prop.inverse_property = new_prop
    
    return onto

def add_data_properties(onto):
    """Adds data properties from CSV file"""
    print("Adding data properties...")
    
    with onto:
        # Check if data_properties.csv exists
        if not os.path.exists('data_properties.csv'):
            print("Warning: data_properties.csv file not found.")
            return onto
            
        # Read data properties from CSV
        with open('data_properties.csv', mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                # Create the property
                property_name = row['property_name']
                domain_name = row['domain']
                range_type = row['range']
                
                # Get or create domain class
                domain_class = None
                for cls in onto.classes():
                    if cls.name == domain_name:
                        domain_class = cls
                        break
                
                if domain_class is None:
                    print(f"Creating domain class: {domain_name}")
                    domain_class = types.new_class(domain_name, (Thing,))
                
                # Create the property, making it functional if specified
                if 'is_functional' in row and row['is_functional'].upper() == 'TRUE':
                    new_prop = types.new_class(property_name, (DataProperty, FunctionalProperty))
                else:
                    new_prop = types.new_class(property_name, (DataProperty,))
                
                new_prop.domain.append(domain_class)
                
                # Set range based on type
                if range_type == 'string':
                    new_prop.range.append(str)
                elif range_type == 'float':
                    new_prop.range.append(float)
                elif range_type == 'integer':
                    new_prop.range.append(int)
                else:
                    new_prop.range.append(str)  # Default to string
                
                # Add description annotation if available
                if 'description' in row and row['description']:
                    new_prop.comment.append(row['description'])
    
    return onto

def add_taxonomic_hierarchy(onto):
    """Adds taxonomic hierarchy from CSV file"""
    print("Adding taxonomic hierarchy...")
    
    with onto:
        # Check if taxonomic_hierarchy.csv exists
        if not os.path.exists('taxonomic_hierarchy.csv'):
            print("Warning: taxonomic_hierarchy.csv file not found.")
            return onto
            
        # First, collect all unique class, order, and family names
        class_names = set()
        order_names = set()
        family_names = set()
        
        with open('taxonomic_hierarchy.csv', mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                if 'class_name' in row and row['class_name'].strip():
                    class_names.add(row['class_name'].strip())
                if 'order_name' in row and row['order_name'].strip():
                    order_names.add(row['order_name'].strip())
                if 'family_name' in row and row['family_name'].strip():
                    family_names.add(row['family_name'].strip())
        
        # Create classes for each taxonomic rank
        class_entities = {}
        for name in class_names:
            if name:  # Skip empty names
                safe_name = name.replace(' ', '_')
                new_class = types.new_class(safe_name, (onto.Class,))
                class_entities[name] = new_class
        
        order_entities = {}
        for name in order_names:
            if name:
                safe_name = name.replace(' ', '_')
                new_order = types.new_class(safe_name, (onto.Order,))
                order_entities[name] = new_order
        
        family_entities = {}
        for name in family_names:
            if name:
                safe_name = name.replace(' ', '_')
                new_family = types.new_class(safe_name, (onto.Family,))
                family_entities[name] = new_family
        
        # Now create the relationships
        hasParentClass = None
        hasParentOrder = None
        
        # Find the object properties
        for prop in onto.object_properties():
            if prop.name == "hasParentClass":
                hasParentClass = prop
            elif prop.name == "hasParentOrder":
                hasParentOrder = prop
        
        if not hasParentClass or not hasParentOrder:
            print("Warning: Required object properties not found. Make sure to import object_properties.csv first.")
            return onto
        
        with open('taxonomic_hierarchy.csv', mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                # Link Order to Class
                if 'order_name' in row and row['order_name'] and 'class_name' in row and row['class_name']:
                    order_name = row['order_name'].strip()
                    class_name = row['class_name'].strip()
                    
                    if order_name in order_entities and class_name in class_entities:
                        order = order_entities[order_name]
                        class_entity = class_entities[class_name]
                        
                        # Create a restriction: Order hasParentClass some Class
                        restriction = hasParentClass.some(class_entity)
                        order.is_a.append(restriction)
                
                # Link Family to Order
                if 'family_name' in row and row['family_name'] and 'order_name' in row and row['order_name']:
                    family_name = row['family_name'].strip()
                    order_name = row['order_name'].strip()
                    
                    if family_name in family_entities and order_name in order_entities:
                        family = family_entities[family_name]
                        order = order_entities[order_name]
                        
                        # Create a restriction: Family hasParentOrder some Order
                        restriction = hasParentOrder.some(order)
                        family.is_a.append(restriction)
    
    return onto

def add_biomes(onto):
    """Adds biomes from CSV file"""
    print("Adding biomes...")
    
    with onto:
        # Check if biomes.csv exists
        if not os.path.exists('biomes.csv'):
            print("Warning: biomes.csv file not found.")
            return onto, {}
            
        # Read biomes from CSV
        with open('biomes.csv', mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            biome_entities = {}
            
            for row in reader:
                if 'biome_name' in row and row['biome_name']:
                    biome_name = row['biome_name'].strip()
                    safe_name = biome_name.replace(' ', '_')
                    biome = types.new_class(safe_name, (onto.Biome,))
                    biome_entities[biome_name] = biome
                    
                    # Add ID as annotation if available
                    if 'biome_id' in row and row['biome_id']:
                        biome.comment.append(f"Biome ID: {row['biome_id']}")
    
    return onto, biome_entities

def add_ecoregions(onto, biome_entities=None):
    """Adds ecoregions from CSV file and links to biomes"""
    print("Adding ecoregions...")
    
    with onto:
        # Check if ecoregions.csv exists
        if not os.path.exists('ecoregions.csv'):
            print("Warning: ecoregions.csv file not found.")
            return onto
        
        # Find inBiome property
        inBiome = None
        for prop in onto.object_properties():
            if prop.name == "inBiome":
                inBiome = prop
                break
        
        if not inBiome:
            print("Warning: inBiome property not found. Make sure to import object_properties.csv first.")
            return onto
        
        # Create a dictionary to map biome_id to biome entity
        biome_id_map = {}
        if biome_entities is None:
            biome_entities = {}  # If not provided, create empty dict
            
        # If biome_entities is empty, try to collect biomes from the ontology
        if not biome_entities:
            for biome in onto.Biome.instances():
                for comment in biome.comment:
                    if comment.startswith("Biome ID:"):
                        biome_id = comment.split(":")[1].strip()
                        biome_id_map[biome_id] = biome
        
        # Read biomes.csv to map IDs if needed
        if not biome_id_map and os.path.exists('biomes.csv'):
            with open('biomes.csv', mode='r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                for row in reader:
                    if 'biome_id' in row and 'biome_name' in row:
                        biome_id = row['biome_id'].strip()
                        biome_name = row['biome_name'].strip().replace(' ', '_')
                        # Try to find the biome in the ontology
                        biome = None
                        for b in onto.classes():
                            if b.name == biome_name and onto.Biome in b.is_a:
                                biome = b
                                break
                        if biome:
                            biome_id_map[biome_id] = biome
        
        # Read ecoregions from CSV
        with open('ecoregions.csv', mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                if 'ecoregion_name' in row and row['ecoregion_name']:
                    ecoregion_name = row['ecoregion_name'].strip()
                    safe_name = ecoregion_name.replace(' ', '_')
                    ecoregion = types.new_class(safe_name, (onto.Ecoregion,))
                    
                    # Add ID as annotation if available
                    if 'ecoregion_id' in row and row['ecoregion_id']:
                        ecoregion.comment.append(f"Ecoregion ID: {row['ecoregion_id']}")
                    
                    # Link to biome if biome_id is present
                    if 'biome_id' in row and row['biome_id'] and row['biome_id'] in biome_id_map:
                        biome = biome_id_map[row['biome_id']]
                        
                        # Create a restriction: Ecoregion inBiome some Biome
                        restriction = inBiome.some(biome)
                        ecoregion.is_a.append(restriction)
    
    return onto

def add_countries(onto):
    """Adds countries from CSV file with country codes"""
    print("Adding countries...")
    
    with onto:
        # Check if countries.csv exists
        if not os.path.exists('countries.csv'):
            print("Warning: countries.csv file not found.")
            return onto
            
        # Find annotation properties
        hasCountryCode = None
        inContinent = None
        
        for prop in onto.annotation_properties():
            if prop.name == "hasCountryCode":
                hasCountryCode = prop
            elif prop.name == "inContinent":
                inContinent = prop
        
        if not hasCountryCode:
            hasCountryCode = types.new_class("hasCountryCode", (AnnotationProperty,))
        
        if not inContinent:
            inContinent = types.new_class("inContinent", (AnnotationProperty,))
        
        # Read countries from CSV
        with open('countries.csv', mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            continent_entities = {}
            
            for row in reader:
                if 'country_name' in row and row['country_name']:
                    country_name = row['country_name'].strip()
                    safe_name = country_name.replace(' ', '_')
                    country = types.new_class(safe_name, (onto.Country,))
                    
                    # Add country code as annotation
                    if 'country_code' in row and row['country_code']:
                        country.hasCountryCode = [row['country_code']]
                    
                    # Link to continent if present
                    if 'continent' in row and row['continent']:
                        continent_name = row['continent'].strip()
                        
                        # Get or create continent
                        if continent_name not in continent_entities:
                            safe_continent_name = continent_name.replace(' ', '_')
                            continent = types.new_class(safe_continent_name, (onto.Continent,))
                            continent_entities[continent_name] = continent
                        else:
                            continent = continent_entities[continent_name]
                        
                        # Add continent annotation
                        country.inContinent = [continent_name]
    
    return onto

# This function is added to work with the web app
def generate_ontology_from_directory(directory_path, ontology_name="biodiversity-ontology"):
    """Generate ontology from CSV files in the specified directory"""
    # Set the current directory to the input directory
    original_dir = os.getcwd()
    os.chdir(directory_path)
    
    try:
        # Create new ontology with basic structure
        onto = create_ontology()
        
        # Add components if the corresponding files exist
        if os.path.exists('object_properties.csv'):
            onto = add_object_properties(onto)
        
        if os.path.exists('data_properties.csv'):
            onto = add_data_properties(onto)
        
        # Add biomes first (needed for ecoregions)
        biome_entities = {}
        if os.path.exists('biomes.csv'):
            onto, biome_entities = add_biomes(onto)
        
        # Add ecoregions next, linking to biomes
        if os.path.exists('ecoregions.csv'):
            onto = add_ecoregions(onto, biome_entities)
        
        # Add taxonomic hierarchy
        if os.path.exists('taxonomic_hierarchy.csv'):
            onto = add_taxonomic_hierarchy(onto)
        
        # Add countries
        if os.path.exists('countries.csv'):
            onto = add_countries(onto)
        
        # Run reasoner to check consistency
        try:
            print("Running reasoner to check consistency...")
            sync_reasoner(onto)
            print("Ontology is consistent!")
        except Exception as e:
            print(f"Reasoner found inconsistencies: {e}")
        
        # Save the ontology
        output_file = f"{ontology_name}.owl"
        print(f"Saving ontology to {output_file}...")
        onto.save(file=output_file, format="rdfxml")
        print(f"Ontology saved successfully to {output_file}")
        
        return output_file
    
    finally:
        # Restore the original directory
        os.chdir(original_dir)

def generate_complete_ontology():
    """Generates the complete ontology from CSV files"""
    # Create new ontology with basic structure
    onto = create_ontology()
    
    # Add object properties
    onto = add_object_properties(onto)
    
    # Add data properties
    onto = add_data_properties(onto)
    
    # Add biomes
    onto, biome_entities = add_biomes(onto)
    
    # Add ecoregions and link to biomes
    onto = add_ecoregions(onto, biome_entities)
    
    # Add taxonomic hierarchy
    onto = add_taxonomic_hierarchy(onto)
    
    # Add countries with country codes
    onto = add_countries(onto)
    
    # Run reasoner to check consistency
    print("Running reasoner to check consistency...")
    try:
        sync_reasoner(onto)
        print("Ontology is consistent!")
    except Exception as e:
        print(f"Reasoner found inconsistencies: {e}")
    
    # Save the ontology
    output_file = "biodiversity-ontology.owl"
    print(f"Saving ontology to {output_file}...")
    onto.save(file=output_file, format="rdfxml")
    print(f"Ontology saved successfully to {output_file}")
    
    return onto

if __name__ == "__main__":
    generate_complete_ontology()