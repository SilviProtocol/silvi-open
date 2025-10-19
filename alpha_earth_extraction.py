#!/usr/bin/env python3
"""
ALPHA EARTH EMBEDDINGS EXTRACTION
Extract 64-dimensional embeddings from Google's Satellite Embedding dataset
Powered by AlphaEarth Foundations - DeepMind
"""

import pandas as pd
import ee
import time

def initialize_gee():
    """Initialize Google Earth Engine"""
    try:
        ee.Initialize(project='treekipedia')
        print("✅ GEE initialized successfully")
        return True
    except Exception as e:
        print(f"❌ GEE initialization failed: {e}")
        return False

def get_alpha_earth_embeddings(year=2024):
    """
    Access Google's Satellite Embedding dataset (AlphaEarth Foundations)

    Returns 64-dimensional embeddings representing:
    - Temporal trajectories of surface conditions
    - Multi-sensor data fusion (Sentinel-2, Sentinel-1, Landsat)
    - Cloud-free, artifact-free representations
    - 10m spatial resolution globally
    """

    print(f"🌍 Loading AlphaEarth Satellite Embeddings for {year}...")

    # Access Google's Satellite Embedding dataset
    satellite_embeddings = ee.ImageCollection('GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL') \
                            .filterDate(f'{year}-01-01', f'{year}-12-31') \
                            .first()

    # The dataset contains 64 embedding dimensions
    embedding_bands = satellite_embeddings.bandNames().getInfo()
    print(f"🤖 AlphaEarth provides {len(embedding_bands)} embedding dimensions")
    print(f"📊 Each pixel = 64D vector representing Earth surface conditions")

    return satellite_embeddings

def test_alpha_earth_access():
    """Test access to AlphaEarth embeddings"""
    print("🧪 TESTING ALPHA EARTH EMBEDDING ACCESS")
    print("=" * 50)

    if not initialize_gee():
        return False

    try:
        # Get embeddings for 2024
        embeddings = get_alpha_earth_embeddings(2024)

        # Test sampling at NYC
        test_point = ee.Geometry.Point([-74.0, 40.7])

        # Sample the embeddings
        sample = embeddings.sample(test_point, 10).first()
        sample_data = sample.getInfo()

        print("✅ Successfully accessed AlphaEarth embeddings!")
        print(f"📊 Sample embedding for NYC (first 10 dimensions):")

        properties = sample_data['properties']
        for i, (band, value) in enumerate(list(properties.items())[:10]):
            print(f"  Embedding_{i:02d}: {value:.4f}")

        print(f"\n🎯 Total embedding dimensions: {len(properties)}")
        print("✅ AlphaEarth embeddings ready for extraction!")

        return True

    except Exception as e:
        print(f"❌ Error accessing AlphaEarth embeddings: {e}")
        return False

def extract_alpha_earth_batch(df_batch, embeddings, batch_id, year=2024):
    """Extract AlphaEarth embeddings for a batch of species occurrences"""

    print(f"🤖 Processing AlphaEarth batch {batch_id}: {len(df_batch)} occurrences...")

    # Create points from coordinates
    points = []
    for idx, row in df_batch.iterrows():
        point = ee.Geometry.Point([row['decimalLongitude'], row['decimalLatitude']])
        points.append(ee.Feature(point, {
            'species': row['species'],
            'original_index': int(idx),
            'lat': row['decimalLatitude'],
            'lon': row['decimalLongitude'],
            'year': year
        }))

    # Create FeatureCollection
    points_fc = ee.FeatureCollection(points)

    # Sample AlphaEarth embeddings at species occurrence points
    sampled = embeddings.sampleRegions(
        collection=points_fc,
        scale=10,  # AlphaEarth is at 10m resolution
        geometries=True
    )

    # Export to Google Drive
    task = ee.batch.Export.table.toDrive(
        collection=sampled,
        description=f'alpha_earth_batch_{batch_id}_{year}',
        folder='alpha_earth_embeddings',
        fileFormat='CSV'
    )

    task.start()
    print(f"✅ Started AlphaEarth export task for batch {batch_id}")
    return task

def process_species_with_alpha_earth():
    """
    Complete workflow to extract AlphaEarth embeddings for 100 species
    """
    print("🤖 ALPHA EARTH EMBEDDINGS EXTRACTION FOR 100 SPECIES")
    print("=" * 60)

    # Step 1: Test AlphaEarth access
    if not test_alpha_earth_access():
        print("❌ Cannot access AlphaEarth embeddings")
        return

    print("\n" + "="*60)

    # Step 2: Load species data
    print("📊 Loading species occurrence data...")
    df = pd.read_parquet('species_data.parquet')

    # Filter to top 100 species
    species_counts = df['species'].value_counts()
    top_species = species_counts[species_counts >= 500].head(100)
    df_filtered = df[df['species'].isin(top_species.index)].copy()

    # Remove invalid coordinates
    df_filtered = df_filtered[
        (df_filtered['decimalLatitude'].between(-60, 75)) &
        (df_filtered['decimalLongitude'].between(-180, 180)) &
        (df_filtered['decimalLatitude'].notna()) &
        (df_filtered['decimalLongitude'].notna())
    ]

    print(f"🎯 Selected {df_filtered['species'].nunique()} species")
    print(f"📊 Processing {len(df_filtered):,} total occurrences")

    # Step 3: Get AlphaEarth embeddings for 2024
    embeddings = get_alpha_earth_embeddings(2024)

    # Step 4: Process in batches
    batch_size = 1000
    total_batches = (len(df_filtered) + batch_size - 1) // batch_size
    tasks = []
    failed_batches = []

    print(f"\n🚀 STARTING ALPHA EARTH EXTRACTION:")
    print(f"  • Batch size: {batch_size}")
    print(f"  • Total batches: {total_batches}")
    print(f"  • Embedding dimensions: 64")
    print(f"  • Spatial resolution: 10m")
    print(f"  • Temporal coverage: 2024")

    user_confirm = input(f"\n🤖 Start AlphaEarth extraction of {len(df_filtered):,} records? (y/N): ")
    if user_confirm.lower() != 'y':
        print("❌ Extraction cancelled.")
        return

    for i in range(total_batches):
        start_idx = i * batch_size
        end_idx = min((i + 1) * batch_size, len(df_filtered))
        batch = df_filtered.iloc[start_idx:end_idx].copy()

        try:
            task = extract_alpha_earth_batch(batch, embeddings, i + 1, 2024)
            tasks.append(task)

            print(f"🤖 AlphaEarth batch {i + 1}/{total_batches} submitted ({len(batch)} records)")

            # Rate limiting
            if (i + 1) % 3 == 0:
                print(f"⏸️ Pausing for rate limiting...")
                time.sleep(30)

            if (i + 1) % 10 == 0:
                print(f"📊 Progress: {i + 1}/{total_batches} batches submitted")
                time.sleep(60)

        except Exception as e:
            print(f"❌ Error processing batch {i + 1}: {e}")
            failed_batches.append(i + 1)

    # Results summary
    print(f"\n🎉 ALPHA EARTH EXTRACTION INITIATED!")
    print("=" * 50)
    print(f"✅ {len(tasks)} AlphaEarth tasks submitted to GEE")
    print(f"🤖 Each occurrence will have 64 AlphaEarth embedding dimensions")
    print(f"📊 Processing {len(df_filtered):,} occurrences across {df_filtered['species'].nunique()} species")

    if failed_batches:
        print(f"⚠️ {len(failed_batches)} batches failed: {failed_batches}")

    print(f"\n📋 MONITORING & RESULTS:")
    print(f"1. 🖥️ Monitor: https://code.earthengine.google.com/tasks")
    print(f"2. 📁 Download from: Google Drive/alpha_earth_embeddings/")
    print(f"3. 📊 Format: species,lat,lon,embedding_00,embedding_01,...,embedding_63")
    print(f"4. 🤖 Each embedding dimension represents learned Earth surface patterns")
    print(f"5. 🌍 Data includes: multi-sensor fusion, cloud-free representations")

    print(f"\n🎯 WHAT YOU GET:")
    print(f"• 64-dimensional vectors per occurrence")
    print(f"• Pre-trained representations from DeepMind's AlphaEarth")
    print(f"• Multi-sensor data fusion (Sentinel-2, Sentinel-1, Landsat)")
    print(f"• 10m spatial resolution")
    print(f"• Analysis-ready features for ML models")

    return tasks, failed_batches

def compare_embeddings_across_years():
    """Optional: Extract embeddings for multiple years to study temporal changes"""
    print("📅 MULTI-YEAR ALPHA EARTH ANALYSIS")
    print("Extract embeddings for 2017-2024 to study environmental changes over time")

    years = [2020, 2021, 2022, 2023, 2024]

    for year in years:
        print(f"🗓️ Processing year {year}...")
        # Implementation for multi-year analysis
        # This could be extended for longitudinal studies

if __name__ == "__main__":
    print("🤖 ALPHA EARTH FOUNDATIONS EMBEDDING EXTRACTION")
    print("Powered by Google DeepMind's AlphaEarth model")
    print("Dataset: GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL")
    print()

    # Run the main extraction
    process_species_with_alpha_earth()