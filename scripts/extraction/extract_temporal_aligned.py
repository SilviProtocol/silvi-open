#!/usr/bin/env python3
"""
STEP 1: GEE EXTRACTION WITH YEAR-MATCHED TEMPORAL ALIGNMENT
Extract embeddings by matching each occurrence to its corresponding GEE imagery year.

KEY LOGIC (WITH Temporal Alignment):
- Occurrences provide: lat/lon + year
- GEE provides: 64D embeddings (A00-A63) from yearly images (2018-2024)
- Year matching strategy:
  * If occurrence year < 2018: use 2018 embedding (earliest available)
  * If 2018 ≤ occurrence year ≤ 2024: use THAT year's embedding (exact match)
  * If occurrence year > 2024: skip (no embedding available yet)
- For each occurrence: Sample ONLY its matched GEE year (not all years)
- Output: CSV with one row per occurrence containing its year-matched 64D embedding

This ensures temporal alignment between occurrence observation and satellite imagery.
"""

import pandas as pd
import numpy as np
import ee

def initialize_gee():
    """Initialize Google Earth Engine"""
    try:
        # !!! IMPORTANT: Replace 'treekipedia' with your GEE project ID !!!
        ee.Initialize(project='treekipedia') 
        print("✅ GEE initialized")
        return True
    except Exception as e:
        print(f"❌ GEE initialization failed: {e}")
        return False

def get_available_years():
    """Hardcoded years from GEE catalog (avoids slow aggregate_array.getInfo())"""
    # Use 2018-2024 (7 years) to match example; dataset has 2017 too but skipping for consistency
    return [2018, 2019, 2020, 2021, 2022, 2023, 2024]

def extract_server_side_signature(df, species_name, max_samples=5000, export_yearly=True):
    """
    Server-side: Sample embeddings with YEAR-MATCHED temporal alignment.
    Each occurrence is matched to its corresponding GEE imagery year.

    PROCESS OVERVIEW:
    ================
    1. For each occurrence (lat/lon + year):
       - Determine GEE year to use:
         * year < 2018 → use 2018
         * 2018 ≤ year ≤ 2024 → use that year
         * year > 2024 → skip
       - Sample Alpha Earth imagery from ONLY the matched year
       - Each sample = 64-dimensional embedding (bands A00-A63)

    2. Output CSV with year-matched embeddings:
       - One row per occurrence
       - Columns: occurrence_id, lat, lon, occurrence_year, gee_year, A00-A63
       - This CSV can then be used for aggregation (mean/std/p10/p90)

    Parameters:
    -----------
    df : DataFrame
        Species occurrence data with 'year' column
    species_name : str
        Name of species to extract
    max_samples : int
        Maximum number of points to sample (default 5000)
    export_yearly : bool
        Kept for compatibility but not used in this version

    This approach ensures temporal alignment between occurrence observation
    and satellite imagery year.
    """
    print(f"\n{'='*70}")
    print(f"EXTRACTING: {species_name} (Year-Matched Temporal Alignment)")
    print(f"{'='*70}")

    # Filter/clean species data - NOW includes year column
    # Support both 'species' and 'species_scientific_name' columns
    if 'species' in df.columns:
        species_col = 'species'
    elif 'species_scientific_name' in df.columns:
        species_col = 'species_scientific_name'
    else:
        print("❌ ERROR: No 'species' or 'species_scientific_name' column found!")
        print(f"   Available columns: {df.columns.tolist()}")
        return []

    species_df = df[df[species_col] == species_name].copy()

    # Check if year column exists
    if 'year' not in species_df.columns:
        print("❌ ERROR: No 'year' column found in dataframe!")
        print(f"   Available columns: {species_df.columns.tolist()}")
        return []

    # Clean coordinates and year
    species_df = species_df[
        (species_df['decimalLatitude'].between(-90, 90)) &
        (species_df['decimalLongitude'].between(-180, 180)) &
        (species_df['decimalLatitude'].notna()) &
        (species_df['decimalLongitude'].notna()) &
        (species_df['year'].notna())
    ].copy()

    # Filter out invalid years (infinity, NaN)
    pre_year_filter = len(species_df)
    species_df = species_df[np.isfinite(species_df['year'])].copy()
    print(f"Full clean occurrences: {len(species_df):,} (removed {pre_year_filter - len(species_df):,} invalid years)")

    if len(species_df) == 0:
        print("❌ No valid occurrences")
        return []

    # FIXED: Outlier filter using IQR (removes global misgeos; keeps native range)
    if len(species_df) > 10:  # Only if enough points
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
        print(f"After IQR outlier filter: {len(species_df):,} (removed {pre_filter - len(species_df):,} extremes)")
    else:
        lat_low, lat_high, lon_low, lon_high = -90, 90, -180, 180

    # Sample if too large (inside function for consistency)
    if len(species_df) > max_samples:
        species_df = species_df.sample(n=max_samples, random_state=42)
        print(f"Sampled to: {len(species_df):,}")

    # MAP OCCURRENCE YEARS TO GEE YEARS
    print(f"\n🔄 Mapping occurrence years to GEE imagery years...")

    def map_to_gee_year(occ_year):
        """Map occurrence year to available GEE year (2018-2024)"""
        if occ_year < 2018:
            return 2018  # Use earliest available
        elif occ_year > 2024:
            return None  # Skip - no imagery available yet
        else:
            return int(occ_year)  # Use exact year

    species_df['gee_year'] = species_df['year'].apply(map_to_gee_year)

    # Remove occurrences with no GEE year (>2024)
    pre_filter = len(species_df)
    species_df = species_df[species_df['gee_year'].notna()].copy()
    removed_future = pre_filter - len(species_df)
    if removed_future > 0:
        print(f"   Removed {removed_future:,} occurrences with year > 2024 (no GEE imagery)")

    # Show year mapping distribution
    print(f"\n📊 Year mapping summary:")
    print(f"   Occurrence year range: {int(species_df['year'].min())} - {int(species_df['year'].max())}")
    gee_year_counts = species_df['gee_year'].value_counts().sort_index()
    print(f"   GEE year distribution:")
    for gee_year, count in gee_year_counts.items():
        print(f"      {int(gee_year)}: {count:,} occurrences")
    print(f"   Total occurrences for extraction: {len(species_df):,}")

    # Compute bounding box from filtered points
    if len(species_df) > 0:
        min_lat = float(species_df['decimalLatitude'].min())
        max_lat = float(species_df['decimalLatitude'].max())
        min_lon = float(species_df['decimalLongitude'].min())
        max_lon = float(species_df['decimalLongitude'].max())
        bbox_list = [min_lon, min_lat, max_lon, max_lat]
        # Create GEE geometry for filtering tiles
        bbox_geom = ee.Geometry.Rectangle(bbox_list)
        print(f"📐 Species bbox: [{min_lon:.2f}, {min_lat:.2f}, {max_lon:.2f}, {max_lat:.2f}]")
    else:
        print("❌ No points after filtering")
        return []

    print("🔄 Loading Alpha Earth collection...")
    # Load Alpha Earth (2018–2024 available) - source of 64D embeddings
    alpha_earth = ee.ImageCollection('GOOGLE/SATELLITE_EMBEDDING/V1/ANNUAL')

    # Debug: Check collection size
    try:
        collection_size = alpha_earth.size().getInfo()
        print(f"   📊 Alpha Earth collection size: {collection_size} images")
        if collection_size == 0:
            print("   ❌ ERROR: Collection is empty! Check dataset access.")
            return []
    except Exception as e:
        print(f"   ⚠️ Could not check collection size: {e}")

    # Binary land mask
    land_image = ee.Image('MODIS/006/MCD12Q1/2018_01_01').select('LC_Type1')
    binary_land_mask = land_image.neq(17).rename('is_land')  # 17=water

    print("🔄 Creating points FeatureCollection with year info (server-side land filter next)...")
    # Build full FC client-side (fast, no getInfo()) - NOW includes occurrence year and gee_year
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

    # Server-side land filter - use coarser scale to be less restrictive
    # CRITICAL: Must keep geometries=True so points can be sampled later!
    land_sampled = binary_land_mask.sampleRegions(
        collection=points_fc,
        properties=['occurrence_id', 'lat', 'lon', 'occurrence_year', 'gee_year'],  # Keep ALL properties including years
        scale=500,      # Use coarser scale (500m) to be less restrictive
        geometries=True  # MUST BE TRUE - needed for sampling Alpha Earth later
    )
    # Filter to land-only points (is_land > 0)
    points_fc_land = land_sampled.filter(ee.Filter.gt('is_land', 0))

    # Safe size check (after land filter)
    try:
        fc_size = points_fc_land.size().getInfo()
        print(f"✅ FC created & filtered: {fc_size} land points (of {len(species_df)} total)")
    except Exception as e:
        print(f"⚠️ FC size fetch failed (ok, proceeding): {e}")
        fc_size = 0

    if fc_size == 0:
        print("❌ Empty FC after land filter—check if all points over water")
        return []

    # Get unique GEE years from our data (NOT all available years)
    unique_gee_years = sorted([int(y) for y in species_df['gee_year'].unique()])
    print(f"\n🚀 Year-matched sampling: {len(unique_gee_years)} unique GEE years needed: {unique_gee_years}")

    # Test single point to verify data access
    test_lat = float(species_df['decimalLatitude'].iloc[0])
    test_lon = float(species_df['decimalLongitude'].iloc[0])
    print(f"🧪 Testing single point: lat={test_lat:.2f}, lon={test_lon:.2f}")
    test_point = ee.Geometry.Point([test_lon, test_lat])
    test_fc = ee.FeatureCollection([ee.Feature(test_point)])

    # Check if we can get a 2018 image using date filtering
    # Alpha Earth uses system:time_start for year: 2018-01-01 00:00:00
    start_date = ee.Date.fromYMD(2018, 1, 1)
    end_date = start_date.advance(1, 'year')
    test_collection = alpha_earth.filterDate(start_date, end_date)
    try:
        test_col_size = test_collection.size().getInfo()
        print(f"   📊 2018 images in collection: {test_col_size}")
        if test_col_size == 0:
            print("   ❌ No 2018 images found!")
        else:
            print(f"   ℹ️  This is a tiled dataset - using mosaic() to combine tiles")
    except Exception as e:
        print(f"   ⚠️ Could not check 2018 collection: {e}")

    # FIXED: Use mosaic() to combine all tiles for the year (not first())
    test_image = test_collection.mosaic()

    # Test WITHOUT clipping - use higher scale for robustness
    if test_image:
        try:
            test_sampled = test_image.sampleRegions(
                collection=test_fc,
                properties=[],
                scale=250,  # Use 250m scale (Alpha Earth native resolution)
                geometries=False
            )
            test_feat = test_sampled.first()
            if test_feat:
                test_info = test_feat.getInfo()
                if test_info and 'properties' in test_info:
                    a00_val = test_info['properties'].get('A00')
                    if a00_val is not None:
                        print(f"      ✅ Test A00: {a00_val:.4f} (success!)")
                    else:
                        print(f"      ⚠️ Test A00: null (point may be masked)")
                else:
                    print(f"      ⚠️ Test: No properties in feature")
            else:
                print(f"      ⚠️ Test: Empty sampled collection")
        except Exception as e:
            print(f"      ⚠️ Test error: {e}")
    else:
        print(f"      ❌ Test image is None - collection may be empty")

    # Sample points for their MATCHED GEE year
    def sample_year_matched(year, points_for_year):
        """
        Sample ONLY the points that should use this GEE year.

        Parameters:
        -----------
        year : int
            The GEE year to sample from (2018-2024)
        points_for_year : ee.FeatureCollection
            Points that have gee_year == year
        """
        # Filter by date: year-01-01 to (year+1)-01-01
        start_date = ee.Date.fromYMD(year, 1, 1)
        end_date = start_date.advance(1, 'year')

        # Filter collection by date and bounds
        year_collection = (alpha_earth
                          .filterDate(start_date, end_date)
                          .filterBounds(bbox_geom))

        year_image = year_collection.mosaic()

        # Sample ONLY the points that should use this year
        sampled = year_image.sampleRegions(
            collection=points_for_year,
            properties=['occurrence_id', 'lat', 'lon', 'occurrence_year', 'gee_year'],  # Keep ALL metadata
            scale=250,      # Alpha Earth native resolution (250m)
            geometries=False,
            tileScale=16
        )

        # Drop fully masked (null A00)
        sampled_valid = sampled.filter(ee.Filter.notNull(['A00']))

        return sampled_valid

    print("🔄 Building year-matched sampled FC...")
    # Build FC by sampling each unique GEE year with its corresponding points
    all_sampled_fc = ee.FeatureCollection([])

    for gee_year in unique_gee_years:
        print(f"    Processing GEE year {gee_year}...")

        # Filter points_fc_land to ONLY points that should use this year
        points_for_this_year = points_fc_land.filter(ee.Filter.eq('gee_year', gee_year))

        # Sample these points from this year's imagery
        yearly_fc = sample_year_matched(gee_year, points_for_this_year)

        print(f"      → Year {gee_year}: Sampled (year-matched)")

        # Merge into master collection
        all_sampled_fc = all_sampled_fc.merge(yearly_fc)

    # Check total count
    try:
        total_valid = all_sampled_fc.size().getInfo()
        print(f"\n📊 Total year-matched embeddings: {total_valid:,} (of {len(species_df):,} occurrences)")
        if total_valid < len(species_df) * 0.5:
            print(f"      ⚠️ Low success rate - many points may be masked/over water")
    except Exception as e:
        print(f"⚠️ Count fetch failed (export may still succeed): {e}")
        total_valid = 0

    # EXPORT YEAR-MATCHED EMBEDDINGS
    print(f"\n🔄 Exporting year-matched embeddings...")
    safe_name = species_name.replace(' ', '_').replace('/', '_')
    task_desc = f'{safe_name}_year_matched_embeddings_64d'

    # Export the full collection with ALL year-matched embeddings
    task = ee.batch.Export.table.toDrive(
        collection=all_sampled_fc,
        description=task_desc,
        folder='species_year_matched_embeddings',
        fileFormat='CSV'
    )
    task.start()

    print(f"      ✅ Export task: {task_desc}")
    print(f"📁 Output folder: Google Drive/species_year_matched_embeddings/")
    print(f"📊 Output format: One row per occurrence with columns:")
    print(f"      • Metadata: occurrence_id, lat, lon, occurrence_year, gee_year")
    print(f"      • Embeddings: A00-A63 (64 bands)")
    print(f"      • Total columns: ~70")
    print(f"\n🔗 Monitor task: https://code.earthengine.google.com/tasks")
    print(f"\n💡 Next step: Download CSV and aggregate to create signature")
    print(f"   • Can compute mean/std/p10/p90 across all embeddings")
    print(f"   • Or analyze temporal patterns by grouping by gee_year")

    return [task]

def run_extraction():
    """Main extraction workflow with year-matched temporal alignment"""
    print("="*70)
    print("STEP 1: YEAR-MATCHED EXTRACTION (GEE WITH Temporal Alignment)")
    print("="*70)

    if not initialize_gee():
        return

    # Get available years (hardcoded to avoid hang)
    available_years = get_available_years()
    print(f"Alpha Earth years: {available_years[0]} - {available_years[-1]}")
    print(f"⚙️  Sampling Strategy: YEAR-MATCHED (each occurrence → its GEE year)")
    print("   • year < 2018: use 2018 imagery")
    print("   • 2018 ≤ year ≤ 2024: use exact year imagery")
    print("   • year > 2024: skip (no imagery)")

    print(f"\n📂 Loading species data...")
    try:
        df = pd.read_parquet('Treekipedia_occ_Year_october24d.parquet')
        print(f"✅ Loaded: {len(df):,} occurrences, {df['species'].nunique():,} species")
        print(f"📋 Available columns: {df.columns.tolist()}")
        if 'year' in df.columns:
            print(f"✅ 'year' column found → Year-matched sampling enabled")
        else:
            print(f"❌ No 'year' column found!")
            return
    except Exception as e:
        print(f"❌ Failed to load parquet: {e}")
        return

    # Test species - use Acer rubrum (top species with 2.3M occurrences)
    test_species = 'Acer rubrum'
    if test_species not in df['species'].values:
        # Fallback to first species
        test_species = df['species'].iloc[0]
        print(f"⚠️ Acer rubrum not found. Using: {test_species}")

    print(f"\nTest species: {test_species}")

    # Extract with year-matching
    extract_server_side_signature(
        df,  # Pass full df with year column
        test_species,
        max_samples=5000,
        export_yearly=False  # We export one combined CSV instead
    )

    print(f"\n{'='*70}")
    print("✅ Extraction complete! Check tasks panel.")
    print("NEXT STEPS:")
    print("="*70)
    print("1. ⏳ Wait 2-5 min for GEE task to complete")
    print("   • 1 CSV with year-matched embeddings (~5000 rows)")
    print("2. 📥 Download CSV from Google Drive:")
    print("   • Folder: species_year_matched_embeddings/")
    print("   • File: {species}_year_matched_embeddings_64d.csv")
    print("3. 🔍 Verify CSV structure:")
    print("   • Expected shape: (~5000, ~70)")
    print("   • Columns: occurrence_id, lat, lon, occurrence_year, gee_year, A00-A63")
    print("4. 📊 Create signature by aggregating:")
    print("   • Compute mean/std/p10/p90 across all embeddings")
    print("   • This gives you the 256D signature (64 bands × 4 stats)")
    print("\n💡 For multiple species:")
    print("   for sp in top_species:")
    print("       extract_server_side_signature(df, sp, max_samples=5000)")
    print("       time.sleep(10)  # Pause between species")

if __name__ == "__main__":
    run_extraction()