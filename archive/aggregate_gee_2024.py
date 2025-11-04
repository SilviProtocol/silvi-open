#!/usr/bin/env python3
"""
GEE AGGREGATION: Compute 256-band signature using GEE server-side (2024 only)

Process:
1. Loads only 2024 data from Alpha Earth
2. Samples at occurrence locations server-side
3. Computes mean, std, p10, p90 for each of 64 bands on GEE servers
4. Creates 256-band signature (64 bands × 4 statistics)
5. Exports signature to Google Drive

This uses only ONE year (2024) to avoid timeout issues.
Compare with local aggregation to verify consistency.
"""

import pandas as pd
import ee

def initialize_gee():
    """Initialize Google Earth Engine"""
    try:
        ee.Initialize(project='treekipedia')  # Update with your project
        print("✅ GEE initialized")
        return True
    except Exception as e:
        print(f"❌ GEE initialization failed: {e}")
        return False


def aggregate_gee_single_year(df, species_name, year=2024, max_samples=5000):
    """
    GEE server-side aggregation for a single year.

    Parameters:
    -----------
    df : DataFrame
        Species occurrence data with lat/lon
    species_name : str
        Name of species
    year : int
        Year to process (default: 2024)
    max_samples : int
        Maximum number of points to sample

    Returns:
    --------
    GEE export task
    """

    print(f"\n{'='*70}")
    print(f"GEE AGGREGATION: {species_name} - Year {year}")
    print(f"{'='*70}")

    # Filter species data
    species_df = df[df['species'] == species_name].copy()
    species_df = species_df[
        (species_df['decimalLatitude'].between(-90, 90)) &
        (species_df['decimalLongitude'].between(-180, 180)) &
        (species_df['decimalLatitude'].notna()) &
        (species_df['decimalLongitude'].notna())
    ].copy()

    print(f"Full clean occurrences: {len(species_df):,}")

    # IQR outlier filter
    if len(species_df) > 10:
        lat_q1 = species_df['decimalLatitude'].quantile(0.25)
        lat_q3 = species_df['decimalLatitude'].quantile(0.75)
        lat_iqr = lat_q3 - lat_q1
        lat_low = lat_q1 - 1.5 * lat_iqr
        lat_high = lat_q3 + 1.5 * lat_iqr

        lon_q1 = species_df['decimalLongitude'].quantile(0.25)
        lon_q3 = species_df['decimalLongitude'].quantile(0.75)
        lon_iqr = lon_q3 - lon_q1
        lon_low = lon_q1 - 1.5 * lon_iqr
        lon_high = lon_q3 + 1.5 * lon_iqr

        pre_filter = len(species_df)
        species_df = species_df[
            (species_df['decimalLatitude'] >= lat_low) &
            (species_df['decimalLatitude'] <= lat_high) &
            (species_df['decimalLongitude'] >= lon_low) &
            (species_df['decimalLongitude'] <= lon_high)
        ].copy()
        print(f"After IQR outlier filter: {len(species_df):,} (removed {pre_filter - len(species_df):,})")

    # Sample if needed
    if len(species_df) > max_samples:
        species_df = species_df.sample(n=max_samples, random_state=42)
        print(f"Sampled to: {len(species_df):,}")

    # Compute bbox
    min_lat = float(species_df['decimalLatitude'].min())
    max_lat = float(species_df['decimalLatitude'].max())
    min_lon = float(species_df['decimalLongitude'].min())
    max_lon = float(species_df['decimalLongitude'].max())
    bbox_list = [min_lon, min_lat, max_lon, max_lat]
    bbox_geom = ee.Geometry.Rectangle(bbox_list)
    print(f"📐 Bbox: [{min_lon:.2f}, {min_lat:.2f}, {max_lon:.2f}, {max_lat:.2f}]")

    # Load Alpha Earth
    print(f"🔄 Loading Alpha Earth for year {year}...")
    alpha_earth = ee.ImageCollection('GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL')

    # Filter for specific year
    start_date = ee.Date.fromYMD(year, 1, 1)
    end_date = start_date.advance(1, 'year')

    year_image = (alpha_earth
                  .filterDate(start_date, end_date)
                  .filterBounds(bbox_geom)
                  .mosaic())

    print(f"✅ Loaded {year} image (mosaic of tiles)")

    # Create points FeatureCollection
    print(f"🔄 Creating points ({len(species_df):,} locations)...")
    features = []
    for idx, row in species_df.iterrows():
        point = ee.Geometry.Point([row['decimalLongitude'], row['decimalLatitude']])
        feat = ee.Feature(point, {
            'occurrence_id': str(idx),
            'lat': row['decimalLatitude'],
            'lon': row['decimalLongitude']
        })
        features.append(feat)
    points_fc = ee.FeatureCollection(features)

    print(f"✅ Created FeatureCollection with {len(features)} points")

    # Sample at points
    print(f"🔄 Sampling Alpha Earth at points (server-side)...")
    sampled_fc = year_image.sampleRegions(
        collection=points_fc,
        properties=['occurrence_id', 'lat', 'lon'],
        scale=250,  # Alpha Earth native resolution
        geometries=False,
        tileScale=16
    )

    # Filter out null values
    sampled_fc = sampled_fc.filter(ee.Filter.notNull(['A00']))

    print(f"✅ Sampling complete")

    # Define band names
    band_names = [f'A{i:02d}' for i in range(64)]

    # Create combined reducer for all 4 statistics
    print(f"🔄 Computing statistics (server-side)...")
    combined_red = (
        ee.Reducer.mean()
        .combine(ee.Reducer.stdDev(), sharedInputs=True)
        .combine(ee.Reducer.percentile([10]), sharedInputs=True)
        .combine(ee.Reducer.percentile([90]), sharedInputs=True)
    ).repeat(64)

    # Aggregate across all features (server-side computation)
    stats_dict = sampled_fc.reduceColumns(
        reducer=combined_red,
        selectors=band_names
    )

    print(f"🔄 Flattening results...")
    try:
        stats_info = stats_dict.getInfo()
    except Exception as e:
        print(f"❌ Aggregation failed: {e}")
        return None

    # Extract stats
    mean_list = stats_info.get('mean', [])
    std_list = stats_info.get('stdDev', [])
    p10_list = stats_info.get('p10', [])
    p90_list = stats_info.get('p90', [])

    print(f"✅ Extracted: {len(mean_list)} means, {len(std_list)} stds, {len(p10_list)} p10s, {len(p90_list)} p90s")

    if len(mean_list) != 64:
        print(f"❌ Expected 64 values per statistic, got {len(mean_list)}")
        return None

    # Build signature
    signature = {
        'species': species_name,
        'year': year,
        'total_samples': len(species_df),
        'computation_method': 'gee_server_side',
    }

    for i in range(64):
        band = band_names[i]
        signature[f'mean_{band}'] = mean_list[i]
        signature[f'std_{band}'] = std_list[i]
        signature[f'p10_{band}'] = p10_list[i]
        signature[f'p90_{band}'] = p90_list[i]

    # Sample output
    print(f"\n📊 Sample statistics (A00):")
    print(f"   Mean:  {signature['mean_A00']:.6f}")
    print(f"   Std:   {signature['std_A00']:.6f}")
    print(f"   P10:   {signature['p10_A00']:.6f}")
    print(f"   P90:   {signature['p90_A00']:.6f}")

    # Create feature for export
    signature_feature = ee.Feature(None, signature)

    # Export to Google Drive
    print(f"\n📤 Exporting to Google Drive...")
    safe_name = species_name.replace(' ', '_').replace('/', '_')
    task_desc = f'{safe_name}_{year}_signature_256d_GEE'

    task = ee.batch.Export.table.toDrive(
        collection=ee.FeatureCollection([signature_feature]),
        description=task_desc,
        folder='species_signatures',
        fileFormat='CSV'
    )
    task.start()

    print(f"✅ Export started: {task_desc}")
    print(f"📁 Folder: Google Drive/species_signatures/")
    print(f"🔗 Monitor: https://code.earthengine.google.com/tasks")

    return task


def run_gee_aggregation():
    """
    Main workflow for GEE aggregation.
    """
    print("="*70)
    print("GEE SERVER-SIDE AGGREGATION - YEAR 2024")
    print("="*70)
    print("\nThis script:")
    print("  1. Loads 2024 Alpha Earth data")
    print("  2. Samples at occurrence locations")
    print("  3. Computes 256-band signature on GEE servers")
    print("  4. Exports to Google Drive/species_signatures/")
    print("\n" + "="*70)

    # Initialize GEE
    if not initialize_gee():
        return

    # Load species data
    print(f"\n📂 Loading species data...")
    try:
        df = pd.read_parquet('species_data.parquet')
        print(f"✅ Loaded: {len(df):,} occurrences, {df['species'].nunique():,} species")
    except Exception as e:
        print(f"❌ Failed to load parquet: {e}")
        return

    # Species to process
    species_name = 'Quercus coccifera'

    # Run aggregation
    task = aggregate_gee_single_year(
        df,
        species_name,
        year=2024,
        max_samples=5000
    )

    if task:
        print("\n" + "="*70)
        print("✅ GEE AGGREGATION COMPLETE!")
        print("="*70)
        print(f"\nExport task started for {species_name} (2024)")
        print(f"Wait 2-3 minutes for completion")
        print(f"\nCheck: https://code.earthengine.google.com/tasks")
        print(f"Download from: Google Drive/species_signatures/")
        print(f"File: Quercus_coccifera_2024_signature_256d_GEE.csv")
        print(f"\n📊 Summary:")
        print(f"   • Year: 2024 only")
        print(f"   • Statistics: 256 (64 bands × 4 stats)")
        print(f"   • Computation: GEE server-side")
        print(f"\nNext steps:")
        print(f"   1. Wait for GEE export to complete")
        print(f"   2. Download both signatures (LOCAL and GEE)")
        print(f"   3. Compare them to verify consistency!")


if __name__ == "__main__":
    run_gee_aggregation()
