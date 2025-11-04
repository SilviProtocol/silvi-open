#!/usr/bin/env python3
"""
Flask backend for Tile-to-Species Similarity Demo

Provides API endpoint for querying species similarity at any location
"""

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import pandas as pd
import numpy as np
import ee
import io
from pathlib import Path
import pickle

# Google Drive API
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

app = Flask(__name__)
CORS(app)

# Global cache for signatures
SIGNATURES_CACHE = None


def initialize_gee(project='treekipedia'):
    """Initialize Google Earth Engine"""
    try:
        ee.Initialize(project=project)
        print("✅ GEE initialized")
        return True
    except Exception as e:
        print(f"❌ GEE initialization failed: {e}")
        return False


def initialize_drive():
    """Initialize Google Drive API"""
    SCOPES = ['https://www.googleapis.com/auth/drive.readonly']

    creds = None
    if Path('token.pickle').exists():
        with open('token.pickle', 'rb') as token:
            creds = pickle.load(token)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not Path('credentials.json').exists():
                print("❌ credentials.json not found!")
                return None

            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)

        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)

    drive_service = build('drive', 'v3', credentials=creds)
    print("✅ Google Drive API initialized")
    return drive_service


def load_species_signatures(drive_service, folder_name='species_signatures'):
    """Load all species signatures from Google Drive (cached)"""
    global SIGNATURES_CACHE

    if SIGNATURES_CACHE is not None:
        print("📦 Using cached signatures")
        return SIGNATURES_CACHE

    print(f"📥 Loading species signatures from Drive...")

    try:
        # Get folder ID
        query = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder'"
        results = drive_service.files().list(q=query, fields="files(id, name)").execute()
        items = results.get('files', [])

        if not items:
            return None

        folder_id = items[0]['id']

        # List all CSV files
        query = f"'{folder_id}' in parents and mimeType='text/csv'"
        results = drive_service.files().list(
            q=query,
            fields="files(id, name)",
            pageSize=1000
        ).execute()
        files = results.get('files', [])

        if not files:
            return None

        print(f"   Found {len(files)} signature files")

        # Load all signatures
        all_signatures = []

        for file in files:
            file_id = file['id']

            # Download to memory
            request = drive_service.files().get_media(fileId=file_id)
            fh = io.BytesIO()
            downloader = MediaIoBaseDownload(fh, request)

            done = False
            while not done:
                status, done = downloader.next_chunk()

            # Read CSV
            fh.seek(0)
            df = pd.read_csv(fh)
            all_signatures.append(df)

        # Combine and cache
        SIGNATURES_CACHE = pd.concat(all_signatures, ignore_index=True)
        print(f"✅ Loaded {len(SIGNATURES_CACHE)} species signatures")
        return SIGNATURES_CACHE

    except Exception as e:
        print(f"❌ Failed to load signatures: {e}")
        return None


def query_tile_embedding(lat, lon, year=2024):
    """Query Alpha Earth tile at given location"""
    try:
        # Load Alpha Earth collection
        collection = ee.ImageCollection('GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL')

        # Filter by year
        start_date = f'{year}-01-01'
        end_date = f'{year}-12-31'
        year_collection = collection.filterDate(start_date, end_date)

        # Mosaic tiles
        image = year_collection.mosaic()

        # Create point
        point = ee.Geometry.Point([lon, lat])

        # Sample all 64 bands
        band_names = [f'A{i:02d}' for i in range(64)]

        # Sample at point
        sample = image.sample(
            region=point,
            scale=250,
            geometries=False
        ).first()

        # Get values
        sample_dict = sample.getInfo()

        if sample_dict is None or 'properties' not in sample_dict:
            return None

        properties = sample_dict['properties']

        # Extract embedding
        embedding = np.array([properties.get(band, np.nan) for band in band_names])

        # Check for NaN
        if np.isnan(embedding).any():
            return None

        return embedding

    except Exception as e:
        print(f"❌ Failed to query tile: {e}")
        return None


def compute_similarity_centroid(tile_embedding, species_signature):
    """Compute similarity using centroid approach"""
    band_names = [f'A{i:02d}' for i in range(64)]
    species_mean = np.array([species_signature[f'mean_{band}'] for band in band_names])

    distance = np.linalg.norm(tile_embedding - species_mean)
    similarity = 1.0 / (1.0 + distance)

    return similarity


# Initialize on startup
print("🚀 Initializing services...")
initialize_gee()
drive_service = initialize_drive()

if drive_service:
    # Pre-load signatures
    load_species_signatures(drive_service)


@app.route('/')
def index():
    """Serve the main page"""
    return render_template('index.html')


@app.route('/api/query', methods=['POST'])
def query_location():
    """
    API endpoint to query species similarity at a location

    Request JSON:
    {
        "lat": -33.5,
        "lon": 151.0,
        "year": 2024,
        "top_n": 10
    }

    Response JSON:
    {
        "success": true,
        "location": {"lat": -33.5, "lon": 151.0},
        "tile_embedding": [...],
        "results": [
            {"species": "Doryphora sassafras", "similarity": 0.662, "occurrences": 689},
            ...
        ]
    }
    """
    try:
        data = request.json
        lat = float(data.get('lat'))
        lon = float(data.get('lon'))
        year = int(data.get('year', 2024))
        top_n = int(data.get('top_n', 10))

        print(f"📍 Query: ({lat}, {lon}) year={year} top={top_n}")

        # Validate
        if not (-90 <= lat <= 90):
            return jsonify({"success": False, "error": "Invalid latitude"}), 400
        if not (-180 <= lon <= 180):
            return jsonify({"success": False, "error": "Invalid longitude"}), 400
        if not (2018 <= year <= 2024):
            return jsonify({"success": False, "error": "Year must be 2018-2024"}), 400

        # Query tile
        tile_embedding = query_tile_embedding(lat, lon, year)
        if tile_embedding is None:
            return jsonify({
                "success": False,
                "error": "No data at this location (water or no coverage)"
            }), 404

        # Get signatures
        signatures = SIGNATURES_CACHE
        if signatures is None:
            return jsonify({
                "success": False,
                "error": "Species signatures not loaded"
            }), 500

        # Compute similarities
        results = []
        for idx, row in signatures.iterrows():
            species_name = row['species']
            similarity = compute_similarity_centroid(tile_embedding, row)
            results.append({
                'species': species_name,
                'similarity': float(similarity),
                'occurrences': int(row.get('total_occurrences', 0))
            })

        # Sort by similarity
        results = sorted(results, key=lambda x: x['similarity'], reverse=True)[:top_n]

        return jsonify({
            "success": True,
            "location": {"lat": lat, "lon": lon},
            "year": year,
            "tile_embedding": tile_embedding.tolist(),
            "results": results
        })

    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/api/stats', methods=['GET'])
def get_stats():
    """Get statistics about loaded signatures"""
    if SIGNATURES_CACHE is None:
        return jsonify({"loaded": False})

    return jsonify({
        "loaded": True,
        "num_species": len(SIGNATURES_CACHE),
        "species_list": SIGNATURES_CACHE['species'].tolist()
    })


if __name__ == '__main__':
    print("\n" + "="*70)
    print("🌍 TILE-TO-SPECIES SIMILARITY DEMO")
    print("="*70)
    print("\n🚀 Starting Flask server...")
    print("📍 Open: http://localhost:5002")
    print("\n" + "="*70 + "\n")

    app.run(debug=True, port=5002, host='0.0.0.0')
