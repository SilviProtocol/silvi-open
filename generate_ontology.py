import csv
import os
import json
from owlready2 import *

# Set Owlready2 to store the ontology in memory
onto_path.append(".")
ONTOLOGY_IRI = "http://www.example.org/biodiversity-ontology"

def load_config(config_path):
    """Load the ontology configuration from a JSON file."""
    try:
        with open(config_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        raise ValueError(f"Failed to load configuration file: {e}")

def create_base_ontology(config):
    """Create the base ontology with classes and annotation properties."""
    print("Creating base ontology...")
    onto = get_ontology(ONTOLOGY_IRI)
    
    with onto:
        # Create base classes
        for base_class in config.get("base_classes", []):
            # Get the parent class - ensure Thing is properly referenced
            parent_name = base_class["parent"]
            
            # Special handling for 'Thing' as parent
            if parent_name == "Thing":
                parent = Thing
            else:
                # Try to get the parent from the ontology
                parent = getattr(onto, parent_name, None)
                # If parent not found and not Thing, use Thing as default
                if parent is None:
                    print(f"Warning: Parent class {parent_name} not found, using Thing")
                    parent = Thing
                    
            print(f"Creating class {base_class['name']} with parent {parent.__name__}")
            new_class = types.new_class(base_class["name"], (parent,))
            
            # Verify class was created
            if new_class is None:
                print(f"Error: Failed to create class {base_class['name']}")
        
        # Create annotation properties
        for ann_prop in config.get("annotation_properties", []):
            print(f"Creating annotation property {ann_prop['name']}")
            new_prop = types.new_class(ann_prop["name"], (AnnotationProperty,))
            
            # Verify property was created
            if new_prop is None:
                print(f"Error: Failed to create annotation property {ann_prop['name']}")
    
    print("Base ontology classes:", [cls.__name__ for cls in onto.classes()])
    print("Base ontology annotation properties:", [prop.__name__ for prop in onto.annotation_properties()])
    return onto

def process_csv_file(onto, file_path, file_config, directory_path, all_entities):
    """Process a single CSV file based on its configuration."""
    print(f"Processing file: {file_path}")
    if not os.path.exists(file_path):
        print(f"Warning: {file_path} not found.")
        return onto, {}

    file_type = file_config["type"]
    entities = {}

    with open(file_path, mode='r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        rows = list(reader)  # Store rows for multiple passes
        print(f"CSV columns: {reader.fieldnames}")

        if file_type == "class":
            # Create instances or subclasses for a class
            class_column = file_config["class_column"]
            class_type = file_config["class_type"]
            class_obj = getattr(onto, class_type, None)
            if not class_obj:
                # Default to Thing if parent class can't be determined
                parent_name = "Habitat" if "Habitat" in class_type else "Thing"
                parent = getattr(onto, parent_name, Thing)
                print(f"Creating class {class_type} with parent {parent.__name__}")
                class_obj = types.new_class(class_type, (parent,))
                if class_obj is None:
                    print(f"Error: Failed to create class {class_type}")
                    return onto, entities

            # Create related classes (e.g., Continent for Countries)
            for rel_class in file_config.get("related_classes", []):
                rel_column = rel_class["column"]
                rel_class_type = rel_class["class"]
                rel_class_obj = getattr(onto, rel_class_type, None)
                if not rel_class_obj:
                    print(f"Creating related class {rel_class_type}")
                    rel_class_obj = types.new_class(rel_class_type, (Thing,))
                    if rel_class_obj is None:
                        print(f"Error: Failed to create related class {rel_class_type}")
                        continue
                
                # Collect unique values for related class
                rel_values = set(row[rel_column].strip() for row in rows if rel_column in row and row[rel_column])
                for value in rel_values:
                    safe_name = value.replace(' ', '_')
                    print(f"Creating related entity {safe_name} for {rel_class_type}")
                    entity = types.new_class(safe_name, (rel_class_obj,))
                    if entity is not None:
                        entities[value] = entity
                    else:
                        print(f"Error: Failed to create entity {safe_name} for {rel_class_type}")

            # Create main class entities
            for row in rows:
                if class_column in row and row[class_column]:
                    safe_name = row[class_column].strip().replace(' ', '_')
                    print(f"Creating entity {safe_name} for {class_type}")
                    entity = types.new_class(safe_name, (class_obj,))
                    if entity is None:
                        print(f"Error: Failed to create entity {safe_name} for {class_type}")
                        continue
                    
                    entities[row[class_column]] = entity

                    # Add annotations
                    for ann in file_config.get("annotations", []):
                        prop = getattr(onto, ann["property"], None)
                        if prop and ann["column"] in row and row[ann["column"]]:
                            print(f"Adding annotation {ann['property']} = {row[ann['column']]} to {safe_name}")
                            setattr(entity, ann["property"], [row[ann["column"]]])
                        elif not prop:
                            print(f"Warning: Annotation property {ann['property']} not found.")

        elif file_type == "hierarchy":
            # Create classes and relationships for a hierarchy
            class_entities = {}
            for class_info in file_config.get("class_columns", []):
                class_type = class_info["class"]
                class_obj = getattr(onto, class_type, None)
                if not class_obj:
                    # Try to get TaxonomicRank or default to Thing
                    parent = getattr(onto, "TaxonomicRank", Thing)
                    print(f"Creating class {class_type} with parent {parent.__name__}")
                    class_obj = types.new_class(class_type, (parent,))
                    if class_obj is None:
                        print(f"Error: Failed to create class {class_type}")
                        continue

                # Collect unique names
                names = set()
                for row in rows:
                    if class_info["column"] in row and row[class_info["column"]]:
                        names.add(row[class_info["column"]].strip())

                # Create classes
                for name in names:
                    safe_name = name.replace(' ', '_')
                    print(f"Creating entity {safe_name} for {class_type}")
                    entity = types.new_class(safe_name, (class_obj,))
                    if entity is None:
                        print(f"Error: Failed to create entity {safe_name} for {class_type}")
                        continue
                    
                    class_entities[name] = entity
                    entities[name] = entity

            # Create relationships
            for rel in file_config.get("relationships", []):
                prop_name = rel["property"]
                # Create the property if it doesn't exist
                prop = getattr(onto, prop_name, None)
                if not prop:
                    print(f"Creating object property {prop_name} for hierarchy relationship")
                    with onto:
                        prop = types.new_class(prop_name, (ObjectProperty,))
                    if prop is None:
                        print(f"Error: Failed to create property {prop_name}")
                        continue

                for row in rows:
                    from_name = row.get(rel["from_column"])
                    to_name = row.get(rel["to_column"])
                    # Skip if either name is empty or missing
                    if not from_name or not to_name:
                        print(f"Skipping row with missing names: {row}")
                        continue
                    if from_name in class_entities and to_name in class_entities:
                        from_entity = class_entities[from_name]
                        to_entity = class_entities[to_name]
                        if from_entity is None or to_entity is None:
                            print(f"Warning: Entity is None for {from_name} or {to_name} in row {row}")
                            continue
                        print(f"Creating relationship {prop_name} from {from_name} to {to_name}")
                        try:
                            restriction = prop.some(to_entity)
                            from_entity.is_a.append(restriction)
                        except Exception as e:
                            print(f"Error creating relationship: {e}")
                    else:
                        print(f"Warning: Entity {from_name} or {to_name} not found in class_entities for row {row}")

        elif file_type == "object_properties":
            # Create object properties
            columns = file_config["columns"]
            for row in rows:
                prop_name = row[columns["property_name"]]
                domain_name = row[columns["domain"]]
                range_name = row[columns["range"]]

                # Get or create the domain class
                domain_class = getattr(onto, domain_name, None)
                if not domain_class:
                    print(f"Creating domain class {domain_name}")
                    domain_class = types.new_class(domain_name, (Thing,))
                if domain_class is None:
                    print(f"Error: Failed to create domain class {domain_name}")
                    continue

                # Get or create the range class
                range_class = getattr(onto, range_name, None)
                if not range_class:
                    print(f"Creating range class {range_name}")
                    range_class = types.new_class(range_name, (Thing,))
                if range_class is None:
                    print(f"Error: Failed to create range class {range_name}")
                    continue

                # Create the object property
                print(f"Creating object property {prop_name} ({domain_name} -> {range_name})")
                with onto:
                    # Ensure ObjectProperty is imported
                    new_prop = types.new_class(prop_name, (ObjectProperty,))
                
                if new_prop is None:
                    print(f"Error: Failed to create property {prop_name}")
                    continue

                # Set domain and range
                new_prop.domain.append(domain_class)
                new_prop.range.append(range_class)

                # Optional attributes
                if columns.get("is_transitive") in row and row[columns["is_transitive"]].upper() == "TRUE":
                    new_prop.is_a.append(TransitiveProperty)
                if columns.get("is_functional") in row and row[columns["is_functional"]].upper() == "TRUE":
                    new_prop.is_a.append(FunctionalProperty)
                if columns.get("description") in row and row[columns["description"]]:
                    new_prop.comment.append(row[columns["description"]])

                # Handle inverse property if specified
                if columns.get("inverse_property") in row and row[columns["inverse_property"]]:
                    inv_prop_name = row[columns["inverse_property"]]
                    inv_prop = getattr(onto, inv_prop_name, None)
                    if not inv_prop:
                        print(f"Creating inverse property {inv_prop_name}")
                        with onto:
                            inv_prop = types.new_class(inv_prop_name, (ObjectProperty,))
                    if inv_prop is None:
                        print(f"Warning: Failed to create inverse property {inv_prop_name}. Skipping inverse relationship.")
                        continue
                    inv_prop.domain.append(range_class)
                    inv_prop.range.append(domain_class)
                    new_prop.inverse_property = inv_prop
                    inv_prop.inverse_property = new_prop

        elif file_type == "data_properties":
            # Create data properties
            columns = file_config["columns"]
            for row in rows:
                prop_name = row[columns["property_name"]]
                domain_name = row[columns["domain"]]
                range_type = row[columns["range"]]

                # Get or create the domain class
                domain_class = getattr(onto, domain_name, None)
                if not domain_class:
                    print(f"Creating domain class {domain_name}")
                    domain_class = types.new_class(domain_name, (Thing,))
                if domain_class is None:
                    print(f"Error: Failed to create domain class {domain_name}")
                    continue

                # Create the data property
                print(f"Creating data property {prop_name} ({domain_name} -> {range_type})")
                with onto:
                    if columns.get("is_functional") in row and row[columns["is_functional"]].upper() == "TRUE":
                        new_prop = types.new_class(prop_name, (DataProperty, FunctionalProperty))
                    else:
                        new_prop = types.new_class(prop_name, (DataProperty,))
                
                if new_prop is None:
                    print(f"Error: Failed to create data property {prop_name}")
                    continue

                # Set domain and range
                new_prop.domain.append(domain_class)
                if range_type == "string":
                    new_prop.range.append(str)
                elif range_type == "float":
                    new_prop.range.append(float)
                elif range_type == "integer":
                    new_prop.range.append(int)
                else:
                    new_prop.range.append(str)

                # Optional description
                if columns.get("description") in row and row[columns["description"]]:
                    new_prop.comment.append(row[columns["description"]])

    return onto, entities

def generate_ontology_from_directory(directory_path, config_path="ontology_config.json", ontology_name="biodiversity-ontology"):
    """Generate ontology from CSV files in the specified directory using a configuration file."""
    original_dir = os.getcwd()
    os.chdir(directory_path)

    try:
        # Load configuration
        print("Loading configuration...")
        config = load_config(os.path.join(original_dir, config_path))

        # Create base ontology
        onto = create_base_ontology(config)

        # Add essential object properties needed for relationships
        print("Creating essential properties...")
        with onto:
            # Create essential properties explicitly
            for rel_config in config.get("files", []):
                if rel_config["type"] == "hierarchy":
                    for rel in rel_config.get("relationships", []):
                        prop_name = rel["property"]
                        if not hasattr(onto, prop_name):
                            print(f"Pre-creating relationship property: {prop_name}")
                            types.new_class(prop_name, (ObjectProperty,))

        # Process object and data properties first to ensure properties are defined
        print("Processing properties...")
        all_entities = {}
        for file_config in config.get("files", []):
            if file_config["type"] in ["object_properties", "data_properties"]:
                file_path = f"{file_config['name']}.csv"
                onto, entities = process_csv_file(onto, file_path, file_config, directory_path, all_entities)
                all_entities.update(entities)

        # Process other files
        print("Processing other files...")
        for file_config in config.get("files", []):
            if file_config["type"] not in ["object_properties", "data_properties"]:
                file_path = f"{file_config['name']}.csv"
                onto, entities = process_csv_file(onto, file_path, file_config, directory_path, all_entities)
                all_entities.update(entities)

        # Run reasoner to check consistency
        print("Running reasoner to check consistency...")
        try:
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

    except Exception as e:
        raise Exception(f"Ontology generation failed: {str(e)}")

    finally:
        os.chdir(original_dir)

if __name__ == "__main__":
    generate_ontology_from_directory(".")