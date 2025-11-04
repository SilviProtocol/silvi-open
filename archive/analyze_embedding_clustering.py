#!/usr/bin/env python3
"""
ANALYZE EMBEDDING CLUSTERING

Analyzes how clustered embeddings are for a species to determine if
using a simple centroid (mean) is sufficient, or if distribution stats
(std, percentiles) are needed.

Usage:
    python analyze_embedding_clustering.py "Acer_rubrum_year_matched_embeddings_64d.csv"
"""

import pandas as pd
import numpy as np
import sys
from pathlib import Path
import argparse


def analyze_embedding_distribution(csv_path, species_name=None):
    """Analyze embedding distribution for a species"""

    print("="*70)
    print("EMBEDDING CLUSTERING ANALYSIS")
    print("="*70)

    # Load data
    df = pd.read_csv(csv_path)

    if species_name is None:
        # Extract from filename
        species_name = Path(csv_path).stem.replace('_year_matched_embeddings_64d', '').replace('_', ' ')

    print(f"\nSpecies: {species_name}")
    print(f"Total embeddings: {len(df):,}")

    # Extract embedding bands
    band_names = [f'A{i:02d}' for i in range(64)]
    missing = [b for b in band_names if b not in df.columns]
    if missing:
        print(f"❌ Missing bands: {missing}")
        return None

    # Get embedding matrix
    embedding_matrix = df[band_names].values

    # Remove NaN rows
    valid_mask = ~np.isnan(embedding_matrix).any(axis=1)
    embedding_matrix = embedding_matrix[valid_mask]

    if len(embedding_matrix) < len(df):
        print(f"⚠️  Removed {len(df) - len(embedding_matrix)} rows with NaN")

    print(f"Valid embeddings: {len(embedding_matrix):,}")

    # ===================================================================
    # METRIC 1: Within-species variance (coefficient of variation)
    # ===================================================================
    print("\n" + "="*70)
    print("METRIC 1: COEFFICIENT OF VARIATION (CV) PER BAND")
    print("="*70)
    print("CV = std/mean. Low CV (<0.5) = tight clustering, High CV (>1.0) = spread out")

    cvs = []
    for i in range(64):
        band_values = embedding_matrix[:, i]
        mean_val = np.mean(band_values)
        std_val = np.std(band_values)
        cv = std_val / abs(mean_val) if mean_val != 0 else float('inf')
        cvs.append(cv)

    cvs = np.array(cvs)
    cvs_finite = cvs[np.isfinite(cvs)]  # Remove inf values

    print(f"\nCV statistics across 64 bands:")
    print(f"  Mean CV:   {np.mean(cvs_finite):.3f}")
    print(f"  Median CV: {np.median(cvs_finite):.3f}")
    print(f"  Min CV:    {np.min(cvs_finite):.3f}")
    print(f"  Max CV:    {np.max(cvs_finite):.3f}")
    print(f"  Std CV:    {np.std(cvs_finite):.3f}")

    # Count how many bands have high variance
    high_variance_count = np.sum(cvs_finite > 1.0)
    medium_variance_count = np.sum((cvs_finite > 0.5) & (cvs_finite <= 1.0))
    low_variance_count = np.sum(cvs_finite <= 0.5)

    print(f"\nVariance distribution:")
    print(f"  Low variance (CV ≤ 0.5):     {low_variance_count} bands ({low_variance_count/64*100:.1f}%)")
    print(f"  Medium variance (0.5 < CV ≤ 1.0): {medium_variance_count} bands ({medium_variance_count/64*100:.1f}%)")
    print(f"  High variance (CV > 1.0):    {high_variance_count} bands ({high_variance_count/64*100:.1f}%)")

    # ===================================================================
    # METRIC 2: Pairwise distances between embeddings
    # ===================================================================
    print("\n" + "="*70)
    print("METRIC 2: PAIRWISE EUCLIDEAN DISTANCES")
    print("="*70)
    print("Measures how far apart embeddings are from each other")

    # Sample to avoid memory issues
    sample_size = min(1000, len(embedding_matrix))
    if len(embedding_matrix) > sample_size:
        print(f"\n⚠️  Sampling {sample_size:,} embeddings for distance calculation")
        indices = np.random.choice(len(embedding_matrix), sample_size, replace=False)
        sample_embeddings = embedding_matrix[indices]
    else:
        sample_embeddings = embedding_matrix

    # Compute pairwise distances (only for upper triangle to save memory)
    from scipy.spatial.distance import pdist
    distances = pdist(sample_embeddings, metric='euclidean')

    print(f"\nDistance statistics:")
    print(f"  Mean distance:   {np.mean(distances):.4f}")
    print(f"  Median distance: {np.median(distances):.4f}")
    print(f"  Min distance:    {np.min(distances):.4f}")
    print(f"  Max distance:    {np.max(distances):.4f}")
    print(f"  Std distance:    {np.std(distances):.4f}")
    print(f"  25th percentile: {np.percentile(distances, 25):.4f}")
    print(f"  75th percentile: {np.percentile(distances, 75):.4f}")

    # ===================================================================
    # METRIC 3: Distance from centroid
    # ===================================================================
    print("\n" + "="*70)
    print("METRIC 3: DISTANCE FROM CENTROID")
    print("="*70)
    print("How far each embedding is from the species centroid (mean)")

    centroid = np.mean(embedding_matrix, axis=0)
    distances_from_centroid = np.linalg.norm(embedding_matrix - centroid, axis=1)

    print(f"\nDistance from centroid statistics:")
    print(f"  Mean:   {np.mean(distances_from_centroid):.4f}")
    print(f"  Median: {np.median(distances_from_centroid):.4f}")
    print(f"  Min:    {np.min(distances_from_centroid):.4f}")
    print(f"  Max:    {np.max(distances_from_centroid):.4f}")
    print(f"  Std:    {np.std(distances_from_centroid):.4f}")
    print(f"  10th percentile: {np.percentile(distances_from_centroid, 10):.4f}")
    print(f"  90th percentile: {np.percentile(distances_from_centroid, 90):.4f}")

    # Outlier detection (points > 2 std from mean distance)
    mean_dist = np.mean(distances_from_centroid)
    std_dist = np.std(distances_from_centroid)
    outliers = distances_from_centroid > (mean_dist + 2*std_dist)
    outlier_count = np.sum(outliers)
    outlier_pct = outlier_count / len(distances_from_centroid) * 100

    print(f"\nOutliers (>2 std from mean):")
    print(f"  Count: {outlier_count} ({outlier_pct:.2f}%)")

    # ===================================================================
    # METRIC 4: Spread relative to centroid magnitude
    # ===================================================================
    print("\n" + "="*70)
    print("METRIC 4: RELATIVE SPREAD")
    print("="*70)

    centroid_magnitude = np.linalg.norm(centroid)
    mean_spread = np.mean(distances_from_centroid)
    relative_spread = mean_spread / centroid_magnitude

    print(f"Centroid magnitude:  {centroid_magnitude:.4f}")
    print(f"Mean spread:         {mean_spread:.4f}")
    print(f"Relative spread:     {relative_spread:.4f} ({relative_spread*100:.1f}%)")

    if relative_spread < 0.1:
        spread_rating = "VERY TIGHT - embeddings cluster very close to centroid"
    elif relative_spread < 0.25:
        spread_rating = "TIGHT - embeddings mostly close to centroid"
    elif relative_spread < 0.5:
        spread_rating = "MODERATE - embeddings have noticeable spread"
    else:
        spread_rating = "SPREAD OUT - embeddings vary significantly from centroid"

    print(f"Rating: {spread_rating}")

    # ===================================================================
    # METRIC 5: Per-band statistics range
    # ===================================================================
    print("\n" + "="*70)
    print("METRIC 5: PER-BAND VALUE RANGES")
    print("="*70)

    ranges = []
    for i in range(64):
        band_values = embedding_matrix[:, i]
        val_range = np.max(band_values) - np.min(band_values)
        ranges.append(val_range)

    ranges = np.array(ranges)

    print(f"\nValue range statistics across bands:")
    print(f"  Mean range:   {np.mean(ranges):.4f}")
    print(f"  Median range: {np.median(ranges):.4f}")
    print(f"  Min range:    {np.min(ranges):.4f}")
    print(f"  Max range:    {np.max(ranges):.4f}")

    # ===================================================================
    # FINAL RECOMMENDATION
    # ===================================================================
    print("\n" + "="*70)
    print("RECOMMENDATION")
    print("="*70)

    # Decision logic
    use_centroid = True
    reasons = []

    # Check 1: Coefficient of variation
    if np.mean(cvs_finite) > 0.7:
        use_centroid = False
        reasons.append(f"High mean CV ({np.mean(cvs_finite):.3f}) indicates high variability")

    # Check 2: Relative spread
    if relative_spread > 0.3:
        use_centroid = False
        reasons.append(f"High relative spread ({relative_spread:.3f}) suggests distribution info is important")

    # Check 3: Outliers
    if outlier_pct > 5.0:
        use_centroid = False
        reasons.append(f"High outlier percentage ({outlier_pct:.1f}%) means centroid may be skewed")

    # Check 4: High variance bands
    if high_variance_count > 20:
        use_centroid = False
        reasons.append(f"Many bands ({high_variance_count}) have high variance")

    print("\n📊 ANALYSIS RESULTS:")

    if use_centroid:
        print("✅ CENTROID (64D) IS SUFFICIENT")
        print("\nEmbeddings are tightly clustered around the mean.")
        print("Distribution information (std, percentiles) may not add much value.")
    else:
        print("⚠️  DISTRIBUTION STATS RECOMMENDED (256D)")
        print("\nEmbeddings show significant variation:")
        for reason in reasons:
            print(f"  • {reason}")
        print("\nRecommendation: Keep mean + std + p10 + p90 (256D)")
        print("Alternative: Use mean + std only (128D) as a middle ground")

    print("\n" + "="*70)

    # Return summary stats
    return {
        'species': species_name,
        'n_embeddings': len(embedding_matrix),
        'mean_cv': np.mean(cvs_finite),
        'median_cv': np.median(cvs_finite),
        'relative_spread': relative_spread,
        'outlier_pct': outlier_pct,
        'high_variance_bands': high_variance_count,
        'use_centroid': use_centroid,
        'mean_pairwise_distance': np.mean(distances),
        'mean_distance_from_centroid': np.mean(distances_from_centroid)
    }


def main():
    parser = argparse.ArgumentParser(description='Analyze embedding clustering')
    parser.add_argument('csv_file', type=str, help='Path to embeddings CSV file')
    parser.add_argument('--species', type=str, help='Species name (auto-detected from filename if not provided)')

    args = parser.parse_args()

    if not Path(args.csv_file).exists():
        print(f"❌ File not found: {args.csv_file}")
        sys.exit(1)

    results = analyze_embedding_distribution(args.csv_file, args.species)

    if results is None:
        sys.exit(1)


if __name__ == "__main__":
    main()
