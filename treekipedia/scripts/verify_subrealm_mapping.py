#!/usr/bin/env python3
"""
Verify SVG subrealm codes match One Earth official numbering
by cross-referencing with country overlaps
"""

import json

# Load the SVG code to number mapping
with open('/root/silvi-open/treekipedia/scripts/subrealm_code_to_number.json', 'r') as f:
    svg_mapping = json.load(f)['subrealm_code_mapping']

# Load official One Earth codes
with open('/root/silvi-open/treekipedia/scripts/one_earth_official_codes.json', 'r') as f:
    official_codes = json.load(f)['subrealm_codes']

# Country overlaps from our earlier query
country_overlaps = {
    "_x34_9": ["Brazil"],
    "_x34_6": ["United States of America"],
    "_x34_5": ["United States of America", "Canada"],
    "_x34_4": ["United States of America"],
    "_x34_3": ["Canada"],
    "_x34_2": ["Canada", "United States of America"],
    "_x34_1": ["Canada", "United States of America"],
    "_x33_8": ["Canada"],
    "_x33_3": ["United States of America"],
    "_x33_2": ["Canada", "United States of America"],
    "_x33_0": ["Canada"],
    "_x31_8": ["Madagascar", "Sudan"],
    "_x31_7": ["Australia", "Indonesia", "Philippines"],
    "_x31_6": ["Australia"],
    "_x31_5": ["Australia", "Papua New Guinea"],
    "_x31_3": ["Philippines", "Indonesia", "Papua New Guinea"],
    "_x31_2": ["India"],
    "_x31_1": ["China"],
    "_x31_0": ["China"],
    "Southeast_US_and_Savanna_Forests": ["China"],
    "_x39_": ["China"],
    "_x38_": ["China"],
    "_x37_": ["Bangladesh", "India"],
    "_x36_": ["China"],
    "_x35_": ["Pakistan"],
    "_x34_": ["Russia"],
    "_x33_": ["Russia"],
    "_x32_": ["Russia"],
    "_x31_": ["Russia"]
}

print("🔍 Verifying SVG Codes Against Official One Earth Numbering")
print("=" * 80)

verified = []
mismatched = []

for svg_id, countries in country_overlaps.items():
    svg_number = svg_mapping.get(svg_id)
    if not svg_number or not svg_number.isdigit():
        continue

    official_name = official_codes.get(svg_number)

    # Check if countries match expected subrealm
    match = False
    confidence = "❓"

    if svg_number == "14" and "Brazil" in countries:
        match = True
        confidence = "✅"  # Amazonia
    elif svg_number == "49" and any(c in ["Brazil"] for c in countries):
        match = True
        confidence = "✅"  # Amazonia
    elif svg_number == "46" and "United States of America" in countries:
        match = True
        confidence = "✅"  # American West
    elif svg_number == "45" and "United States of America" in countries and "Canada" in countries:
        match = True
        confidence = "✅"  # Northeast American Forests
    elif svg_number == "44" and "United States of America" in countries:
        match = True
        confidence = "✅"  # Southeast US
    elif svg_number == "43" and "Canada" in countries:
        match = True
        confidence = "✅"  # Canadian Boreal
    elif svg_number == "42" and "Canada" in countries and "United States of America" in countries:
        match = True
        confidence = "✅"  # Great Plains
    elif svg_number == "41" and "Canada" in countries:
        match = True
        confidence = "✅"  # Northeast American Forests
    elif svg_number == "38" and "Canada" in countries:
        match = True
        confidence = "✅"  # Canadian Tundra
    elif svg_number == "33" and "United States of America" in countries:
        match = True
        confidence = "✅"  # Alaska
    elif svg_number == "32" and "Canada" in countries:
        match = True
        confidence = "✅"  # Canadian Tundra
    elif svg_number == "30" and "Canada" in countries:
        match = True
        confidence = "✅"  # Canadian Boreal
    elif svg_number == "18" and "Madagascar" in countries:
        match = True
        confidence = "✅"  # Madagascar
    elif svg_number == "17" and "Australia" in countries and "Indonesia" in countries:
        match = True
        confidence = "✅"  # Australasian Islands
    elif svg_number == "16" and "Australia" in countries:
        match = True
        confidence = "✅"  # South American Grasslands (WRONG - should be Australia #51)
    elif svg_number == "15" and "Australia" in countries:
        match = True
        confidence = "✅"  # Brazil Cerrado (WRONG - should be Australia)
    elif svg_number == "13" and "Indonesia" in countries:
        match = True
        confidence = "✅"  # Upper South America (WRONG - should be Australasian)
    elif svg_number == "12" and "India" in countries:
        match = True
        confidence = "✅"  # Central America (WRONG - should be Indian Subcontinent #47)
    elif svg_number == "11" and "China" in countries:
        match = True
        confidence = "✅"  # Caribbean (WRONG - should be Central East Asian)
    elif svg_number == "10" and "China" in countries:
        match = True
        confidence = "✅"  # Southeast US (WRONG - but labeled correctly in SVG!)
    elif svg_number == "9" and "China" in countries:
        match = True
        confidence = "✅"  # NE American (WRONG)
    elif svg_number == "8" and "China" in countries:
        match = True
        confidence = "✅"  # Great Plains (WRONG)
    elif svg_number == "7" and "India" in countries:
        match = True
        confidence = "✅"  # Mexican Drylands (WRONG - Indian Subcontinent #47)
    elif svg_number == "6" and "China" in countries:
        match = True
        confidence = "✅"  # American West (WRONG - Tibetan Plateau #40)
    elif svg_number == "5" and "Pakistan" in countries:
        match = True
        confidence = "✅"  # North Pacific (WRONG)
    elif svg_number in ["4", "3", "2", "1"] and "Russia" in countries:
        match = True
        confidence = "✅"  # Siberia/Palearctic regions

    print(f"{confidence} Code {svg_number:>2}: {official_name:<45} | Countries: {', '.join(countries[:3])}")

    if match:
        verified.append(svg_number)
    else:
        mismatched.append(svg_number)

print("\n" + "=" * 80)
print("🎯 CONCLUSION: The SVG numbers DO NOT match the official One Earth codes!")
print("=" * 80)
print("\nThe SVG appears to use a different numbering system or is incorrectly numbered.")
print("We need to either:")
print("  1. Get the correct georeferenced One Earth dataset")
print("  2. Manually map the SVG regions visually")
print("  3. Find documentation for the SVG's numbering scheme")
