#!/usr/bin/env python3
"""
Create 64D centroids (mean only) from existing embeddings on Drive
Centroid approach: Just compute mean of 64 bands, no std/p10/p90
"""

import pandas as pd
import numpy as np
import io
from pathlib import Path
import pickle

# Google Drive API
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload, MediaIoBaseUpload


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
                print("❌ credentials.json not found!")
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
        file_metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        folder = drive_service.files().create(body=file_metadata, fields='id').execute()
        return folder.get('id')

    return items[0]['id']


def read_embeddings_from_drive(drive_service, species_name):
    """Read 64D embeddings CSV from Drive"""
    safe_name = species_name.replace(' ', '_').replace('/', '_')
    filename = f"{safe_name}_year_matched_embeddings_64d.csv"
    folder_name = 'species_year_matched_embeddings'

    print(f"\n📥 Reading: {filename}")

    folder_id = get_folder_id(drive_service, folder_name)
    if not folder_id:
        return None

    query = f"name='{filename}' and '{folder_id}' in parents"
    results = drive_service.files().list(q=query, fields="files(id, name)").execute()
    items = results.get('files', [])

    if not items:
        print(f"❌ File not found: {filename}")
        return None

    file_id = items[0]['id']

    request = drive_service.files().get_media(fileId=file_id)
    fh = io.BytesIO()
    downloader = MediaIoBaseDownload(fh, request)

    done = False
    while not done:
        status, done = downloader.next_chunk()

    fh.seek(0)
    df = pd.read_csv(fh)

    print(f"✅ Loaded: {len(df):,} embeddings")
    return df


def compute_64d_centroid(df, species_name):
    """Compute 64D centroid (mean only)"""
    print(f"\n🔢 Computing 64D centroid for: {species_name}")

    band_names = [f'A{i:02d}' for i in range(64)]

    embedding_matrix = df[band_names].values
    valid_mask = ~np.isnan(embedding_matrix).any(axis=1)
    embedding_matrix_clean = embedding_matrix[valid_mask]

    print(f"   Valid embeddings: {len(embedding_matrix_clean):,}")

    # Compute mean (centroid) for each band
    centroid = {
        'species': species_name,
        'total_occurrences': len(df)
    }

    for i, band in enumerate(band_names):
        centroid[f'mean_{band}'] = np.mean(embedding_matrix_clean[:, i])

    centroid_df = pd.DataFrame([centroid])

    print(f"✅ 64D centroid computed")
    print(f"   Sample (A00): {centroid['mean_A00']:.6f}")

    return centroid_df


def upload_centroid_to_drive(drive_service, centroid_df, species_name):
    """Upload 64D centroid to Drive"""
    safe_name = species_name.replace(' ', '_').replace('/', '_')
    filename = f"{safe_name}_centroid_64d.csv"
    folder_name = 'species_signatures'

    print(f"\n📤 Uploading: {filename}")

    folder_id = get_folder_id(drive_service, folder_name)

    csv_buffer = io.BytesIO()
    centroid_df.to_csv(csv_buffer, index=False)
    csv_buffer.seek(0)

    query = f"name='{filename}' and '{folder_id}' in parents"
    results = drive_service.files().list(q=query, fields="files(id, name)").execute()
    items = results.get('files', [])

    file_metadata = {
        'name': filename,
        'parents': [folder_id]
    }

    media = MediaIoBaseUpload(csv_buffer, mimetype='text/csv', resumable=True)

    if items:
        file_id = items[0]['id']
        print(f"   Updating existing file...")
        file = drive_service.files().update(fileId=file_id, media_body=media).execute()
    else:
        print(f"   Creating new file...")
        file = drive_service.files().create(body=file_metadata, media_body=media, fields='id').execute()

    print(f"✅ Uploaded: species_signatures/{filename}")
    return True


def main():
    """Process all 10 species"""
    species_list = [
        "Quercus alba",
        "Prunus serotina",
        "Liquidambar styraciflua",
        "Ulmus americana",
        "Pinus taeda",
        "Nyssa sylvatica",
        "Quercus stellata",
        "Fraxinus pennsylvanica",
        "Juniperus virginiana",
        "Quercus nigra"
    ]

    print("="*70)
    print("CREATE 64D CENTROIDS (MEAN ONLY) FOR 10 SPECIES")
    print("="*70)
    print("\n💡 Centroid approach: Using only mean of 64 bands (not std/p10/p90)")

    drive_service = initialize_drive()
    if not drive_service:
        print("❌ Failed to initialize Drive")
        return

    for i, species in enumerate(species_list, 1):
        print(f"\n{'='*70}")
        print(f"SPECIES {i}/5: {species}")
        print(f"{'='*70}")

        # Read embeddings
        df = read_embeddings_from_drive(drive_service, species)
        if df is None:
            print(f"⚠️ Skipping {species} - embeddings not found")
            continue

        # Compute centroid
        centroid_df = compute_64d_centroid(df, species)

        # Upload to Drive
        upload_centroid_to_drive(drive_service, centroid_df, species)

    print(f"\n{'='*70}")
    print("✅ ALL 10 SPECIES COMPLETED!")
    print("="*70)
    print("\n📁 Output folder: species_signatures/")
    print("   Format: {species}_centroid_64d.csv")
    print("\n📊 Each file contains:")
    print("   • species: species name")
    print("   • total_occurrences: number of embeddings")
    print("   • mean_A00 to mean_A63: 64D centroid")


if __name__ == "__main__":
    main()
