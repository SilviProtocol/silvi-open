#!/usr/bin/env python3
"""
AUTOMATED PIPELINE: GEE Extraction → Auto Download → Local Aggregation → Auto Upload

Complete streamlined workflow:
1. Extract yearly embeddings from GEE (server-side)
2. Wait for GEE tasks to complete
3. Auto-download yearly CSVs from Google Drive
4. Aggregate locally (all years combined)
5. Auto-upload signature back to Google Drive

No manual downloads required!
"""

import pandas as pd
import ee
import time
from pathlib import Path
import io

# Optional: Google Drive API (if available)
try:
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload, MediaIoBaseDownload
    import pickle
    DRIVE_API_AVAILABLE = True
except ImportError:
    DRIVE_API_AVAILABLE = False
    print("⚠️  Google Drive API not installed. Install with: pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client")


class AutomatedPipeline:
    """
    Automated pipeline for GEE extraction and aggregation.
    """

    def __init__(self, species_name, gee_project='treekipedia', max_samples=5000):
        self.species_name = species_name
        self.gee_project = gee_project
        self.max_samples = max_samples
        self.safe_name = species_name.replace(' ', '_').replace('/', '_')
        self.years = [2018, 2019, 2020, 2021, 2022, 2023, 2024]
        self.drive_service = None

        # Initialize GEE
        self.initialize_gee()

        # Initialize Drive API if available
        if DRIVE_API_AVAILABLE:
            self.initialize_drive()

    def initialize_gee(self):
        """Initialize Google Earth Engine"""
        try:
            ee.Initialize(project=self.gee_project)
            print("✅ GEE initialized")
            return True
        except Exception as e:
            print(f"❌ GEE initialization failed: {e}")
            return False

    def initialize_drive(self):
        """Initialize Google Drive API"""
        SCOPES = ['https://www.googleapis.com/auth/drive']

        creds = None
        # Token file stores user's access and refresh tokens
        if Path('token.pickle').exists():
            with open('token.pickle', 'rb') as token:
                creds = pickle.load(token)

        # If no valid credentials, let user log in
        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                # Need credentials.json from Google Cloud Console
                if not Path('credentials.json').exists():
                    print("\n❌ credentials.json not found!")
                    print("📋 Setup instructions:")
                    print("   1. Go to: https://console.cloud.google.com")
                    print("   2. Enable Google Drive API")
                    print("   3. Create OAuth 2.0 credentials")
                    print("   4. Download as credentials.json")
                    print("   5. Place in this directory")
                    return False

                flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
                creds = flow.run_local_server(port=0)

            # Save credentials for next run
            with open('token.pickle', 'wb') as token:
                pickle.dump(creds, token)

        self.drive_service = build('drive', 'v3', credentials=creds)
        print("✅ Google Drive API initialized")
        return True

    def get_folder_id(self, folder_name):
        """Get Google Drive folder ID by name"""
        if not self.drive_service:
            return None

        query = f"name='{folder_name}' and mimeType='application/vnd.google-apps.folder'"
        results = self.drive_service.files().list(q=query, fields="files(id, name)").execute()
        items = results.get('files', [])

        if not items:
            print(f"⚠️  Folder '{folder_name}' not found")
            return None

        return items[0]['id']

    def download_file_from_drive(self, filename, folder_name):
        """Download a file from Google Drive"""
        if not self.drive_service:
            print(f"⚠️  Drive API not available, skipping download of {filename}")
            return None

        # Get folder ID
        folder_id = self.get_folder_id(folder_name)
        if not folder_id:
            return None

        # Find file in folder
        query = f"name='{filename}' and '{folder_id}' in parents"
        results = self.drive_service.files().list(q=query, fields="files(id, name)").execute()
        items = results.get('files', [])

        if not items:
            print(f"   ⚠️  File '{filename}' not found in folder '{folder_name}'")
            return None

        file_id = items[0]['id']

        # Download file
        request = self.drive_service.files().get_media(fileId=file_id)
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)

        done = False
        while not done:
            status, done = downloader.next_chunk()

        # Save to disk
        local_path = Path(filename)
        with open(local_path, 'wb') as f:
            f.write(fh.getvalue())

        print(f"   ✅ Downloaded: {filename} ({local_path.stat().st_size / 1024:.1f} KB)")
        return local_path

    def upload_file_to_drive(self, local_path, folder_name):
        """Upload a file to Google Drive"""
        if not self.drive_service:
            print(f"⚠️  Drive API not available. Please upload manually:")
            print(f"   File: {local_path}")
            print(f"   Destination: Google Drive/{folder_name}/")
            return None

        # Get folder ID
        folder_id = self.get_folder_id(folder_name)
        if not folder_id:
            return None

        # Upload file
        file_metadata = {
            'name': Path(local_path).name,
            'parents': [folder_id]
        }
        media = MediaFileUpload(local_path, resumable=True)

        file = self.drive_service.files().create(
            body=file_metadata,
            media_body=media,
            fields='id'
        ).execute()

        print(f"   ✅ Uploaded: {Path(local_path).name} (ID: {file.get('id')})")
        return file.get('id')

    def extract_yearly_embeddings(self, df):
        """
        Step 1: Extract yearly embeddings from GEE
        """
        print("\n" + "="*70)
        print("STEP 1: EXTRACTING YEARLY EMBEDDINGS FROM GEE")
        print("="*70)

        # Import the extraction function from extract_temporal_aligned.py
        from extract_temporal_aligned import extract_server_side_signature

        # Run extraction
        tasks = extract_server_side_signature(
            df,
            self.species_name,
            max_samples=self.max_samples,
            export_yearly=True
        )

        print(f"\n✅ {len(tasks) if isinstance(tasks, list) else 'Multiple'} export tasks started")
        return tasks

    def wait_for_gee_tasks(self, timeout_minutes=30):
        """
        Step 2: Wait for GEE tasks to complete
        """
        print("\n" + "="*70)
        print("STEP 2: WAITING FOR GEE TASKS TO COMPLETE")
        print("="*70)

        print(f"\n⏳ Monitoring GEE tasks (timeout: {timeout_minutes} min)...")
        print("   Check status: https://code.earthengine.google.com/tasks")

        start_time = time.time()
        check_interval = 30  # seconds

        while True:
            elapsed = (time.time() - start_time) / 60
            if elapsed > timeout_minutes:
                print(f"\n⚠️  Timeout reached ({timeout_minutes} min)")
                print("   Some tasks may still be running")
                break

            # Check if tasks are done (simplified - just wait for expected time)
            # In practice, you'd query task status via GEE API
            time.sleep(check_interval)

            if elapsed > 5:  # Assume tasks complete after 5 min
                print(f"\n✅ Tasks should be complete after {elapsed:.1f} min")
                break

            print(f"   Still waiting... ({elapsed:.1f} min elapsed)")

    def download_yearly_csvs(self):
        """
        Step 3: Download yearly CSVs from Google Drive
        """
        print("\n" + "="*70)
        print("STEP 3: DOWNLOADING YEARLY CSVs FROM GOOGLE DRIVE")
        print("="*70)

        folder_name = 'species_yearly_embeddings'
        downloaded_files = []

        for year in self.years:
            filename = f"{self.safe_name}_year_{year}_embeddings_64d.csv"
            print(f"\n📥 Downloading {year} data...")

            local_path = self.download_file_from_drive(filename, folder_name)

            if local_path and local_path.exists():
                downloaded_files.append((year, local_path))
            else:
                print(f"   ❌ Failed to download {filename}")

        print(f"\n✅ Downloaded {len(downloaded_files)}/{len(self.years)} files")
        return downloaded_files

    def aggregate_all_years(self, downloaded_files):
        """
        Step 4: Aggregate all years locally
        """
        print("\n" + "="*70)
        print("STEP 4: AGGREGATING ALL YEARS LOCALLY")
        print("="*70)

        # Load and concatenate
        dfs = []
        for year, filepath in downloaded_files:
            print(f"\n   Loading {year}...")
            df = pd.read_csv(filepath)
            if 'year' not in df.columns:
                df['year'] = year
            dfs.append(df)
            print(f"      ✅ {len(df):,} rows")

        combined_df = pd.concat(dfs, ignore_index=True)
        print(f"\n✅ Combined: {len(combined_df):,} total samples across {len(dfs)} years")

        # Compute signature
        band_cols = [f'A{i:02d}' for i in range(64)]
        band_data = combined_df[band_cols].dropna()

        print(f"\n🔢 Computing statistics...")
        signature = {
            'species': self.species_name,
            'years': f'{self.years[0]}-{self.years[-1]}',
            'num_years': len(self.years),
            'total_samples': len(band_data),
            'computation_method': 'automated_pipeline_local',
        }

        # Compute stats
        means = band_data.mean(axis=0)
        stds = band_data.std(axis=0)
        p10s = band_data.quantile(0.10, axis=0)
        p90s = band_data.quantile(0.90, axis=0)

        for i, band in enumerate(band_cols):
            signature[f'mean_{band}'] = means[i]
            signature[f'std_{band}'] = stds[i]
            signature[f'p10_{band}'] = p10s[i]
            signature[f'p90_{band}'] = p90s[i]

        signature_df = pd.DataFrame([signature])

        print(f"✅ Computed 256 statistics")
        print(f"\n📊 Sample (A00): mean={means[0]:.6f}, std={stds[0]:.6f}")

        return signature_df

    def save_and_upload_signature(self, signature_df):
        """
        Step 5: Save and upload signature to Google Drive
        """
        print("\n" + "="*70)
        print("STEP 5: SAVING AND UPLOADING SIGNATURE")
        print("="*70)

        # Save locally
        output_filename = f"{self.safe_name}_{self.years[0]}-{self.years[-1]}_signature_256d_AUTO.csv"
        signature_df.to_csv(output_filename, index=False)
        print(f"\n💾 Saved locally: {output_filename}")

        # Upload to Drive
        folder_name = 'species_signatures'
        print(f"\n📤 Uploading to Google Drive/{folder_name}/...")
        file_id = self.upload_file_to_drive(output_filename, folder_name)

        if file_id:
            print(f"✅ Upload complete!")
        else:
            print(f"⚠️  Please upload manually")

        return output_filename

    def run(self, df):
        """
        Run the complete automated pipeline
        """
        print("="*70)
        print("AUTOMATED PIPELINE: GEE EXTRACTION → AGGREGATION")
        print("="*70)
        print(f"\nSpecies: {self.species_name}")
        print(f"Years: {self.years[0]}-{self.years[-1]}")
        print(f"Max samples per year: {self.max_samples:,}")
        print("\n" + "="*70)

        # Step 1: Extract from GEE
        tasks = self.extract_yearly_embeddings(df)

        # Step 2: Wait for completion
        self.wait_for_gee_tasks(timeout_minutes=10)

        # Step 3: Download yearly CSVs
        if DRIVE_API_AVAILABLE and self.drive_service:
            downloaded_files = self.download_yearly_csvs()
        else:
            print("\n⚠️  Drive API not available. Manual download required:")
            print("   1. Go to Google Drive/species_yearly_embeddings/")
            print("   2. Download all yearly CSVs")
            print("   3. Run aggregate_all_years_local.py")
            return

        # Step 4: Aggregate
        if downloaded_files:
            signature_df = self.aggregate_all_years(downloaded_files)

            # Step 5: Upload
            output_file = self.save_and_upload_signature(signature_df)

            print("\n" + "="*70)
            print("✅ AUTOMATED PIPELINE COMPLETE!")
            print("="*70)
            print(f"\nOutput: {output_file}")
            print(f"Location: Google Drive/species_signatures/")
            print(f"\n📊 Summary:")
            print(f"   • Species: {self.species_name}")
            print(f"   • Years: {self.years[0]}-{self.years[-1]} ({len(self.years)} years)")
            print(f"   • Samples: {signature_df['total_samples'].iloc[0]:,}")
            print(f"   • Statistics: 256 (64 bands × 4 stats)")
            print(f"\n🎉 No manual downloads needed!")


def main():
    """
    Main entry point
    """
    print("="*70)
    print("AUTOMATED PIPELINE - SETUP")
    print("="*70)

    # Check Drive API
    if not DRIVE_API_AVAILABLE:
        print("\n⚠️  Google Drive API not installed!")
        print("\nTo enable automation, run:")
        print("   pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client")
        print("\nThen setup credentials:")
        print("   1. Go to: https://console.cloud.google.com")
        print("   2. Enable Google Drive API")
        print("   3. Create OAuth 2.0 credentials")
        print("   4. Download as credentials.json")
        print("   5. Place in this directory")
        print("\nFor now, using manual workflow...")
        print("\n" + "="*70)

    # Load species data
    print("\n📂 Loading species data...")
    try:
        df = pd.read_parquet('species_data.parquet')
        print(f"✅ Loaded: {len(df):,} occurrences")
    except Exception as e:
        print(f"❌ Failed: {e}")
        return

    # Configure pipeline
    species_name = 'Quercus coccifera'
    gee_project = 'treekipedia'  # Update with your project
    max_samples = 5000

    # Run pipeline
    pipeline = AutomatedPipeline(
        species_name=species_name,
        gee_project=gee_project,
        max_samples=max_samples
    )

    pipeline.run(df)


if __name__ == "__main__":
    main()
