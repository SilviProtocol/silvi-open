const express = require('express');

module.exports = (pool) => {
const router = express.Router();
const geospatialController = require('../controllers/geospatial')(pool);

/**
 * Geospatial API Routes
 * All routes are prefixed with /api/geospatial
 */

// Find species near a location
// GET /api/geospatial/species/nearby?lat=37.7749&lng=-122.4194&radius=5
router.get('/species/nearby', geospatialController.findSpeciesNearby);

// Get species distribution as geohash tiles
// GET /api/geospatial/species/:taxon_id/distribution
router.get('/species/:taxon_id/distribution', geospatialController.getSpeciesDistribution);

// Get occurrence heatmap for a bounding box
// GET /api/geospatial/heatmap?minLat=37&minLng=-123&maxLat=38&maxLng=-122
router.get('/heatmap', geospatialController.getOccurrenceHeatmap);

// Get species in a specific geohash tile
// GET /api/geospatial/tiles/:geohash
router.get('/tiles/:geohash', geospatialController.getSpeciesInTile);

// Get tiles with temporal filtering (STAC-compliant)
// GET /api/geospatial/tiles?start=2024-01-01&end=2024-12-31&bbox=-180,-90,180,90
router.get('/tiles', geospatialController.getTilesByTimeRange);

// Get geospatial statistics
// GET /api/geospatial/stats
router.get('/stats', geospatialController.getGeospatialStats);

// Analyze species within a polygon plot
// POST /api/geospatial/analyze-plot
router.post('/analyze-plot', geospatialController.analyzePlot);

// Get species within a specific ecoregion
// GET /api/geospatial/ecoregions/:ecoregion_id/species
router.get('/ecoregions/:ecoregion_id/species', geospatialController.getSpeciesByEcoregion);

// Get ecoregion info for coordinates
// GET /api/geospatial/ecoregions/at-point?lat=37.7749&lng=-122.4194
router.get('/ecoregions/at-point', geospatialController.getEcoregionAtPoint);

// Get overlapping ecoregions for a polygon
// POST /api/geospatial/ecoregions/intersect
router.post('/ecoregions/intersect', geospatialController.getEcoregionsIntersecting);

// Get ecoregion diversity statistics
// GET /api/geospatial/ecoregions/stats
router.get('/ecoregions/stats', geospatialController.getEcoregionStats);

// Export ecoregion boundary as KML/GeoJSON/WKT
// GET /api/geospatial/ecoregions/:ecoregion_id/export?format=kml
router.get('/ecoregions/:ecoregion_id/export', geospatialController.exportEcoregion);

return router;
};