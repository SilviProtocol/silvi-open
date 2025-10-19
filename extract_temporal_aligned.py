#!/usr/bin/env python3
"""
STEP 1: GEE EXTRACTION WITH TEMPORAL ALIGNMENT
Extract embeddings matched to occurrence observation year

Rule: If occurrence.year < 2017, use 2017 embeddings
      Otherwise, use embeddings from occurrence.year
"""

import pandas as pd
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
    """Get available years from Alpha Earth dataset"""
    embeddings = ee.ImageCollection('GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL')
    years_ms = embeddings.aggregate_array('system:time_start').getInfo()
    years = sorted([int(ee.Date(t).format('YYYY').getInfo()) for t in years_ms])
    return years

def extract_with_temporal_alignment(df, species_name, earliest_year):
    """
    Extract embeddings with temporal alignment

    Each occurrence gets 64-dimensional embedding from its observation year
    """
    print(f"\n{'='*70}")
    print(f"EXTRACTING: {species_name}")
    print(f"{'='*70}")

    # Filter to species
    species_df = df[df['species'] == species_name].copy()
    print(f"Total occurrences: {len(species_df):,}")

    # Clean data
    species_df = species_df[
        (species_df['decimalLatitude'].between(-90, 90)) &
        (species_df['decimalLongitude'].between(-180, 180)) &
        (species_df['decimalLatitude'].notna()) &
        (species_df['decimalLongitude'].notna()) &
        (species_df['year'].notna())
    ].copy()

    print(f"Clean occurrences: {len(species_df):,}")

    if len(species_df) == 0:
        print("❌ No valid occurrences")
        return []

    # Apply temporal alignment rule
    def align_year(obs_year):
        return earliest_year if obs_year < earliest_year else int(obs_year)

    species_df['embedding_year'] = species_df['year'].apply(align_year)

    # Show alignment stats
    print(f"\n📅 Temporal Alignment:")
    print(f"  Observation years: {int(species_df['year'].min())} - {int(species_df['year'].max())}")
    print(f"  Before {earliest_year}: {sum(species_df['year'] < earliest_year)} occurrences → using {earliest_year}")
    print(f"  From {earliest_year}+: {sum(species_df['year'] >= earliest_year)} occurrences → using exact year")

    # Load Alpha Earth collection
    alpha_earth = ee.ImageCollection('GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL')

    # Group by embedding year and extract
    tasks = []
    year_groups = species_df.groupby('embedding_year')

    print(f"\n🚀 Extracting by year:")

    for emb_year, year_df in year_groups:
        emb_year = int(emb_year)
        print(f"\n  Year {emb_year}: {len(year_df)} occurrences")

        # Get embeddings for this specific year
        year_image = alpha_earth.filter(
            ee.Filter.calendarRange(emb_year, emb_year, 'year')
        ).first()

        # Create features
        features = []
        for idx, row in year_df.iterrows():
            point = ee.Geometry.Point([row['decimalLongitude'], row['decimalLatitude']])
            feature = ee.Feature(point, {
                'species': species_name,
                'occurrence_id': str(idx),
                'lat': row['decimalLatitude'],
                'lon': row['decimalLongitude'],
                'observation_year': int(row['year']),
                'embedding_year': emb_year
            })
            features.append(feature)

        fc = ee.FeatureCollection(features)

        # Sample embeddings at exact points (10m resolution, no buffer)
        sampled = year_image.sampleRegions(
            collection=fc,
            scale=10,
            geometries=False,
            tileScale=4
        )

        # Export to Drive
        safe_name = species_name.replace(' ', '_').replace('/', '_')
        task_desc = f'{safe_name}_year_{emb_year}'

        task = ee.batch.Export.table.toDrive(
            collection=sampled,
            description=task_desc,
            folder='embeddings_temporal_aligned',
            fileFormat='CSV'
        )

        task.start()
        tasks.append({'task': task, 'description': task_desc, 'count': len(year_df)})
        print(f"    ✅ Task: {task_desc} ({len(year_df)} occurrences)")

        time.sleep(0.5)

    print(f"\n{'='*70}")
    print(f"✅ {len(tasks)} tasks submitted")
    print(f"📁 Folder: Google Drive/embeddings_temporal_aligned/")
    print(f"🔗 Monitor: https://code.earthengine.google.com/tasks")
    print(f"\n📊 OUTPUT PER FILE:")
    print(f"  Columns: species, occurrence_id, lat, lon, observation_year, embedding_year, A00-A63")
    print(f"  Total rows across all files: {len(species_df):,}")

    return tasks

def run_extraction():
    """Main extraction workflow"""
    print("="*70)
    print("STEP 1: TEMPORAL-ALIGNED EXTRACTION (GEE)")
    print("="*70)

    if not initialize_gee():
        return

    # Get available years
    available_years = get_available_years()
    print(f"Alpha Earth years: {available_years[0]} - {available_years[-1]}")
    earliest_year = available_years[0]

    # Load data
    print(f"\n📂 Loading species data...")
    df = pd.read_parquet('species_data.parquet')
    print(f"Total: {len(df):,} occurrences, {df['species'].nunique():,} species")

    # Check for year column
    if 'year' not in df.columns:
        print("❌ 'year' column required")
        return

    # Test species
    test_species = 'Quercus coccifera'
    species_df = df[df['species'] == test_species]

    # Sample 5000
    if len(species_df) > 5000:
        species_df = species_df.sample(n=5000, random_state=42)

    print(f"\nTest species: {test_species}")
    print(f"Sample size: {len(species_df):,}")

    # Extract
    tasks = extract_with_temporal_alignment(
        species_df,
        test_species,
        earliest_year=earliest_year
    )

    print(f"\n{'='*70}")
    print("NEXT STEPS:")
    print("="*70)
    print("1. ⏳ Wait 5-10 min for GEE tasks to complete")
    print("2. 📥 Download CSVs from Google Drive/embeddings_temporal_aligned/")
    print("3. 🐍 Run: python aggregate_species_signature.py")
    print("   → Creates species signature: Median + Std + P10 + P90")
    print("   → Result: 256 features (64 dimensions × 4 statistics)")

if __name__ == "__main__":
    run_extraction()
