#!/usr/bin/env python3
"""
Apply manual subrealm name mapping to GeoJSON
"""

import geopandas as gpd
import json

# Load the unnamed GeoJSON
gdf = gpd.read_file('/root/silvi-open/treekipedia/subrealms.geojson')

# Load manual mapping
with open('/root/silvi-open/treekipedia/scripts/subrealm_manual_mapping.json', 'r') as f:
    mapping = json.load(f)['manual_mapping']

# Apply names
gdf['subrealm_name'] = gdf['id'].map(mapping)

# Filter out OCEAN polygons (keep only terrestrial subrealms)
terrestrial_gdf = gdf[~gdf['subrealm_name'].str.contains('OCEAN', na=False)].copy()

# Clean up duplicate names (some IDs map to same subrealm)
print("🗺️  Subrealm Name Mapping Applied")
print("=" * 80)
print(f"Total polygons: {len(gdf)}")
print(f"Ocean/water polygons: {len(gdf) - len(terrestrial_gdf)}")
print(f"Terrestrial subrealms: {len(terrestrial_gdf)}")
print(f"Unique subrealm names: {terrestrial_gdf['subrealm_name'].nunique()}")

print("\n📋 Identified Terrestrial Subrealms:")
print("-" * 80)
for idx, row in terrestrial_gdf.sort_values('subrealm_name').iterrows():
    print(f"  {row['subrealm_name']}")

# Save updated GeoJSON with names
terrestrial_gdf[['subrealm_name', 'geometry']].to_file(
    '/root/silvi-open/treekipedia/subrealms_named.geojson',
    driver='GeoJSON'
)

print(f"\n💾 Saved terrestrial subrealms to: /root/silvi-open/treekipedia/subrealms_named.geojson")

# List missing subrealms from One Earth Framework
one_earth_subrealms = {
    "Greenland", "Canadian Tundra", "Alaska", "Canadian Boreal Forests",
    "North Pacific Coast", "American West", "Great Plains", "Northeast American Forests",
    "Southeast US Savannas & Forests", "Mexican Drylands",
    "Central America", "Caribbean",
    "Upper South America", "Amazonia", "Brazil Cerrado & Atlantic Coast",
    "South American Grasslands", "Andes Mountains & Pacific Coast",
    "Oceanic Islands",
    "Madagascar & East African Coast", "Southern Afrotropics", "Sub-Equatorial Afrotropics",
    "Equatorial Afrotropics", "Sub-Saharan Afrotropics", "Horn of Africa",
    "North Africa", "Greater Arabian Peninsula",
    "Mediterranean", "Black Sea Forests & Steppe", "European Mountain Forests",
    "Greater European Forests", "Anglo-Celtic Isles",
    "Palearctic Tundra", "Scandinavia & Western Boreal Forests",
    "Siberia & Eastern Boreal Forests", "Sea of Okhotsk & Bering Tundra/Taiga",
    "Japanese Islands", "Northeast Asian Forests", "Mongolian Grasslands",
    "Central East Asian Forests", "Tibetan Plateau", "East Asian Deserts",
    "Kazakh Steppes & Hemiboreal Forests", "Caspian Sea & Central Asian Deserts",
    "Tien Shan Mountains", "Persian Deserts & Forests", "Altai-Sayan Mountains",
    "Indian Subcontinent", "Southeast Asian Forests", "Malaysia & Western Indonesia",
    "Australasian Islands & Eastern Indonesia", "Australia", "New Zealand"
}

identified_subrealms = set(terrestrial_gdf['subrealm_name'].unique())
missing_subrealms = one_earth_subrealms - identified_subrealms

print(f"\n⚠️  Missing Subrealms from SVG ({len(missing_subrealms)} total):")
print("-" * 80)
for name in sorted(missing_subrealms):
    print(f"  - {name}")

print("\n💡 Note: The SVG file may be incomplete or focused on specific regions.")
print("   Missing subrealms may need to be sourced from another dataset.")
