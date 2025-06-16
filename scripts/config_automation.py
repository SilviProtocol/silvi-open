#!/usr/bin/env python3
"""
Ontology Configuration Automation
---------------------------------
This script:
1. Analyzes spreadsheet structure to detect new worksheets/columns
2. Automatically updates ontology_config.json to include new elements
3. Uses pattern matching and heuristics to determine entity types
4. Maintains a versioned history of configuration changes
"""

import os
import sys
import json
import copy
import logging
import argparse
import datetime
import re
from pathlib import Path

# Import the Google Sheets integration from your project
from sheets_integration import SheetsIntegration

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("config_automation.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("config-automation")

# Column naming patterns to help identify entity types
PATTERNS = {
    "id": r'.*_id$|^id$|^identifier$|^code$',
    "name": r'.*_name$|^name$|^title$|^label$',
    "description": r'.*_desc$|^desc$|^description$|^about$|^details$',
    "date": r'.*_date$|^date$|.*_time$|^timestamp$|^created_at$|^updated_at$',
    "parent": r'.*_parent$|^parent.*|.*_of$',
    "relation": r'.*_to_.*|^has_.*|^is_.*|^belongs_to$|^connected_to$'
}

class ConfigAutomation:
    """Class to handle dynamic ontology configuration."""
    
    def __init__(self, config_path="ontology_config.json", service_account_file="service_account.json"):
        """Initialize with path to existing config and credentials."""
        self.config_path = config_path
        self.service_account_file = service_account_file
        self.sheets_integration = None
        self.config = None
        
        # Load existing config if it exists
        if os.path.exists(config_path):
            try:
                with open(config_path, 'r') as f:
                    self.config = json.load(f)
                logger.info(f"Loaded existing config from {config_path}")
            except Exception as e:
                logger.error(f"Error loading config: {e}")
                self.config = self._create_empty_config()
        else:
            logger.warning(f"Config file {config_path} not found. Creating new config.")
            self.config = self._create_empty_config()
        
        # Initialize Google Sheets integration
        try:
            self.sheets_integration = SheetsIntegration(service_account_file=service_account_file)
            if not self.sheets_integration.is_initialized():
                logger.error("Failed to initialize Google Sheets integration.")
                sys.exit(1)
        except Exception as e:
            logger.error(f"Error initializing Google Sheets integration: {e}")
            sys.exit(1)
    
    def _create_empty_config(self):
        """Create a minimal empty configuration structure."""
        return {
            "base_classes": [
                {"name": "Thing", "parent": None}
            ],
            "annotation_properties": [],
            "files": []
        }
    
    def backup_config(self):
        """Create a backup of the current config file."""
        if os.path.exists(self.config_path):
            backup_dir = "config_backups"
            os.makedirs(backup_dir, exist_ok=True)
            timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_path = os.path.join(backup_dir, f"ontology_config_{timestamp}.json")
            try:
                with open(self.config_path, 'r') as src, open(backup_path, 'w') as dst:
                    dst.write(src.read())
                logger.info(f"Created backup of config at {backup_path}")
                return backup_path
            except Exception as e:
                logger.error(f"Error creating backup: {e}")
        return None
    
    def save_config(self):
        """Save the updated configuration to file."""
        try:
            # Create a backup first
            self.backup_config()
            
            # Save the updated config with pretty formatting
            with open(self.config_path, 'w') as f:
                json.dump(self.config, f, indent=2)
            logger.info(f"Saved updated config to {self.config_path}")
            return True
        except Exception as e:
            logger.error(f"Error saving config: {e}")
            return False
    
    def analyze_spreadsheet(self, spreadsheet_id=None, spreadsheet_name=None):
        """
        Analyze a Google Spreadsheet and update the ontology config.
        
        Args:
            spreadsheet_id (str, optional): The ID of the spreadsheet.
            spreadsheet_name (str, optional): The name of the spreadsheet.
            
        Returns:
            bool: Success or failure.
        """
        if not self.sheets_integration:
            logger.error("Sheets integration not initialized")
            return False
        
        try:
            # Open the spreadsheet
            if spreadsheet_id:
                spreadsheet = self.sheets_integration.open_spreadsheet(spreadsheet_id=spreadsheet_id)
            elif spreadsheet_name:
                spreadsheet = self.sheets_integration.open_spreadsheet(spreadsheet_name=spreadsheet_name)
            else:
                logger.error("Either spreadsheet_id or spreadsheet_name must be provided")
                return False
            
            logger.info(f"Analyzing spreadsheet: {spreadsheet.title} (ID: {spreadsheet.id})")
            
            # Get all worksheets
            worksheets = spreadsheet.worksheets()
            
            # Track changes
            changes_made = False
            
            # Get current file configurations
            existing_files = {file_config["name"]: file_config for file_config in self.config.get("files", [])}
            
            # Process each worksheet
            for worksheet in worksheets:
                # Skip the metadata worksheet or empty worksheets
                if worksheet.title == "metadata":
                    continue
                
                # Get the data from the worksheet
                try:
                    data = self.sheets_integration.get_worksheet_data(spreadsheet, worksheet_name=worksheet.title)
                    
                    if not data or len(data) == 0:
                        logger.warning(f"Worksheet {worksheet.title} is empty. Skipping.")
                        continue
                    
                    # Get column names
                    sample_row = data[0]
                    column_names = list(sample_row.keys())
                    
                    # Check if this worksheet is already in the config
                    if worksheet.title in existing_files:
                        logger.info(f"Worksheet {worksheet.title} already exists in config. Checking for new columns.")
                        # Update the existing file config with any new columns
                        changes_made = self._update_file_config(existing_files[worksheet.title], column_names, data) or changes_made
                    else:
                        logger.info(f"Found new worksheet: {worksheet.title}. Adding to config.")
                        # Create a new file configuration for this worksheet
                        new_file_config = self._create_file_config(worksheet.title, column_names, data)
                        self.config["files"].append(new_file_config)
                        changes_made = True
                
                except Exception as e:
                    logger.error(f"Error processing worksheet {worksheet.title}: {e}")
            
            # If changes were made, save the updated config
            if changes_made:
                logger.info("Changes detected. Saving updated config.")
                return self.save_config()
            else:
                logger.info("No changes detected in the configuration.")
                return True
                
        except Exception as e:
            logger.error(f"Error analyzing spreadsheet: {e}")
            return False
    
    def _identify_column_type(self, column_name, sample_values=None):
        """
        Identify the likely type of a column based on name patterns and sample values.
        
        Args:
            column_name (str): The name of the column.
            sample_values (list, optional): Sample values from the column.
            
        Returns:
            str: The identified column type.
        """
        # Try to match against known patterns
        for type_name, pattern in PATTERNS.items():
            if re.match(pattern, column_name.lower()):
                return type_name
        
        # If no pattern matches, try to infer from sample values
        if sample_values:
            # Analyze sample values to determine type
            # This is a simplified example
            numeric_count = 0
            date_count = 0
            url_count = 0
            
            for value in sample_values[:10]:  # Check first 10 values
                if not value:
                    continue
                    
                # Check if it's numeric
                try:
                    float(value)
                    numeric_count += 1
                    continue
                except ValueError:
                    pass
                
                # Check if it looks like a date
                date_patterns = [
                    r'\d{4}-\d{2}-\d{2}',  # ISO date
                    r'\d{2}/\d{2}/\d{4}',   # MM/DD/YYYY
                    r'\d{1,2}\s+[A-Za-z]+\s+\d{4}'  # 1 Jan 2020
                ]
                if any(re.match(p, value) for p in date_patterns):
                    date_count += 1
                    continue
                
                # Check if it looks like a URL
                if value.startswith(('http://', 'https://')):
                    url_count += 1
            
            # Determine predominant type
            if numeric_count > len(sample_values) / 2:
                return "numeric"
            if date_count > len(sample_values) / 2:
                return "date"
            if url_count > len(sample_values) / 2:
                return "url"
        
        # Default to string if we can't determine
        return "string"
    
    def _get_sample_values(self, data, column_name, max_samples=10):
        """Get sample values from a column in the data."""
        samples = []
        for row in data[:max_samples]:
            if column_name in row and row[column_name]:
                samples.append(row[column_name])
        return samples
    
    def _create_file_config(self, worksheet_name, column_names, data):
        """
        Create a new file configuration for a worksheet.
        
        Args:
            worksheet_name (str): The name of the worksheet.
            column_names (list): List of column names.
            data (list): Sample data rows.
            
        Returns:
            dict: A new file configuration dictionary.
        """
        # Start with a basic file config
        file_config = {
            "name": worksheet_name,
            "type": "class",  # Default type, we'll try to determine better
        }
        
        # Look for name columns to use as class column
        name_columns = [col for col in column_names if re.match(PATTERNS["name"], col.lower())]
        id_columns = [col for col in column_names if re.match(PATTERNS["id"], col.lower())]
        
        # Determine the file type and main columns
        has_hierarchy = any("parent" in col.lower() for col in column_names)
        
        if has_hierarchy:
            # Looks like a hierarchy file
            file_config["type"] = "hierarchy"
            
            # Identify potential class columns
            class_columns = []
            potential_hierarchy = []
            
            for col in column_names:
                col_type = self._identify_column_type(col, self._get_sample_values(data, col))
                if col_type == "name":
                    potential_hierarchy.append(col)
            
            # If we found multiple name columns, try to determine hierarchy order
            if len(potential_hierarchy) > 1:
                # Create class columns entries for each name column
                for col in potential_hierarchy:
                    # Try to determine the class name from the column name
                    class_name = col.replace('_name', '').title().replace(' ', '')
                    
                    # Make sure we have this class in base_classes
                    self._ensure_base_class_exists(class_name, "TaxonomicRank")
                    
                    class_columns.append({
                        "column": col,
                        "class": class_name
                    })
                
                file_config["class_columns"] = class_columns
                
                # Try to determine relationships between columns
                if len(potential_hierarchy) > 1:
                    relationships = []
                    for i in range(1, len(potential_hierarchy)):
                        from_col = potential_hierarchy[i]
                        to_col = potential_hierarchy[i-1]
                        
                        from_class = file_config["class_columns"][i]["class"]
                        to_class = file_config["class_columns"][i-1]["class"]
                        
                        # Create property name for the relationship
                        property_name = f"hasParent{to_class}"
                        
                        relationships.append({
                            "from_column": from_col,
                            "to_column": to_col,
                            "property": property_name
                        })
                    
                    file_config["relationships"] = relationships
            
        elif worksheet_name.lower() in ["object_properties", "objectproperties", "object_props"]:
            # Looks like an object properties definition file
            file_config["type"] = "object_properties"
            file_config["columns"] = {
                "property_name": next((col for col in column_names if "name" in col.lower()), column_names[0]),
                "domain": next((col for col in column_names if "domain" in col.lower()), None),
                "range": next((col for col in column_names if "range" in col.lower()), None),
                "is_transitive": next((col for col in column_names if "transitive" in col.lower()), None),
                "is_functional": next((col for col in column_names if "functional" in col.lower()), None),
                "inverse_property": next((col for col in column_names if "inverse" in col.lower()), None),
                "description": next((col for col in column_names if "desc" in col.lower() or "comment" in col.lower()), None)
            }
            # Remove any None values
            file_config["columns"] = {k: v for k, v in file_config["columns"].items() if v is not None}
            
        elif worksheet_name.lower() in ["data_properties", "dataproperties", "data_props"]:
            # Looks like a data properties definition file
            file_config["type"] = "data_properties"
            file_config["columns"] = {
                "property_name": next((col for col in column_names if "name" in col.lower()), column_names[0]),
                "domain": next((col for col in column_names if "domain" in col.lower()), None),
                "range": next((col for col in column_names if "range" in col.lower() or "type" in col.lower()), None),
                "is_functional": next((col for col in column_names if "functional" in col.lower()), None),
                "description": next((col for col in column_names if "desc" in col.lower() or "comment" in col.lower()), None)
            }
            # Remove any None values
            file_config["columns"] = {k: v for k, v in file_config["columns"].items() if v is not None}
            
        else:
            # Regular class file
            if name_columns:
                # Use the first name column as the class column
                class_column = name_columns[0]
                
                # Use worksheet name as class type (if not already in base_classes)
                class_type = worksheet_name.title().replace(' ', '')
                
                # Make sure the class exists in base_classes
                self._ensure_base_class_exists(class_type, "Thing")
                
                file_config["class_column"] = class_column
                file_config["class_type"] = class_type
                
                # Add annotations for ID columns
                if id_columns:
                    annotations = []
                    for id_col in id_columns:
                        property_name = f"has{id_col.replace('_', '').title()}"
                        
                        # Make sure this annotation property exists
                        self._ensure_annotation_property_exists(property_name)
                        
                        annotations.append({
                            "column": id_col,
                            "property": property_name
                        })
                    
                    if annotations:
                        file_config["annotations"] = annotations
                
                # Look for potential relationships with other files
                # (This is a simplified approach - real implementation would be more complex)
                relationships = []
                for col in column_names:
                    if "_id" in col.lower() and col not in id_columns:
                        # This might be a foreign key to another file
                        target_file = col.replace('_id', '')
                        property_name = f"in{target_file.title()}"
                        
                        relationships.append({
                            "from_column": class_column,
                            "to_column": col,
                            "property": property_name,
                            "lookup_file": target_file,
                            "lookup_column": col
                        })
                
                if relationships:
                    file_config["relationships"] = relationships
            
        return file_config
    
    def _update_file_config(self, file_config, column_names, data):
        """
        Update an existing file configuration with new columns.
        
        Args:
            file_config (dict): The existing file configuration.
            column_names (list): List of column names.
            data (list): Sample data rows.
            
        Returns:
            bool: Whether changes were made.
        """
        # Track if changes were made
        changes_made = False
        
        # Different updates based on file type
        if file_config["type"] == "hierarchy":
            # Check for new columns in class_columns
            existing_columns = [col_config["column"] for col_config in file_config.get("class_columns", [])]
            new_name_columns = [col for col in column_names if col not in existing_columns and re.match(PATTERNS["name"], col.lower())]
            
            for col in new_name_columns:
                # Try to determine class name
                class_name = col.replace('_name', '').title().replace(' ', '')
                
                # Make sure the class exists
                self._ensure_base_class_exists(class_name, "TaxonomicRank")
                
                # Add to class_columns
                if "class_columns" not in file_config:
                    file_config["class_columns"] = []
                
                file_config["class_columns"].append({
                    "column": col,
                    "class": class_name
                })
                changes_made = True
            
            # If we added new class columns, update relationships
            if changes_made and "class_columns" in file_config and len(file_config["class_columns"]) > 1:
                # Rebuild relationships
                if "relationships" not in file_config:
                    file_config["relationships"] = []
                
                # Sort class columns by index order
                class_columns = sorted(file_config["class_columns"], key=lambda x: column_names.index(x["column"]))
                
                # Create relationships based on column order
                for i in range(1, len(class_columns)):
                    from_col = class_columns[i]["column"]
                    to_col = class_columns[i-1]["column"]
                    
                    from_class = class_columns[i]["class"]
                    to_class = class_columns[i-1]["class"]
                    
                    # Property name
                    property_name = f"hasParent{to_class}"
                    
                    # Check if this relationship already exists
                    rel_exists = any(
                        r["from_column"] == from_col and r["to_column"] == to_col
                        for r in file_config["relationships"]
                    )
                    
                    if not rel_exists:
                        file_config["relationships"].append({
                            "from_column": from_col,
                            "to_column": to_col,
                            "property": property_name
                        })
                        changes_made = True
        
        elif file_config["type"] in ["object_properties", "data_properties"]:
            # Check for new columns in the object/data properties definition
            existing_columns = file_config.get("columns", {}).values()
            new_columns = [col for col in column_names if col not in existing_columns]
            
            if new_columns:
                columns_dict = file_config.get("columns", {})
                
                # Try to determine what each new column represents
                for col in new_columns:
                    col_lower = col.lower()
                    
                    if "name" in col_lower and "property_name" not in columns_dict:
                        columns_dict["property_name"] = col
                        changes_made = True
                    elif "domain" in col_lower and "domain" not in columns_dict:
                        columns_dict["domain"] = col
                        changes_made = True
                    elif "range" in col_lower and "range" not in columns_dict:
                        columns_dict["range"] = col
                        changes_made = True
                    elif ("transitive" in col_lower or "transitivity" in col_lower) and "is_transitive" not in columns_dict:
                        columns_dict["is_transitive"] = col
                        changes_made = True
                    elif ("functional" in col_lower or "functionality" in col_lower) and "is_functional" not in columns_dict:
                        columns_dict["is_functional"] = col
                        changes_made = True
                    elif ("inverse" in col_lower or "opposite" in col_lower) and "inverse_property" not in columns_dict:
                        columns_dict["inverse_property"] = col
                        changes_made = True
                    elif ("desc" in col_lower or "comment" in col_lower or "about" in col_lower) and "description" not in columns_dict:
                        columns_dict["description"] = col
                        changes_made = True
                
                if changes_made:
                    file_config["columns"] = columns_dict
        
        else:
            # Regular class file
            class_column = file_config.get("class_column")
            
            # Check for new ID columns to add as annotations
            existing_annotations = [ann_config["column"] for ann_config in file_config.get("annotations", [])]
            new_id_columns = [col for col in column_names 
                             if col not in existing_annotations 
                             and re.match(PATTERNS["id"], col.lower())]
            
            for id_col in new_id_columns:
                property_name = f"has{id_col.replace('_', '').title()}"
                
                # Make sure this annotation property exists
                self._ensure_annotation_property_exists(property_name)
                
                # Add to annotations
                if "annotations" not in file_config:
                    file_config["annotations"] = []
                
                file_config["annotations"].append({
                    "column": id_col,
                    "property": property_name
                })
                changes_made = True
            
            # Check for new relationship columns
            existing_relationships = []
            if "relationships" in file_config:
                existing_relationships = [rel_config["to_column"] for rel_config in file_config["relationships"]]
            
            new_rel_columns = [col for col in column_names 
                              if col not in existing_relationships
                              and "_id" in col.lower()]
            
            for rel_col in new_rel_columns:
                # This might be a foreign key to another file
                target_file = rel_col.replace('_id', '')
                property_name = f"in{target_file.title()}"
                
                # Add to relationships
                if "relationships" not in file_config:
                    file_config["relationships"] = []
                
                file_config["relationships"].append({
                    "from_column": class_column,
                    "to_column": rel_col,
                    "property": property_name,
                    "lookup_file": target_file,
                    "lookup_column": rel_col
                })
                changes_made = True
        
        return changes_made
    
    def _ensure_base_class_exists(self, class_name, parent_class="Thing"):
        """
        Make sure a base class exists in the configuration.
        
        Args:
            class_name (str): The name of the class to ensure.
            parent_class (str): The parent class name.
            
        Returns:
            bool: Whether the class was added.
        """
        # Check if the class already exists
        existing_classes = [cls["name"] for cls in self.config.get("base_classes", [])]
        
        if class_name not in existing_classes:
            # Add the class
            self.config["base_classes"].append({
                "name": class_name,
                "parent": parent_class
            })
            logger.info(f"Added new base class: {class_name} (parent: {parent_class})")
            return True
        
        return False
    
    def _ensure_annotation_property_exists(self, property_name):
        """
        Make sure an annotation property exists in the configuration.
        
        Args:
            property_name (str): The name of the property to ensure.
            
        Returns:
            bool: Whether the property was added.
        """
        # Check if the property already exists
        existing_properties = [prop["name"] for prop in self.config.get("annotation_properties", [])]
        
        if property_name not in existing_properties:
            # Add the property
            self.config["annotation_properties"].append({
                "name": property_name
            })
            logger.info(f"Added new annotation property: {property_name}")
            return True
        
        return False

def main():
    """Main function to process command line arguments."""
    parser = argparse.ArgumentParser(description='Ontology Configuration Automation')
    parser.add_argument('--config', default='ontology_config.json', help='Path to ontology configuration file')
    parser.add_argument('--service-account', default='service_account.json', help='Path to Google service account credentials')
    parser.add_argument('--spreadsheet-id', help='Google Spreadsheet ID to analyze')
    parser.add_argument('--spreadsheet-name', help='Google Spreadsheet name to analyze')
    parser.add_argument('--all-spreadsheets', action='store_true', help='Process all accessible spreadsheets')
    args = parser.parse_args()
    
    # Initialize the config automation
    config_auto = ConfigAutomation(
        config_path=args.config,
        service_account_file=args.service_account
    )
    
    if args.all_spreadsheets:
        # Process all accessible spreadsheets
        try:
            # Get all accessible spreadsheets
            accessible_sheets = config_auto.sheets_integration.client.list_spreadsheet_files()
            
            if not accessible_sheets:
                logger.warning("No accessible spreadsheets found.")
                return
            
            logger.info(f"Found {len(accessible_sheets)} accessible spreadsheets.")
            
            for sheet in accessible_sheets:
                logger.info(f"Processing spreadsheet: {sheet['name']} (ID: {sheet['id']})")
                config_auto.analyze_spreadsheet(spreadsheet_id=sheet['id'])
                
        except Exception as e:
            logger.error(f"Error processing all spreadsheets: {e}")
    
    elif args.spreadsheet_id or args.spreadsheet_name:
        # Process a specific spreadsheet
        config_auto.analyze_spreadsheet(
            spreadsheet_id=args.spreadsheet_id,
            spreadsheet_name=args.spreadsheet_name
        )
    
    else:
        parser.print_help()

if __name__ == "__main__":
    main()