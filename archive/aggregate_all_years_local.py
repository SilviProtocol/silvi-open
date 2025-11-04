#!/usr/bin/env python3
"""
LOCAL AGGREGATION: All Years (2018-2024)

Combines all 7 yearly CSVs and computes 256-band signature locally.

Process:
1. Downloads all 7 yearly CSVs from Google Drive (2018-2024)
2. Concatenates them into one dataset (~34,000 samples)
3. Computes mean, std, p10, p90 for each of 64 bands
4. Creates 256-band signature (64 bands × 4 statistics)
5. Saves signature for upload to Google Drive

This is the recommended method for multi-year aggregation!
"""

import pandas as pd
import numpy as np
from pathlib import Path
import glob

def check_yearly_csvs():
    """
    Check which yearly CSV files are available.
    """
    print("\n" + "="*70)
    print("CHECKING YEARLY CSV FILES")
    print("="*70)

    years = [2018, 2019, 2020, 2021, 2022, 2023, 2024]
    found_files = []
    missing_files = []

    for year in years:
        filename = f"Quercus_coccifera_year_{year}_embeddings_64d.csv"
        filepath = Path(filename)

        if filepath.exists():
            size_mb = filepath.stat().st_size / (1024 * 1024)
            found_files.append((year, filename, size_mb))
            print(f"   ✅ {year}: {filename} ({size_mb:.2f} MB)")
        else:
            missing_files.append((year, filename))
            print(f"   ❌ {year}: {filename} - NOT FOUND")

    return found_files, missing_files


def download_instructions(missing_files):
    """
    Show instructions for downloading missing files.
    """
    if not missing_files:
        return

    print("\n" + "="*70)
    print("📥 DOWNLOAD MISSING FILES")
    print("="*70)
    print("\nMissing files:")
    for year, filename in missing_files:
        print(f"   • {filename}")

    print("\nTo download:")
    print("1. Go to: https://drive.google.com")
    print("2. Navigate to: species_yearly_embeddings/")
    print("3. Download the files listed above")
    print("4. Place them in: /Users/jeremicarose/Downloads/GEE/")
    print("\nPress Enter when ready, or Ctrl+C to exit...")
    input()


def load_and_validate_year(year, filename):
    """
    Load a yearly CSV and validate it.
    """
    print(f"\n   Loading {year}...")

    try:
        df = pd.read_csv(filename)

        # Check for required columns
        band_cols = [f'A{i:02d}' for i in range(64)]
        missing_bands = [b for b in band_cols if b not in df.columns]

        if missing_bands:
            print(f"      ⚠️  Missing bands: {missing_bands}")
            return None

        # Count valid samples (non-null A00)
        valid_count = df['A00'].notna().sum()
        null_count = df['A00'].isna().sum()

        print(f"      ✅ {len(df):,} rows ({valid_count:,} valid, {null_count:,} null)")

        # Add year column if not present
        if 'year' not in df.columns:
            df['year'] = year

        return df

    except Exception as e:
        print(f"      ❌ Error loading {filename}: {e}")
        return None


def concatenate_years(found_files):
    """
    Load and concatenate all yearly CSVs.
    """
    print("\n" + "="*70)
    print("LOADING AND CONCATENATING YEARLY DATA")
    print("="*70)

    dfs = []
    total_samples = 0

    for year, filename, _ in found_files:
        df = load_and_validate_year(year, filename)

        if df is not None:
            dfs.append(df)
            total_samples += len(df)

    if not dfs:
        print("\n❌ No valid data loaded!")
        return None

    print(f"\n   🔄 Concatenating {len(dfs)} yearly datasets...")
    combined_df = pd.concat(dfs, ignore_index=True)

    print(f"\n✅ Combined dataset:")
    print(f"   • Total rows: {len(combined_df):,}")
    print(f"   • Years covered: {sorted(combined_df['year'].unique())}")
    print(f"   • Columns: {len(combined_df.columns)}")

    return combined_df


def compute_signature_all_years(combined_df, species_name="Quercus coccifera"):
    """
    Compute 256-band signature from all years combined.
    """
    print("\n" + "="*70)
    print("COMPUTING 256-BAND SIGNATURE (ALL YEARS)")
    print("="*70)

    # Extract band columns (A00 to A63)
    band_cols = [f'A{i:02d}' for i in range(64)]

    print(f"\n🔢 Computing statistics for 64 bands...")
    print(f"   Using {len(combined_df):,} total samples")

    # Extract band data
    band_data = combined_df[band_cols]

    # Check for NaN values
    nan_count = band_data.isna().sum().sum()
    if nan_count > 0:
        print(f"   ⚠️  Found {nan_count:,} NaN values (will be ignored)")
        # Drop rows with any NaN
        pre_drop = len(band_data)
        band_data = band_data.dropna()
        combined_df = combined_df.loc[band_data.index]
        print(f"   → Dropped {pre_drop - len(band_data):,} rows with NaN")
        print(f"   → Remaining: {len(band_data):,} samples")

    # Compute statistics (ignoring NaNs)
    print(f"\n   Computing statistics...")
    print(f"      → Mean...")
    means = band_data.mean(axis=0)

    print(f"      → Standard deviation...")
    stds = band_data.std(axis=0)

    print(f"      → 10th percentile...")
    p10s = band_data.quantile(0.10, axis=0)

    print(f"      → 90th percentile...")
    p90s = band_data.quantile(0.90, axis=0)

    # Build signature dictionary
    signature = {
        'species': species_name,
        'years': '2018-2024',
        'num_years': len(combined_df['year'].unique()),
        'total_samples': len(combined_df),
        'computation_method': 'local_pandas_multiyear',
    }

    # Add statistics
    for i, band in enumerate(band_cols):
        signature[f'mean_{band}'] = means[i]
        signature[f'std_{band}'] = stds[i]
        signature[f'p10_{band}'] = p10s[i]
        signature[f'p90_{band}'] = p90s[i]

    print(f"\n✅ Computed: {len(signature) - 5} statistics (64 bands × 4 stats = 256)")

    # Create DataFrame
    signature_df = pd.DataFrame([signature])

    # Sample statistics for validation
    print(f"\n📊 Sample statistics (A00):")
    print(f"   Mean:  {signature['mean_A00']:.6f}")
    print(f"   Std:   {signature['std_A00']:.6f}")
    print(f"   P10:   {signature['p10_A00']:.6f}")
    print(f"   P90:   {signature['p90_A00']:.6f}")

    # Per-year breakdown
    print(f"\n📅 Samples per year:")
    year_counts = combined_df['year'].value_counts().sort_index()
    for year, count in year_counts.items():
        print(f"   • {year}: {count:,} samples")

    return signature_df


def save_signature(signature_df, species_name="Quercus coccifera"):
    """
    Save signature to local CSV for manual upload to Google Drive.
    """
    print(f"\n💾 Saving signature...")

    safe_name = species_name.replace(' ', '_').replace('/', '_')
    output_filename = f"{safe_name}_2018-2024_signature_256d_LOCAL.csv"
    output_path = f"/Users/jeremicarose/Downloads/GEE/{output_filename}"

    signature_df.to_csv(output_path, index=False)

    print(f"✅ Saved: {output_path}")
    print(f"   Shape: {signature_df.shape} (1 row × {len(signature_df.columns)} columns)")

    print(f"\n📤 UPLOAD TO GOOGLE DRIVE:")
    print("="*70)
    print("1. Go to: https://drive.google.com")
    print("2. Navigate to folder: species_signatures/")
    print("3. Upload this file:")
    print(f"   {output_filename}")
    print("4. Done!")

    return output_path


def run_all_years_aggregation():
    """
    Main workflow for all-years aggregation.
    """
    print("="*70)
    print("LOCAL AGGREGATION: ALL YEARS (2018-2024)")
    print("="*70)
    print("\nThis script:")
    print("  1. Loads all 7 yearly CSVs (2018-2024)")
    print("  2. Combines them into one dataset (~34,000 samples)")
    print("  3. Computes 256-band signature locally (pandas/numpy)")
    print("  4. Saves signature CSV for upload to Google Drive")
    print("\n" + "="*70)

    # Check which files are available
    found_files, missing_files = check_yearly_csvs()

    if missing_files:
        print(f"\n⚠️  Missing {len(missing_files)} file(s)")
        download_instructions(missing_files)

        # Recheck after user has downloaded
        found_files, missing_files = check_yearly_csvs()

        if missing_files:
            print(f"\n❌ Still missing {len(missing_files)} file(s). Exiting.")
            return

    # Load and concatenate
    combined_df = concatenate_years(found_files)

    if combined_df is None:
        print("\n❌ Failed to load data. Exiting.")
        return

    # Compute signature
    signature_df = compute_signature_all_years(combined_df)

    if signature_df is None:
        print("\n❌ Failed to compute signature. Exiting.")
        return

    # Save
    output_path = save_signature(signature_df)

    print("\n" + "="*70)
    print("✅ ALL-YEARS AGGREGATION COMPLETE!")
    print("="*70)
    print(f"\nOutput file: {Path(output_path).name}")
    print(f"Location: {output_path}")
    print(f"\n📊 Summary:")
    print(f"   • Years: 2018-2024 (7 years)")
    print(f"   • Total samples: {signature_df['total_samples'].iloc[0]:,}")
    print(f"   • Statistics computed: 256 (64 bands × 4 stats)")
    print(f"   • Computation method: Local (pandas/numpy)")
    print(f"\nThis signature represents the complete temporal profile!")
    print(f"\nNext steps:")
    print(f"   1. Upload {Path(output_path).name} to Google Drive/species_signatures/")
    print(f"   2. Use for species classification/analysis")
    print(f"   3. Repeat for other species!")


if __name__ == "__main__":
    run_all_years_aggregation()
