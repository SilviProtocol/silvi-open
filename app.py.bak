from flask import Flask, render_template, request, redirect, url_for, flash, send_file, jsonify
import os
import shutil
import uuid
import datetime
import time
import json
import re
import logging
import csv
from werkzeug.utils import secure_filename
from generate_ontology import generate_ontology_from_directory
from sheets_integration import SheetsIntegration
from app import *

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', "biodiversity_ontology_builder")

# Set up storage directories
if os.environ.get('RENDER') == 'true':
    # On Render, use the /tmp directory for ephemeral storage
    app.config['UPLOAD_FOLDER'] = '/tmp/uploads'
    app.config['METADATA_DIR'] = '/tmp/metadata'
else:
    # For local development or other environments
    app.config['UPLOAD_FOLDER'] = 'Uploads'
    app.config['METADATA_DIR'] = 'Metadata'

app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024 # 32MB max file size
app.config['SESSION_EXPIRY'] = 3600 # 1 hour in seconds

# Google Sheets configuration - Force enable for testing
app.config['USE_GOOGLE_SHEETS'] = True
app.config['GOOGLE_SHEETS_CREDS_FILE'] = 'service_account.json'
app.config['SPREADSHEET_ID'] = os.environ.get('SPREADSHEET_ID', '')

# Initialize Google Sheets integration
sheets_integration = None
try:
    # Directly use the service account file that we know works
    sheets_integration = SheetsIntegration(service_account_file='service_account.json')
    if sheets_integration.is_initialized():
        logger.info("Google Sheets integration initialized successfully!")
        logger.info(f"Service account email: {sheets_integration.credentials.service_account_email}")
    else:
        logger.warning("Failed to initialize Google Sheets integration.")
except Exception as e:
    logger.error(f"Error initializing Google Sheets integration: {str(e)}")

# Ensure upload and metadata directories exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['METADATA_DIR'], exist_ok=True)

def allowed_file(filename):
    """Check if the file has a valid extension"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() == 'csv'

def sanitize_filename(filename):
    """Sanitize filename to prevent security issues."""
    # Replace space with underscores and remove special characters
    filename = re.sub(r'[^\w\-_.]', '', filename.replace(' ', '_'))
    # Ensure the filename is not empty
    if not filename:
        filename = 'biodiversity-ontology'
    return filename

def save_metadata(session_id, metadata):
    """Save session metadata to a JSON file."""
    metadata_path = os.path.join(app.config['METADATA_DIR'], f"{session_id}.json")
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f)
    logger.info(f"Saved metadata for session {session_id}")

def load_metadata(session_id):
    """Load session metadata from a JSON file."""
    metadata_path = os.path.join(app.config['METADATA_DIR'], f"{session_id}.json")
    if os.path.exists(metadata_path):
        with open(metadata_path, 'r') as f:
            return json.load(f)
    return None

def log_to_google_sheets(metadata):
    """Log ontology generation data to Google Sheets."""
    if not sheets_integration or not sheets_integration.is_initialized():
        logger.warning("Google Sheets integration not available for logging")
        return False

    try:
        # Open the spreadsheet
        if app.config['SPREADSHEET_ID']:
            spreadsheet = sheets_integration.open_spreadsheet(spreadsheet_id=app.config['SPREADSHEET_ID'])
        else:
            # Look for an existing sheet or create one
            try:
                spreadsheet = sheets_integration.open_spreadsheet(spreadsheet_name="Biodiversity Ontology Generator Log")
            except:
                spreadsheet = sheets_integration.create_spreadsheet("Biodiversity Ontology Generator Log")
                # Initialize the headers
                headers = [["Timestamp", "Session ID", "Ontology Name", "File Size", "Files Used", "Status"]]
                sheets_integration.update_value(spreadsheet, "A1:F1", headers)

        # Prepare the data row
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        session_id = metadata.get("session_id", "N/A")
        ontology_name = metadata.get("ontology_name", 'N/A')
        file_size = metadata.get("file_size", 0)
        files_used = ", ".join(metadata.get("uploaded_files", []))
        status  = "Success"

        # Append the data
        row_data = [[timestamp, session_id, ontology_name, file_size, files_used, status]]
        sheets_integration.append_rows(spreadsheet, values=row_data)

        logger.info(f"Successfully logged to Google Sheets: {session_id}")
        return True
    except Exception as e:
        logger.error(f"Error logging to Google Sheets: {str(e)}")
        return False

@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html')

@app.route('/sheets-status')
def sheets_status():
    """Check the status of Google Sheetes integration."""
    if not app.config['USE_GOOGLE_SHEETS']:
        return jsonify({
            "enabled": False,
            "message": "Google Sheets integration is not enabled"
        })  

    if not sheets_integration or not sheets_integration.is_initialized():
        return jsonify({
            "enabled": True,
            "initialized": False,
            "message": "Google Sheets integration is enabled but not initialized properly"
        })

    return jsonify({
        "enabled": True,
        "initialized": False,
        "message": "Google Sheets integration is enabled and working"
    })  

@app.route('/upload', methods=['POST'])
def upload_files():
    """Handle file uploads and ontology generatiion."""
    if request.method == 'POST':
        try:
            # Create a unique directory for this session
            session_id = str(uuid.uuid4())
            session_dir = os.path.join(app.config['UPLOAD_FOLDER'], session_id)
            os.makedirs(session_dir, exist_ok=True)

            files_uploaded = False
            uploaded_file_names = []

            # Process all uploaded files under the 'files' key
            uploaded_files = request.files.getlist('files')
            for file in uploaded_files:
                if file and file.filename:
                    # Ensure the filename is safe
                    filename = secure_filename(file.filename)
                    if not allowed_file(filename):
                        flash('Invalid file type. Only CSV files are allowed.', 'warning')
                        continue

                    logger.info(f"Saving files: {filename} to {session_dir}")
                    file.save(os.path.join(session_dir, filename))
                    files_uploaded = True
                    uploaded_file_names.append(filename) 

            if not files_uploaded:
                flash("No files were uploaded. Please select at least one CSV file. ", 'error')
                return redirect(url_for('index'))

            # Get ontology name, use default if not provided
            ontology_name = request.form.get('ontology_name', '').strip()
            if not ontology_name:
                ontology_name = 'biodiversity-ontology'

             # Sanitize ontology name
            ontology_name = sanitize_filename(ontology_name)

            # Generate the ontology
            try:
                logger.info(f"Generating ontology {ontology_name} for session {session_id}")
                ontology_file = generate_ontology_from_directory(
                    session_dir,
                    config_path=os.path.join(os.path.dirname(__file__), 'ontology_config.json'),
                    ontology_name=ontology_name
                )

                # Store the path for download
                download_path = os.path.join(session_dir, ontology_file)

                # Calculate file size
                file_size = os.path.getsize(download_path)

                # Save metadata about the ontology generation
                expiry_time = datetime.datetime.now() + datetime.timedelta(seconds=app.config['SESSION_EXPIRY'])

                metadata = {
                    'session_id': session_id,
                    'ontology_name': ontology_name,
                    'filename': ontology_file,
                    'file_size': file_size,
                    'uploaded_files': uploaded_file_names,
                    'creation_time': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'expiry_time': expiry_time.strftime('%Y-%m-%d %H:%M:%S')
                }
                save_metadata(session_id, metadata)

                # Log to Google Sheets if enabled
                if app.config['USE_GOOGLE_SHEETS']:
                    sheets_logged = log_to_google_sheets(metadata)
                    if sheets_logged:
                        logger.info(f"Successfully logged to Google Sheets: {session_id}")
                    else:
                        logger.warning(f"Failed to log to Google Sheets: {session_id}")

                logger.info(f"Ontology generated successfully: {ontology_file} ({file_size} bytes)")

                return render_template('success.html',
                                       session_id=session_id,
                                       filename=ontology_file,
                                       file_size=file_size,
                                       file_count=len(uploaded_file_names),
                                       creation_time=datetime.datetime.now().strftime('%H:%M'),
                                       expiry_minutes=app.config['SESSION_EXPIRY'] // 60,
                                       sheets_logging=app.config['USE_GOOGLE_SHEETS'])

            except Exception as e:
                logger.error(f"Error generating ontology: {str(e)}", exc_info=True)
                flash(f'Error generating ontology: {str(e)}', 'error')
                # Cklean up the session directory if an error occurs
                try:
                    shutil.rmtree(session_dir)
                except Exception as cleanup_error:
                    logger.error(f"Error cleaning up session directory: {str(cleanup_error)}")
                return redirect(url_for('index'))

        except Exception as e:
            logger.error(f"Unexpected error in upload process: {str(e)}", exc_info=True)
            flash(f'An unexpected error occurred: {str(e)}', 'error')
            return redirect(url_for('index'))

@app.route('/download/<session_id>/<filename>')
def download(session_id, filename):
    """Handle file downloads.""" 
    try:
        # Validate the session_id and filename to prevent directory travesal
        if '..' in session_id or '/' in session_id or '..' in filename or '/' in filename:
            logger.warning(f"Invalid download request: {session_id}/{filename} - Possible directory traversal attrempt")
            flash('Invalid request', 'error')
            return redirect(url_for('index'))

        # Get the file path
        path = os.path.join(app.config['UPLOAD_FOLDER'], session_id, filename)

        # Verify the file exists
        if not os.path.exists(path):
            logger.warning(f"Download file not found: {path}")
            flash('File not found', 'error')
            return redirect(url_for('index'))

        # Load metadata to check if the file has expired
        metadata = load_metadata(session_id)
        if metadata:
            try:
                expiry_time = datetime.datetime.strptime(metadata['expiry_time'], '%Y-%m-%d %H:%M:%S')
                if datetime.datetime.now() > expiry_time:
                    logger.info(f"Download attempted for expired file: {session_id}/{filename}")
                    flash('This file has expired and is no loger available for download.', 'warning')
                    return redirect(url_for('index'))
            except (KeyError, ValueError) as e:
                logger.erroe(f"Error parsing metadata for session {session_id}: {str(e)}")

        # Log the download
        logger.info(f"File download: {session_id}/{filename}")

        # Serve the file
        return send_file(path, as_attachment=True)
    except Exception as e:
        logger.error(f"Error downloading file: {str(e)}", exc_info=True)
        flash(f'Error downloading file: {str(e)}', 'error')
        return redirect(url_for('index'))

@app.route('/import-from-sheets', methods=['GET', 'POST'])
def import_from_sheets():
    """Import data from Google Sheets and process it,"""
    if not app.config['USE_GOOGLE_SHEETS'] or not sheets_integration or not sheets_integration.is_initialized():
        flash('Google Sheets integration is not enabled or properly configured.', 'error') 
        return redirect(url_for('index'))

    if request.method == 'GET':
        # Render the import from
        return render_template('import_sheets.html')

    elif request.method == 'POST' :
        try:
            # Get the spreadsheet ID or name
            spreadsheet_id = request.form.get('spreadsheet_id', '').strip()
            spreadsheet_name = request.form.get('spreadsheet_name', '').strip()

            if not spreadsheet_id and not spreadsheet_name:
                flash('Please provided either a spreadsheet ID or name.', 'error')
                return redirect(url_for('import_from_sheets'))

            # Open the spreadsheet
            try:
                if spreadsheet_id:
                    spreadsheet = sheets_integration.open_spreadsheet(spreadsheet_id=spreadsheet_id)
                else:
                    spreadsheet = sheets_integration.open_spreadsheet(spreadsheet_name=spreadsheet_name)
            except Exception as e:
                flash(f'Error opening spreadsheet: {str(e)}', 'error') 
                return redirect(url_for('import_from_sheets'))

            # Create a unique session directory
            session_id = str(uuid.uuid4())
            session_dir = os.path.join(app.config['UPLOAD_FOLDER'], session_id)
            os.makedirs(session_dir, exist_ok=True)

            # Get all available worksheets
            available_worksheets = [worksheet.title for worksheet in spreadsheet.worksheets()]
            logger.info(f"Found {len(available_worksheets)} worksheets: {', '.join(available_worksheets)}")

            files_imported = []

            # Process each available worksheet
            for sheet_name in available_worksheets:
                try:
                    # Try to get the data
                    data = sheets_integration.get_worksheet_data(spreadsheet, worksheet_name=sheet_name)

                    if data:
                        # Write to CSV file
                        csv_path = os.path.join(session_dir, f"{sheet_name}.csv")
                        with open(csv_path, 'w', newline='') as f:
                            writer = csv.DictWriter(f, fieldnames=data[0].keys())
                            writer.writeheader()
                            writer.writerows(data)

                        files_imported.append(f"{sheet_name}.csv")
                        logger.info(f"Imported {sheet_name} from Google Sheets with {len(data)} rows")
                except Exception as e:
                    logger.warning(f"Could not import {sheet_name} from Google Sheets: {str(e)}")            
            
            if not files_imported:
                flash('No valid data could be imported from Google Sheets. Please make sure your spreadsheet contains at least one worksheet with data.', 'error')
                # Clean up the session directory
                shutil.rmtree(session_dir)
                return redirect(url_for('import_from_sheets'))
            
            # Check for minimum required worksheets - adjust as needed
            minimum_required = ["taxonomic_hierarchy"] # Set just one as absolutely required, or leave empty for complete flexibility
            missing_essential = [sheet for sheet in minimum_required if f"{sheet}.csv" not in files_imported]

            if missing_essential:
                flash(f'Missing essential worksheets: {", ".join(missing_essential)}. These are required for basic ontology generation.', 'warning')
                # You can choose whether to continue or abort here

            if not files_imported:
                flash('No valid data could be imported from Google Sheets.', 'error')
                # Clean up the session directory
                shutil.rmtree(session_dir)
                return redirect(url_for('import_from_sheets'))

            # Get ontology name
            ontology_name = request.form.get('ontology_name', '').strip()
            if not ontology_name:
                ontology_name = 'biodiversity-ontology'

            # Sanitize ontology name
            ontology_name = sanitize_filename(ontology_name)

            # Generate the ontology
            try:
                logger.info(f"Generating ontology {ontology_name} for session {session_id} from Google Sheets data")
                ontology_file = generate_ontology_from_directory(
                    session_dir,
                    config_path=os.path.join(os.path.dirname(__file__), 'ontology_config.json'),
                    ontology_name=ontology_name
                )    

                # Store the path for download
                download_path = os.path.join(session_dir, ontology_file)

                # Calculate file size
                file_size = os.path.getsize(download_path)

                # Save metadata
                expiry_time = datetime.datetime.now() + datetime.timedelta(seconds=app.config['SESSION_EXPIRY'])

                metadata = {
                    'session_id': session_id,
                    'ontology_name': ontology_name,
                    'filename': ontology_file,
                    'file_size': file_size,
                    'uploaded_files': files_imported,
                    'source': 'google_sheets',
                    'spreadsheet_name': spreadsheet_name or 'N/A',
                    'spreadsheet_id': spreadsheet_id or 'N/A',
                    'creation_time': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'expiry_time': expiry_time.strftime('%Y-%m-%d %H:%M:%S')
                }
                save_metadata(session_id, metadata)

                # Log to Google Sheets
                log_to_google_sheets(metadata)

                logger.info(f"ontology generated successfully from Google Sheets: {ontology_file} ({file_size} bytes)")

                return render_template('success.html',
                                       session_id=session_id,
                                       filename=ontology_file,
                                       file_size=file_size,
                                       file_count=len(files_imported),
                                       creation_time=datetime.datetime.now().strftime('%H:%M'),
                                       expiry_minutes=app.config['SESSION_EXPIRY'] // 60,
                                       source='Google Sheets',
                                       sheets_logging=True)
            
            except Exception as e:
                logger.error(f"Error generating ontology from Google Sheets: {str(e)}", exc_info=True)
                flash(f'Error generating ontology: {str(e)}', 'error')
                # Clean up the session directory
                shutil.rmtree(session_dir)
                return redirect(url_for('import_from_sheets'))
                
        except Exception as e:
            logger.error(f"Unexpected error in Google Sheets import: {str(e)}", exc_info=True)
            flash(f'An unexpected error occurred: {str(e)}', 'error')
            return redirect(url_for('import_from_sheets'))

@app.route('/status/<session_id>')
def check_status(session_id):
    """API endpoint to check the status of a session."""
    metadata = load_metadata(session_id)
    if metadata:
        # Calculate time remaining
        try:
            expiry_time = datetime.datetime.strptime(metadata['expiry_time'], '%Y-%m-%d %H:%M:%S')
            now = datetime.datetime.now()
            if now > expiry_time:
                time_remaining = 0
            else:
                time_remaining = int((expiry_time - now).total_seconds())

            return jsonify({
                'status': 'active',
                'time_remainig': time_remaining,
                'filename': metadata.get('filename'),
                'file_size': metadata.get('file_size', 0),
                'source': metadata.get('source', 'upload')
            })                    
        except (KeyError, ValueError) as e:
            logger.error(f"Error calculating time remaining for session {session_id}: {str(e)}")

    return jsonify({
        'status': 'expired',
        'time_rmaining': 0
    })        

@app.route('/cleanup', methods=['POST'])
def cleanup():
    """Scheduled task to clean up expired files."""
    if request.form.get('secret') != app.secret_key:
        logger.warning("Unauthorized cleanup attempt")
        return "Unauthorized", 401
    
    # Delete uploads older thean the expiry time
    now = time.time()
    cleanup_count = 0

    for dir_name in os.listdir(app.config['UPLOAD_FOLDER']):
        dir_path = os.path.join(app.config['UPLOAD_FOLDER'], dir_name)
        if os.path.isdir(dir_path):
            created_time = os.path.getctime(dir_path)
            if now - created_time > app.config['SESSION_EXPIRY']:
                try:
                    shutil.rmtree(dir_path)
                    #Also remove metadata file if it exists
                    metadata_path = os.path.join(app.config['METADATA_DIR'], f"{dir_name}.json")
                    if os.path.exists(metadata_path):
                        os.remove(metadata_path)
                    cleanup_count += 1
                except Exception as e:
                    logger.error(f"Error cleaning up directory {dir_path}: {str(e)}")

    logger.info(f"Cleanup complete. Removed {cleanup_count} expired sessions.")
    return f"Cleanup complete. Removed {cleanup_count} expired sessions.", 200

@app.errorhandler(413)
def request_entity_too_large(error):
    """Handle file size exceeded error."""
    flash(f'The file is too large. Maximum allowed size is {app.config["MAX_CONTENT_LENGTH"] // (1024 * 1024)}MB.', 'error')
    return redirect(url_for('index')),413

@app.errorhandler(404)
def page_not_found(error):
    """Handle 404 errors."""
    flash('The requested page was not found.', 'error')
    return redirect(url_for('index')), 404

@app.errorhandler(500)
def page_not_found(error):
    """Handle 500 errors."""
    logger.error(f"Internal server error: {str(error)}", exc_info=True)
    flash('An internal server error occurred. Please try again later.', 'error')
    return redirect(url_for('index')), 500

# Add these imports to the top of app.py
import datetime
import json

# Add these new routes to app.py

@app.route('/version-management')
def version_management():
    """Render the spreadsheet version management page."""
    # Check if Google Sheets integration is available
    if not app.config['USE_GOOGLE_SHEETS'] or not sheets_integration or not sheets_integration.is_initialized():
        flash('Google Sheets integration is not enabled or properly configured.', 'error')
        return redirect(url_for('index'))
        
    return render_template('version_management.html')

@app.route('/spreadsheet-metadata', methods=['GET'])
def get_spreadsheet_metadata():
    """Get metadata about a Google Sheet including version information."""
    if not app.config['USE_GOOGLE_SHEETS'] or not sheets_integration or not sheets_integration.is_initialized():
        return jsonify({
            'success': False,
            'error': 'Google Sheets integration is not enabled or properly configured'
        }), 400

    # Get spreadsheet ID or name from query params
    spreadsheet_id = request.args.get('spreadsheet_id', '').strip()
    spreadsheet_name = request.args.get('spreadsheet_name', '').strip()

    if not spreadsheet_id and not spreadsheet_name:
        return jsonify({
            'success': False,
            'error': 'Please provide either a spreadsheet ID or name'
        }), 400

    try:
        # Open the spreadsheet
        if spreadsheet_id:
            spreadsheet = sheets_integration.open_spreadsheet(spreadsheet_id=spreadsheet_id)
        else:
            spreadsheet = sheets_integration.open_spreadsheet(spreadsheet_name=spreadsheet_name)

        # Get metadata
        metadata = sheets_integration.get_spreadsheet_metadata(spreadsheet)
        
        return jsonify({
            'success': True,
            'metadata': metadata
        })
    except Exception as e:
        logger.error(f"Error retrieving spreadsheet metadata: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Error retrieving spreadsheet metadata: {str(e)}'
        }), 500

@app.route('/update-spreadsheet-version', methods=['POST'])
def update_spreadsheet_version():
    """Update the version information of a spreadsheet."""
    if not app.config['USE_GOOGLE_SHEETS'] or not sheets_integration or not sheets_integration.is_initialized():
        return jsonify({
            'success': False,
            'error': 'Google Sheets integration is not enabled or properly configured'
        }), 400

    # Get parameters from form data
    spreadsheet_id = request.form.get('spreadsheet_id', '').strip()
    spreadsheet_name = request.form.get('spreadsheet_name', '').strip()
    new_version = request.form.get('new_version', '').strip()
    modified_by = request.form.get('modified_by', '').strip()
    changelog = request.form.get('changelog', '').strip()

    if not (spreadsheet_id or spreadsheet_name):
        return jsonify({
            'success': False,
            'error': 'Please provide either a spreadsheet ID or name'
        }), 400

    if not new_version:
        return jsonify({
            'success': False,
            'error': 'Please provide a new version number'
        }), 400

    try:
        # Open the spreadsheet
        if spreadsheet_id:
            spreadsheet = sheets_integration.open_spreadsheet(spreadsheet_id=spreadsheet_id)
        else:
            spreadsheet = sheets_integration.open_spreadsheet(spreadsheet_name=spreadsheet_name)

        # Update version
        success = sheets_integration.update_spreadsheet_version(
            spreadsheet=spreadsheet,
            new_version=new_version,
            modified_by=modified_by,
            changelog=changelog
        )
        
        if success:
            # Get updated metadata
            metadata = sheets_integration.get_spreadsheet_metadata(spreadsheet)
            
            return jsonify({
                'success': True,
                'message': f'Successfully updated spreadsheet to version {new_version}',
                'metadata': metadata
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to update version information'
            }), 500
    except Exception as e:
        logger.error(f"Error updating spreadsheet version: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Error updating spreadsheet version: {str(e)}'
        }), 500

@app.route('/create-version-snapshot', methods=['POST'])
def create_version_snapshot():
    """Create a snapshot of the current spreadsheet as a new versioned spreadsheet."""
    if not app.config['USE_GOOGLE_SHEETS'] or not sheets_integration or not sheets_integration.is_initialized():
        return jsonify({
            'success': False,
            'error': 'Google Sheets integration is not enabled or properly configured'
        }), 400

    # Get parameters from form data
    spreadsheet_id = request.form.get('spreadsheet_id', '').strip()
    spreadsheet_name = request.form.get('spreadsheet_name', '').strip()
    version_name = request.form.get('version_name', '').strip()

    if not (spreadsheet_id or spreadsheet_name):
        return jsonify({
            'success': False,
            'error': 'Please provide either a spreadsheet ID or name'
        }), 400

    if not version_name:
        # Generate a default version name using the current date
        version_name = f"v{datetime.datetime.now().strftime('%Y%m%d')}"

    try:
        # Open the spreadsheet
        if spreadsheet_id:
            spreadsheet = sheets_integration.open_spreadsheet(spreadsheet_id=spreadsheet_id)
        else:
            spreadsheet = sheets_integration.open_spreadsheet(spreadsheet_name=spreadsheet_name)

        # Create snapshot
        snapshot = sheets_integration.create_version_snapshot(
            spreadsheet=spreadsheet,
            version_name=version_name
        )
        
        # Get metadata for the new snapshot
        snapshot_metadata = sheets_integration.get_spreadsheet_metadata(snapshot)
        
        return jsonify({
            'success': True,
            'message': f'Successfully created version snapshot {version_name}',
            'snapshot_id': snapshot.id,
            'snapshot_title': snapshot.title,
            'snapshot_url': f"https://docs.google.com/spreadsheets/d/{snapshot.id}/edit",
            'metadata': snapshot_metadata
        })
    except Exception as e:
        logger.error(f"Error creating version snapshot: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Error creating version snapshot: {str(e)}'
        }), 500

@app.route('/versions', methods=['GET'])
def list_version_history():
    """
    Retrieve the version history of a spreadsheet based on metadata.
    Also lists any available snapshots if they can be found.
    """
    if not app.config['USE_GOOGLE_SHEETS'] or not sheets_integration or not sheets_integration.is_initialized():
        return jsonify({
            'success': False,
            'error': 'Google Sheets integration is not enabled or properly configured'
        }), 400

    # Get spreadsheet ID or name from query params
    spreadsheet_id = request.args.get('spreadsheet_id', '').strip()
    spreadsheet_name = request.args.get('spreadsheet_name', '').strip()

    if not spreadsheet_id and not spreadsheet_name:
        return jsonify({
            'success': False,
            'error': 'Please provide either a spreadsheet ID or name'
        }), 400

    try:
        # Open the spreadsheet
        if spreadsheet_id:
            spreadsheet = sheets_integration.open_spreadsheet(spreadsheet_id=spreadsheet_id)
        else:
            spreadsheet = sheets_integration.open_spreadsheet(spreadsheet_name=spreadsheet_name)

        # Get metadata including version info
        metadata = sheets_integration.get_spreadsheet_metadata(spreadsheet)
        
        # Parse changelog to extract version history if available
        version_history = []
        changelog = metadata.get('version_info', {}).get('changelog', '')
        
        if changelog:
            # Simple parsing of changelog entries (assuming format: "DATE - vVERSION: MESSAGE")
            lines = changelog.strip().split('\n')
            for line in lines:
                if ' - v' in line and ': ' in line:
                    try:
                        date_part = line.split(' - v')[0].strip()
                        version_part = 'v' + line.split(' - v')[1].split(': ')[0].strip()
                        message_part = line.split(': ', 1)[1].strip()
                        
                        version_history.append({
                            'date': date_part,
                            'version': version_part,
                            'message': message_part
                        })
                    except:
                        # Skip malformed entries
                        pass
        
        # Try to find related snapshots by searching for spreadsheets with similar names
        snapshots = []
        try:
            # Search for spreadsheets containing the original title and "snapshot" or version pattern
            all_spreadsheets = sheets_integration.client.list_spreadsheet_files()
            base_name = spreadsheet.title.lower()
            
            for sheet in all_spreadsheets:
                sheet_title = sheet['name'].lower()
                # Check if it looks like a snapshot of our spreadsheet
                if base_name in sheet_title and ('v' in sheet_title or 'snapshot' in sheet_title):
                    snapshots.append({
                        'id': sheet['id'],
                        'title': sheet['name'],
                        'url': f"https://docs.google.com/spreadsheets/d/{sheet['id']}/edit"
                    })
        except Exception as snapshot_error:
            logger.warning(f"Error finding snapshot spreadsheets: {str(snapshot_error)}")
        
        return jsonify({
            'success': True,
            'spreadsheet_title': spreadsheet.title,
            'spreadsheet_id': spreadsheet.id,
            'current_version': metadata.get('version_info', {}).get('version', 'Unknown'),
            'version_date': metadata.get('version_info', {}).get('version_date', ''),
            'version_history': version_history,
            'snapshots': snapshots
        })
    except Exception as e:
        logger.error(f"Error retrieving version history: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': f'Error retrieving version history: {str(e)}'
        }), 500

# Force enable Google Sheets integration for testing
app.config['USE_GOOGLE_SHEETS'] = True

# Override service account information
if not os.path.exists('service_account.json'):
    print("WARNING: service_account.json not found. Google Sheets integration will not work.")
    print("Please follow the Google Sheets API Setup Guide to create your service account.")
else:
    print("Found service_account.json - Initializing Google Sheets integration")
    try:
        # Re-initialize sheets integration
        sheets_integration = SheetsIntegration(service_account_file='service_account.json')
        if sheets_integration.is_initialized():
            print("Google Sheets integration initialized successfully!")
            print(f"Service account email: {sheets_integration.credentials.service_account_email}")
        else:
            print("Failed to initialize Google Sheets integration. Check service_account.json.")
    except Exception as e:
        print(f"Error initializing Google Sheets integration: {str(e)}")   


if __name__ == '__main__':
    # Use production server when deployed
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5001)) )                    
                        


