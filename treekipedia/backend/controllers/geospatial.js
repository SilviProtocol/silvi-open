/**
 * Geospatial controller for querying species data using PostGIS and geohash tiles
 * Provides spatial queries on Marina's compressed occurrence data
 */

module.exports = (pool) => {

// Find species near a specific location
async function findSpeciesNearby(req, res) {
  try {
    const { lat, lng, radius = 5 } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Missing required parameters: lat and lng' 
      });
    }
    
    const radiusMeters = radius * 1000; // Convert km to meters
    
    // Query geohash tiles within radius and extract unique species
    const query = `
      WITH nearby_tiles AS (
        SELECT species_data
        FROM geohash_species_tiles
        WHERE ST_DWithin(
          center_point,
          ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
          $3
        )
      )
      SELECT DISTINCT jsonb_object_keys(species_data) as taxon_id
      FROM nearby_tiles
      ORDER BY taxon_id;
    `;
    
    const result = await pool.query(query, [
      parseFloat(lng), 
      parseFloat(lat), 
      radiusMeters
    ]);
    
    // Get species details for found taxon IDs
    const taxonIds = result.rows.map(row => row.taxon_id);
    
    if (taxonIds.length > 0) {
      const speciesQuery = `
        SELECT taxon_id, scientific_name, common_name
        FROM species
        WHERE taxon_id = ANY($1)
        ORDER BY scientific_name;
      `;
      
      const speciesResult = await pool.query(speciesQuery, [taxonIds]);
      
      res.json({
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        radius_km: radius,
        species_count: speciesResult.rows.length,
        species: speciesResult.rows
      });
    } else {
      res.json({
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        radius_km: radius,
        species_count: 0,
        species: []
      });
    }
    
  } catch (error) {
    console.error('Error in findSpeciesNearby:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get species distribution as geohash tiles
async function getSpeciesDistribution(req, res) {
  try {
    const { taxon_id } = req.params;
    
    const query = `
      SELECT 
        geohash_l7,
        (species_data->>$1)::int as occurrence_count,
        ST_AsGeoJSON(geometry)::json as geometry,
        datetime,
        data_source
      FROM geohash_species_tiles
      WHERE species_data ? $1
      ORDER BY occurrence_count DESC;
    `;
    
    const result = await pool.query(query, [taxon_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'No distribution data found for this species' 
      });
    }
    
    // Calculate distribution statistics
    const totalOccurrences = result.rows.reduce(
      (sum, row) => sum + row.occurrence_count, 
      0
    );
    
    res.json({
      taxon_id,
      tile_count: result.rows.length,
      total_occurrences: totalOccurrences,
      distribution: result.rows.map(row => ({
        type: 'Feature',
        properties: {
          geohash: row.geohash_l7,
          occurrences: row.occurrence_count,
          datetime: row.datetime,
          data_source: row.data_source
        },
        geometry: row.geometry
      }))
    });
    
  } catch (error) {
    console.error('Error in getSpeciesDistribution:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get occurrence heatmap for a bounding box
async function getOccurrenceHeatmap(req, res) {
  try {
    const { minLat, minLng, maxLat, maxLng } = req.query;
    
    if (!minLat || !minLng || !maxLat || !maxLng) {
      return res.status(400).json({ 
        error: 'Missing required parameters: minLat, minLng, maxLat, maxLng' 
      });
    }
    
    const query = `
      SELECT 
        geohash_l7,
        total_occurrences,
        species_count,
        ST_AsGeoJSON(geometry)::json as geometry,
        datetime
      FROM geohash_species_tiles
      WHERE ST_Intersects(
        geometry,
        ST_MakeEnvelope($1, $2, $3, $4, 4326)
      )
      ORDER BY total_occurrences DESC;
    `;
    
    const result = await pool.query(query, [
      parseFloat(minLng),
      parseFloat(minLat),
      parseFloat(maxLng),
      parseFloat(maxLat)
    ]);
    
    res.json({
      bbox: {
        min: [parseFloat(minLng), parseFloat(minLat)],
        max: [parseFloat(maxLng), parseFloat(maxLat)]
      },
      tile_count: result.rows.length,
      features: result.rows.map(row => ({
        type: 'Feature',
        properties: {
          geohash: row.geohash_l7,
          total_occurrences: row.total_occurrences,
          species_count: row.species_count,
          datetime: row.datetime
        },
        geometry: row.geometry
      }))
    });
    
  } catch (error) {
    console.error('Error in getOccurrenceHeatmap:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get species in a specific geohash tile
async function getSpeciesInTile(req, res) {
  try {
    const { geohash } = req.params;
    
    // Validate geohash length
    if (geohash.length !== 7) {
      return res.status(400).json({ 
        error: 'Invalid geohash. Must be exactly 7 characters (level 7)' 
      });
    }
    
    const query = `
      SELECT 
        species_data,
        total_occurrences,
        species_count,
        datetime,
        data_source,
        ST_AsGeoJSON(geometry)::json as geometry
      FROM geohash_species_tiles
      WHERE geohash_l7 = $1;
    `;
    
    const result = await pool.query(query, [geohash]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        error: 'No data found for this geohash tile' 
      });
    }
    
    const tile = result.rows[0];
    const taxonIds = Object.keys(tile.species_data);
    
    // Get species details
    const speciesQuery = `
      SELECT taxon_id, scientific_name, common_name
      FROM species
      WHERE taxon_id = ANY($1)
      ORDER BY scientific_name;
    `;
    
    const speciesResult = await pool.query(speciesQuery, [taxonIds]);
    
    // Map occurrence counts to species
    const speciesWithCounts = speciesResult.rows.map(species => ({
      ...species,
      occurrence_count: tile.species_data[species.taxon_id]
    }));
    
    res.json({
      geohash: geohash,
      tile_info: {
        total_occurrences: tile.total_occurrences,
        species_count: tile.species_count,
        datetime: tile.datetime,
        data_source: tile.data_source,
        geometry: tile.geometry
      },
      species: speciesWithCounts
    });
    
  } catch (error) {
    console.error('Error in getSpeciesInTile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get tiles with temporal filtering (STAC-compliant)
async function getTilesByTimeRange(req, res) {
  try {
    const { start, end, bbox } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({ 
        error: 'Missing required parameters: start and end dates' 
      });
    }
    
    let query = `
      SELECT 
        geohash_l7 as id,
        'Feature' as type,
        ST_AsGeoJSON(geometry)::json as geometry,
        json_build_object(
          'datetime', datetime,
          'species_count', species_count,
          'total_occurrences', total_occurrences,
          'data_source', data_source
        ) as properties
      FROM geohash_species_tiles
      WHERE datetime >= $1 AND datetime <= $2
    `;
    
    const params = [start, end];
    
    // Add spatial filter if bbox provided
    if (bbox) {
      const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(parseFloat);
      query += ` AND ST_Intersects(geometry, ST_MakeEnvelope($3, $4, $5, $6, 4326))`;
      params.push(minLng, minLat, maxLng, maxLat);
    }
    
    query += ` ORDER BY datetime DESC;`;
    
    const result = await pool.query(query, params);
    
    res.json({
      type: 'FeatureCollection',
      features: result.rows,
      numberReturned: result.rows.length,
      timeRange: { start, end }
    });
    
  } catch (error) {
    console.error('Error in getTilesByTimeRange:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get geospatial statistics
async function getGeospatialStats(req, res) {
  try {
    const query = `
      SELECT 
        COUNT(*) as total_tiles,
        COUNT(DISTINCT jsonb_object_keys(species_data)) as unique_species,
        SUM(total_occurrences) as total_occurrences,
        MIN(datetime) as earliest_observation,
        MAX(datetime) as latest_observation,
        array_agg(DISTINCT data_source) as data_sources
      FROM geohash_species_tiles;
    `;
    
    const result = await pool.query(query);
    const stats = result.rows[0];
    
    // Get coverage area
    const coverageQuery = `
      SELECT 
        ST_Area(ST_Union(geometry)::geography) / 1000000 as coverage_area_km2,
        ST_AsGeoJSON(ST_Envelope(ST_Union(geometry)))::json as bounding_box
      FROM geohash_species_tiles;
    `;
    
    const coverageResult = await pool.query(coverageQuery);
    const coverage = coverageResult.rows[0];
    
    res.json({
      tiles: {
        total: parseInt(stats.total_tiles),
        tile_size_m: 150  // Level 7 geohash
      },
      species: {
        unique_count: parseInt(stats.unique_species)
      },
      occurrences: {
        total: parseInt(stats.total_occurrences)
      },
      temporal: {
        earliest: stats.earliest_observation,
        latest: stats.latest_observation
      },
      spatial: {
        coverage_km2: Math.round(coverage.coverage_area_km2),
        bounding_box: coverage.bounding_box
      },
      data_sources: stats.data_sources
    });
    
  } catch (error) {
    console.error('Error in getGeospatialStats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Analyze species within a polygon area
async function analyzePlot(req, res) {
  try {
    const { geometry } = req.body;
    
    if (!geometry || geometry.type !== 'Polygon') {
      return res.status(400).json({ 
        error: 'Invalid geometry. Must be a GeoJSON Polygon' 
      });
    }
    
    // Convert GeoJSON polygon to PostGIS format
    const geoJsonString = JSON.stringify(geometry);
    
    const query = `
      WITH user_polygon AS (
        SELECT ST_GeomFromGeoJSON($1) as geom
      ),
      intersected_countries AS (
        SELECT
          c.admin,
          CASE
            WHEN c.admin = 'United States of America' THEN 'United States'
            WHEN c.admin = 'United Kingdom' THEN 'United Kingdom'
            ELSE c.admin
          END as species_search_name,
          ST_Area(ST_Intersection(c.geom, up.geom)) / ST_Area(up.geom) as area_fraction
        FROM countries c, user_polygon up
        WHERE ST_Intersects(c.geom, up.geom)
      ),
      primary_country AS (
        SELECT admin, species_search_name
        FROM intersected_countries
        ORDER BY area_fraction DESC
        LIMIT 1
      ),
      intersecting_tiles AS (
        SELECT
          species_data,
          geohash_l7
        FROM geohash_species_tiles gst, user_polygon up
        WHERE ST_Intersects(gst.geometry, up.geom)
      ),
      species_aggregated AS (
        SELECT
          key as taxon_id,
          SUM(value::int) as total_occurrences,
          COUNT(DISTINCT geohash_l7) as tile_count
        FROM intersecting_tiles,
        LATERAL jsonb_each_text(species_data)
        GROUP BY key
      )
      SELECT
        sa.taxon_id,
        sa.total_occurrences,
        sa.tile_count,
        COALESCE(s.species_scientific_name, s.accepted_scientific_name) as scientific_name,
        s.common_name,
        s.family,
        s.genus,

        -- Country detection (primary country for display)
        pc.admin as country_name,
        pc.species_search_name,

        -- Native status analysis (check ALL intersected countries)
        CASE
          WHEN EXISTS (
            SELECT 1 FROM intersected_countries ic
            WHERE s.countries_native LIKE '%' || ic.species_search_name || '%'
          ) THEN 'native'
          WHEN EXISTS (
            SELECT 1 FROM intersected_countries ic
            WHERE s.countries_introduced LIKE '%' || ic.species_search_name || '%'
          ) THEN 'introduced'
          ELSE 'unknown'
        END as native_status,

        -- Calculate native percentage across all intersected countries
        COALESCE((
          SELECT
            ROUND(
              SUM(
                CASE
                  WHEN s.countries_native LIKE '%' || ic.species_search_name || '%' THEN ic.area_fraction * 100
                  ELSE 0
                END
              )
            )
          FROM intersected_countries ic
        ), 0) as native_percentage,

        -- Intact forest analysis
        CASE
          WHEN s.present_intact_forest LIKE '%YES%' THEN 'present'
          WHEN s.present_intact_forest = 'NO' THEN 'absent'
          ELSE 'unknown'
        END as intact_forest_status,

        -- Commercial status
        CASE WHEN s.comercialspecies_lower = 'YES' THEN true ELSE false END as is_commercial

      FROM species_aggregated sa
      LEFT JOIN species s ON s.taxon_id = sa.taxon_id
      LEFT JOIN primary_country pc ON true
      ORDER BY sa.total_occurrences DESC;
    `;
    
    const result = await pool.query(query, [geoJsonString]);

    const totalOccurrences = result.rows.reduce(
      (sum, row) => sum + parseInt(row.total_occurrences),
      0
    );

    // Calculate cross-analysis statistics
    let crossAnalysis = null;
    if (result.rows.length > 0) {
      const firstRow = result.rows[0];
      const countryDetected = firstRow.country_name != null;

      // Get all intersected countries for display
      const countriesQuery = `
        WITH user_polygon AS (
          SELECT ST_GeomFromGeoJSON($1) as geom
        ),
        intersected_countries AS (
          SELECT
            c.admin,
            ST_Area(ST_Intersection(c.geom, up.geom)) / ST_Area(up.geom) as area_fraction
          FROM countries c, user_polygon up
          WHERE ST_Intersects(c.geom, up.geom)
          ORDER BY area_fraction DESC
        )
        SELECT admin, ROUND(area_fraction * 100) as percentage
        FROM intersected_countries
        WHERE area_fraction > 0.01;  -- Only show countries with >1% overlap
      `;

      const countriesResult = await pool.query(countriesQuery, [geoJsonString]);
      const countryList = countriesResult.rows.map(r =>
        `${r.admin} (${r.percentage}%)`
      ).join(', ');

      // Count native status categories
      const nativeSpecies = result.rows.filter(row => row.native_status === 'native').length;
      const introducedSpecies = result.rows.filter(row => row.native_status === 'introduced').length;
      const unknownNativeStatus = result.rows.filter(row => row.native_status === 'unknown').length;

      // Count intact forest status categories
      const intactForestSpecies = result.rows.filter(row => row.intact_forest_status === 'present').length;
      const nonIntactForestSpecies = result.rows.filter(row => row.intact_forest_status === 'absent').length;
      const unknownForestStatus = result.rows.filter(row => row.intact_forest_status === 'unknown').length;

      // Count commercial species
      const commercialSpecies = result.rows.filter(row => row.is_commercial === true).length;
      const nonCommercialSpecies = result.rows.filter(row => row.is_commercial === false).length;

      crossAnalysis = {
        country: countryList || null,
        countryDetected: countryDetected,
        nativeSpecies,
        introducedSpecies,
        unknownNativeStatus,
        intactForestSpecies,
        nonIntactForestSpecies,
        unknownForestStatus,
        commercialSpecies,
        nonCommercialSpecies
      };
    }

    res.json({
      totalSpecies: result.rows.length,
      totalOccurrences: totalOccurrences,
      crossAnalysis: crossAnalysis,
      species: result.rows.map(row => ({
        taxon_id: row.taxon_id,
        scientific_name: row.scientific_name || `Unknown (${row.taxon_id})`,
        common_name: row.common_name || null,
        family: row.family || null,
        genus: row.genus || null,
        occurrences: parseInt(row.total_occurrences),
        tile_count: parseInt(row.tile_count),
        nativeStatus: row.native_status || 'unknown',
        nativePercentage: parseInt(row.native_percentage) || 0,
        intactForestStatus: row.intact_forest_status || 'unknown',
        isCommercial: row.is_commercial || false
      }))
    });
    
  } catch (error) {
    console.error('Error in analyzePlot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get species within a specific ecoregion
async function getSpeciesByEcoregion(req, res) {
  try {
    const { ecoregion_id } = req.params;
    const { limit = 100, offset = 0 } = req.query;
    
    if (!ecoregion_id) {
      return res.status(400).json({ 
        error: 'Missing required parameter: ecoregion_id' 
      });
    }
    
    const query = `
      WITH ecoregion_species AS (
        SELECT 
          jsonb_object_keys(species_data) as taxon_id,
          SUM((species_data->>jsonb_object_keys(species_data))::int) as total_occurrences,
          COUNT(DISTINCT geohash_l7) as tile_count
        FROM geohash_species_tiles
        WHERE eco_id = $1
        GROUP BY jsonb_object_keys(species_data)
      )
      SELECT 
        es.taxon_id,
        es.total_occurrences,
        es.tile_count,
        s.species_scientific_name as scientific_name,
        s.common_name,
        s.family,
        s.genus
      FROM ecoregion_species es
      LEFT JOIN species s ON s.taxon_id = es.taxon_id
      ORDER BY es.total_occurrences DESC
      LIMIT $2 OFFSET $3;
    `;
    
    const result = await pool.query(query, [ecoregion_id, limit, offset]);
    
    // Get ecoregion info
    const ecoregionQuery = `
      SELECT eco_id, eco_name, biome_name, realm, 
             ST_Area(geom::geography) / 1000000 as area_km2
      FROM ecoregions WHERE eco_id = $1;
    `;
    const ecoregionResult = await pool.query(ecoregionQuery, [ecoregion_id]);
    
    if (ecoregionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ecoregion not found' });
    }
    
    const ecoregion = ecoregionResult.rows[0];
    
    res.json({
      ecoregion: {
        eco_id: ecoregion.eco_id,
        eco_name: ecoregion.eco_name,
        biome_name: ecoregion.biome_name,
        realm: ecoregion.realm,
        area_km2: Math.round(parseFloat(ecoregion.area_km2))
      },
      species_count: result.rows.length,
      species: result.rows.map(row => ({
        taxon_id: row.taxon_id,
        scientific_name: row.scientific_name || `Unknown (${row.taxon_id})`,
        common_name: row.common_name || null,
        family: row.family || null,
        genus: row.genus || null,
        occurrences: parseInt(row.total_occurrences),
        tile_count: parseInt(row.tile_count)
      }))
    });
    
  } catch (error) {
    console.error('Error in getSpeciesByEcoregion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get ecoregion information for specific coordinates
async function getEcoregionAtPoint(req, res) {
  try {
    const { lat, lng } = req.query;
    
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Missing required parameters: lat and lng' 
      });
    }
    
    const query = `
      SELECT 
        eco_id,
        eco_name,
        biome_name,
        realm,
        ST_Area(geom::geography) / 1000000 as area_km2
      FROM ecoregions
      WHERE ST_Contains(geom, ST_SetSRID(ST_MakePoint($1, $2), 4326))
      LIMIT 1;
    `;
    
    const result = await pool.query(query, [parseFloat(lng), parseFloat(lat)]);
    
    if (result.rows.length === 0) {
      return res.json({
        location: { lat: parseFloat(lat), lng: parseFloat(lng) },
        ecoregion: null,
        message: 'No ecoregion found at this location (may be ocean or unmapped area)'
      });
    }
    
    const ecoregion = result.rows[0];
    
    res.json({
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      ecoregion: {
        eco_id: ecoregion.eco_id,
        eco_name: ecoregion.eco_name,
        biome_name: ecoregion.biome_name,
        realm: ecoregion.realm,
        area_km2: Math.round(parseFloat(ecoregion.area_km2))
      }
    });
    
  } catch (error) {
    console.error('Error in getEcoregionAtPoint:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get overlapping ecoregions for a polygon
async function getEcoregionsIntersecting(req, res) {
  try {
    const { geometry } = req.body;
    
    if (!geometry || geometry.type !== 'Polygon') {
      return res.status(400).json({ 
        error: 'Invalid geometry. Must be a GeoJSON Polygon' 
      });
    }
    
    const geoJsonString = JSON.stringify(geometry);
    
    const query = `
      SELECT 
        e.eco_id,
        e.eco_name,
        e.biome_name,
        e.realm,
        ST_Area(e.geom::geography) / 1000000 as total_area_km2,
        ST_Area(ST_Intersection(e.geom, ST_GeomFromGeoJSON($1))::geography) / 1000000 as intersection_area_km2,
        ST_AsGeoJSON(ST_Intersection(e.geom, ST_GeomFromGeoJSON($1)))::json as intersection_geom
      FROM ecoregions e
      WHERE ST_Intersects(e.geom, ST_GeomFromGeoJSON($1))
      ORDER BY intersection_area_km2 DESC;
    `;
    
    const result = await pool.query(query, [geoJsonString]);
    
    res.json({
      ecoregions_count: result.rows.length,
      ecoregions: result.rows.map(row => ({
        eco_id: row.eco_id,
        eco_name: row.eco_name,
        biome_name: row.biome_name,
        realm: row.realm,
        total_area_km2: Math.round(parseFloat(row.total_area_km2)),
        intersection_area_km2: Math.round(parseFloat(row.intersection_area_km2)),
        coverage_percent: Math.round(parseFloat(row.intersection_area_km2) / parseFloat(row.total_area_km2) * 100),
        geometry: row.intersection_geom
      }))
    });
    
  } catch (error) {
    console.error('Error in getEcoregionsIntersecting:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get ecoregion diversity statistics
async function getEcoregionStats(req, res) {
  try {
    const query = `
      SELECT 
        e.eco_id,
        e.eco_name,
        e.biome_name,
        e.realm,
        ST_Area(e.geom::geography) / 1000000 as area_km2,
        COUNT(DISTINCT t.geohash_l7) as tile_count,
        COUNT(DISTINCT jsonb_object_keys(t.species_data)) as unique_species,
        SUM(t.total_occurrences) as total_occurrences,
        COUNT(DISTINCT jsonb_object_keys(t.species_data))::float / (ST_Area(e.geom::geography) / 1000000000) as species_per_1000km2
      FROM ecoregions e
      LEFT JOIN geohash_species_tiles t ON t.eco_id = e.eco_id
      GROUP BY e.eco_id, e.eco_name, e.biome_name, e.realm, e.geom
      HAVING COUNT(DISTINCT jsonb_object_keys(t.species_data)) > 0
      ORDER BY unique_species DESC
      LIMIT 50;
    `;
    
    const result = await pool.query(query);
    
    res.json({
      top_ecoregions: result.rows.map(row => ({
        eco_id: row.eco_id,
        eco_name: row.eco_name,
        biome_name: row.biome_name,
        realm: row.realm,
        area_km2: Math.round(parseFloat(row.area_km2)),
        tile_count: parseInt(row.tile_count),
        unique_species: parseInt(row.unique_species),
        total_occurrences: parseInt(row.total_occurrences),
        species_density: parseFloat(row.species_per_1000km2).toFixed(2)
      }))
    });
    
  } catch (error) {
    console.error('Error in getEcoregionStats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Export ecoregion boundary in various formats
async function exportEcoregion(req, res) {
  try {
    const { ecoregion_id } = req.params;
    const { format = 'kml' } = req.query;
    
    if (!ecoregion_id) {
      return res.status(400).json({ 
        error: 'Missing required parameter: ecoregion_id' 
      });
    }

    // First get basic ecoregion info
    const infoQuery = `
      SELECT eco_id, eco_name, biome_name, realm,
             ST_Area(geom::geography) / 1000000 as area_km2
      FROM ecoregions 
      WHERE eco_id = $1;
    `;
    
    const infoResult = await pool.query(infoQuery, [ecoregion_id]);
    
    if (infoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ecoregion not found' });
    }
    
    const ecoregion = infoResult.rows[0];
    
    // Generate different formats based on request
    if (format.toLowerCase() === 'kml') {
      const kmlQuery = `
        SELECT ST_AsKML(geom) as kml_geometry 
        FROM ecoregions 
        WHERE eco_id = $1;
      `;
      
      const kmlResult = await pool.query(kmlQuery, [ecoregion_id]);
      const kmlGeometry = kmlResult.rows[0].kml_geometry;
      
      // Create full KML document with metadata
      const kmlDocument = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${ecoregion.eco_name}</name>
    <description>
      WWF Terrestrial Ecoregion
      
      Ecoregion: ${ecoregion.eco_name}
      Biome: ${ecoregion.biome_name}
      Realm: ${ecoregion.realm}
      Area: ${Math.round(parseFloat(ecoregion.area_km2)).toLocaleString()} km²
      
      Source: Treekipedia (https://treekipedia.silvi.earth)
      Data: WWF Terrestrial Ecoregions 2017
    </description>
    <Style id="ecoregionStyle">
      <LineStyle>
        <color>ff00ff00</color>
        <width>2</width>
      </LineStyle>
      <PolyStyle>
        <color>7f00ff00</color>
        <fill>1</fill>
        <outline>1</outline>
      </PolyStyle>
    </Style>
    <Placemark>
      <name>${ecoregion.eco_name}</name>
      <description>
        Biome: ${ecoregion.biome_name}
        Realm: ${ecoregion.realm}
        Area: ${Math.round(parseFloat(ecoregion.area_km2)).toLocaleString()} km²
      </description>
      <styleUrl>#ecoregionStyle</styleUrl>
      ${kmlGeometry}
    </Placemark>
  </Document>
</kml>`;

      res.set({
        'Content-Type': 'application/vnd.google-earth.kml+xml',
        'Content-Disposition': `attachment; filename="${ecoregion.eco_name.replace(/[^a-zA-Z0-9]/g, '_')}.kml"`
      });
      
      res.send(kmlDocument);
      
    } else if (format.toLowerCase() === 'geojson') {
      const geoJsonQuery = `
        SELECT 
          json_build_object(
            'type', 'Feature',
            'properties', json_build_object(
              'eco_id', eco_id,
              'eco_name', eco_name,
              'biome_name', biome_name,
              'realm', realm,
              'area_km2', ROUND(ST_Area(geom::geography) / 1000000)
            ),
            'geometry', ST_AsGeoJSON(geom)::json
          ) as geojson
        FROM ecoregions 
        WHERE eco_id = $1;
      `;
      
      const geoJsonResult = await pool.query(geoJsonQuery, [ecoregion_id]);
      
      res.set({
        'Content-Type': 'application/geo+json',
        'Content-Disposition': `attachment; filename="${ecoregion.eco_name.replace(/[^a-zA-Z0-9]/g, '_')}.geojson"`
      });
      
      res.json(geoJsonResult.rows[0].geojson);
      
    } else if (format.toLowerCase() === 'wkt') {
      const wktQuery = `
        SELECT ST_AsText(geom) as wkt_geometry 
        FROM ecoregions 
        WHERE eco_id = $1;
      `;
      
      const wktResult = await pool.query(wktQuery, [ecoregion_id]);
      
      res.set({
        'Content-Type': 'text/plain',
        'Content-Disposition': `attachment; filename="${ecoregion.eco_name.replace(/[^a-zA-Z0-9]/g, '_')}.wkt"`
      });
      
      res.send(`# ${ecoregion.eco_name}\n# Biome: ${ecoregion.biome_name}\n# Realm: ${ecoregion.realm}\n# Area: ${Math.round(parseFloat(ecoregion.area_km2)).toLocaleString()} km²\n\n${wktResult.rows[0].wkt_geometry}`);
      
    } else {
      return res.status(400).json({ 
        error: 'Unsupported format. Supported formats: kml, geojson, wkt' 
      });
    }
    
  } catch (error) {
    console.error('Error in exportEcoregion:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get ecoregion boundaries for map display
async function getEcoregionBoundaries(req, res) {
  try {
    const { bbox, simplify = 0.01 } = req.query;

    let query;
    let params = [];

    if (bbox) {
      // Parse bbox: minLng,minLat,maxLng,maxLat
      const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);

      query = `
        SELECT
          eco_id,
          eco_name,
          biome_name,
          realm,
          color,
          color_bio,
          ST_AsGeoJSON(ST_Simplify(geom, $5))::json as geometry
        FROM ecoregions
        WHERE ST_Intersects(
          geom,
          ST_MakeEnvelope($1, $2, $3, $4, 4326)
        )
      `;
      params = [minLng, minLat, maxLng, maxLat, simplify];
    } else {
      // Return all ecoregions (simplified for performance)
      query = `
        SELECT
          eco_id,
          eco_name,
          biome_name,
          realm,
          color,
          color_bio,
          ST_AsGeoJSON(ST_Simplify(geom, $1))::json as geometry
        FROM ecoregions
      `;
      params = [simplify];
    }

    const result = await pool.query(query, params);

    // Return as GeoJSON FeatureCollection
    res.json({
      type: 'FeatureCollection',
      features: result.rows.map(row => ({
        type: 'Feature',
        properties: {
          eco_id: row.eco_id,
          eco_name: row.eco_name,
          biome_name: row.biome_name,
          realm: row.realm,
          color: row.color,
          color_bio: row.color_bio
        },
        geometry: row.geometry
      }))
    });

  } catch (error) {
    console.error('Error in getEcoregionBoundaries:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

return {
  findSpeciesNearby,
  getSpeciesDistribution,
  getOccurrenceHeatmap,
  getSpeciesInTile,
  getTilesByTimeRange,
  getGeospatialStats,
  analyzePlot,
  getSpeciesByEcoregion,
  getEcoregionAtPoint,
  getEcoregionsIntersecting,
  getEcoregionStats,
  exportEcoregion,
  getEcoregionBoundaries
};

};