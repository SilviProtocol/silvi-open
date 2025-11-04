#!/usr/bin/env python3
"""
COMPARE SIGNATURES: Local vs GEE aggregation

Compares the 256-band signatures computed by:
1. Local aggregation (pandas/numpy)
2. GEE server-side aggregation

Shows differences and validates consistency.
"""

import pandas as pd
import numpy as np
from pathlib import Path
import matplotlib.pyplot as plt

def load_signatures(local_path, gee_path):
    """
    Load both signature CSVs.
    """
    print("="*70)
    print("LOADING SIGNATURES")
    print("="*70)

    print(f"\n📂 Loading LOCAL signature: {local_path}")
    local_df = pd.read_csv(local_path)
    print(f"   Shape: {local_df.shape}")
    print(f"   Columns: {local_df.columns.tolist()[:5]}...")

    print(f"\n📂 Loading GEE signature: {gee_path}")
    gee_df = pd.read_csv(gee_path)
    print(f"   Shape: {gee_df.shape}")
    print(f"   Columns: {gee_df.columns.tolist()[:5]}...")

    return local_df, gee_df


def compare_statistics(local_df, gee_df):
    """
    Compare statistics between local and GEE signatures.
    """
    print("\n" + "="*70)
    print("COMPARING STATISTICS")
    print("="*70)

    # Extract band columns
    band_cols = [f'A{i:02d}' for i in range(64)]
    stats = ['mean', 'std', 'p10', 'p90']

    differences = []

    for stat in stats:
        for band in band_cols:
            col = f'{stat}_{band}'

            if col not in local_df.columns:
                print(f"⚠️  Missing in LOCAL: {col}")
                continue

            if col not in gee_df.columns:
                print(f"⚠️  Missing in GEE: {col}")
                continue

            local_val = local_df[col].iloc[0]
            gee_val = gee_df[col].iloc[0]

            # Compute differences
            abs_diff = abs(local_val - gee_val)
            rel_diff = abs_diff / abs(gee_val) * 100 if gee_val != 0 else 0

            differences.append({
                'statistic': col,
                'stat_type': stat,
                'band': band,
                'local': local_val,
                'gee': gee_val,
                'abs_diff': abs_diff,
                'rel_diff_pct': rel_diff
            })

    diff_df = pd.DataFrame(differences)

    # Summary statistics
    print(f"\n📊 Overall comparison ({len(diff_df)} statistics):")
    print(f"   Max absolute difference:    {diff_df['abs_diff'].max():.8f}")
    print(f"   Mean absolute difference:   {diff_df['abs_diff'].mean():.8f}")
    print(f"   Median absolute difference: {diff_df['abs_diff'].median():.8f}")
    print(f"\n   Max relative difference:    {diff_df['rel_diff_pct'].max():.4f}%")
    print(f"   Mean relative difference:   {diff_df['rel_diff_pct'].mean():.4f}%")
    print(f"   Median relative difference: {diff_df['rel_diff_pct'].median():.4f}%")

    # Per-statistic breakdown
    print(f"\n📈 Breakdown by statistic type:")
    for stat in stats:
        stat_df = diff_df[diff_df['stat_type'] == stat]
        print(f"\n   {stat.upper()}:")
        print(f"      Max abs diff:  {stat_df['abs_diff'].max():.8f}")
        print(f"      Mean abs diff: {stat_df['abs_diff'].mean():.8f}")
        print(f"      Max rel diff:  {stat_df['rel_diff_pct'].max():.4f}%")
        print(f"      Mean rel diff: {stat_df['rel_diff_pct'].mean():.4f}%")

    # Top differences
    print(f"\n🔍 Top 10 largest absolute differences:")
    top_abs = diff_df.nlargest(10, 'abs_diff')[['statistic', 'local', 'gee', 'abs_diff', 'rel_diff_pct']]
    print(top_abs.to_string(index=False))

    print(f"\n🔍 Top 10 largest relative differences:")
    top_rel = diff_df.nlargest(10, 'rel_diff_pct')[['statistic', 'local', 'gee', 'abs_diff', 'rel_diff_pct']]
    print(top_rel.to_string(index=False))

    # Save comparison
    output_file = "signature_comparison_2024_LOCAL_vs_GEE.csv"
    diff_df.to_csv(output_file, index=False)
    print(f"\n💾 Saved detailed comparison: {output_file}")

    return diff_df


def plot_comparison(diff_df):
    """
    Create visualizations comparing local vs GEE.
    """
    print(f"\n📊 Creating visualizations...")

    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle('Local vs GEE Signature Comparison (2024)', fontsize=16, fontweight='bold')

    stats = ['mean', 'std', 'p10', 'p90']
    titles = ['Mean', 'Standard Deviation', '10th Percentile', '90th Percentile']

    for idx, (stat, title) in enumerate(zip(stats, titles)):
        ax = axes[idx // 2, idx % 2]

        stat_df = diff_df[diff_df['stat_type'] == stat]

        # Scatter plot: local vs gee
        ax.scatter(stat_df['gee'], stat_df['local'], alpha=0.6, s=20)

        # Perfect agreement line
        min_val = min(stat_df['gee'].min(), stat_df['local'].min())
        max_val = max(stat_df['gee'].max(), stat_df['local'].max())
        ax.plot([min_val, max_val], [min_val, max_val], 'r--', linewidth=2, label='Perfect agreement')

        ax.set_xlabel('GEE value', fontsize=11)
        ax.set_ylabel('Local value', fontsize=11)
        ax.set_title(f'{title} (64 bands)', fontsize=12, fontweight='bold')
        ax.legend()
        ax.grid(True, alpha=0.3)

        # Add correlation coefficient
        corr = stat_df['gee'].corr(stat_df['local'])
        ax.text(0.05, 0.95, f'R² = {corr**2:.6f}', transform=ax.transAxes,
                verticalalignment='top', bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))

    plt.tight_layout()

    output_plot = "signature_comparison_2024_LOCAL_vs_GEE.png"
    plt.savefig(output_plot, dpi=300, bbox_inches='tight')
    print(f"✅ Saved plot: {output_plot}")

    plt.close()


def assess_agreement(diff_df):
    """
    Assess whether local and GEE methods agree.
    """
    print(f"\n" + "="*70)
    print("AGREEMENT ASSESSMENT")
    print("="*70)

    # Thresholds for agreement
    abs_threshold = 0.01  # Absolute difference threshold
    rel_threshold = 1.0   # Relative difference threshold (%)

    # Count agreements
    abs_agrees = (diff_df['abs_diff'] < abs_threshold).sum()
    rel_agrees = (diff_df['rel_diff_pct'] < rel_threshold).sum()

    total = len(diff_df)

    print(f"\n📊 Agreement rates:")
    print(f"   Absolute threshold ({abs_threshold}): {abs_agrees}/{total} ({abs_agrees/total*100:.1f}%)")
    print(f"   Relative threshold ({rel_threshold}%): {rel_agrees}/{total} ({rel_agrees/total*100:.1f}%)")

    # Overall assessment
    if diff_df['rel_diff_pct'].mean() < 0.1:
        verdict = "✅ EXCELLENT - Methods produce nearly identical results"
    elif diff_df['rel_diff_pct'].mean() < 1.0:
        verdict = "✅ GOOD - Minor differences, methods agree well"
    elif diff_df['rel_diff_pct'].mean() < 5.0:
        verdict = "⚠️  MODERATE - Some differences, investigate further"
    else:
        verdict = "❌ POOR - Significant differences, methods disagree"

    print(f"\n🎯 Verdict: {verdict}")

    return verdict


def run_comparison():
    """
    Main comparison workflow.
    """
    print("="*70)
    print("SIGNATURE COMPARISON: LOCAL vs GEE (2024)")
    print("="*70)

    # File paths
    local_file = "Quercus_coccifera_2024_signature_256d_LOCAL.csv"
    gee_file = "Quercus_coccifera_2024_signature_256d_GEE.csv"

    # Check if files exist
    if not Path(local_file).exists():
        print(f"\n❌ Local signature not found: {local_file}")
        print(f"   Run: python3 aggregate_local_2024.py")
        return

    if not Path(gee_file).exists():
        print(f"\n❌ GEE signature not found: {gee_file}")
        print(f"   Run: python3 aggregate_gee_2024.py")
        print(f"   Then download from Google Drive")
        return

    # Load signatures
    local_df, gee_df = load_signatures(local_file, gee_file)

    # Compare
    diff_df = compare_statistics(local_df, gee_df)

    # Plot
    try:
        plot_comparison(diff_df)
    except Exception as e:
        print(f"⚠️  Could not create plots: {e}")

    # Assess
    verdict = assess_agreement(diff_df)

    print("\n" + "="*70)
    print("✅ COMPARISON COMPLETE")
    print("="*70)
    print(f"\nOutputs:")
    print(f"   • CSV: signature_comparison_2024_LOCAL_vs_GEE.csv")
    print(f"   • Plot: signature_comparison_2024_LOCAL_vs_GEE.png")
    print(f"\n{verdict}")


if __name__ == "__main__":
    run_comparison()
