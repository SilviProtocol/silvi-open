#!/usr/bin/env python3
"""
COMPLETE PIPELINE - DRIVE ONLY (NO LOCAL STORAGE)

One command to do everything:
1. Extract year-matched embeddings from GEE → exports to Drive
2. Wait for GEE task to complete (auto-polling)
3. Read CSV from Drive (in memory, no local download)
4. Aggregate to 256D signature locally
5. Upload signature back to Drive

Usage:
    python complete_pipeline_drive_only.py "Acer rubrum"
    python complete_pipeline_drive_only.py "Acer rubrum" --max-samples 5000
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
    from googleapiclient.http import MediaIoBaseDownload, MediaIoBaseUpload
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
        export_yearly=False
    )

    print(f"\n✅ GEE export task started")
    return tasks


def wait_for_gee_task(species_name, check_interval=60):
    """
    Step 2: Wait for GEE task to complete (auto-polling)
    """
    print("\n" + "="*70)
    print("STEP 2: WAITING FOR GEE TASK COMPLETION (AUTO-POLLING)")
    print("="*70)

    safe_name = species_name.replace(' ', '_').replace('/', '_')
    task_desc = f'{safe_name}_year_matched_embeddings_64d'

    print(f"\n⏳ Monitoring task: {task_desc}")
    print(f"   Checking every {check_interval} seconds...")
    print(f"   Monitor: https://code.earthengine.google.com/tasks")

    start_time = time.time()
    check_count = 0

    while True:
        check_count += 1
        elapsed = int((time.time() - start_time) / 60)

        # Get task status
        tasks = ee.batch.Task.list()
        matching_task = None

        for task in tasks:
            if task.status()['description'] == task_desc:
                matching_task = task
                break

        if not matching_task:
            print(f"\n❌ Task not found: {task_desc}")
            return False

        state = matching_task.status()['state']
        print(f"   [{elapsed} min] Check #{check_count}: {state}")

        if state == 'COMPLETED':
            print(f"\n✅ Task completed! (took {elapsed} minutes)")
            return True
        elif state == 'FAILED':
            print(f"\n❌ Task failed!")
            error_message = matching_task.status().get('error_message', 'Unknown error')
            print(f"   Error: {error_message}")
            return False
        elif state in ['CANCELLED', 'CANCEL_REQUESTED']:
            print(f"\n❌ Task was cancelled")
            return False
        elif state in ['READY', 'RUNNING']:
            # Still processing, wait and check again
            time.sleep(check_interval)
        else:
            print(f"\n⚠️ Unknown state: {state}")
            time.sleep(check_interval)


def get_folder_id(drive_service, folder_name):
    """Get Google Drive folder ID"""
    query = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder'"
    results = drive_service.files().list(q=query, fields="files(id, name)").execute()
    items = results.get('files', [])

    if not items:
        # Try to create folder if it doesn't exist
        print(f"   Folder '{folder_name}' not found, creating it...")
        file_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        folder = drive_service.files().create(body=file_metadata, fields='id').execute()
        return folder.get('id')

    return items[0]['id']


def read_csv_from_drive(drive_service, species_name):
    """
    Step 3: Read CSV from Google Drive directly into memory
    """
    print("\n" + "="*70)
    print("STEP 3: READING CSV FROM DRIVE (IN MEMORY)")
    print("="*70)

    safe_name = species_name.replace(' ', '_').replace('/', '_')
    filename = f"{safe_name}_year_matched_embeddings_64d.csv"
    folder_name = 'species_year_matched_embeddings'

    print(f"\n📥 Reading: {filename}")
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
        return None

    file_id = items[0]['id']

    # Download to memory
    request = drive_service.files().get_media(fileId=file_id)
    fh = io.BytesIO()
    downloader = MediaIoBaseDownload(fh, request)

    done = False
    while not done:
        status, done = downloader.next_chunk()
        if status:
            print(f"   Reading progress: {int(status.progress() * 100)}%")

    # Read CSV from memory
    fh.seek(0)
    df = pd.read_csv(fh)

    print(f"✅ Loaded from Drive: {len(df):,} rows, {len(df.columns)} columns")
    return df


def aggregate_to_signature(df, species_name):
    """
    Step 4: Aggregate embeddings to 256D signature
    """
    print("\n" + "="*70)
    print("STEP 4: AGGREGATING TO 256D SIGNATURE")
    print("="*70)

    # Extract bands
    band_names = [f'A{i:02d}' for i in range(64)]
    missing = [b for b in band_names if b not in df.columns]
    if missing:
        print(f"❌ Missing bands: {missing}")
        return None

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

    return signature_df


def upload_signature_to_drive(drive_service, signature_df, species_name):
    """
    Step 5: Upload signature CSV back to Google Drive
    """
    print("\n" + "="*70)
    print("STEP 5: UPLOADING SIGNATURE TO DRIVE")
    print("="*70)

    safe_name = species_name.replace(' ', '_').replace('/', '_')
    filename = f"{safe_name}_signature_256d.csv"
    folder_name = 'species_signatures'

    print(f"\n📤 Uploading: {filename}")
    print(f"   To: {folder_name}/")

    # Get/create folder
    folder_id = get_folder_id(drive_service, folder_name)

    # Convert DataFrame to CSV in memory
    csv_buffer = io.BytesIO()
    signature_df.to_csv(csv_buffer, index=False)
    csv_buffer.seek(0)

    # Check if file already exists
    query = f"name='{filename}' and '{folder_id}' in parents"
    results = drive_service.files().list(q=query, fields="files(id, name)").execute()
    items = results.get('files', [])

    file_metadata = {
        'name': filename,
        'parents': [folder_id]
    }

    media = MediaIoBaseUpload(
        csv_buffer,
        mimetype='text/csv',
        resumable=True
    )

    if items:
        # Update existing file
        file_id = items[0]['id']
        print(f"   Updating existing file...")
        file = drive_service.files().update(
            fileId=file_id,
            media_body=media
        ).execute()
    else:
        # Create new file
        print(f"   Creating new file...")
        file = drive_service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id'
        ).execute()

    print(f"✅ Uploaded to Drive: {folder_name}/{filename}")
    print(f"   File ID: {file.get('id')}")

    return True


def main():
    """Main complete pipeline"""
    parser = argparse.ArgumentParser(description='Complete year-matched GEE extraction pipeline (Drive only)')
    parser.add_argument('species', type=str, help='Species name (e.g., "Acer rubrum")')
    parser.add_argument('--max-samples', type=int, default=5000, help='Max samples to extract (default: 5000)')
    parser.add_argument('--check-interval', type=int, default=60, help='Seconds between GEE status checks (default: 60)')
    parser.add_argument('--parquet', type=str, default='Treekipedia_occ_Year_october24d.parquet', help='Parquet file path')

    args = parser.parse_args()

    print("="*70)
    print("COMPLETE PIPELINE - DRIVE ONLY (NO LOCAL STORAGE)")
    print("="*70)
    print(f"\nSpecies: {args.species}")
    print(f"Max samples: {args.max_samples:,}")
    print(f"Check interval: {args.check_interval}s")
    print("\n💡 This pipeline:")
    print("   1. Extracts embeddings from GEE → exports to Drive")
    print("   2. Auto-polls until GEE task completes")
    print("   3. Reads CSV from Drive (in memory)")
    print("   4. Aggregates locally")
    print("   5. Uploads signature back to Drive")
    print("   → No local file storage needed!")
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
        # Support both 'species' and 'species_scientific_name' columns
        species_col = 'species' if 'species' in df.columns else 'species_scientific_name'
        print(f"✅ Loaded: {len(df):,} occurrences, {df[species_col].nunique():,} species")
    except Exception as e:
        print(f"❌ Failed to load parquet: {e}")
        sys.exit(1)

    # STEP 1: Extract from GEE
    tasks = extract_year_matched_embeddings(df, args.species, args.max_samples)

    # STEP 2: Wait for GEE task to complete (auto-polling)
    success = wait_for_gee_task(args.species, args.check_interval)
    if not success:
        print("\n❌ GEE task failed or was cancelled")
        sys.exit(1)

    # STEP 3: Read CSV from Drive
    embeddings_df = read_csv_from_drive(drive_service, args.species)
    if embeddings_df is None:
        print("\n❌ Failed to read CSV from Drive")
        sys.exit(1)

    # STEP 4: Aggregate to signature
    signature_df = aggregate_to_signature(embeddings_df, args.species)
    if signature_df is None:
        print("❌ Aggregation failed")
        sys.exit(1)

    # STEP 5: Upload signature to Drive
    success = upload_signature_to_drive(drive_service, signature_df, args.species)
    if not success:
        print("❌ Upload failed")
        sys.exit(1)

    # Final summary
    print("\n" + "="*70)
    print("✅ COMPLETE PIPELINE SUCCESS!")
    print("="*70)
    print(f"\nResults saved to Google Drive:")
    print(f"   • Input: species_year_matched_embeddings/{args.species.replace(' ', '_')}_year_matched_embeddings_64d.csv")
    print(f"   • Output: species_signatures/{args.species.replace(' ', '_')}_signature_256d.csv")
    print(f"\n📊 Signature info:")
    print(f"   • Embeddings: {signature_df['total_embeddings'].iloc[0]:,}")
    print(f"   • Statistics: 256 (64 bands × 4 stats)")
    print(f"\n🎉 Ready for classification!")


if __name__ == "__main__":
    main()
