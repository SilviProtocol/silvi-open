#!/usr/bin/env python3
"""
COMPLETE YEAR-MATCHED PIPELINE

One command to:
1. Extract year-matched embeddings from GEE → 64D CSV
2. Wait for GEE task to complete
3. Auto-download from Google Drive
4. Aggregate to 256D signature

Usage:
    python complete_pipeline.py "Species Name"
    python complete_pipeline.py "Species Name" --max-samples 5000 --wait-time 10
"""

import pandas as pd
import numpy as np
import ee
import time
import sys
import io
from pathlib import Path
import argparse

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
    SCOPES = ['https://www.googleapis.com/auth/drive']

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


def extract_year_matched_embeddings(df, species_name, max_samples=5000):
    """
    Step 1: Extract year-matched embeddings from GEE
    """
    print("\n" + "="*70)
    print("STEP 1: EXTRACTING YEAR-MATCHED EMBEDDINGS FROM GEE")
    print("="*70)

    from extract_temporal_aligned import extract_server_side_signature

    tasks = extract_server_side_signature(
        df,
        species_name,
        max_samples=max_samples,
        export_yearly=False  # We only export one year-matched CSV
    )

    print(f"\n✅ GEE export task started")
    return tasks


def wait_for_gee_completion(wait_minutes=10):
    """
    Step 2: Wait for GEE task to complete
    """
    print("\n" + "="*70)
    print("STEP 2: WAITING FOR GEE TASK COMPLETION")
    print("="*70)

    print(f"\n⏳ Waiting {wait_minutes} minutes for GEE processing...")
    print("   Monitor: https://code.earthengine.google.com/tasks")

    for i in range(wait_minutes):
        remaining = wait_minutes - i
        print(f"   {remaining} minutes remaining...")
        time.sleep(60)

    print("\n✅ Wait complete - proceeding to download")


def get_folder_id(drive_service, folder_name):
    """Get Google Drive folder ID"""
    query = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder'"
    results = drive_service.files().list(q=query, fields="files(id, name)").execute()
    items = results.get('files', [])

    if not items:
        print(f"❌ Folder '{folder_name}' not found")
        return None

    return items[0]['id']


def download_year_matched_csv(drive_service, species_name):
    """
    Step 3: Download year-matched CSV from Google Drive
    """
    print("\n" + "="*70)
    print("STEP 3: DOWNLOADING YEAR-MATCHED CSV FROM DRIVE")
    print("="*70)

    safe_name = species_name.replace(' ', '_').replace('/', '_')
    filename = f"{safe_name}_year_matched_embeddings_64d.csv"
    folder_name = 'species_year_matched_embeddings'

    print(f"\n📥 Downloading: {filename}")
    print(f"   From: {folder_name}/")

    # Get folder ID
    folder_id = get_folder_id(drive_service, folder_name)
    if not folder_id:
        return None

    # Find file
    query = f"name='{filename}' and '{folder_id}' in parents"
    results = drive_service.files().list(q=query, fields="files(id, name)").execute()
    items = results.get('files', [])

    if not items:
        print(f"❌ File not found: {filename}")
        print("   Please check if GEE task completed successfully")
        return None

    file_id = items[0]['id']

    # Download
    request = drive_service.files().get_media(fileId=file_id)
    fh = io.BytesIO()
    downloader = MediaIoBaseDownload(fh, request)

    done = False
    while not done:
        status, done = downloader.next_chunk()
        if status:
            print(f"   Progress: {int(status.progress() * 100)}%")

    # Save
    local_path = Path(filename)
    with open(local_path, 'wb') as f:
        f.write(fh.getvalue())

    print(f"✅ Downloaded: {local_path} ({local_path.stat().st_size / 1024:.1f} KB)")
    return local_path


def aggregate_to_signature(csv_path):
    """
    Step 4: Aggregate 64D embeddings to 256D signature
    """
    print("\n" + "="*70)
    print("STEP 4: AGGREGATING TO 256D SIGNATURE")
    print("="*70)

    # Load
    print(f"\n📂 Loading: {csv_path}")
    df = pd.read_csv(csv_path)
    print(f"✅ Loaded: {len(df):,} rows, {len(df.columns)} columns")

    # Extract bands
    band_names = [f'A{i:02d}' for i in range(64)]
    missing = [b for b in band_names if b not in df.columns]
    if missing:
        print(f"❌ Missing bands: {missing}")
        return None

    # Extract species name
    if 'species' in df.columns:
        species_name = df['species'].iloc[0]
    else:
        species_name = csv_path.stem.replace('_year_matched_embeddings_64d', '')

    print(f"📊 Species: {species_name}")

    # Show year info
    if 'occurrence_year' in df.columns and 'gee_year' in df.columns:
        print(f"   Occurrence years: {df['occurrence_year'].value_counts().to_dict()}")
        print(f"   GEE years used: {df['gee_year'].value_counts().to_dict()}")

    # Get embedding matrix
    embedding_matrix = df[band_names].values

    # Remove NaN rows
    valid_mask = ~np.isnan(embedding_matrix).any(axis=1)
    embedding_matrix_clean = embedding_matrix[valid_mask]

    if len(embedding_matrix_clean) < len(embedding_matrix):
        print(f"   ⚠️ Removed {len(embedding_matrix) - len(embedding_matrix_clean)} rows with NaN")

    print(f"   Using {len(embedding_matrix_clean):,} valid embeddings")

    # Compute statistics
    print(f"\n🔢 Computing mean/std/p10/p90 for 64 bands...")

    stats = {
        'species': species_name,
        'total_embeddings': len(embedding_matrix_clean),
        'total_occurrences': len(df)
    }

    for i, band in enumerate(band_names):
        band_values = embedding_matrix_clean[:, i]
        stats[f'mean_{band}'] = np.mean(band_values)
        stats[f'std_{band}'] = np.std(band_values)
        stats[f'p10_{band}'] = np.percentile(band_values, 10)
        stats[f'p90_{band}'] = np.percentile(band_values, 90)

    signature_df = pd.DataFrame([stats])

    print(f"✅ Signature: 259 columns (3 metadata + 256 stats)")
    print(f"\n📊 Sample (A00):")
    print(f"   Mean: {stats['mean_A00']:.6f}")
    print(f"   Std:  {stats['std_A00']:.6f}")
    print(f"   P10:  {stats['p10_A00']:.6f}")
    print(f"   P90:  {stats['p90_A00']:.6f}")

    # Save
    safe_name = species_name.replace(' ', '_').replace('/', '_')
    output_file = f"{safe_name}_signature_256d.csv"
    signature_df.to_csv(output_file, index=False)

    print(f"\n💾 Saved: {output_file}")
    print(f"   Shape: {signature_df.shape}")

    return signature_df, output_file


def main():
    """Main complete pipeline"""
    parser = argparse.ArgumentParser(description='Complete year-matched GEE extraction pipeline')
    parser.add_argument('species', type=str, help='Species name (e.g., "Acer rubrum")')
    parser.add_argument('--max-samples', type=int, default=5000, help='Max samples to extract (default: 5000)')
    parser.add_argument('--wait-time', type=int, default=10, help='Minutes to wait for GEE (default: 10)')
    parser.add_argument('--parquet', type=str, default='Treekipedia_occ_Year_october24d.parquet', help='Parquet file path')

    args = parser.parse_args()

    print("="*70)
    print("COMPLETE YEAR-MATCHED PIPELINE")
    print("="*70)
    print(f"\nSpecies: {args.species}")
    print(f"Max samples: {args.max_samples:,}")
    print(f"Wait time: {args.wait_time} minutes")
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

    # Load data
    print(f"\n📂 Loading species data from: {args.parquet}")
    try:
        df = pd.read_parquet(args.parquet)
        print(f"✅ Loaded: {len(df):,} occurrences, {df['species'].nunique():,} species")
    except Exception as e:
        print(f"❌ Failed to load parquet: {e}")
        sys.exit(1)

    # STEP 1: Extract from GEE
    tasks = extract_year_matched_embeddings(df, args.species, args.max_samples)

    # STEP 2: Wait for GEE
    wait_for_gee_completion(args.wait_time)

    # STEP 3: Download CSV
    csv_path = download_year_matched_csv(drive_service, args.species)
    if not csv_path:
        print("\n❌ Download failed - check if GEE task completed")
        sys.exit(1)

    # STEP 4: Aggregate to signature
    signature_df, signature_file = aggregate_to_signature(csv_path)

    # Final summary
    print("\n" + "="*70)
    print("✅ COMPLETE PIPELINE SUCCESS!")
    print("="*70)
    print(f"\nOutputs:")
    print(f"  1. 64D Embeddings: {csv_path}")
    print(f"     • {len(pd.read_csv(csv_path)):,} rows")
    print(f"     • Columns: occurrence_id, lat, lon, occurrence_year, gee_year, A00-A63")
    print(f"\n  2. 256D Signature: {signature_file}")
    print(f"     • Species: {args.species}")
    print(f"     • Embeddings: {signature_df['total_embeddings'].iloc[0]:,}")
    print(f"     • Statistics: 256 (64 bands × 4 stats)")
    print(f"\n🎉 Ready for classification!")


if __name__ == "__main__":
    main()
