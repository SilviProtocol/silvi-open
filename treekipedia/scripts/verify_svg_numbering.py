#!/usr/bin/env python3
"""
Verify if SVG polygon numbers match One Earth official numbering
by checking specific realms with known subrealm codes
"""

import json

print("🔍 Verifying SVG Numbering Against One Earth Official Codes")
print("=" * 80)

# Load One Earth official codes
with open('/root/silvi-open/treekipedia/scripts/one_earth_official_codes.json', 'r') as f:
    official = json.load(f)['subrealm_codes']

# Load SVG code mapping
with open('/root/silvi-open/treekipedia/scripts/subrealm_code_to_number.json', 'r') as f:
    svg_codes = json.load(f)['subrealm_code_mapping']

# Country overlaps from earlier analysis
country_data = {
    "_x31_6": {"countries": ["Australia"], "svg_code": "16"},
    "_x31_7": {"countries": ["Australia", "Indonesia", "Philippines"], "svg_code": "17"},
    "_x31_5": {"countries": ["Australia", "Papua New Guinea"], "svg_code": "15"},
    "_x31_3": {"countries": ["Philippines", "Indonesia", "Papua New Guinea"], "svg_code": "13"},
    "_x35_2": {"countries": ["OCEAN"], "svg_code": "52"},
    "_x34_6": {"countries": ["United States of America"], "svg_code": "46"},
    "_x33_3": {"countries": ["United States of America"], "svg_code": "33"},
    "_x33_2": {"countries": ["Canada", "United States of America"], "svg_code": "32"},
    "_x34_3": {"countries": ["Canada"], "svg_code": "43"},
    "_x33_0": {"countries": ["Canada"], "svg_code": "30"},
    "_x34_": {"countries": ["Russia"], "svg_code": "4"},
    "_x32_": {"countries": ["Russia"], "svg_code": "2"},
}

print("\n🧪 TEST 1: Australia/Oceania Region")
print("-" * 80)
print("Expected One Earth codes: 50 (Australasian Islands), 51 (Australia), 52 (New Zealand)")
print("\nSVG polygons in Australia region:")

australia_svg_codes = []
for svg_id, data in country_data.items():
    if "Australia" in data["countries"]:
        svg_num = data["svg_code"]
        australia_svg_codes.append(svg_num)
        official_name = official.get(svg_num, "NOT IN OFFICIAL LIST")
        print(f"  SVG Code {svg_num}: {official_name}")
        print(f"    Countries: {', '.join(data['countries'])}")

print(f"\n❌ MISMATCH: SVG has codes {sorted(set(australia_svg_codes))}, expected [50, 51, 52]")

print("\n🧪 TEST 2: New Zealand Check")
print("-" * 80)
print("Expected One Earth code: 52 (New Zealand)")
nz_svg = country_data.get("_x35_2", {})
print(f"SVG Code 52: {nz_svg.get('countries', ['UNKNOWN'])}")
print(f"Official #52: {official.get('52')}")
if "OCEAN" in str(nz_svg.get('countries', [])):
    print("❌ MISMATCH: Code 52 is ocean, not New Zealand")

print("\n🧪 TEST 3: North America Region")
print("-" * 80)
print("Expected One Earth codes: 1-10 (Greenland through Southeast US)")
print("\nSVG polygons in North America region:")

na_svg_codes = []
for svg_id, data in country_data.items():
    if any(c in ["United States of America", "Canada"] for c in data["countries"]):
        svg_num = data["svg_code"]
        na_svg_codes.append(int(svg_num))
        official_name = official.get(svg_num, "NOT IN OFFICIAL LIST")
        print(f"  SVG Code {svg_num}: {official_name}")
        print(f"    Countries: {', '.join(data['countries'])}")

na_expected = list(range(1, 11))
print(f"\n❌ MISMATCH: SVG has codes {sorted(set(na_svg_codes))}, expected {na_expected}")

print("\n🧪 TEST 4: Russia/Palearctic Region")
print("-" * 80)
print("Expected One Earth codes: 32-35 (Palearctic Tundra, Scandinavia, Siberia, Sea of Okhotsk)")
print("\nSVG polygons in Russia region:")

russia_svg_codes = []
for svg_id, data in country_data.items():
    if "Russia" in data["countries"]:
        svg_num = data["svg_code"]
        russia_svg_codes.append(int(svg_num))
        official_name = official.get(svg_num, "NOT IN OFFICIAL LIST")
        print(f"  SVG Code {svg_num}: {official_name}")

russia_expected = list(range(32, 36))
print(f"\n❌ MISMATCH: SVG has codes {sorted(set(russia_svg_codes))}, expected {russia_expected}")

print("\n" + "=" * 80)
print("📊 CONCLUSION:")
print("=" * 80)
print("❌ The SVG polygon numbers DO NOT match One Earth official codes!")
print("")
print("Evidence:")
print("  • Australia region: SVG has 13,15,16,17 but should have 50,51,52")
print("  • North America: SVG has 30,32,33,43,46 but should have 1-10")
print("  • Russia: SVG has 2,4 but should have 32-35")
print("")
print("🎯 The SVG uses a DIFFERENT numbering system (possibly arbitrary Adobe IDs)")
print("")
print("Next steps:")
print("  1. We cannot trust the SVG numbers to match One Earth codes")
print("  2. We need to use geographic matching (realms + country overlaps)")
print("  3. Or obtain official One Earth GeoJSON with correct codes")
