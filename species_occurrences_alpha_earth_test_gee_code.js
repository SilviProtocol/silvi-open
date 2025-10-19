// ====================================================================
// SPECIES OCCURRENCE DATA IN GOOGLE EARTH ENGINE
// Generated automatically by Python upload script
// ====================================================================

// Load your uploaded species data
var speciesData = ee.FeatureCollection('users/treekipedia/species_occurrences_alpha_earth_test');

// Basic dataset information
print('Dataset loaded successfully!');
print('Total occurrences:', speciesData.size());
print('Unique species:', speciesData.aggregate_array('species').distinct().size());
print('Date range:', speciesData.aggregate_min('year'), 'to', speciesData.aggregate_max('year'));

// ====================================================================
// SPECIES FILTERING AND ANALYSIS
// ====================================================================

// Filter by individual species
var whiteOak = speciesData.filter(ee.Filter.eq('species', 'Quercus alba'));
var robin = speciesData.filter(ee.Filter.eq('species', 'Turdus migratorius'));

print('White Oak occurrences:', whiteOak.size());
print('American Robin occurrences:', robin.size());

// ====================================================================
// ALPHA EARTH TILE ANALYSIS
// ====================================================================

// Group occurrences by Alpha Earth tiles
var tileGroups = speciesData
  .select(['alpha_tile_id', 'species'])
  .distinct()
  .aggregate_histogram('alpha_tile_id');

print('Alpha Earth tiles with data:', tileGroups);

// Count species per tile
var speciesPerTile = speciesData
  .select(['alpha_tile_id', 'species'])
  .distinct()
  .reduceColumns({
    reducer: ee.Reducer.count().group({
      groupField: 0,
      groupName: 'alpha_tile_id'
    }),
    selectors: ['alpha_tile_id', 'species']
  });

print('Species count per Alpha Earth tile:', speciesPerTile);

// ====================================================================
// VISUALIZATION
// ====================================================================

// Center map on data
var bounds = speciesData.geometry().bounds();
Map.centerObject(bounds, 5);

// Create visualization styles
var whiteOakStyle = {
  color: '228B22',  // Forest Green
  pointRadius: 4,
  pointShape: 'circle',
  width: 2,
  fillColor: '90EE90'
};

var robinStyle = {
  color: '4169E1',  // Royal Blue  
  pointRadius: 3,
  pointShape: 'circle',
  width: 2,
  fillColor: '87CEEB'
};

// Add species layers to map
Map.addLayer(whiteOak.style(whiteOakStyle), {}, 'White Oak (Quercus alba)', true);
Map.addLayer(robin.style(robinStyle), {}, 'American Robin (Turdus migratorius)', true);

// ====================================================================
// NEXT STEPS: ALPHA EARTH INTEGRATION
// ====================================================================

// This is where you'll integrate Alpha Earth embeddings:
// 1. Load Alpha Earth imagery/data
// 2. Extract 64-band embeddings for each occurrence point  
// 3. Create species landscape profiles
// 4. Build similarity-based species recommendations

print('\n🎉 Your species occurrence data is ready for Alpha Earth analysis!');
print('Next steps:');
print('1. Load Alpha Earth embedding data');
print('2. Extract embeddings for each occurrence point');
print('3. Create species landscape preference profiles');
print('4. Build landscape similarity matching system');
