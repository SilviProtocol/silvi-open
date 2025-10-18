#!/usr/bin/env python3
"""
Convert Subrealms SVG to GeoJSON with proper georeferencing

This script converts the Polygons-subrealms.svg file to GeoJSON format,
georeferencing it to world coordinates (WGS84).
"""

import geopandas as gpd
from shapely.geometry import Polygon, MultiPolygon
from shapely.affinity import translate, scale
from shapely import wkt
import xml.etree.ElementTree as ET
import re
import json

def parse_svg_path_simple(path_string):
    """
    Simple SVG path parser for M, L, Z commands
    """
    points = []
    commands = re.findall(r'[MLZmlz]|[-+]?\d*\.?\d+', path_string)

    current_x, current_y = 0, 0
    i = 0

    while i < len(commands):
        cmd = commands[i]

        if cmd in ['M', 'm']:  # Move to
            i += 1
            x = float(commands[i])
            i += 1
            y = float(commands[i])
            if cmd == 'm':  # relative
                current_x += x
                current_y += y
            else:  # absolute
                current_x = x
                current_y = y
            points.append((current_x, current_y))

        elif cmd in ['L', 'l']:  # Line to
            i += 1
            x = float(commands[i])
            i += 1
            y = float(commands[i])
            if cmd == 'l':  # relative
                current_x += x
                current_y += y
            else:  # absolute
                current_x = x
                current_y = y
            points.append((current_x, current_y))

        elif cmd in ['H', 'h']:  # Horizontal line
            i += 1
            x = float(commands[i])
            if cmd == 'h':
                current_x += x
            else:
                current_x = x
            points.append((current_x, current_y))

        elif cmd in ['V', 'v']:  # Vertical line
            i += 1
            y = float(commands[i])
            if cmd == 'v':
                current_y += y
            else:
                current_y = y
            points.append((current_x, current_y))

        elif cmd in ['Z', 'z']:  # Close path
            if len(points) > 0 and points[0] != points[-1]:
                points.append(points[0])

        i += 1

    return points

def parse_svg_polygon(points_string):
    """Parse SVG polygon points attribute"""
    coords = re.findall(r'[-+]?\d*\.?\d+', points_string)
    points = [(float(coords[i]), float(coords[i+1]))
              for i in range(0, len(coords)-1, 2)]
    return points

def svg_to_geodataframe(svg_file, world_bounds=None):
    """
    Convert SVG to GeoDataFrame with proper georeferencing

    Parameters:
    -----------
    svg_file : str
        Path to SVG file
    world_bounds : tuple, optional
        (min_lon, min_lat, max_lon, max_lat) for georeferencing
        Default is (-180, -90, 180, 90) for world map
    """
    if world_bounds is None:
        world_bounds = (-180, -90, 180, 90)

    # Parse SVG
    tree = ET.parse(svg_file)
    root = tree.getroot()

    # Get SVG viewBox or dimensions
    viewbox = root.get('viewBox')
    if viewbox:
        vb_parts = viewbox.split()
        svg_width = float(vb_parts[2])
        svg_height = float(vb_parts[3])
    else:
        svg_width = float(root.get('width', '1000').replace('px', ''))
        svg_height = float(root.get('height', '500').replace('px', ''))

    print(f"SVG dimensions: {svg_width} x {svg_height}")

    geometries = []
    attributes = []

    # Define XML namespace
    ns = {'svg': 'http://www.w3.org/2000/svg'}

    # Find all groups (each should be a subrealm)
    groups = root.findall('.//svg:g[@id]', ns)
    print(f"Found {len(groups)} groups with IDs")

    for group in groups:
        group_id = group.get('id')

        # Find all paths and polygons in this group
        paths = group.findall('.//svg:path', ns)
        polygons = group.findall('.//svg:polygon', ns)

        all_polys = []

        # Process paths
        for path in paths:
            d = path.get('d')
            if not d:
                continue

            try:
                points = parse_svg_path_simple(d)
                if len(points) >= 3:
                    all_polys.append(Polygon(points))
            except Exception as e:
                print(f"  Warning: Could not parse path in {group_id}: {e}")
                continue

        # Process polygons
        for polygon in polygons:
            points_str = polygon.get('points')
            if not points_str:
                continue

            try:
                points = parse_svg_polygon(points_str)
                if len(points) >= 3:
                    all_polys.append(Polygon(points))
            except Exception as e:
                print(f"  Warning: Could not parse polygon in {group_id}: {e}")
                continue

        if not all_polys:
            continue

        # Combine all polygons in this group into a MultiPolygon or single Polygon
        if len(all_polys) == 1:
            geom = all_polys[0]
        else:
            geom = MultiPolygon(all_polys)

        # Transform coordinates
        # 1. Flip Y axis (SVG has origin at top-left, maps have origin at bottom-left)
        geom = scale(geom, xfact=1, yfact=-1, origin=(0, svg_height/2))

        # 2. Scale to world coordinates
        x_scale = (world_bounds[2] - world_bounds[0]) / svg_width
        y_scale = (world_bounds[3] - world_bounds[1]) / svg_height
        geom = scale(geom, xfact=x_scale, yfact=y_scale, origin=(0, 0))

        # 3. Translate to world bounds
        geom = translate(geom, xoff=world_bounds[0], yoff=world_bounds[1])

        geometries.append(geom)

        # Extract attributes
        attrs = {
            'id': group_id,
            'name': group_id.replace('_', ' ').title()  # Clean up ID for name
        }
        attributes.append(attrs)

        print(f"  Processed: {group_id}")

    # Create GeoDataFrame
    gdf = gpd.GeoDataFrame(attributes, geometry=geometries, crs="EPSG:4326")

    return gdf

def main():
    svg_file = '/root/silvi-open/treekipedia/Polygons-subrealms.svg'
    output_geojson = '/root/silvi-open/treekipedia/subrealms.geojson'

    print("🗺️  Converting Subrealms SVG to GeoJSON")
    print("=" * 50)

    # Convert
    gdf = svg_to_geodataframe(svg_file)

    print(f"\n✅ Converted {len(gdf)} subrealms")

    # Save as GeoJSON
    gdf.to_file(output_geojson, driver='GeoJSON')
    print(f"💾 Saved to: {output_geojson}")

    # Print summary
    print("\n📊 Summary:")
    print(gdf[['id', 'name']])

    # Print bounds
    bounds = gdf.total_bounds
    print(f"\n🌍 Geographic bounds:")
    print(f"   Min Lon: {bounds[0]:.2f}°")
    print(f"   Min Lat: {bounds[1]:.2f}°")
    print(f"   Max Lon: {bounds[2]:.2f}°")
    print(f"   Max Lat: {bounds[3]:.2f}°")

if __name__ == "__main__":
    main()
