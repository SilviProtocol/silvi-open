#!/usr/bin/env python3
"""
Analyze species occurrence counts to determine how many species have 5000+ occurrences
"""

import pandas as pd

def analyze_species_counts(parquet_file='species_data.parquet'):
    """
    Analyze species occurrence counts
    """
    print("SPECIES OCCURRENCE ANALYSIS")
    print("=" * 60)

    # Load data
    print(f"Loading {parquet_file}...")
    df = pd.read_parquet(parquet_file)

    print(f"\n📊 DATASET OVERVIEW:")
    print(f"Total occurrences: {len(df):,}")
    print(f"Total species: {df['species'].nunique():,}")

    # Get species counts
    species_counts = df['species'].value_counts()

    # Analyze by thresholds
    thresholds = [5000, 4000, 3000, 2000, 1000, 500, 100]

    print(f"\n📈 SPECIES COUNT BY THRESHOLD:")
    print("-" * 60)
    for threshold in thresholds:
        count = (species_counts >= threshold).sum()
        percent = (count / len(species_counts)) * 100
        total_occurrences = species_counts[species_counts >= threshold].sum()
        occ_percent = (total_occurrences / len(df)) * 100

        print(f"≥ {threshold:,} occurrences: {count:,} species ({percent:.2f}%) | {total_occurrences:,} occurrences ({occ_percent:.1f}%)")

    # Top species with 5000+
    species_5000_plus = species_counts[species_counts >= 5000]

    print(f"\n🌳 TOP SPECIES WITH 5000+ OCCURRENCES ({len(species_5000_plus)} species):")
    print("-" * 60)
    for i, (species, count) in enumerate(species_5000_plus.items(), 1):
        print(f"{i:3d}. {species:50s} {count:,} occurrences")

    # Distribution statistics
    print(f"\n📊 DISTRIBUTION STATISTICS:")
    print(f"Mean occurrences per species: {species_counts.mean():.0f}")
    print(f"Median occurrences per species: {species_counts.median():.0f}")
    print(f"Most occurrences (single species): {species_counts.max():,}")
    print(f"Least occurrences (single species): {species_counts.min():,}")

    # Cumulative distribution
    cumsum = species_counts.cumsum()
    top_10_pct = (cumsum <= len(df) * 0.10).sum()
    top_50_pct = (cumsum <= len(df) * 0.50).sum()
    top_90_pct = (cumsum <= len(df) * 0.90).sum()

    print(f"\n📉 CUMULATIVE DISTRIBUTION:")
    print(f"Top {top_10_pct} species account for 10% of occurrences")
    print(f"Top {top_50_pct} species account for 50% of occurrences")
    print(f"Top {top_90_pct} species account for 90% of occurrences")

    # Save species counts
    output_file = 'species_occurrence_counts.csv'
    species_counts_df = pd.DataFrame({
        'species': species_counts.index,
        'occurrence_count': species_counts.values,
        'rank': range(1, len(species_counts) + 1)
    })
    species_counts_df.to_csv(output_file, index=False)
    print(f"\n💾 Saved: {output_file}")

    return species_counts_df

if __name__ == "__main__":
    analyze_species_counts()
