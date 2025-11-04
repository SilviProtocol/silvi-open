#!/usr/bin/env python3
"""
AGGREGATE FROM GOOGLE DRIVE (NO LOCAL DOWNLOADS)

Reads CSV from Google Drive, aggregates locally, uploads signature back to Drive.
No local file storage needed.

Usage:
    python aggregate_from_drive.py "Acer rubrum"
"""

import pandas as pd
import numpy as np
import sys
import io
from pathlib import Path

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
    print("⚠️  Google Drive API not installed")


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
    """Read CSV from Google Drive directly into memory"""

    safe_name = species_name.replace(' ', '_').replace('/', '_')
    filename = f"{safe_name}_year_matched_embeddings_64d.csv"
    folder_name = 'species_year_matched_embeddings'

    print(f"\n📥 Reading from Google Drive (in memory)...")
    print(f"   Folder: {folder_name}/")
    print(f"   File: {filename}")

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
        print("\n💡 Check GEE task status at: https://code.earthengine.google.com/tasks")
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
    """Aggregate embeddings to 256D signature"""

    print("\n" + "="*70)
    print("AGGREGATING TO 256D SIGNATURE")
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
    """Upload signature CSV back to Google Drive"""

    safe_name = species_name.replace(' ', '_').replace('/', '_')
    filename = f"{safe_name}_signature_256d.csv"
    folder_name = 'species_signatures'

    print(f"\n📤 Uploading signature to Google Drive...")
    print(f"   Folder: {folder_name}/")
    print(f"   File: {filename}")

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
    """Main execution"""
    if len(sys.argv) < 2:
        print("Usage: python aggregate_from_drive.py <species_name>")
        print("\nExample:")
        print("  python aggregate_from_drive.py 'Acer rubrum'")
        sys.exit(1)

    species_name = sys.argv[1]

    print("="*70)
    print("AGGREGATE FROM GOOGLE DRIVE (NO LOCAL STORAGE)")
    print("="*70)
    print(f"\nSpecies: {species_name}")
    print("\n💡 This approach:")
    print("   • Reads CSV from Google Drive (in memory)")
    print("   • Aggregates locally")
    print("   • Uploads signature back to Drive")
    print("   • No local file storage needed")

    # Initialize Drive API
    if not DRIVE_API_AVAILABLE:
        print("\n❌ Google Drive API not installed!")
        print("\nInstall with:")
        print("  pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client")
        sys.exit(1)

    drive_service = initialize_drive()
    if not drive_service:
        print("❌ Failed to initialize Drive API")
        sys.exit(1)

    # Read CSV from Drive
    df = read_csv_from_drive(drive_service, species_name)
    if df is None:
        print("\n❌ Failed to read CSV from Drive")
        print("\n💡 Make sure the GEE task has completed:")
        print("   Visit: https://code.earthengine.google.com/tasks")
        sys.exit(1)

    # Aggregate
    signature_df = aggregate_to_signature(df, species_name)
    if signature_df is None:
        print("❌ Aggregation failed")
        sys.exit(1)

    # Upload back to Drive
    success = upload_signature_to_drive(drive_service, signature_df, species_name)
    if not success:
        print("❌ Upload failed")
        sys.exit(1)

    print("\n" + "="*70)
    print("✅ COMPLETE!")
    print("="*70)
    print(f"\nResults saved to Google Drive:")
    print(f"   • Input: species_year_matched_embeddings/{species_name.replace(' ', '_')}_year_matched_embeddings_64d.csv")
    print(f"   • Output: species_signatures/{species_name.replace(' ', '_')}_signature_256d.csv")
    print(f"\n📊 Signature info:")
    print(f"   • Embeddings: {signature_df['total_embeddings'].iloc[0]:,}")
    print(f"   • Statistics: 256 (64 bands × 4 stats)")
    print(f"\n🎉 Ready for classification!")


if __name__ == "__main__":
    main()
