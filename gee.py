# ====================================================================
# COMPLETE GOOGLE EARTH ENGINE UPLOAD WORKFLOW
# Species Occurrence Data to GEE FeatureCollection
# ====================================================================

import pandas as pd
import ee
import geemap
import json
from datetime import datetime

# ====================================================================
# STEP 1: PREPARE YOUR DATA FOR GEE
# ====================================================================

def prepare_data_for_gee(csv_file):
    """
    Prepare species occurrence data for GEE upload
    """
    print("📊 Loading and preparing data for GEE...")
    
    # Load your data
    df = pd.read_csv(csv_file)
    
    # Clean and prepare data for GEE
    # GEE doesn't handle NaN well, so replace with appropriate values
    df = df.fillna({
        'elevation': -999,
        'country': 'Unknown',
        'coordinateUncertaintyInMeters': 1000
    })
    
    # Convert date to GEE-friendly format (days since epoch)
    df['date_numeric'] = pd.to_datetime(df['eventDate']).astype(int) / 10**9
    
    # Ensure numeric types for GEE
    df['decimalLatitude'] = pd.to_numeric(df['decimalLatitude'])
    df['decimalLongitude'] = pd.to_numeric(df['decimalLongitude'])
    df['year'] = pd.to_numeric(df['year'])
    df['elevation'] = pd.to_numeric(df['elevation'])
    
    print(f"✅ Prepared {len(df)} records for upload")
    print(f"   - Species: {df['species'].nunique()}")
    print(f"   - Date range: {df['year'].min()}-{df['year'].max()}")
    print(f"   - Geographic extent: {df['decimalLatitude'].min():.2f} to {df['decimalLatitude'].max():.2f}°N")
    
    return df

# ====================================================================
# STEP 2: CONVERT TO GEE FEATURECOLLECTION
# ====================================================================

def create_gee_featurecollection(df, max_features=5000):
    """
    Convert DataFrame to GEE FeatureCollection
    """
    print("🌍 Converting to GEE FeatureCollection...")
    
    # Limit features if dataset is too large (GEE has upload limits)
    if len(df) > max_features:
        print(f"⚠️  Dataset has {len(df)} records. Limiting to {max_features} for upload.")
        df = df.sample(n=max_features, random_state=42).copy()
    
    features = []
    
    for idx, row in df.iterrows():
        # Create point geometry
        point = ee.Geometry.Point([row['decimalLongitude'], row['decimalLatitude']])
        
        # Create properties dictionary (all non-geometric data)
        properties = {
            'species': row['species'],
            'scientificName': row['scientificName'],
            'year': int(row['year']),
            'month': int(row['month']),
            'day': int(row['day']),
            'elevation': int(row['elevation']),
            'country': str(row['country']),
            'geohash': str(row['geohash']),
            'alpha_tile_id': str(row['alpha_tile_id']),
            'basisOfRecord': str(row['basisOfRecord']),
            'occurrenceID': str(row['occurrenceID']),
            'coordinateUncertainty': int(row['coordinateUncertaintyInMeters']),
            'date_numeric': float(row['date_numeric'])
        }
        
        # Create feature
        feature = ee.Feature(point, properties)
        features.append(feature)
        
        if (idx + 1) % 100 == 0:
            print(f"   Processed {idx + 1}/{len(df)} records...")
    
    # Create FeatureCollection
    feature_collection = ee.FeatureCollection(features)
    
    print(f"✅ Created FeatureCollection with {len(features)} features")
    return feature_collection

# ====================================================================
# STEP 3: UPLOAD TO GEE AS ASSET
# ====================================================================

def upload_to_gee_asset(feature_collection, asset_name, description=""):
    """
    Upload FeatureCollection to GEE as an asset
    """
    print("📤 Uploading to GEE as asset...")
    
    # Get your GEE username (replace with your actual username)
    # You can find this at: https://code.earthengine.google.com/
    username = "arosejeremic5"  # REPLACE THIS!
    asset_id = f"users/{username}/{asset_name}"
    
    try:
        # Export to asset
        task = ee.batch.Export.table.toAsset(
            collection=feature_collection,
            description=f"upload_{asset_name}",
            assetId=asset_id
        )
        
        task.start()
        
        print(f"✅ Upload task started!")
        print(f"   Asset ID: {asset_id}")
        print(f"   Task description: upload_{asset_name}")
        print(f"   Check progress at: https://code.earthengine.google.com/tasks")
        
        return asset_id, task
        
    except Exception as e:
        print(f"❌ Upload failed: {str(e)}")
        print("Make sure to:")
        print("1. Replace 'your_username_here' with your actual GEE username")
        print("2. Check that you're authenticated with GEE")
        return None, None

# ====================================================================
# STEP 4: ALTERNATIVE UPLOAD METHODS
# ====================================================================

def upload_via_shapefile(df, output_name):
    """
    Alternative: Convert to Shapefile for GEE upload via web interface
    """
    print("📁 Creating Shapefile for web upload...")
    
    try:
        import geopandas as gpd
        from shapely.geometry import Point
        
        # Create GeoDataFrame
        geometry = [Point(xy) for xy in zip(df['decimalLongitude'], df['decimalLatitude'])]
        gdf = gpd.GeoDataFrame(df, geometry=geometry, crs='EPSG:4326')
        
        # Save as shapefile
        shapefile_name = f"{output_name}.shp"
        gdf.to_file(shapefile_name)
        
        print(f"✅ Shapefile created: {shapefile_name}")
        print("📤 Upload manually at: https://code.earthengine.google.com/")
        print("   Go to Assets tab → NEW → Upload → Table")
        
        return shapefile_name
        
    except ImportError:
        print("❌ geopandas not installed. Install with: pip install geopandas")
        return None

def save_as_geojson(df, output_name):
    """
    Alternative: Save as GeoJSON for easy GEE upload
    """
    print(" Creating GeoJSON...")

    features = []
    for idx, row in df.iterrows():
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [row['decimalLongitude'], row['decimalLatitude']]
            },
            "properties": {
                "species": row['species'],
                "year": int(row['year']),
                "elevation": int(row['elevation']),
                "geohash": row['geohash'],
                "alpha_title_id": row['alpha_title_id'],
                "occurrenceID": row['occurrenceID']
            }
        }
        features.append(feature)

    geojson = {
        "type": "FeatureCollection",
        "features": features
    }    

    filename = f"{output_name}.geojson"
    with open(filename, 'w') as f:
        json.dump(geojson, f)

    print(f"GeoJSON created: {filename}")
    return filename

# =====================================================================
# Step 5: Using the data in GEE (Javascript code for code Editor)
# =====================================================================

def generate_gee_code(asset_id):
    """
    Generate Gee Javascript code to use your uploaded data
    """
    js_code = f'''
// ======================================================================
// USING YOUR SPECIES OCCURRENCE DATA IN GEE
// ========================================================================

// Load your uploaded asset
var speciesData = ee.FeatureCollection('{asset_id}');

// Basic information about your dataset
print('Total occurences:', specisData.size());
print('Data range:', speciesData.aggregate_array('species).distinct());
print('Date range:', speciesData.aggregate_min('year'), 'to', speciesData.aggregate_max('year'));

// ==========================================================================
// ANALYSIS EXAMPLES
// ==========================================================================

// 1. Filter by species
var whiteOak = speciesData.filter(ee.Filter.eq('species', 'Quercus alba'));
var robin = speciesData.filter(ee.Filter.eq('species', 'Turdus migratorius'));

print('White Oak occurrences:', whiteOak.size());
print('American Robin occurrences:', robin.size());

// 2. Filter by Alpha Earth titles
var title_018_09 = speciesData.filter(ee.Filter.eq('alpha_title_id', 'alpha_018_09'));
print('Occurrences in Alpha Earth title 018_09:', tile_018_09.size());

//3. Group by Alpha Earth titles
var titlesWithSpecies = speciesData
  .select(['alphs_title_id', 'species'])
  .distinct()
  .aggregate_histogram('alpha_title_id');
print('Species per Alpha Earth title:', titlesWithSpecies);

// ===================================================================
// VISUALIZATION
// ====================================================================

// Create a map
Map.setCenter(-85, 40, 5);

// Style points by species
var whiteOakStyle = {{color: 'green', pointRadius: 3}};
var robinStyle = {{color: 'blue', pointRadius: 2}};

// Add to map
Map.addLayer(whiteOak.style(whiteOakStyle), {{}}, 'White Oak');
Map.addLayer(robin.style(robinStyle), {{}}, 'American Robin');

// ========================================================================
// ALPHA EARTH INTEGRATION (nexr step)
// ========================================================================

// This is where you'll add your Alpha Earth embedding analysis
// Example placeholder:

// Load Alpha Earth data (when available)
// var alaphaEarth = ee.ImageCollection('your_alpha_collection');

// Extract embeddings for each occurence point
// var extractEmbeddings = function(feature) {{
    var point = feature.geometry();
    var embeddings = alphaEarth.sample(point, 1000).first();
    return feature.copyProperties(embeddings);
// }};

// var occurrencesWithEmbeddings = speciesData.map(extractEmbeddings);

print('Your species occurence data is ready in GEE|');
'''
    
    return js_code

# ======================================================================
# MAIN EXECUTION FUNCTION
# ========================================================================

def main_upload_workflow(csv_file, asset_name, method='featurecollection'):
    """
    Complete workflow to get species data into GEE
    """
    print("STARTING GEE UPLOAD WORKFLOW")
    print("=" * 50)

    # Step 1: Initialize GEE
    try:
        ee.Initialize()
        print("GEE initialized successfully")
    except:
        print("GEE authentication failed. Run: ee.Authenticate()")
        return None

    # step 2: Prepare data
    df = prepare_data_for_gee(csv_file)

    # Step 3: Choose upload methos
    if method == 'featurecollection':
        # Direct upload via Python API
        fc = create_gee_featurecollection(df) 
        asset_id, task = upload_to_gee_asset(fc, asset_name)

        if asset_id:
            # Generate code for using the data
            js_code = generate_gee_code(asset_id)

            # Save JavaScript code to file
            with open(f'{asset_name}_gee_code.js', 'w') as f:
                f.write(js_code)

            print(f"GEE JavaScript code saved to: {asset_name}_gee_code.js")

    elif method == 'shapefile':
        # Upload via shapefile
        shapefile = upload_via_shapefile(df, asset_name) 

    elif method == 'geojson':
        # Upload via GeoJSON
        geojson_file = save_as_geojson(df, asset_name) 

    print("UPLOAD WORKFLOW COMPLETE!")
    print("=" * 50)

# ==================================================================
# USAGE EXAMPLES
# ===================================================================

if __name__ == "__main__":
    # Example usage:
    # 
    # Make sure you have your CSV file ready
    csv_file = "species_occurrences_sample.csv"
    asset_name = "apecies_occurrences_test"
    
                             
    