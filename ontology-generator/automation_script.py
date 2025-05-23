#!/usr/bin/env python3
"""
Automated Ontology Generator and Blazegraph Import Script
--------------------------------------------------------
This script:
1. Checks for changes in specified Google Sheets
2. Generates new ontologies when changes are detected
3. Automatically imports those ontologies into Blazegraph
4. Updates version information
5. Sends notifications on completion

Run this script as a scheduled task (e.g., using cron or Windows Task Scheduler)
"""

import os
import sys
import time
import json
import hashlib
import argparse
import datetime
import requests
import logging
import tempfile
import shutil
from pathlib import Path

# Import required modules from your application
from sheets_integration import SheetsIntegration
from generate_ontology import generate_ontology_from_directory

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("automation.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("ontology-automation")

# Configuration
CONFIG = {
    'service_account_file': 'service_account.json',
    'spreadsheet_ids': [],  # Will be filled from command line or config file
    'spreadsheet_names': [],  # Will be filled from command line or config file
    'check_interval': 3600,  # Default: check every hour (in seconds)
    "blazegraph_endpoint": "http://localhost:9999/blazegraph/namespace/biodiversity/sparql",
    'ontology_output_dir': 'generated_ontologies',
    'blazegraph_update_auth': None,  # Set if Blazegraph requires authentication
    'notify_email': None,  # Set to enable email notifications
    'smtp_server': None,  # For email notifications
    'smtp_port': 587,  # For email notifications
    'smtp_username': None,  # For email notifications
    'smtp_password': None,  # For email notifications
    'save_history': True,  # Keep history of all generated ontologies
    'history_dir': 'ontology_history',
    'auto_update_version': True,  # Automatically update spreadsheet version
    'version_update_user': 'Automation System',  # User who makes version updates
}

def load_config_file(config_path):
    """Load configuration from a JSON file."""
    try:
        with open(config_path, 'r') as f:
            config_data = json.load(f)
            # Update our CONFIG with values from the file
            for key, value in config_data.items():
                if key in CONFIG:
                    CONFIG[key] = value
            logger.info(f"Loaded configuration from {config_path}")
    except Exception as e:
        logger.error(f"Error loading config file: {e}")
        sys.exit(1)

def calculate_checksum(data):
    """Calculate a checksum for the data to detect changes."""
    if isinstance(data, list):
        # Convert list of dictionaries to a stable string representation
        data_str = json.dumps(data, sort_keys=True)
    else:
        data_str = str(data)
    return hashlib.md5(data_str.encode()).hexdigest()

def get_last_processed_state(spreadsheet_id):
    """Get the last processed state for a spreadsheet."""
    state_file = f"state_{spreadsheet_id}.json"
    if os.path.exists(state_file):
        try:
            with open(state_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.warning(f"Could not read state file: {e}")
    return {"last_checksum": None, "last_processed": None, "version": None}

def save_processed_state(spreadsheet_id, checksum, version):
    """Save the processed state for a spreadsheet."""
    state_file = f"state_{spreadsheet_id}.json"
    state = {
        "last_checksum": checksum,
        "last_processed": datetime.datetime.now().isoformat(),
        "version": version
    }
    try:
        with open(state_file, 'w') as f:
            json.dump(state, f)
        logger.info(f"Saved state for spreadsheet {spreadsheet_id}")
    except Exception as e:
        logger.error(f"Error saving state: {e}")

def get_spreadsheet_data(sheets_integration, spreadsheet_id=None, spreadsheet_name=None):
    """Get the data and metadata from a spreadsheet."""
    try:
        # Open the spreadsheet
        if spreadsheet_id:
            spreadsheet = sheets_integration.open_spreadsheet(spreadsheet_id=spreadsheet_id)
        else:
            spreadsheet = sheets_integration.open_spreadsheet(spreadsheet_name=spreadsheet_name)
            spreadsheet_id = spreadsheet.id
        
        # Get spreadsheet metadata
        metadata = {}
        try:
            metadata = sheets_integration.get_spreadsheet_metadata(spreadsheet)
        except Exception as e:
            logger.warning(f"Error getting spreadsheet metadata: {e}. Will use basic metadata.")
            metadata = {
                "title": spreadsheet.title,
                "id": spreadsheet.id,
                "version_info": {
                    "version": "1.0.0"  # Default version if not found
                }
            }
        
        # Get all worksheets data
        worksheets_data = {}
        for worksheet in spreadsheet.worksheets():
            try:
                if worksheet.title != "metadata":  # Skip metadata sheet
                    data = sheets_integration.get_worksheet_data(spreadsheet, worksheet_name=worksheet.title)
                    worksheets_data[worksheet.title] = data
            except Exception as ws_error:
                logger.warning(f"Error reading worksheet {worksheet.title}: {ws_error}")
        
        return {
            "id": spreadsheet_id,
            "title": spreadsheet.title,
            "metadata": metadata,
            "worksheets": worksheets_data,
            "spreadsheet_obj": spreadsheet  # Keep the spreadsheet object for later use
        }
    except Exception as e:
        logger.error(f"Error getting spreadsheet data: {e}")
        return None

def process_spreadsheet(sheets_integration, spreadsheet_id=None, spreadsheet_name=None, force=False):
    """
    Process a single spreadsheet:
    1. Check if it has changed since last processing
    2. Generate ontology if changed
    3. Import to Blazegraph if successful
    4. Update version information
    """
    logger.info(f"Processing spreadsheet: {spreadsheet_id or spreadsheet_name}")
    
    # Get spreadsheet data and metadata
    spreadsheet_data = get_spreadsheet_data(sheets_integration, spreadsheet_id, spreadsheet_name)
    if not spreadsheet_data:
        logger.error(f"Could not get data for spreadsheet {spreadsheet_id or spreadsheet_name}")
        return False
    
    spreadsheet_id = spreadsheet_data["id"]
    
    # Calculate checksum of worksheet data (excluding metadata sheet)
    checksum = calculate_checksum(spreadsheet_data["worksheets"])
    
    # Get last processed state
    last_state = get_last_processed_state(spreadsheet_id)
    
    # Get current version
    current_version = spreadsheet_data["metadata"].get("version_info", {}).get("version", "0.0.0")
    
    # Determine if we need to process
    if not force and checksum == last_state["last_checksum"]:
        logger.info(f"No changes detected for {spreadsheet_data['title']} (ID: {spreadsheet_id})")
        return False
    
    logger.info(f"Changes detected in {spreadsheet_data['title']} (ID: {spreadsheet_id})")
    
    # Create temporary directory for processing
    with tempfile.TemporaryDirectory() as temp_dir:
        # Save worksheet data as CSV files
        file_paths = []
        for sheet_name, data in spreadsheet_data["worksheets"].items():
            if data:  # Only process non-empty worksheets
                file_path = os.path.join(temp_dir, f"{sheet_name}.csv")
                with open(file_path, 'w', newline='') as f:
                    if data and len(data) > 0:
                        fieldnames = data[0].keys()
                        import csv
                        writer = csv.DictWriter(f, fieldnames=fieldnames)
                        writer.writeheader()
                        writer.writerows(data)
                        file_paths.append(file_path)
                        logger.info(f"Saved {sheet_name}.csv with {len(data)} rows")
        
        if not file_paths:
            logger.warning(f"No valid data found in spreadsheet {spreadsheet_data['title']}")
            return False
        
        # Generate ontology
        try:
            # Make a safe filename from the spreadsheet title
            safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in spreadsheet_data["title"])
            ontology_name = f"{safe_name}_{datetime.datetime.now().strftime('%Y%m%d')}"
            
            # Generate the ontology
            logger.info(f"Generating ontology from {len(file_paths)} worksheet files")
            config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ontology_config.json')
            
            # Check if config file exists
            if not os.path.exists(config_path):
                logger.error(f"Ontology config file not found at: {config_path}")
                raise FileNotFoundError(f"Ontology config file not found at: {config_path}")
            
            ontology_file = generate_ontology_from_directory(
                temp_dir,
                config_path=config_path,
                ontology_name=ontology_name
            )
            
            # Full path to the generated ontology
            ontology_path = os.path.join(temp_dir, ontology_file)
            
            # Ensure output directory exists
            os.makedirs(CONFIG['ontology_output_dir'], exist_ok=True)
            
            # Copy to output directory (latest version)
            output_path = os.path.join(CONFIG['ontology_output_dir'], f"{safe_name}_latest.owl")
            shutil.copy2(ontology_path, output_path)
            
            # Copy to history directory if enabled
            if CONFIG['save_history']:
                os.makedirs(CONFIG['history_dir'], exist_ok=True)
                history_path = os.path.join(CONFIG['history_dir'], f"{safe_name}_{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}_v{current_version}.owl")
                shutil.copy2(ontology_path, history_path)
            
            logger.info(f"Successfully generated ontology: {ontology_file}")
            
            # Calculate new version
            new_version = increment_version(current_version)
            
            # Import to Blazegraph
            blazegraph_success = True
            if CONFIG['blazegraph_endpoint']:
                blazegraph_success = import_to_blazegraph(ontology_path, spreadsheet_data['title'], current_version)
                if blazegraph_success:
                    logger.info(f"Successfully imported to Blazegraph: {ontology_file}")
                else:
                    logger.error(f"Failed to import to Blazegraph: {ontology_file}")
            
            # Update spreadsheet version if enabled
            if CONFIG['auto_update_version'] and blazegraph_success:
                try:
                    # Get the spreadsheet object - either from data or retrieve again
                    spreadsheet = spreadsheet_data.get("spreadsheet_obj")
                    if not spreadsheet:
                        if spreadsheet_id:
                            spreadsheet = sheets_integration.open_spreadsheet(spreadsheet_id=spreadsheet_id)
                        else:
                            spreadsheet = sheets_integration.open_spreadsheet(spreadsheet_name=spreadsheet_name)
                    
                    # Try to update version using enhanced SheetsIntegration
                    try:
                        changelog_message = f"Automated ontology generation - {len(file_paths)} worksheets processed"
                        
                        # First try using the enhanced method
                        if hasattr(sheets_integration, 'update_spreadsheet_version'):
                            sheets_integration.update_spreadsheet_version(
                                spreadsheet=spreadsheet,
                                new_version=new_version,
                                modified_by=CONFIG['version_update_user'],
                                changelog=changelog_message
                            )
                            logger.info(f"Updated spreadsheet version to {new_version}")
                        else:
                            # Fallback to manual metadata update if enhanced method doesn't exist
                            try:
                                # Check if metadata worksheet exists
                                try:
                                    metadata_sheet = spreadsheet.worksheet("metadata")
                                except:
                                    # Create metadata sheet if it doesn't exist
                                    metadata_sheet = spreadsheet.add_worksheet(title="metadata", rows=10, cols=2)
                                
                                # Current time in ISO format
                                current_time = datetime.datetime.now().isoformat()
                                
                                # Update version info
                                metadata_sheet.update("A1:B8", [
                                    ["version", new_version],
                                    ["version_date", current_time],
                                    ["last_modified_by", CONFIG['version_update_user']],
                                    ["last_modified_date", current_time],
                                    ["changelog", f"{current_time} - v{new_version}: {changelog_message}"]
                                ])
                                logger.info(f"Updated spreadsheet version to {new_version} using fallback method")
                            except Exception as metadata_error:
                                logger.error(f"Error updating metadata worksheet: {metadata_error}")
                    except Exception as version_error:
                        logger.error(f"Error updating spreadsheet version: {version_error}")
                except Exception as e:
                    logger.error(f"Error opening spreadsheet for version update: {e}")
            
            # Save processed state
            save_processed_state(spreadsheet_id, checksum, new_version)
            
            # Send notification if configured
            if CONFIG['notify_email']:
                send_notification(
                    spreadsheet_data['title'],
                    new_version,
                    ontology_file,
                    f"Successfully generated ontology. Blazegraph import {'succeeded' if blazegraph_success else 'failed'}."
                )
            
            return True
            
        except Exception as e:
            logger.error(f"Error generating ontology: {e}", exc_info=True)
            
            # Send error notification if configured
            if CONFIG['notify_email']:
                send_notification(
                    spreadsheet_data['title'],
                    current_version,
                    None,
                    f"Error generating ontology: {str(e)}"
                )
            
            return False

def increment_version(version_str):
    """Increment the patch version number (x.y.z -> x.y.z+1)."""
    try:
        # Parse version components
        if version_str.startswith('v'):
            version_str = version_str[1:]
        
        components = version_str.split('.')
        if len(components) < 3:
            components = components + ['0'] * (3 - len(components))
        
        # Increment patch version
        components[2] = str(int(components[2]) + 1)
        
        return '.'.join(components)
    except Exception as e:
        logger.warning(f"Error incrementing version {version_str}: {e}")
        return "0.0.1"  # Default if version can't be parsed

def import_to_blazegraph(ontology_path, spreadsheet_title, version):
    """Import the ontology into Blazegraph."""
    try:
        # Read the ontology file
        with open(ontology_path, 'rb') as f:
            ontology_data = f.read()
        
        # Define headers and query parameters
        headers = {
            'Content-Type': 'application/rdf+xml'
        }
        
        # Add authentication if configured
        auth = None
        if CONFIG['blazegraph_update_auth']:
            if isinstance(CONFIG['blazegraph_update_auth'], list) and len(CONFIG['blazegraph_update_auth']) == 2:
                auth = tuple(CONFIG['blazegraph_update_auth'])
        
        # Construct the endpoint URL
        endpoint = CONFIG['blazegraph_endpoint']
        
        # If the endpoint ends with 'sparql', modify for update
        if endpoint.endswith('/sparql'):
            update_endpoint = endpoint
        else:
            update_endpoint = endpoint
        
        # Create a named graph URI based on spreadsheet title and version
        safe_title = spreadsheet_title.replace(' ', '_')
        graph_uri = f"http://example.org/ontology/{safe_title}/v{version.replace(' ','')}"
        params = {'context-uri': graph_uri}
        
        # First, try to clear the existing graph
        clear_query = f"CLEAR GRAPH <{graph_uri}>"
        try:
            r = requests.post(
                update_endpoint, 
                headers={'Content-Type': 'application/sparql-update'},
                data=clear_query,
                auth=auth
            )
            if r.status_code >= 200 and r.status_code < 300:
                logger.info(f"Cleared existing graph: {graph_uri}")
            else:
                logger.warning(f"Failed to clear graph: {r.status_code} {r.text}")
        except Exception as e:
            logger.warning(f"Error clearing graph: {e}")
        
        # Now import the new data
        r = requests.post(
            update_endpoint,
            headers=headers,
            params=params,
            data=ontology_data,
            auth=auth
        )
        
        if r.status_code >= 200 and r.status_code < 300:
            logger.info(f"Successfully imported to Blazegraph: {graph_uri}")
            return True
        else:
            logger.error(f"Error importing to Blazegraph: {r.status_code} {r.text}")
            return False
            
    except Exception as e:
        logger.error(f"Error importing to Blazegraph: {e}", exc_info=True)
        return False

def send_notification(spreadsheet_title, version, ontology_file, message):
    """Send a notification email about the processing result."""
    if not CONFIG['notify_email'] or not CONFIG['smtp_server']:
        return False
    
    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        msg = MIMEMultipart()
        msg['Subject'] = f"Ontology Generation: {spreadsheet_title} - v{version}"
        msg['From'] = CONFIG['smtp_username']
        msg['To'] = CONFIG['notify_email']
        
        body = f"""
        <html>
        <body>
            <h2>Ontology Generation Report</h2>
            <p><strong>Spreadsheet:</strong> {spreadsheet_title}</p>
            <p><strong>Version:</strong> {version}</p>
            <p><strong>Status:</strong> {message}</p>
            <p><strong>Time:</strong> {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
            {'<p><strong>Ontology File:</strong> ' + ontology_file + '</p>' if ontology_file else ''}
        </body>
        </html>
        """
        
        msg.attach(MIMEText(body, 'html'))
        
        server = smtplib.SMTP(CONFIG['smtp_server'], CONFIG['smtp_port'])
        server.starttls()
        if CONFIG['smtp_username'] and CONFIG['smtp_password']:
            server.login(CONFIG['smtp_username'], CONFIG['smtp_password'])
        server.send_message(msg)
        server.quit()
        
        logger.info(f"Sent notification email to {CONFIG['notify_email']}")
        return True
    except Exception as e:
        logger.error(f"Error sending notification: {e}")
        return False

def main():
    """Main function to process spreadsheets based on configuration."""
    parser = argparse.ArgumentParser(description='Automated Ontology Generator and Blazegraph Importer')
    parser.add_argument('--config', help='Path to configuration file')
    parser.add_argument('--spreadsheet-id', help='Specific spreadsheet ID to process')
    parser.add_argument('--spreadsheet-name', help='Specific spreadsheet name to process')
    parser.add_argument('--force', action='store_true', help='Force processing even if no changes detected')
    parser.add_argument('--continuous', action='store_true', help='Run continuously checking for changes')
    args = parser.parse_args()
    
    # Load configuration if provided
    if args.config:
        load_config_file(args.config)
    
    # Override configuration with command line arguments
    if args.spreadsheet_id:
        CONFIG['spreadsheet_ids'] = [args.spreadsheet_id]
    
    if args.spreadsheet_name:
        CONFIG['spreadsheet_names'] = [args.spreadsheet_name]
    
    # Ensure we have spreadsheets to process
    if not CONFIG['spreadsheet_ids'] and not CONFIG['spreadsheet_names']:
        logger.error("No spreadsheets specified. Use --spreadsheet-id, --spreadsheet-name, or --config")
        sys.exit(1)
    
    # Initialize Google Sheets integration
    try:
        sheets_integration = SheetsIntegration(service_account_file=CONFIG['service_account_file'])
        if not sheets_integration.is_initialized():
            logger.error("Failed to initialize Google Sheets integration.")
            sys.exit(1)
    except Exception as e:
        logger.error(f"Error initializing Google Sheets integration: {e}")
        sys.exit(1)
    
    # Create necessary directories
    os.makedirs(CONFIG['ontology_output_dir'], exist_ok=True)
    if CONFIG['save_history']:
        os.makedirs(CONFIG['history_dir'], exist_ok=True)
    
    # Process spreadsheets once or continuously
    if args.continuous:
        logger.info(f"Starting continuous monitoring. Checking every {CONFIG['check_interval']} seconds")
        while True:
            try:
                # Process all spreadsheet IDs
                for spreadsheet_id in CONFIG['spreadsheet_ids']:
                    process_spreadsheet(sheets_integration, spreadsheet_id=spreadsheet_id, force=args.force)
                
                # Process all spreadsheet names
                for spreadsheet_name in CONFIG['spreadsheet_names']:
                    process_spreadsheet(sheets_integration, spreadsheet_name=spreadsheet_name, force=args.force)
                
                # Wait for next check
                logger.info(f"Sleeping for {CONFIG['check_interval']} seconds")
                time.sleep(CONFIG['check_interval'])
            except KeyboardInterrupt:
                logger.info("Received keyboard interrupt. Exiting...")
                break
            except Exception as e:
                logger.error(f"Error in main loop: {e}", exc_info=True)
                time.sleep(60)  # Short delay before retrying
    else:
        # Process all spreadsheet IDs
        for spreadsheet_id in CONFIG['spreadsheet_ids']:
            process_spreadsheet(sheets_integration, spreadsheet_id=spreadsheet_id, force=args.force)
        
        # Process all spreadsheet names
        for spreadsheet_name in CONFIG['spreadsheet_names']:
            process_spreadsheet(sheets_integration, spreadsheet_name=spreadsheet_name, force=args.force)
    
    logger.info("Processing complete")

if __name__ == "__main__":
    main()