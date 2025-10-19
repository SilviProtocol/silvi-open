#!/usr/bin/env python3
"""
Extract Google Alpha Earth Tile Embeddings for Tree Species Occurrences
Uses GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL dataset
"""

import pandas as pd
import numpy as np
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

def load_satellite_embeddings(year=None):
    """
    Load Google Alpha Earth satellite embeddings

    Args:
        year: Specific year (2017-present), or None for all years

    Returns:
        ee.ImageCollection with 64 bands (A00-A63) per image
    """
    print(f"Loading GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL...")

    embeddings = ee.ImageCollection('GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL')

    if year:
        embeddings = embeddings.filter(ee.Filter.calendarRange(year, year, 'year'))
        print(f"  Filtered to year: {year}")

    # Get available years
    years = embeddings.aggregate_array('system:time_start').getInfo()
    if years:
        years_readable = [ee.Date(t).format('YYYY').getInfo() for t in years[:5]]
        print(f"  Available years (sample): {years_readable}")

    print(f"  Resolution: 10m × 10m")
    print(f"  Bands: A00-A63 (64-dimensional embeddings)")
    print(f"  Properties: Unit-length vectors (normalized)")

    return embeddings

def create_temporal_embedding_statistics(embeddings_collection):
    """
    Calculate temporal statistics across all years for each embedding dimension
    Preserves temporal information without naive averaging

    Returns:
        ee.Image with bands: A00_mean, A00_std, A00_min, A00_max, ... (64 × 4 = 256 bands)
    """
    print("Creating temporal embedding statistics...")

    # Calculate statistics across time for each of the 64 dimensions
    mean_img = embeddings_collection.mean().rename(
        [f'A{i:02d}_mean' for i in range(64)]
    )

    stddev_img = embeddings_collection.reduce(ee.Reducer.stdDev()).rename(
        [f'A{i:02d}_std' for i in range(64)]
    )

    min_img = embeddings_collection.min().rename(
        [f'A{i:02d}_min' for i in range(64)]
    )

    max_img = embeddings_collection.max().rename(
        [f'A{i:02d}_max' for i in range(64)]
    )

    # Combine into single image with 256 bands
    temporal_stats = ee.Image.cat([mean_img, stddev_img, min_img, max_img])

    print(f"  ✅ Created 256 temporal statistics bands:")
    print(f"     - 64 × mean (central tendency)")
    print(f"     - 64 × std (temporal variability)")
    print(f"     - 64 × min (minimum state)")
    print(f"     - 64 × max (maximum state)")

    return temporal_stats

def extract_embeddings_for_species(df, species_name, embeddings_stats, use_batches=False, batch_size=1000):
    """
    Extract embedding statistics for all occurrences of a species

    Args:
        df: DataFrame with species occurrences
        species_name: Name of species to extract
        embeddings_stats: ee.Image with temporal statistics
        use_batches: If True, split into batches; if False, extract all at once
        batch_size: Number of occurrences per batch (if use_batches=True)

    Returns:
        List of GEE export tasks
    """
    print(f"\n{'='*60}")
    print(f"EXTRACTING EMBEDDINGS: {species_name}")
    print(f"{'='*60}")

    # Filter to species
    species_data = df[df['species'] == species_name].copy()
    print(f"Total occurrences: {len(species_data):,}")

    # Clean coordinates (full global range)
    clean_data = species_data[
        (species_data['decimalLatitude'].between(-90, 90)) &
        (species_data['decimalLongitude'].between(-180, 180)) &
        (species_data['decimalLatitude'].notna()) &
        (species_data['decimalLongitude'].notna())
    ]
    print(f"Clean occurrences: {len(clean_data):,} (lost {len(species_data) - len(clean_data)})")

    if len(clean_data) == 0:
        print("❌ No valid occurrences after cleaning")
        return []

    tasks = []

    if not use_batches:
        # SINGLE EXPORT - All occurrences at once
        print(f"\n📦 Processing ALL {len(clean_data):,} occurrences in single export")

        # Create point features
        points = []
        for idx, row in clean_data.iterrows():
            point = ee.Geometry.Point([row['decimalLongitude'], row['decimalLatitude']])
            feature = ee.Feature(point, {
                'species': species_name,
                'occurrence_id': int(idx),
                'lat': row['decimalLatitude'],
                'lon': row['decimalLongitude']
            })
            points.append(feature)

        points_fc = ee.FeatureCollection(points)

        # Sample embeddings at 10m resolution (native resolution of embeddings)
        sampled = embeddings_stats.sampleRegions(
            collection=points_fc,
            scale=10,           # 10m native resolution
            geometries=False,   # No need for geometries
            tileScale=4         # Increase tileScale for large dataset
        )

        # Export to Google Drive
        safe_species_name = species_name.replace(' ', '_').replace('/', '_')
        task_desc = f'embeddings_{safe_species_name}_ALL'

        task = ee.batch.Export.table.toDrive(
            collection=sampled,
            description=task_desc,
            folder='species_embeddings',
            fileFormat='CSV'
        )

        task.start()
        tasks.append((task, task_desc, len(clean_data)))
        print(f"  ✅ Started: {task_desc} (expected: {len(clean_data):,} rows)")
        print(f"  ⚠️  If this fails with 'computation too complex', rerun with use_batches=True")

    else:
        # BATCHED EXPORT - Original approach
        total_batches = (len(clean_data) + batch_size - 1) // batch_size
        print(f"\n📦 Processing in {total_batches} batches of {batch_size}")

        for batch_idx in range(total_batches):
            start_idx = batch_idx * batch_size
            end_idx = min(start_idx + batch_size, len(clean_data))
            batch_df = clean_data.iloc[start_idx:end_idx]

            print(f"  Batch {batch_idx + 1}/{total_batches}: {len(batch_df)} occurrences")

            # Create point features
            points = []
            for idx, row in batch_df.iterrows():
                point = ee.Geometry.Point([row['decimalLongitude'], row['decimalLatitude']])
                feature = ee.Feature(point, {
                    'species': species_name,
                    'occurrence_id': int(idx),
                    'lat': row['decimalLatitude'],
                    'lon': row['decimalLongitude']
                })
                points.append(feature)

            points_fc = ee.FeatureCollection(points)

            # Sample embeddings at 10m resolution (native resolution of embeddings)
            sampled = embeddings_stats.sampleRegions(
                collection=points_fc,
                scale=10,           # 10m native resolution
                geometries=False,   # No need for geometries
                tileScale=2         # Reduce boundary artifacts
            )

            # Export to Google Drive
            safe_species_name = species_name.replace(' ', '_').replace('/', '_')
            task_desc = f'embeddings_{safe_species_name}_batch_{batch_idx:03d}'

            task = ee.batch.Export.table.toDrive(
                collection=sampled,
                description=task_desc,
                folder='species_embeddings',
                fileFormat='CSV'
            )

            task.start()
            tasks.append((task, task_desc, len(batch_df)))
            print(f"    ✅ Started: {task_desc}")

            # Brief pause
            time.sleep(0.5)

    print(f"\n🎯 {len(tasks)} task(s) submitted for {species_name}")
    print(f"📁 Output folder: species_embeddings/")
    print(f"🔗 Monitor: https://code.earthengine.google.com/tasks")

    return tasks

def aggregate_species_embeddings(csv_files, output_format='both'):
    """
    Aggregate individual occurrence embeddings to species-level signature

    Args:
        csv_files: List of CSV file paths with individual occurrence embeddings
        output_format: 'csv', 'geoparquet', or 'both'

    Returns:
        DataFrame with species-level embedding signature (256 dimensions)
    """
    print("\n" + "="*60)
    print("AGGREGATING TO SPECIES-LEVEL SIGNATURE")
    print("="*60)

    # Load all batch files
    all_data = []
    for csv_file in csv_files:
        df = pd.read_csv(csv_file)
        all_data.append(df)

    combined = pd.concat(all_data, ignore_index=True)
    print(f"Total occurrences loaded: {len(combined):,}")

    # Get embedding columns (256 statistical bands)
    embedding_cols = [col for col in combined.columns
                     if col.startswith('A') and any(x in col for x in ['_mean', '_std', '_min', '_max'])]
    print(f"Embedding dimensions: {len(embedding_cols)}")

    # Aggregate across all occurrences (spatial averaging)
    species_signature = {}
    species_signature['species'] = combined['species'].iloc[0]
    species_signature['n_occurrences'] = len(combined)

    # Calculate mean across all occurrence locations for each temporal stat
    for col in embedding_cols:
        species_signature[col] = combined[col].mean()

    # Also calculate spatial variability (how much embeddings vary across species range)
    for col in embedding_cols:
        species_signature[f'{col}_spatial_std'] = combined[col].std()

    signature_df = pd.DataFrame([species_signature])

    print(f"\n📊 Species Signature Created:")
    print(f"   - Species: {species_signature['species']}")
    print(f"   - Occurrences: {species_signature['n_occurrences']:,}")
    print(f"   - Dimensions: {len(embedding_cols)} temporal stats")
    print(f"   - Plus: {len(embedding_cols)} spatial variability metrics")
    print(f"   - Total features: {len(embedding_cols) * 2} dimensions")

    return signature_df

def convert_csv_to_geoparquet(csv_file, output_file=None):
    """
    Convert CSV with lat/lon to GeoParquet format

    Args:
        csv_file: Path to CSV file with lat/lon columns
        output_file: Output path (defaults to same name with .geoparquet extension)

    Returns:
        Path to created GeoParquet file
    """
    try:
        import geopandas as gpd
        from shapely.geometry import Point

        print(f"\n📦 Converting CSV to GeoParquet: {csv_file}")

        # Read CSV
        df = pd.read_csv(csv_file)
        print(f"  Loaded: {len(df):,} rows")

        # Check for coordinate columns
        if 'lat' in df.columns and 'lon' in df.columns:
            lat_col, lon_col = 'lat', 'lon'
        elif 'decimalLatitude' in df.columns and 'decimalLongitude' in df.columns:
            lat_col, lon_col = 'decimalLatitude', 'decimalLongitude'
        else:
            print("  ❌ No lat/lon columns found")
            return None

        # Create geometry
        geometry = [Point(xy) for xy in zip(df[lon_col], df[lat_col])]
        gdf = gpd.GeoDataFrame(df, geometry=geometry, crs='EPSG:4326')

        # Output file
        if output_file is None:
            output_file = csv_file.replace('.csv', '.geoparquet')

        # Save as GeoParquet
        gdf.to_parquet(output_file, compression='snappy')

        # File size comparison
        import os
        csv_size = os.path.getsize(csv_file) / (1024**2)  # MB
        gpq_size = os.path.getsize(output_file) / (1024**2)  # MB
        compression_ratio = (1 - gpq_size/csv_size) * 100

        print(f"  ✅ Saved: {output_file}")
        print(f"  📊 Size: CSV={csv_size:.2f}MB → GeoParquet={gpq_size:.2f}MB ({compression_ratio:.1f}% smaller)")

        return output_file

    except ImportError:
        print("  ❌ GeoPandas not installed. Install with: pip install geopandas")
        return None
    except Exception as e:
        print(f"  ❌ Error: {e}")
        return None

def extract_test_species_embeddings():
    """
    Extract embeddings for the test species (Quercus coccifera with 5000 occurrences)
    """
    print("GOOGLE ALPHA EARTH EMBEDDING EXTRACTION")
    print("="*60)
    print("Dataset: GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL")
    print("Resolution: 10m × 10m pixels")
    print("Embeddings: 64 dimensions (A00-A63)")
    print("Temporal: 2017-present annual composites")
    print("="*60)

    # Initialize GEE
    if not initialize_gee():
        return

    # Load embeddings
    embeddings = load_satellite_embeddings()

    # Create temporal statistics (preserves temporal info without naive averaging)
    temporal_stats = create_temporal_embedding_statistics(embeddings)

    # Load species data
    print("\n📂 Loading species occurrence data...")
    df = pd.read_parquet('species_data.parquet')
    print(f"Total dataset: {len(df):,} occurrences, {df['species'].nunique():,} species")

    # Use same test species from comparison
    test_species = 'Quercus coccifera'
    species_data = df[df['species'] == test_species]

    # Sample 5000 for consistency with previous test
    if len(species_data) > 5000:
        species_data = species_data.sample(n=5000, random_state=42)

    print(f"\nTest species: {test_species}")
    print(f"Sample size: {len(species_data):,} occurrences")

    # Extract embeddings - try all at once first
    tasks = extract_embeddings_for_species(
        species_data,
        test_species,
        temporal_stats,
        use_batches=False  # Try single export first
    )

    print(f"\n{'='*60}")
    print("EXTRACTION COMPLETE")
    print(f"{'='*60}")
    print(f"✅ {len(tasks)} tasks submitted")
    print(f"⏱️  Expected time: 5-10 minutes")
    print(f"📥 Next steps:")
    print(f"   1. Wait for tasks to complete")
    print(f"   2. Download CSVs from Google Drive: species_embeddings/")
    print(f"   3. Run aggregate_species_embeddings() to create species signature")

    return tasks

if __name__ == "__main__":
    # Extract embeddings for test species
    tasks = extract_test_species_embeddings()
