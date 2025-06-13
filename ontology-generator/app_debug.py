#!/usr/bin/env python3
"""
Debug version of the app with Google Sheets integration enabled.
"""
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
from sheets_integration import SheetsIntegration

# Initialize logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)
app.secret_key = "biodiversity_ontology_builder"

# Set up file storage
app.config['UPLOAD_FOLDER'] = 'Uploads'
app.config['METADATA_DIR'] = 'Metadata'
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024  # 32MB max file size
app.config['SESSION_EXPIRY'] = 3600  # 1 hour in seconds

# Make sure directories exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['METADATA_DIR'], exist_ok=True)

# Enable Google Sheets integration
app.config['USE_GOOGLE_SHEETS'] = True
app.config['GOOGLE_SHEETS_CREDS_FILE'] = 'service_account.json'

# Initialize Google Sheets integration
sheets_integration = None
try:
    sheets_integration = SheetsIntegration(service_account_file='service_account.json')
    if sheets_integration.is_initialized():
        print("Google Sheets integration initialized successfully!")
        print(f"Service account email: {sheets_integration.credentials.service_account_email}")
    else:
        print("Failed to initialize Google Sheets integration.")
except Exception as e:
    print(f"Error initializing Google Sheets integration: {str(e)}")

@app.route('/')
def index():
    """Render the main page."""
    return "Google Sheets Debug App - Integration Status: " + str(sheets_integration.is_initialized() if sheets_integration else False)

@app.route('/sheets-status')
def sheets_status():
    """Check the status of Google Sheets integration."""
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
        "initialized": True,
        "message": "Google Sheets integration is enabled and working",
        "service_account_email": sheets_integration.credentials.service_account_email
    })

if __name__ == '__main__':
    # Run with debugging enabled on port 5001
    app.run(debug=True, host='0.0.0.0', port=5001)