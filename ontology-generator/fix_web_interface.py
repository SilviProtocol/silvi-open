#!/usr/bin/env python3
"""
Fix Web Interface for Blazegraph Import
--------------------------------------
This script adds Blazegraph import functionality to the app.py file
"""

import re
import os
import shutil

def fix_app_py(app_file="app.py"):
    """Add Blazegraph import functionality to app.py"""
    
    # Check if file exists
    if not os.path.exists(app_file):
        print(f"Error: {app_file} not found")
        return False
    
    # Create backup
    backup_file = f"{app_file}.bak"
    shutil.copy2(app_file, backup_file)
    print(f"Created backup of {app_file} at {backup_file}")
    
    # Read the file
    with open(app_file, 'r') as f:
        content = f.read()
    
    # Define the import_to_blazegraph function to add
    blazegraph_import_function = """
def import_to_blazegraph(ontology_path, title, version):
    \"\"\"Import the ontology into Blazegraph.\"\"\"
    import requests
    
    try:
        # Read the ontology file
        with open(ontology_path, 'rb') as f:
            ontology_data = f.read()
        
        # Define endpoint and headers
        endpoint = "http://localhost:9999/blazegraph/namespace/biodiversity/sparql"
        headers = {'Content-Type': 'application/rdf+xml'}
        
        # Create a safe graph URI with no spaces
        safe_title = ''.join(c if c.isalnum() else '_' for c in title)
        safe_version = version.replace(' ', '')
        
        graph_uri = f"http://example.org/ontology/{safe_title}/version{safe_version}"
        params = {'context-uri': graph_uri}
        
        # First try to clear the existing graph
        try:
            clear_query = f"CLEAR GRAPH <{graph_uri}>"
            requests.post(
                endpoint,
                headers={'Content-Type': 'application/sparql-update'},
                data=clear_query
            )
            logger.info(f"Cleared existing graph: {graph_uri}")
        except Exception as e:
            logger.warning(f"Error clearing graph: {str(e)}")
        
        # Now import the new data with retry logic
        max_retries = 3
        retry_count = 0
        success = False
        
        while retry_count < max_retries and not success:
            try:
                response = requests.post(
                    endpoint,
                    headers=headers,
                    params=params,
                    data=ontology_data,
                    timeout=30
                )
                
                if response.status_code >= 200 and response.status_code < 300:
                    logger.info(f"Successfully imported to Blazegraph: {graph_uri}")
                    success = True
                    return True
                else:
                    retry_count += 1
                    logger.error(f"Error importing to Blazegraph (attempt {retry_count}): {response.status_code} {response.text}")
                    if retry_count < max_retries:
                        import time
                        time.sleep(2)  # Short delay before retry
            except Exception as e:
                retry_count += 1
                logger.error(f"Error importing to Blazegraph (attempt {retry_count}): {str(e)}")
                if retry_count < max_retries:
                    import time
                    time.sleep(2)
        
        return success
    except Exception as e:
        logger.error(f"Error importing to Blazegraph: {str(e)}", exc_info=True)
        return False
"""
    
    # Check if the function already exists
    if "def import_to_blazegraph" in content:
        print("Function import_to_blazegraph already exists, replacing it...")
        # Replace the existing function
        pattern = r"def import_to_blazegraph\([^)]*\):.*?(?=\ndef|\Z)"
        modified_content = re.sub(pattern, blazegraph_import_function, content, flags=re.DOTALL)
    else:
        print("Adding import_to_blazegraph function...")
        # Find a good place to insert the function - just after imports
        import_section_end = content.find("# Configure logging")
        if import_section_end == -1:
            import_section_end = content.find("app = Flask")
        
        if import_section_end != -1:
            modified_content = content[:import_section_end] + blazegraph_import_function + content[import_section_end:]
        else:
            # If we can't find a good insertion point, add it at the top
            modified_content = blazegraph_import_function + "\n\n" + content
    
    # Now find places where the function should be called - after ontology generation
    pattern = r"(ontology_file = generate_ontology_from_directory\([^)]*\))\s*"
    
    if "import_to_blazegraph" not in modified_content:
        # Add the call to import_to_blazegraph after ontology generation
        call_addition = """
                # Import to Blazegraph
                try:
                    blazegraph_result = import_to_blazegraph(
                        os.path.join(session_dir, ontology_file),
                        ontology_name,
                        "1.0.0"  # Default version
                    )
                    if blazegraph_result:
                        logger.info(f"Successfully imported ontology to Blazegraph")
                    else:
                        logger.warning(f"Failed to import ontology to Blazegraph")
                except Exception as blazegraph_error:
                    logger.error(f"Error importing to Blazegraph: {str(blazegraph_error)}")
                """
        
        # Add the call after ontology generation in both upload and import-from-sheets routes
        modified_content = modified_content.replace(
            "ontology_file = generate_ontology_from_directory(",
            "ontology_file = generate_ontology_from_directory("
        )
        
        # Find where to insert the Blazegraph import code
        upload_pattern = r"(# Calculate file size\s*file_size = os\.path\.getsize\(download_path\))"
        upload_match = re.search(upload_pattern, modified_content)
        if upload_match:
            insert_point = upload_match.end()
            modified_content = modified_content[:insert_point] + call_addition + modified_content[insert_point:]
        
        # Also add to the import-from-sheets route
        sheets_pattern = r"(# Calculate file size\s*file_size = os\.path\.getsize\(download_path\))"
        offset = len(call_addition) if upload_match else 0  # Adjust for the first insertion
        sheets_match = re.search(sheets_pattern, modified_content[insert_point + offset:]) if upload_match else re.search(sheets_pattern, modified_content)
        
        if sheets_match:
            if upload_match:
                insert_point = insert_point + offset + sheets_match.end()
            else:
                insert_point = sheets_match.end()
            modified_content = modified_content[:insert_point] + call_addition + modified_content[insert_point:]
    
    # Save the modified file
    with open(app_file, 'w') as f:
        f.write(modified_content)
    
    print(f"Successfully updated {app_file} with Blazegraph import functionality")
    return True

if __name__ == "__main__":
    import sys
    
    # Get the app file to fix
    app_file = "app.py"
    if len(sys.argv) > 1:
        app_file = sys.argv[1]
    
    success = fix_app_py(app_file)
    
    if success:
        print("\nFix completed successfully!")
        print("Restart your Flask application to apply the changes.")
    else:
        print("\nFailed to apply the fix.")
        print("Please check the app.py file and try again.")