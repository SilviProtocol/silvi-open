#!/usr/bin/env python3
"""
BATCH EXTRACTION: Extract 10 more species with year-matched temporal alignment
"""

import pandas as pd
import numpy as np
import ee
import time

def initialize_gee():
    """Initialize Google Earth Engine"""
    try:
        ee.Initialize(project='treekipedia')
        print("✅ GEE initialized")
        return True
    except Exception as e:
        print(f"❌ GEE initialization failed: {e}")
        return False

def get_available_years():
    """Hardcoded years from GEE catalog"""
    return [2018, 2019, 2020, 2021, 2022, 2023, 2024]

def extract_server_side_signature(df, species_name, max_samples=5000):
    """
    Extract year-matched embeddings for a species
    """
    print(f"\n{'='*70}")
    print(f"EXTRACTING: {species_name}")
    print(f"{'='*70}")

    # Filter species data
    species_df = df[df['species_scientific_name'] == species_name].copy()

    # Check if year column exists
    if 'year' not in species_df.columns:
        print("❌ ERROR: No 'year' column found!")
        return []

    # Clean coordinates and year
    species_df = species_df[
        (species_df['decimalLatitude'].between(-90, 90)) &
        (species_df['decimalLongitude'].between(-180, 180)) &
        (species_df['decimalLatitude'].notna()) &
        (species_df['decimalLongitude'].notna()) &
        (species_df['year'].notna())
    ].copy()

    # Filter out invalid years
    pre_year_filter = len(species_df)
    species_df = species_df[np.isfinite(species_df['year'])].copy()
    print(f"Clean occurrences: {len(species_df):,} (removed {pre_year_filter - len(species_df):,} invalid years)")

    if len(species_df) == 0:
        print("❌ No valid occurrences")
        return []

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
        print(f"After IQR filter: {len(species_df):,} (removed {pre_filter - len(species_df):,} extremes)")

    # Sample if too large
    if len(species_df) > max_samples:
        species_df = species_df.sample(n=max_samples, random_state=42)
        print(f"Sampled to: {len(species_df):,}")

    # Map occurrence years to GEE years
    print(f"\n🔄 Mapping occurrence years to GEE imagery years...")

    def map_to_gee_year(occ_year):
        if occ_year < 2018:
            return 2018
        elif occ_year > 2024:
            return None
        else:
            return int(occ_year)

    species_df['gee_year'] = species_df['year'].apply(map_to_gee_year)

    # Remove occurrences with no GEE year (>2024)
    pre_filter = len(species_df)
    species_df = species_df[species_df['gee_year'].notna()].copy()
    removed_future = pre_filter - len(species_df)
    if removed_future > 0:
        print(f"   Removed {removed_future:,} occurrences with year > 2024")

    # Show year mapping distribution
    print(f"\n📊 Year mapping:")
    print(f"   Occurrence range: {int(species_df['year'].min())} - {int(species_df['year'].max())}")
    gee_year_counts = species_df['gee_year'].value_counts().sort_index()
    for gee_year, count in gee_year_counts.items():
        print(f"      {int(gee_year)}: {count:,} occurrences")
    print(f"   Total: {len(species_df):,}")

    # Compute bounding box
    min_lat = float(species_df['decimalLatitude'].min())
    max_lat = float(species_df['decimalLatitude'].max())
    min_lon = float(species_df['decimalLongitude'].min())
    max_lon = float(species_df['decimalLongitude'].max())
    bbox_list = [min_lon, min_lat, max_lon, max_lat]
    bbox_geom = ee.Geometry.Rectangle(bbox_list)
    print(f"📐 Bbox: [{min_lon:.2f}, {min_lat:.2f}, {max_lon:.2f}, {max_lat:.2f}]")

    print("🔄 Loading Alpha Earth collection...")
    alpha_earth = ee.ImageCollection('GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL')

    # Binary land mask
    land_image = ee.Image('MODIS/006/MCD12Q1/2018_01_01').select('LC_Type1')
    binary_land_mask = land_image.neq(17).rename('is_land')

    print("🔄 Creating points FeatureCollection...")
    features = []
    for idx, row in species_df.iterrows():
        point = ee.Geometry.Point([row['decimalLongitude'], row['decimalLatitude']])
        feat = ee.Feature(point, {
            'occurrence_id': str(idx),
            'lat': row['decimalLatitude'],
            'lon': row['decimalLongitude'],
            'occurrence_year': int(row['year']),
            'gee_year': int(row['gee_year'])
        })
        features.append(feat)
    points_fc = ee.FeatureCollection(features)

    # Server-side land filter
    land_sampled = binary_land_mask.sampleRegions(
        collection=points_fc,
        properties=['occurrence_id', 'lat', 'lon', 'occurrence_year', 'gee_year'],
        scale=500,
        geometries=True
    )
    points_fc_land = land_sampled.filter(ee.Filter.gt('is_land', 0))

    try:
        fc_size = points_fc_land.size().getInfo()
        print(f"✅ Land points: {fc_size}")
    except Exception as e:
        print(f"⚠️ FC size fetch failed: {e}")
        fc_size = 0

    if fc_size == 0:
        print("❌ Empty FC after land filter")
        return []

    # Get unique GEE years
    unique_gee_years = sorted([int(y) for y in species_df['gee_year'].unique()])
    print(f"\n🚀 Year-matched sampling for {len(unique_gee_years)} years: {unique_gee_years}")

    # Sample year-matched
    def sample_year_matched(year, points_for_year):
        start_date = ee.Date.fromYMD(year, 1, 1)
        end_date = start_date.advance(1, 'year')

        year_collection = (alpha_earth
                          .filterDate(start_date, end_date)
                          .filterBounds(bbox_geom))

        year_image = year_collection.mosaic()

        sampled = year_image.sampleRegions(
            collection=points_for_year,
            properties=['occurrence_id', 'lat', 'lon', 'occurrence_year', 'gee_year'],
            scale=250,
            geometries=False,
            tileScale=16
        )

        sampled_valid = sampled.filter(ee.Filter.notNull(['A00']))
        return sampled_valid

    print("🔄 Building year-matched sampled FC...")
    all_sampled_fc = ee.FeatureCollection([])

    for gee_year in unique_gee_years:
        print(f"    Processing year {gee_year}...")
        points_for_this_year = points_fc_land.filter(ee.Filter.eq('gee_year', gee_year))
        yearly_fc = sample_year_matched(gee_year, points_for_this_year)
        all_sampled_fc = all_sampled_fc.merge(yearly_fc)

    # Check total count
    try:
        total_valid = all_sampled_fc.size().getInfo()
        print(f"\n📊 Total year-matched embeddings: {total_valid:,}")
    except Exception as e:
        print(f"⚠️ Count fetch failed: {e}")

    # Export
    print(f"\n🔄 Exporting...")
    safe_name = species_name.replace(' ', '_').replace('/', '_')
    task_desc = f'{safe_name}_year_matched_embeddings_64d'

    task = ee.batch.Export.table.toDrive(
        collection=all_sampled_fc,
        description=task_desc,
        folder='species_year_matched_embeddings',
        fileFormat='CSV'
    )
    task.start()

    print(f"   ✅ Export task: {task_desc}")
    print(f"   📁 Folder: species_year_matched_embeddings/")
    print(f"   🔗 Monitor: https://code.earthengine.google.com/tasks")

    return [task]


def main():
    print("="*70)
    print("BATCH EXTRACTION: 10 MORE SPECIES")
    print("="*70)

    if not initialize_gee():
        return

    print(f"\n📂 Loading species data...")
    try:
        df = pd.read_parquet('Treekipedia_occ_YEAR_LatLong_October30d.parquet')
        print(f"✅ Loaded: {len(df):,} occurrences")
        print(f"📋 Columns: {df.columns.tolist()}")
    except Exception as e:
        print(f"❌ Failed to load parquet: {e}")
        return

    # Get top species (skip Acer rubrum which was already done)
    top_species = df['species_scientific_name'].value_counts().head(11).index.tolist()[1:11]

    print(f"\n🌳 Extracting 10 species:")
    for i, sp in enumerate(top_species, 1):
        print(f"   {i}. {sp}")

    print(f"\n{'='*70}")
    print("Starting extractions... (10-15 seconds pause between species)")
    print(f"{'='*70}\n")

    for i, species_name in enumerate(top_species, 1):
        print(f"\n\n{'#'*70}")
        print(f"# SPECIES {i}/10")
        print(f"{'#'*70}")

        extract_server_side_signature(df, species_name, max_samples=5000)

        if i < len(top_species):
            print(f"\n⏳ Pausing 10 seconds before next species...")
            time.sleep(10)

    print(f"\n\n{'='*70}")
    print("✅ ALL 10 SPECIES SUBMITTED!")
    print("="*70)
    print("\nNEXT STEPS:")
    print("1. ⏳ Wait for GEE tasks to complete (check tasks panel)")
    print("2. 📥 Download CSVs from Google Drive folder: species_year_matched_embeddings/")
    print("3. 📊 Run aggregation script to create signatures")


if __name__ == "__main__":
    main()
