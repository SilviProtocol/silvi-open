#!/usr/bin/env python3
"""
STEP 2: AGGREGATE YEAR-MATCHED EMBEDDINGS TO 256D SIGNATURE

Takes the year-matched 64D embeddings CSV from GEE and computes:
- Mean, Std, P10, P90 for each of the 64 bands
- Resulting in 256D signature (64 bands × 4 stats)

Usage:
    python aggregate_signature.py Acer_rubrum_year_matched_embeddings_64d.csv
"""

import pandas as pd
import numpy as np
import sys
from pathlib import Path

def aggregate_to_signature(input_csv, output_csv=None):
    """
    Aggregate year-matched embeddings to create 256D signature.

    Parameters:
    -----------
    input_csv : str
        Path to year-matched embeddings CSV (64D per occurrence)
    output_csv : str, optional
        Output path for signature CSV. If None, auto-generated.

    Returns:
    --------
    pd.DataFrame : Signature with 256 values + metadata
    """

    print("="*70)
    print("AGGREGATING YEAR-MATCHED EMBEDDINGS TO 256D SIGNATURE")
    print("="*70)

    # Load data
    print(f"\n📂 Loading: {input_csv}")
    df = pd.read_csv(input_csv)

    print(f"✅ Loaded: {len(df):,} rows")
    print(f"📋 Columns: {df.columns.tolist()[:10]}... ({len(df.columns)} total)")

    # Extract embedding bands (A00-A63)
    band_names = [f'A{i:02d}' for i in range(64)]

    # Check if all bands are present
    missing_bands = [b for b in band_names if b not in df.columns]
    if missing_bands:
        print(f"\n❌ ERROR: Missing bands: {missing_bands}")
        return None

    print(f"\n✅ All 64 embedding bands found (A00-A63)")

    # Extract species name from filename or metadata
    if 'species' in df.columns:
        species_name = df['species'].iloc[0]
    else:
        # Extract from filename
        species_name = Path(input_csv).stem.replace('_year_matched_embeddings_64d', '')

    print(f"📊 Species: {species_name}")

    # Get metadata
    if 'occurrence_year' in df.columns and 'gee_year' in df.columns:
        occ_years = df['occurrence_year'].value_counts().to_dict()
        gee_years = df['gee_year'].value_counts().to_dict()
        print(f"   Occurrence years: {occ_years}")
        print(f"   GEE years: {gee_years}")

    # Compute statistics for each band
    print(f"\n🔄 Computing statistics (mean, std, p10, p90) for 64 bands...")

    # Extract embedding matrix
    embedding_matrix = df[band_names].values

    # Remove any NaN rows
    valid_mask = ~np.isnan(embedding_matrix).any(axis=1)
    embedding_matrix_clean = embedding_matrix[valid_mask]

    if len(embedding_matrix_clean) < len(embedding_matrix):
        print(f"   ⚠️ Removed {len(embedding_matrix) - len(embedding_matrix_clean)} rows with NaN values")

    print(f"   Using {len(embedding_matrix_clean):,} valid embeddings")

    # Compute statistics
    stats = {
        'species': species_name,
        'total_embeddings': len(embedding_matrix_clean),
        'total_occurrences': len(df)
    }

    # For each band, compute 4 statistics
    for i, band in enumerate(band_names):
        band_values = embedding_matrix_clean[:, i]

        stats[f'mean_{band}'] = np.mean(band_values)
        stats[f'std_{band}'] = np.std(band_values)
        stats[f'p10_{band}'] = np.percentile(band_values, 10)
        stats[f'p90_{band}'] = np.percentile(band_values, 90)

    # Create signature dataframe
    signature_df = pd.DataFrame([stats])

    print(f"✅ Signature created: {len(stats)} values")
    print(f"   • Metadata: species, total_embeddings, total_occurrences")
    print(f"   • Statistics: 256 values (64 bands × 4 stats)")

    # Sample statistics
    print(f"\n📊 Sample statistics (band A00):")
    print(f"   Mean: {stats['mean_A00']:.4f}")
    print(f"   Std:  {stats['std_A00']:.4f}")
    print(f"   P10:  {stats['p10_A00']:.4f}")
    print(f"   P90:  {stats['p90_A00']:.4f}")

    # Save
    if output_csv is None:
        output_csv = input_csv.replace('_year_matched_embeddings_64d.csv', '_signature_256d.csv')

    signature_df.to_csv(output_csv, index=False)
    print(f"\n💾 Saved signature to: {output_csv}")
    print(f"   Shape: {signature_df.shape}")

    return signature_df


def main():
    """Main execution"""
    if len(sys.argv) < 2:
        print("Usage: python aggregate_signature.py <year_matched_embeddings.csv>")
        print("\nExample:")
        print("  python aggregate_signature.py Acer_rubrum_year_matched_embeddings_64d.csv")
        sys.exit(1)

    input_csv = sys.argv[1]

    if not Path(input_csv).exists():
        print(f"❌ ERROR: File not found: {input_csv}")
        sys.exit(1)

    # Aggregate
    signature_df = aggregate_to_signature(input_csv)

    if signature_df is not None:
        print("\n" + "="*70)
        print("✅ AGGREGATION COMPLETE!")
        print("="*70)
        print("\n📁 Output: 256D signature CSV")
        print("   • Use this for species classification")
        print("   • Contains mean/std/p10/p90 for all 64 bands")


if __name__ == "__main__":
    main()
