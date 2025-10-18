#!/usr/bin/env python3
"""
Analyze topological relationships (neighbors, positions) of SVG subrealm polygons
to verify numbering against One Earth official map
"""

import geopandas as gpd
import json

# Load GeoJSON
gdf = gpd.read_file('/root/silvi-open/treekipedia/subrealms.geojson')

# Decode IDs to numbers
def decode_id(id_str):
    decoded = id_str
    decoded = decoded.replace('_x35_', '5')
    decoded = decoded.replace('_x34_', '4')
    decoded = decoded.replace('_x33_', '3')
    decoded = decoded.replace('_x32_', '2')
    decoded = decoded.replace('_x31_', '1')
    decoded = decoded.replace('_x30_', '0')
    decoded = decoded.replace('_x39_', '9')
    decoded = decoded.replace('_x38_', '8')
    decoded = decoded.replace('_x37_', '7')
    decoded = decoded.replace('_x36_', '6')
    if decoded == 'Layer_26':
        return '26'
    if decoded == 'Southeast_US_and_Savanna_Forests':
        return '10'
    return decoded

gdf['code'] = gdf['id'].apply(decode_id)
gdf = gdf[gdf['code'].str.isdigit()].copy()
gdf['code_int'] = gdf['code'].astype(int)

# Fix invalid geometries
gdf['geometry'] = gdf.geometry.buffer(0)

print("🗺️  Analyzing Spatial Relationships of Subrealm Polygons")
print("=" * 80)

# Find neighbors for each polygon
neighbors = {}
for idx1, row1 in gdf.iterrows():
    code1 = row1['code']
    touching = []

    for idx2, row2 in gdf.iterrows():
        if idx1 == idx2:
            continue
        code2 = row2['code']

        # Check if polygons touch
        if row1.geometry.touches(row2.geometry) or row1.geometry.intersects(row2.geometry):
            touching.append(code2)

    neighbors[code1] = sorted(touching, key=lambda x: int(x) if x.isdigit() else 999)

# Print neighbor relationships
print("\n📍 Polygon Adjacency (Neighbors):")
print("-" * 80)
for code in sorted(neighbors.keys(), key=lambda x: int(x) if x.isdigit() else 999):
    neighbor_list = neighbors[code]
    if len(neighbor_list) > 0:
        print(f"Code {code:>2}: touches {', '.join(neighbor_list)}")
    else:
        print(f"Code {code:>2}: ISOLATED (no neighbors)")

# Calculate centroids for relative positions
print("\n📐 Relative Positions (Centroids):")
print("-" * 80)
gdf['centroid'] = gdf.geometry.centroid
gdf['cent_x'] = gdf.centroid.x
gdf['cent_y'] = gdf.centroid.y

for idx, row in gdf.sort_values('code_int').iterrows():
    print(f"Code {row['code']:>2}: X={row['cent_x']:>8.2f}, Y={row['cent_y']:>8.2f}")

# Group by approximate regions (based on X coordinate in SVG space)
print("\n🌐 Regional Groupings (by X position in SVG):")
print("-" * 80)

# Americas (Western hemisphere in SVG would be negative or low X)
americas = gdf[gdf['cent_x'] < -50].sort_values('cent_y', ascending=False)
print("\nWestern Region (likely Americas):")
for idx, row in americas.iterrows():
    print(f"  Code {row['code']:>2}: Y={row['cent_y']:>7.2f}")

# Asia/Oceania (Eastern hemisphere, positive or high X)
asia_oceania = gdf[gdf['cent_x'] > 50].sort_values('cent_y', ascending=False)
print("\nEastern Region (likely Asia/Oceania):")
for idx, row in asia_oceania.iterrows():
    print(f"  Code {row['code']:>2}: Y={row['cent_y']:>7.2f}")

# Africa/Europe (Middle)
middle = gdf[(gdf['cent_x'] >= -50) & (gdf['cent_x'] <= 50)].sort_values('cent_y', ascending=False)
print("\nMiddle Region (likely Africa/Europe/Middle East):")
for idx, row in middle.iterrows():
    print(f"  Code {row['code']:>2}: X={row['cent_x']:>7.2f}, Y={row['cent_y']:>7.2f}")

# Save topology data
output = {
    'neighbors': neighbors,
    'centroids': {row['code']: {'x': row['cent_x'], 'y': row['cent_y']}
                  for idx, row in gdf.iterrows()}
}

with open('/root/silvi-open/treekipedia/scripts/subrealm_topology.json', 'w') as f:
    json.dump(output, f, indent=2)

print(f"\n💾 Saved topology data to: subrealm_topology.json")
