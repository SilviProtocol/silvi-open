#!/usr/bin/env python3
"""
Match subrealm polygons to One Earth Bioregions Framework names
using geographic centroid matching and visual inspection
"""

import geopandas as gpd
import json
from shapely.geometry import Point

# Load the unnamed subrealms GeoJSON
gdf = gpd.read_file('/root/silvi-open/treekipedia/subrealms.geojson')

# Load reference names
with open('/root/silvi-open/treekipedia/scripts/subrealm_reference.json', 'r') as f:
    reference = json.load(f)

# Calculate centroids for matching
gdf['centroid'] = gdf.geometry.centroid
gdf['centroid_lon'] = gdf.centroid.x
gdf['centroid_lat'] = gdf.centroid.y

# Print centroids for manual matching
print("🗺️  Subrealm Centroids for Matching")
print("=" * 70)
print(f"{'ID':<30} {'Longitude':<15} {'Latitude':<15}")
print("-" * 70)

for idx, row in gdf.iterrows():
    print(f"{row['id']:<30} {row['centroid_lon']:>12.2f}° {row['centroid_lat']:>12.2f}°")

print("\n📋 Reference Subrealms (52 total):")
print("=" * 70)

subrealm_list = []
for realm, data in reference['realms'].items():
    print(f"\n{realm}:")
    for subrealm in data['subrealms']:
        subrealm_list.append(subrealm)
        print(f"  - {subrealm}")

print(f"\n✅ Total reference subrealms: {len(subrealm_list)}")
print(f"✅ Total polygons in GeoJSON: {len(gdf)}")
print(f"\n💡 Next step: Use geographic matching or visual inspection to map IDs to names")

# Known geographic reference points for some subrealms (you can expand this)
reference_points = {
    "Greenland": (-42, 72),
    "Alaska": (-153, 64),
    "Canadian Tundra": (-95, 65),
    "Canadian Boreal Forests": (-100, 55),
    "North Pacific Coast": (-123, 48),
    "American West": (-113, 40),
    "Great Plains": (-100, 40),
    "Northeast American Forests": (-75, 43),
    "Southeast US Savannas & Forests": (-83, 32),
    "Mexican Drylands": (-105, 28),
    "Central America": (-87, 12),
    "Caribbean": (-75, 20),
    "Amazonia": (-65, -5),
    "Brazil Cerrado & Atlantic Coast": (-48, -15),
    "Andes Mountains & Pacific Coast": (-72, -15),
    "South American Grasslands": (-60, -33),
    "Australia": (135, -25),
    "New Zealand": (172, -41),
    "Madagascar & East African Coast": (44, -18),
    "Southern Afrotropics": (25, -28),
    "Equatorial Afrotropics": (22, 0),
    "Horn of Africa": (43, 8),
    "North Africa": (8, 28),
    "Greater Arabian Peninsula": (50, 23),
    "Mediterranean": (10, 40),
    "European Mountain Forests": (10, 47),
    "Greater European Forests": (15, 52),
    "Anglo-Celtic Isles": (-3, 54),
    "Palearctic Tundra": (95, 70),
    "Scandinavia & Western Boreal Forests": (20, 64),
    "Siberia & Eastern Boreal Forests": (105, 60),
    "Japanese Islands": (138, 37),
    "Northeast Asian Forests": (125, 45),
    "Mongolian Grasslands": (105, 47),
    "Tibetan Plateau": (88, 32),
    "Indian Subcontinent": (78, 22),
    "Southeast Asian Forests": (100, 15),
    "Malaysia & Western Indonesia": (110, 0),
    "Australasian Islands & Eastern Indonesia": (130, -5)
}

print("\n🎯 Attempting automatic geographic matching...")
print("=" * 70)

# For each subrealm, find closest reference point
matches = {}
for idx, row in gdf.iterrows():
    centroid = Point(row['centroid_lon'], row['centroid_lat'])

    min_distance = float('inf')
    best_match = None

    for name, (lon, lat) in reference_points.items():
        ref_point = Point(lon, lat)
        distance = centroid.distance(ref_point)

        if distance < min_distance:
            min_distance = distance
            best_match = name

    matches[row['id']] = {
        'suggested_name': best_match,
        'confidence': 'high' if min_distance < 10 else 'medium' if min_distance < 30 else 'low',
        'distance': min_distance
    }

    confidence_icon = "✅" if min_distance < 10 else "⚠️" if min_distance < 30 else "❓"
    print(f"{confidence_icon} {row['id']:<30} → {best_match:<40} (distance: {min_distance:.1f}°)")

# Save mapping
mapping_output = {
    'matches': matches,
    'unmapped_references': [s for s in subrealm_list if s not in reference_points]
}

with open('/root/silvi-open/treekipedia/scripts/subrealm_mapping.json', 'w') as f:
    json.dump(mapping_output, f, indent=2)

print(f"\n💾 Saved mapping to: /root/silvi-open/treekipedia/scripts/subrealm_mapping.json")
print("\n⚠️  Note: Some matches may need manual verification!")
print("    Use the confidence levels (✅ high, ⚠️ medium, ❓ low) as a guide.")
