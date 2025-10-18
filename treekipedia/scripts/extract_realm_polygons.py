#!/usr/bin/env python3
"""
Extract realm polygons from ecoregions table by merging/dissolving ecoregions
"""

import psycopg2
import json
import geopandas as gpd
from shapely.geometry import shape
from shapely.ops import unary_union

print("🌍 Extracting Realm Polygons from Ecoregions")
print("=" * 80)

# Connect to database
conn = psycopg2.connect(
    host='localhost',
    database='treekipedia',
    user='tree_user',
    password='Kj9mPx7vLq2wZn4t'
)

cursor = conn.cursor()

# Get list of realms
cursor.execute("""
    SELECT DISTINCT realm, COUNT(*) as eco_count
    FROM ecoregions
    WHERE realm IS NOT NULL AND realm != 'N/A'
    GROUP BY realm
    ORDER BY realm
""")

realms = cursor.fetchall()

print(f"\n📊 Found {len(realms)} realms:")
for realm, count in realms:
    print(f"  - {realm}: {count} ecoregions")

# Extract and merge polygons for each realm
realm_features = []

for realm_name, eco_count in realms:
    print(f"\n🔄 Processing {realm_name}...")

    # Get all ecoregion geometries for this realm
    cursor.execute("""
        SELECT ST_AsGeoJSON(geom)::json as geometry
        FROM ecoregions
        WHERE realm = %s
    """, (realm_name,))

    geometries = []
    for row in cursor.fetchall():
        geom = shape(row[0])
        geometries.append(geom)

    # Merge all geometries into single polygon/multipolygon
    merged = unary_union(geometries)

    print(f"   ✅ Merged {len(geometries)} ecoregions into 1 realm polygon")

    # Create GeoJSON feature
    feature = {
        "type": "Feature",
        "properties": {
            "realm": realm_name,
            "ecoregion_count": eco_count
        },
        "geometry": merged.__geo_interface__
    }

    realm_features.append(feature)

cursor.close()
conn.close()

# Create GeoJSON FeatureCollection
geojson = {
    "type": "FeatureCollection",
    "features": realm_features
}

# Save to file
output_path = '/root/silvi-open/treekipedia/realms.geojson'
with open(output_path, 'w') as f:
    json.dump(geojson, f, indent=2)

print(f"\n💾 Saved realm polygons to: {output_path}")
print(f"✅ {len(realm_features)} realms extracted successfully")

# Also create a simplified version for faster visualization
print("\n🔄 Creating simplified version for web display...")
gdf = gpd.GeoDataFrame.from_features(geojson['features'], crs='EPSG:4326')
gdf['geometry'] = gdf.geometry.simplify(0.01)

simplified_geojson = json.loads(gdf.to_json())
simplified_path = '/root/silvi-open/treekipedia/realms_simplified.geojson'
with open(simplified_path, 'w') as f:
    json.dump(simplified_geojson, f, indent=2)

print(f"💾 Saved simplified realms to: {simplified_path}")
