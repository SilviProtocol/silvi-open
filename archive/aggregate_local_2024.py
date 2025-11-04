#!/usr/bin/env python3
"""
LOCAL AGGREGATION: Compute 256-band signature from exported 2024 CSV

Process:
1. Downloads 2024 yearly CSV from Google Drive
2. Computes mean, std, p10, p90 for each of 64 bands locally (using pandas/numpy)
3. Creates 256-band signature (64 bands × 4 statistics)
4. Uploads signature back to Google Drive

This demonstrates local computation vs GEE server-side computation.
"""

import pandas as pd
import numpy as np
from pathlib import Path
import os

def download_from_drive_manual():
    """
    Instructions for manually downloading the CSV from Google Drive.
    """
    print("\n📥 STEP 1: Download the 2024 CSV from Google Drive")
    print("="*70)
    print("1. Go to: https://drive.google.com")
    print("2. Navigate to: species_yearly_embeddings/")
    print("3. Download: Quercus_coccifera_year_2024_embeddings_64d.csv")
    print("4. Place it in this directory: /Users/jeremicarose/Downloads/GEE/")
    print("5. Press Enter when ready...")
    input()


def compute_signature_local(csv_path, species_name="Quercus coccifera"):
    """
    Compute 256-band signature from yearly embedding CSV.

    Parameters:
    -----------
    csv_path : str
        Path to the yearly CSV file
    species_name : str
        Name of the species

    Returns:
    --------
    DataFrame with 1 row and 260 columns (4 metadata + 256 statistics)
    """

    print("\n" + "="*70)
    print("LOCAL AGGREGATION: Computing 256-band signature")
    print("="*70)

    # Load the yearly CSV
    print(f"\n📂 Loading CSV: {csv_path}")
    df = pd.read_csv(csv_path)

    print(f"✅ Loaded: {len(df):,} rows × {len(df.columns)} columns")
    print(f"   First few columns: {df.columns.tolist()[:5]}...")

    # Extract band columns (A00 to A63)
    band_cols = [f'A{i:02d}' for i in range(64)]

    # Check if all bands are present
    missing_bands = [b for b in band_cols if b not in df.columns]
    if missing_bands:
        print(f"❌ Missing bands: {missing_bands}")
        print(f"   Available columns: {df.columns.tolist()}")
        return None

    print(f"\n🔢 Computing statistics for 64 bands...")
    print(f"   Using {len(df):,} samples")

    # Extract band data
    band_data = df[band_cols]

    # Check for NaN values
    nan_count = band_data.isna().sum().sum()
    if nan_count > 0:
        print(f"   ⚠️  Found {nan_count} NaN values (will be ignored)")

    # Compute statistics (ignoring NaNs)
    print(f"   Computing mean...")
    means = band_data.mean(axis=0)

    print(f"   Computing std...")
    stds = band_data.std(axis=0)

    print(f"   Computing 10th percentile...")
    p10s = band_data.quantile(0.10, axis=0)

    print(f"   Computing 90th percentile...")
    p90s = band_data.quantile(0.90, axis=0)

    # Build signature dictionary
    signature = {
        'species': species_name,
        'year': 2024,
        'total_samples': len(df),
        'computation_method': 'local_pandas',
    }

    # Add statistics
    for i, band in enumerate(band_cols):
        signature[f'mean_{band}'] = means[i]
        signature[f'std_{band}'] = stds[i]
        signature[f'p10_{band}'] = p10s[i]
        signature[f'p90_{band}'] = p90s[i]

    print(f"\n✅ Computed: {len(signature) - 4} statistics (64 bands × 4 stats = 256)")

    # Create DataFrame
    signature_df = pd.DataFrame([signature])

    # Sample statistics for validation
    print(f"\n📊 Sample statistics (A00):")
    print(f"   Mean:  {signature['mean_A00']:.6f}")
    print(f"   Std:   {signature['std_A00']:.6f}")
    print(f"   P10:   {signature['p10_A00']:.6f}")
    print(f"   P90:   {signature['p90_A00']:.6f}")

    # Check for any NaN in output
    nan_cols = signature_df.columns[signature_df.isna().any()].tolist()
    if nan_cols:
        print(f"\n   ⚠️  Warning: NaN values in: {nan_cols}")

    return signature_df


def save_signature(signature_df, output_filename):
    """
    Save signature to local CSV for manual upload to Google Drive.
    """
    print(f"\n💾 Saving signature locally...")

    output_path = f"/Users/jeremicarose/Downloads/GEE/{output_filename}"
    signature_df.to_csv(output_path, index=False)

    print(f"✅ Saved: {output_path}")
    print(f"   Shape: {signature_df.shape} (1 row × {len(signature_df.columns)} columns)")

    print(f"\n📤 STEP 3: Upload signature to Google Drive")
    print("="*70)
    print("1. Go to: https://drive.google.com")
    print("2. Navigate to folder: species_signatures/")
    print("3. Upload this file:")
    print(f"   {output_path}")
    print("4. Done!")

    return output_path


def run_local_aggregation():
    """
    Main workflow for local aggregation.
    """
    print("="*70)
    print("LOCAL AGGREGATION WORKFLOW - YEAR 2024")
    print("="*70)
    print("\nThis script:")
    print("  1. Reads the 2024 yearly CSV from Google Drive")
    print("  2. Computes 256-band signature locally (pandas/numpy)")
    print("  3. Saves signature CSV for upload to Google Drive")
    print("\n" + "="*70)

    # CSV file name
    csv_filename = "Quercus_coccifera_year_2024_embeddings_64d.csv"
    csv_path = f"/Users/jeremicarose/Downloads/GEE/{csv_filename}"

    # Check if CSV exists
    if not Path(csv_path).exists():
        print(f"\n❌ File not found: {csv_path}")
        download_from_drive_manual()

        # Check again
        if not Path(csv_path).exists():
            print(f"\n❌ Still not found. Please download the file and run again.")
            return

    # Compute signature
    print(f"\n🔄 STEP 2: Computing signature locally...")
    print("="*70)

    signature_df = compute_signature_local(csv_path, species_name="Quercus coccifera")

    if signature_df is None:
        print("\n❌ Failed to compute signature")
        return

    # Save signature
    output_filename = "Quercus_coccifera_2024_signature_256d_LOCAL.csv"
    output_path = save_signature(signature_df, output_filename)

    print("\n" + "="*70)
    print("✅ LOCAL AGGREGATION COMPLETE!")
    print("="*70)
    print(f"\nOutput file: {output_filename}")
    print(f"Location: {output_path}")
    print(f"\n📊 Summary:")
    print(f"   • Input samples: {signature_df['total_samples'].iloc[0]:,}")
    print(f"   • Statistics computed: 256 (64 bands × 4 stats)")
    print(f"   • Computation method: Local (pandas/numpy)")
    print(f"\nNext steps:")
    print(f"   1. Upload {output_filename} to Google Drive/species_signatures/")
    print(f"   2. Run aggregate_gee_2024.py for GEE-based aggregation")
    print(f"   3. Compare both signatures!")


if __name__ == "__main__":
    run_local_aggregation()
