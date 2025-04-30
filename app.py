from flask import Flask, render_template, request, redirect, url_for, flash, send_file, jsonify
import os
import shutil
import uuid
import datetime
import time
import json
import re
import logging
from werkzeug.utils import secure_filename
from generate_ontology import generate_ontology_from_directory

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
app.secret_key = "biodiversity_ontology_builder"
app.config['UPLOAD_FOLDER'] = 'Uploads'
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024  # 32MB max file size
app.config['SESSION_EXPIRY'] = 3600  # 1 hour in seconds
app.config['METADATA_DIR'] = 'Metadata'  # Directory to store session metadata

# Ensure upload and metadata directories exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['METADATA_DIR'], exist_ok=True)

def allowed_file(filename):
    """Check if the file has a valid extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() == 'csv'

def sanitize_filename(filename):
    """Sanitize filename to prevent security issues."""
    # Replace spaces with underscores and remove special characters
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

@app.route('/')
def index():
    """Render the main page."""
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_files():
    """Handle file uploads and ontology generation."""
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
                        
                    logger.info(f"Saving file: {filename} to {session_dir}")
                    file.save(os.path.join(session_dir, filename))
                    files_uploaded = True
                    uploaded_file_names.append(filename)
            
            if not files_uploaded:
                flash('No files were uploaded. Please select at least one CSV file.', 'error')
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
                    'ontology_name': ontology_name,
                    'filename': ontology_file,
                    'file_size': file_size,
                    'uploaded_files': uploaded_file_names,
                    'creation_time': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                    'expiry_time': expiry_time.strftime('%Y-%m-%d %H:%M:%S')
                }
                save_metadata(session_id, metadata)
                
                logger.info(f"Ontology generated successfully: {ontology_file} ({file_size} bytes)")
                
                return render_template('success.html', 
                                     session_id=session_id, 
                                     filename=ontology_file,
                                     file_size=file_size,
                                     file_count=len(uploaded_file_names),
                                     creation_time=datetime.datetime.now().strftime('%H:%M'),
                                     expiry_minutes=app.config['SESSION_EXPIRY'] // 60)
                
            except Exception as e:
                logger.error(f"Error generating ontology: {str(e)}", exc_info=True)
                flash(f'Error generating ontology: {str(e)}', 'error')
                # Clean up the session directory if an error occurs
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
        # Validate the session_id and filename to prevent directory traversal
        if '..' in session_id or '/' in session_id or '..' in filename or '/' in filename:
            logger.warning(f"Invalid download request: {session_id}/{filename} - Possible directory traversal attempt")
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
                    flash('This file has expired and is no longer available for download.', 'warning')
                    return redirect(url_for('index'))
            except (KeyError, ValueError) as e:
                logger.error(f"Error parsing metadata for session {session_id}: {str(e)}")
        
        # Log the download
        logger.info(f"File download: {session_id}/{filename}")
        
        # Serve the file
        return send_file(path, as_attachment=True)
    except Exception as e:
        logger.error(f"Error downloading file: {str(e)}", exc_info=True)
        flash(f'Error downloading file: {str(e)}', 'error')
        return redirect(url_for('index'))

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
                'time_remaining': time_remaining,
                'filename': metadata.get('filename'),
                'file_size': metadata.get('file_size', 0)
            })
        except (KeyError, ValueError) as e:
            logger.error(f"Error calculating time remaining for session {session_id}: {str(e)}")
    
    return jsonify({
        'status': 'expired',
        'time_remaining': 0
    })

@app.route('/cleanup', methods=['POST'])
def cleanup():
    """Scheduled task to clean up expired files."""
    if request.form.get('secret') != app.secret_key:
        logger.warning("Unauthorized cleanup attempt")
        return "Unauthorized", 401
    
    # Delete uploads older than the expiry time
    now = time.time()
    cleanup_count = 0
    
    for dir_name in os.listdir(app.config['UPLOAD_FOLDER']):
        dir_path = os.path.join(app.config['UPLOAD_FOLDER'], dir_name)
        if os.path.isdir(dir_path):
            created_time = os.path.getctime(dir_path)
            if now - created_time > app.config['SESSION_EXPIRY']:
                try:
                    shutil.rmtree(dir_path)
                    # Also remove metadata file if it exists
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
    return redirect(url_for('index')), 413

@app.errorhandler(404)
def page_not_found(error):
    """Handle 404 errors."""
    flash('The requested page was not found.', 'error')
    return redirect(url_for('index')), 404

@app.errorhandler(500)
def internal_server_error(error):
    """Handle 500 errors."""
    logger.error(f"Internal server error: {str(error)}", exc_info=True)
    flash('An internal server error occurred. Please try again later.', 'error')
    return redirect(url_for('index')), 500

if __name__ == '__main__':
    app.run(debug=True)