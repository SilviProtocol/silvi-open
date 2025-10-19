#!/usr/bin/env python3
"""
STEP 2: AGGREGATE TO SPECIES SIGNATURE (Python)
Takes individual occurrence embeddings and creates species-level signature

Statistics: Median + Std + P10 + P90
Result: 64 dimensions × 4 statistics = 256 features per species
"""

import pandas as pd
import numpy as np
from pathlib import Path

def load_occurrence_embeddings(folder_path):
    """
    Load all CSV files from GEE extraction

    Args:
        folder_path: Path to folder containing CSV files

    Returns:
        Combined DataFrame with all occurrences
    """
    print("📂 Loading occurrence embeddings...")

    folder = Path(folder_path)
    csv_files = list(folder.glob("*.csv"))

    if len(csv_files) == 0:
        print(f"❌ No CSV files found in {folder_path}")
        return None

    print(f"Found {len(csv_files)} CSV files")

    # Load and combine all files
    dfs = []
    for csv_file in csv_files:
        df = pd.read_csv(csv_file)
        dfs.append(df)
        print(f"  Loaded: {csv_file.name} ({len(df)} occurrences)")

    combined = pd.concat(dfs, ignore_index=True)
    print(f"✅ Total occurrences loaded: {len(combined):,}")

    return combined

def create_species_signature(df, species_name):
    """
    Aggregate occurrence embeddings to species-level signature

    Statistics calculated:
    - Median (50th percentile): Central tendency, robust to outliers
    - Std: Spread/variability
    - P10 (10th percentile): Lower bound of typical range
    - P90 (90th percentile): Upper bound of typical range

    Args:
        df: DataFrame with occurrence embeddings (columns A00-A63)
        species_name: Name of species

    Returns:
        DataFrame with single row containing species signature
    """
    print(f"\n{'='*70}")
    print(f"CREATING SPECIES SIGNATURE: {species_name}")
    print(f"{'='*70}")

    # Get embedding columns (A00-A63)
    embedding_cols = [f'A{i:02d}' for i in range(64)]

    # Verify columns exist
    missing_cols = [col for col in embedding_cols if col not in df.columns]
    if missing_cols:
        print(f"❌ Missing embedding columns: {missing_cols[:5]}...")
        return None

    print(f"Occurrences: {len(df):,}")
    print(f"Embedding dimensions: {len(embedding_cols)}")

    # Calculate statistics for each dimension
    signature = {'species': species_name, 'n_occurrences': len(df)}

    print("\n📊 Calculating statistics:")
    print("  - Median (50th percentile)")
    print("  - Standard deviation")
    print("  - 10th percentile")
    print("  - 90th percentile")

    for col in embedding_cols:
        values = df[col].dropna()

        # Calculate statistics
        signature[f'{col}_median'] = values.quantile(0.50)
        signature[f'{col}_std'] = values.std()
        signature[f'{col}_p10'] = values.quantile(0.10)
        signature[f'{col}_p90'] = values.quantile(0.90)

    # Create DataFrame
    signature_df = pd.DataFrame([signature])

    print(f"\n✅ Species Signature Created:")
    print(f"  Species: {species_name}")
    print(f"  Occurrences: {len(df):,}")
    print(f"  Features: {len(embedding_cols)} × 4 = {len(embedding_cols) * 4} dimensions")
    print(f"\n📊 Feature breakdown:")
    print(f"  - {len(embedding_cols)} × median")
    print(f"  - {len(embedding_cols)} × std")
    print(f"  - {len(embedding_cols)} × p10")
    print(f"  - {len(embedding_cols)} × p90")

    return signature_df

def analyze_signature_distribution(df):
    """
    Show distribution statistics to understand the species' environmental niche
    """
    print(f"\n{'='*70}")
    print("SIGNATURE ANALYSIS")
    print(f"{'='*70}")

    embedding_cols = [f'A{i:02d}' for i in range(64)]

    # Calculate niche breadth indicators
    print("\n🌍 Environmental Niche Indicators:")

    # Average spread across all dimensions
    std_cols = [f'{col}_std' for col in embedding_cols]
    if all(col in df.columns for col in std_cols):
        avg_std = df[std_cols].iloc[0].mean()
        print(f"  Average std across dimensions: {avg_std:.4f}")
        print(f"    → {'High variability (generalist)' if avg_std > 0.1 else 'Low variability (specialist)'}")

    # Range breadth (p90 - p10)
    ranges = []
    for col in embedding_cols:
        p10_col = f'{col}_p10'
        p90_col = f'{col}_p90'
        if p10_col in df.columns and p90_col in df.columns:
            range_val = df[p90_col].iloc[0] - df[p10_col].iloc[0]
            ranges.append(range_val)

    if ranges:
        avg_range = np.mean(ranges)
        print(f"  Average 80% range (p90-p10): {avg_range:.4f}")
        print(f"    → {'Broad niche' if avg_range > 0.3 else 'Narrow niche'}")

    # Show example dimension
    print(f"\n📈 Example dimension (A00):")
    if 'A00_median' in df.columns:
        print(f"  Median: {df['A00_median'].iloc[0]:.4f}")
        print(f"  Std:    {df['A00_std'].iloc[0]:.4f}")
        print(f"  P10:    {df['A00_p10'].iloc[0]:.4f}")
        print(f"  P90:    {df['A00_p90'].iloc[0]:.4f}")
        print(f"  Range:  {df['A00_p90'].iloc[0] - df['A00_p10'].iloc[0]:.4f}")

def save_signature(signature_df, output_file='species_signature.csv'):
    """Save species signature to file"""
    signature_df.to_csv(output_file, index=False)
    print(f"\n💾 Saved signature to: {output_file}")

    # File info
    import os
    size_kb = os.path.getsize(output_file) / 1024
    print(f"   File size: {size_kb:.1f} KB")
    print(f"   Columns: {len(signature_df.columns)}")

def run_aggregation(folder_path='embeddings_temporal_aligned', species_name='Quercus coccifera'):
    """
    Main aggregation workflow

    Args:
        folder_path: Folder containing CSV files from GEE
        species_name: Name of species to aggregate
    """
    print("="*70)
    print("STEP 2: SPECIES SIGNATURE AGGREGATION (Python)")
    print("="*70)

    # Load occurrence embeddings
    df = load_occurrence_embeddings(folder_path)
    if df is None:
        return

    # Verify species
    if 'species' in df.columns:
        unique_species = df['species'].unique()
        print(f"\nSpecies in data: {unique_species}")

        if species_name not in unique_species:
            print(f"⚠️  Warning: {species_name} not found, using first species")
            species_name = unique_species[0]

    # Filter to species if multiple
    if 'species' in df.columns:
        df = df[df['species'] == species_name]

    # Create signature
    signature = create_species_signature(df, species_name)

    if signature is not None:
        # Analyze
        analyze_signature_distribution(signature)

        # Save
        output_file = f"{species_name.replace(' ', '_')}_signature.csv"
        save_signature(signature, output_file)

        print(f"\n{'='*70}")
        print("✅ SIGNATURE COMPLETE")
        print(f"{'='*70}")
        print(f"Species: {species_name}")
        print(f"Features: 256 (64 dimensions × 4 statistics)")
        print(f"File: {output_file}")
        print(f"\n🎯 USE CASES:")
        print(f"  - Species distribution modeling")
        print(f"  - Habitat suitability prediction")
        print(f"  - Species similarity analysis")
        print(f"  - Environmental niche characterization")

if __name__ == "__main__":
    # Update this path to your downloaded folder
    folder_path = "embeddings_temporal_aligned"

    print("IMPORTANT: Update 'folder_path' to your downloaded CSV folder location")
    print(f"Current path: {folder_path}\n")

    # Run aggregation
    run_aggregation(folder_path=folder_path, species_name='Quercus coccifera')
