# app.py
import os
import shutil
from flask import Flask, render_template, request, redirect, url_for, flash, send_file
import tempfile
import uuid

# Import our ontology generator 
from generate_ontology import generate_ontology_from_directory

app = Flask(__name__)
app.secret_key = "biodiversity_ontology_builder"
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_files():
    if request.method == 'POST':
        # Create a unique directory for this session
        session_id = str(uuid.uuid4())
        session_dir = os.path.join(app.config['UPLOAD_FOLDER'], session_id)
        os.makedirs(session_dir, exist_ok=True)
        
        files_uploaded = False
        
        # Process each possible file type
        file_types = ['taxonomic_hierarchy', 'biomes', 'ecoregions', 'countries', 
                      'object_properties', 'data_properties']
        
        for file_type in file_types:
            if file_type in request.files:
                file = request.files[file_type]
                if file.filename:
                    filename = file_type + '.csv'
                    file.save(os.path.join(session_dir, filename))
                    files_uploaded = True
        
        if not files_uploaded:
            flash('No files were uploaded. Please select at least one file.', 'error')
            return redirect(url_for('index'))
        
        # Generate the ontology
        try:
            ontology_file = generate_ontology_from_directory(
                session_dir, 
                ontology_name=request.form.get('ontology_name', 'biodiversity-ontology')
            )
            
            # Store the path for download
            download_path = os.path.join(session_dir, ontology_file)
            
            return render_template('success.html', 
                                  session_id=session_id, 
                                  filename=ontology_file)
        except Exception as e:
            flash(f'Error generating ontology: {str(e)}', 'error')
            return redirect(url_for('index'))

@app.route('/download/<session_id>/<filename>')
def download(session_id, filename):
    try:
        # Validate the session_id and filename to prevent directory traversal
        if '..' in session_id or '/' in session_id or '..' in filename or '/' in filename:
            flash('Invalid request', 'error')
            return redirect(url_for('index'))
        
        path = os.path.join(app.config['UPLOAD_FOLDER'], session_id, filename)
        
        # Verify the file exists
        if not os.path.exists(path):
            flash('File not found', 'error')
            return redirect(url_for('index'))
        
        return send_file(path, as_attachment=True)
    except Exception as e:
        flash(f'Error downloading file: {str(e)}', 'error')
        return redirect(url_for('index'))

# Clean up old uploads (run periodically)
@app.route('/cleanup', methods=['POST'])
def cleanup():
    if request.form.get('secret') != app.secret_key:
        return "Unauthorized", 401
    
    # Delete uploads older than 1 hour
    import time
    now = time.time()
    for dir_name in os.listdir(app.config['UPLOAD_FOLDER']):
        dir_path = os.path.join(app.config['UPLOAD_FOLDER'], dir_name)
        if os.path.isdir(dir_path):
            created_time = os.path.getctime(dir_path)
            if now - created_time > 3600:  # 1 hour in seconds
                shutil.rmtree(dir_path)
    
    return "Cleanup complete", 200

if __name__ == '__main__':
    app.run(debug=True)