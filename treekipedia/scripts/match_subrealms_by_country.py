#!/usr/bin/env python3
"""
Match subrealm polygons to names by cross-referencing with countries
"""

import psycopg2
import json
import geopandas as gpd

# Database connection
conn = psycopg2.connect(
    host='localhost',
    database='treekipedia',
    user='tree_user',
    password='Kj9mPx7vLq2wZn4t'
)

# Load subrealms GeoJSON
gdf = gpd.read_file('/root/silvi-open/treekipedia/subrealms.geojson')

print("🌍 Matching Subrealms to Names via Country Overlap")
print("=" * 80)

# For each subrealm, find overlapping countries
results = {}

for idx, row in gdf.iterrows():
    subrealm_id = row['id']

    # Fix invalid geometries using buffer(0)
    geom = row.geometry
    if not geom.is_valid:
        geom = geom.buffer(0)
    geom_wkt = geom.wkt

    # Query countries that intersect this subrealm
    query = """
        SELECT
            name,
            ST_Area(ST_Intersection(geom, ST_MakeValid(ST_GeomFromText(%s, 4326)))) as overlap_area
        FROM countries
        WHERE ST_Intersects(geom, ST_MakeValid(ST_GeomFromText(%s, 4326)))
        ORDER BY overlap_area DESC
        LIMIT 10
    """

    cursor = conn.cursor()
    try:
        cursor.execute(query, (geom_wkt, geom_wkt))
        countries = cursor.fetchall()
    except Exception as e:
        print(f"  Error: {e}")
        countries = []
    cursor.close()

    country_list = [c[0] for c in countries]

    results[subrealm_id] = {
        'countries': country_list,
        'top_countries': country_list[:5] if len(country_list) > 5 else country_list
    }

    print(f"\n{subrealm_id}:")
    print(f"  Countries: {', '.join(country_list[:5])}")
    if len(country_list) > 5:
        print(f"  ... and {len(country_list) - 5} more")

conn.close()

# Now use country lists to suggest subrealm names
print("\n" + "=" * 80)
print("🎯 Suggested Matches Based on Country Overlap:")
print("=" * 80)

# Define expected country overlaps for each subrealm
subrealm_patterns = {
    "Greenland": ["Greenland"],
    "Canadian Tundra": ["Canada"],
    "Alaska": ["United States of America", "United States"],
    "Canadian Boreal Forests": ["Canada"],
    "North Pacific Coast": ["United States", "Canada"],
    "American West": ["United States"],
    "Great Plains": ["United States", "Canada"],
    "Northeast American Forests": ["United States", "Canada"],
    "Southeast US Savannas & Forests": ["United States"],
    "Mexican Drylands": ["Mexico", "United States"],
    "Central America": ["Guatemala", "Honduras", "Nicaragua", "Costa Rica", "Panama", "Belize", "El Salvador"],
    "Caribbean": ["Cuba", "Jamaica", "Haiti", "Dominican Republic", "Puerto Rico", "Bahamas"],
    "Upper South America": ["Colombia", "Venezuela", "Guyana", "Suriname"],
    "Amazonia": ["Brazil", "Peru", "Colombia", "Bolivia", "Venezuela"],
    "Brazil Cerrado & Atlantic Coast": ["Brazil"],
    "South American Grasslands": ["Argentina", "Uruguay"],
    "Andes Mountains & Pacific Coast": ["Chile", "Peru", "Ecuador", "Colombia", "Argentina"],
    "Oceanic Islands": ["Fiji", "Samoa", "Tonga", "Vanuatu", "Solomon Islands"],
    "Madagascar & East African Coast": ["Madagascar", "Mozambique", "Tanzania", "Kenya"],
    "Southern Afrotropics": ["South Africa", "Namibia", "Botswana", "Zimbabwe"],
    "Sub-Equatorial Afrotropics": ["Angola", "Zambia", "Malawi", "Tanzania"],
    "Equatorial Afrotropics": ["Congo", "Gabon", "Cameroon", "Central African Republic"],
    "Sub-Saharan Afrotropics": ["Nigeria", "Ghana", "Ivory Coast", "Senegal", "Guinea"],
    "Horn of Africa": ["Ethiopia", "Somalia", "Kenya", "Sudan"],
    "North Africa": ["Morocco", "Algeria", "Tunisia", "Libya", "Egypt"],
    "Greater Arabian Peninsula": ["Saudi Arabia", "Yemen", "Oman", "United Arab Emirates", "Kuwait"],
    "Mediterranean": ["Spain", "Italy", "Greece", "Turkey", "France"],
    "Black Sea Forests & Steppe": ["Ukraine", "Romania", "Bulgaria", "Turkey"],
    "European Mountain Forests": ["Switzerland", "Austria", "Germany", "France", "Italy"],
    "Greater European Forests": ["Poland", "Germany", "Belarus", "Czech Republic"],
    "Anglo-Celtic Isles": ["United Kingdom", "Ireland"],
    "Palearctic Tundra": ["Russia"],
    "Scandinavia & Western Boreal Forests": ["Norway", "Sweden", "Finland"],
    "Siberia & Eastern Boreal Forests": ["Russia"],
    "Sea of Okhotsk & Bering Tundra/Taiga": ["Russia"],
    "Japanese Islands": ["Japan"],
    "Northeast Asian Forests": ["China", "North Korea", "South Korea", "Russia"],
    "Mongolian Grasslands": ["Mongolia", "China", "Russia"],
    "Central East Asian Forests": ["China"],
    "Tibetan Plateau": ["China", "Tibet"],
    "East Asian Deserts": ["China", "Mongolia"],
    "Kazakh Steppes & Hemiboreal Forests": ["Kazakhstan", "Russia"],
    "Caspian Sea & Central Asian Deserts": ["Uzbekistan", "Turkmenistan", "Kazakhstan"],
    "Tien Shan Mountains": ["Kyrgyzstan", "Kazakhstan", "China"],
    "Persian Deserts & Forests": ["Iran", "Afghanistan"],
    "Altai-Sayan Mountains": ["Russia", "Mongolia", "Kazakhstan"],
    "Indian Subcontinent": ["India", "Pakistan", "Bangladesh", "Nepal"],
    "Southeast Asian Forests": ["Myanmar", "Thailand", "Laos", "Vietnam", "Cambodia"],
    "Malaysia & Western Indonesia": ["Malaysia", "Indonesia", "Brunei"],
    "Australasian Islands & Eastern Indonesia": ["Indonesia", "Papua New Guinea"],
    "Australia": ["Australia"],
    "New Zealand": ["New Zealand"]
}

# Match each subrealm to a name based on country overlap
matches = {}

for subrealm_id, data in results.items():
    countries = set(data['countries'])

    best_match = None
    best_score = 0

    for subrealm_name, expected_countries in subrealm_patterns.items():
        # Calculate overlap score
        expected_set = set(expected_countries)
        intersection = countries.intersection(expected_set)

        if len(expected_set) > 0:
            score = len(intersection) / len(expected_set)

            if score > best_score:
                best_score = score
                best_match = subrealm_name

    matches[subrealm_id] = {
        'suggested_name': best_match,
        'confidence': best_score,
        'countries': list(countries)
    }

    confidence_icon = "✅" if best_score >= 0.5 else "⚠️" if best_score >= 0.3 else "❓"
    print(f"{confidence_icon} {subrealm_id:<35} → {best_match:<45} ({best_score:.1%})")

# Save results
output = {
    'matches': matches,
    'methodology': 'Country overlap matching with One Earth Bioregions Framework',
    'total_subrealms': len(matches)
}

with open('/root/silvi-open/treekipedia/scripts/subrealm_country_mapping.json', 'w') as f:
    json.dump(output, f, indent=2)

print(f"\n💾 Saved mapping to: /root/silvi-open/treekipedia/scripts/subrealm_country_mapping.json")
print("\n📊 Summary:")
high_conf = sum(1 for m in matches.values() if m['confidence'] >= 0.5)
med_conf = sum(1 for m in matches.values() if 0.3 <= m['confidence'] < 0.5)
low_conf = sum(1 for m in matches.values() if m['confidence'] < 0.3)

print(f"  ✅ High confidence (≥50%): {high_conf}")
print(f"  ⚠️ Medium confidence (30-50%): {med_conf}")
print(f"  ❓ Low confidence (<30%): {low_conf}")
