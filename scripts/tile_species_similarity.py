#!/usr/bin/env python3
"""
TILE-TO-SPECIES SIMILARITY DEMO

Query any location on the map and find which species have similar habitat.

DEMO WORKFLOW:
1. User clicks location (lat, lon)
2. Query Alpha Earth tile → get 64D embedding
3. Compare to all species signatures (using centroid/mean)
4. Return ranked list of most similar species

Usage:
    python tile_species_similarity.py --lat 35.0 --lon -85.0
    python tile_species_similarity.py --lat -33.8 --lon 151.2 --top 10
"""

import pandas as pd
import numpy as np
import ee
import argparse
import sys
from pathlib import Path
import io

# Google Drive API
try:
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaIoBaseDownload
    import pickle
    DRIVE_API_AVAILABLE = True
except ImportError:
    DRIVE_API_AVAILABLE = False


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
                print("\n❌ credentials.json not found!")
                return None

            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)

        with open('token.pickle', 'wb') as token:
            pickle.dump(creds, token)

    drive_service = build('drive', 'v3', credentials=creds)
    print("✅ Google Drive API initialized")
    return drive_service


def query_tile_embedding(lat, lon, year=2024):
    """
    Query Alpha Earth tile at given location to get 64D embedding

    Parameters:
    -----------
    lat : float
        Latitude (-90 to 90)
    lon : float
        Longitude (-180 to 180)
    year : int
        Year to query (2018-2024)

    Returns:
    --------
    numpy array: 64D embedding (A00-A63) or None if failed
    """
    print(f"\n🌍 Querying tile at: ({lat:.4f}, {lon:.4f})")
    print(f"   Year: {year}")

    try:
        # Load Alpha Earth collection (Google's official satellite embedding dataset)
        collection = ee.ImageCollection('GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL')

        # Filter by year
        start_date = f'{year}-01-01'
        end_date = f'{year}-12-31'
        year_collection = collection.filterDate(start_date, end_date)

        # Mosaic tiles (Alpha Earth is tiled)
        image = year_collection.mosaic()

        # Create point
        point = ee.Geometry.Point([lon, lat])

        # Sample all 64 bands
        band_names = [f'A{i:02d}' for i in range(64)]

        # Sample at point (scale=250m for Alpha Earth native resolution)
        sample = image.sample(
            region=point,
            scale=250,
            geometries=False
        ).first()

        # Get values
        sample_dict = sample.getInfo()

        if sample_dict is None or 'properties' not in sample_dict:
            print("❌ No data at this location (likely water/no coverage)")
            return None

        properties = sample_dict['properties']

        # Extract embedding
        embedding = np.array([properties.get(band, np.nan) for band in band_names])

        # Check for NaN
        if np.isnan(embedding).any():
            print("❌ Incomplete data at this location")
            return None

        print(f"✅ Tile embedding retrieved: 64D")
        print(f"   Sample values: A00={embedding[0]:.4f}, A01={embedding[1]:.4f}, A02={embedding[2]:.4f}")

        return embedding

    except Exception as e:
        print(f"❌ Failed to query tile: {e}")
        return None


def load_species_signatures_from_drive(drive_service, folder_name='species_signatures'):
    """
    Load all species signatures from Google Drive

    Returns:
    --------
    DataFrame with all species signatures (one row per species)
    """
    print(f"\n📥 Loading species signatures from Drive...")
    print(f"   Folder: {folder_name}/")

    try:
        # Get folder ID
        query = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder'"
        results = drive_service.files().list(q=query, fields="files(id, name)").execute()
        items = results.get('files', [])

        if not items:
            print(f"❌ Folder '{folder_name}' not found")
            return None

        folder_id = items[0]['id']

        # List all CSV files in folder
        query = f"'{folder_id}' in parents and mimeType='text/csv'"
        results = drive_service.files().list(
            q=query,
            fields="files(id, name)",
            pageSize=1000
        ).execute()
        files = results.get('files', [])

        if not files:
            print(f"❌ No signature files found in {folder_name}/")
            return None

        print(f"   Found {len(files)} signature files")

        # Load all signatures
        all_signatures = []

        for i, file in enumerate(files):
            file_id = file['id']
            file_name = file['name']

            if i % 10 == 0:
                print(f"   Loading {i+1}/{len(files)}...")

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

        # Combine all signatures
        signatures_df = pd.concat(all_signatures, ignore_index=True)

        print(f"✅ Loaded {len(signatures_df)} species signatures")
        return signatures_df

    except Exception as e:
        print(f"❌ Failed to load signatures: {e}")
        return None


def compute_similarity_centroid(tile_embedding, species_signature):
    """
    OPTION 1: Simple centroid distance

    Compare tile (64D) to species mean (64D)
    Ignore std, p10, p90

    Parameters:
    -----------
    tile_embedding : numpy array (64,)
        The 64D embedding from the queried tile
    species_signature : pandas Series
        One row from signatures dataframe containing mean_A00...mean_A63

    Returns:
    --------
    float: Similarity score (0 to 1, higher = more similar)
    """
    # Extract just the mean columns (centroid)
    band_names = [f'A{i:02d}' for i in range(64)]
    species_mean = np.array([species_signature[f'mean_{band}'] for band in band_names])

    # Compute Euclidean distance
    distance = np.linalg.norm(tile_embedding - species_mean)

    # Convert to similarity (0 to 1 scale)
    # Lower distance = higher similarity
    similarity = 1.0 / (1.0 + distance)

    return similarity


def find_similar_species(tile_embedding, signatures_df, top_n=10):
    """
    Find most similar species to the queried tile

    Parameters:
    -----------
    tile_embedding : numpy array (64,)
        The 64D embedding from the queried tile
    signatures_df : DataFrame
        All species signatures
    top_n : int
        Number of top species to return

    Returns:
    --------
    DataFrame with top N species and their similarity scores
    """
    print(f"\n🔍 Comparing tile to {len(signatures_df)} species signatures...")

    similarities = []

    for idx, row in signatures_df.iterrows():
        species_name = row['species']
        similarity = compute_similarity_centroid(tile_embedding, row)
        similarities.append({
            'species': species_name,
            'similarity_score': similarity,
            'num_occurrences': row.get('total_occurrences', 0)
        })

    # Sort by similarity (descending)
    results_df = pd.DataFrame(similarities)
    results_df = results_df.sort_values('similarity_score', ascending=False)

    print(f"✅ Similarity computed for all species")

    return results_df.head(top_n)


def main():
    parser = argparse.ArgumentParser(
        description='Find species with similar habitat to any location on Earth'
    )
    parser.add_argument('--lat', type=float, required=True, help='Latitude (-90 to 90)')
    parser.add_argument('--lon', type=float, required=True, help='Longitude (-180 to 180)')
    parser.add_argument('--year', type=int, default=2024, help='Year to query (2018-2024, default: 2024)')
    parser.add_argument('--top', type=int, default=10, help='Number of top species to return (default: 10)')
    parser.add_argument('--signatures-folder', type=str, default='species_signatures',
                       help='Drive folder name (default: species_signatures)')

    args = parser.parse_args()

    # Validate inputs
    if not -90 <= args.lat <= 90:
        print("❌ Latitude must be between -90 and 90")
        sys.exit(1)

    if not -180 <= args.lon <= 180:
        print("❌ Longitude must be between -180 and 180")
        sys.exit(1)

    if not 2018 <= args.year <= 2024:
        print("❌ Year must be between 2018 and 2024")
        sys.exit(1)

    print("="*70)
    print("TILE-TO-SPECIES SIMILARITY QUERY")
    print("="*70)
    print(f"\n📍 Query location: ({args.lat}, {args.lon})")
    print(f"📅 Year: {args.year}")
    print(f"🏆 Top species to return: {args.top}")
    print("\n" + "="*70)

    # Check Drive API
    if not DRIVE_API_AVAILABLE:
        print("\n❌ Google Drive API not installed!")
        print("\nInstall with:")
        print("  pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client")
        sys.exit(1)

    # Initialize GEE
    if not initialize_gee():
        print("❌ Failed to initialize GEE")
        sys.exit(1)

    # Initialize Drive
    drive_service = initialize_drive()
    if not drive_service:
        print("❌ Failed to initialize Drive API")
        sys.exit(1)

    # STEP 1: Query tile embedding
    tile_embedding = query_tile_embedding(args.lat, args.lon, args.year)
    if tile_embedding is None:
        print("\n❌ Failed to retrieve tile embedding")
        sys.exit(1)

    # STEP 2: Load species signatures
    signatures_df = load_species_signatures_from_drive(drive_service, args.signatures_folder)
    if signatures_df is None:
        print("\n❌ Failed to load species signatures")
        sys.exit(1)

    # STEP 3: Find similar species
    results = find_similar_species(tile_embedding, signatures_df, args.top)

    # Display results
    print("\n" + "="*70)
    print(f"🏆 TOP {args.top} MOST SIMILAR SPECIES")
    print("="*70)
    print(f"\nLocation: ({args.lat}, {args.lon})")
    print(f"Method: Centroid distance (mean embedding)\n")

    for i, row in results.iterrows():
        rank = i + 1
        species = row['species']
        score = row['similarity_score']
        n_occ = int(row['num_occurrences'])

        # Convert to percentage
        score_pct = score * 100

        print(f"{rank:2d}. {species:40s}  {score_pct:5.2f}%  ({n_occ:,} occurrences)")

    print("\n" + "="*70)
    print("✅ Query complete!")
    print("="*70)

    # Save results
    output_file = f"similarity_results_{args.lat}_{args.lon}.csv"
    results.to_csv(output_file, index=False)
    print(f"\n💾 Results saved to: {output_file}")


if __name__ == "__main__":
    main()
