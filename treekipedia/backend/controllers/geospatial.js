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
      WITH intersecting_tiles AS (
        SELECT 
          species_data
        FROM geohash_species_tiles
        WHERE ST_Intersects(
          geometry,
          ST_GeomFromGeoJSON($1)
        )
      ),
      species_aggregated AS (
        SELECT 
          key as taxon_id,
          SUM(value::int) as total_occurrences
        FROM intersecting_tiles,
        LATERAL jsonb_each_text(species_data)
        GROUP BY key
      )
      SELECT 
        sa.taxon_id,
        sa.total_occurrences,
        s.species_scientific_name as scientific_name,
        s.common_name
      FROM species_aggregated sa
      LEFT JOIN species s ON s.taxon_id = sa.taxon_id
      ORDER BY sa.total_occurrences DESC;
    `;
    
    const result = await pool.query(query, [geoJsonString]);
    
    const totalOccurrences = result.rows.reduce(
      (sum, row) => sum + parseInt(row.total_occurrences), 
      0
    );
    
    res.json({
      totalSpecies: result.rows.length,
      totalOccurrences: totalOccurrences,
      species: result.rows.map(row => ({
        taxon_id: row.taxon_id,
        scientific_name: row.scientific_name || 'Unknown species',
        common_name: row.common_name || null,
        occurrences: parseInt(row.total_occurrences)
      }))
    });
    
  } catch (error) {
    console.error('Error in analyzePlot:', error);
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
  analyzePlot
};

};