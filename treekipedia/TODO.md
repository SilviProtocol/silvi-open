# Treekipedia TODO - Next Development Steps

**Last Updated**: October 22, 2025
**Database**: 67,743 species, 5.8M geohash tiles, 847 ecoregions

---

## ✅ Recently Completed (Sept-Oct 2025)

### Native Status Cross-Analysis ✅
- [x] Update backend `/api/geospatial/analyze-plot` endpoint with native status analysis
- [x] Add country detection and native percentage calculation to response
- [x] Update frontend types.ts with new response structure (PlotAnalysisResponse, CrossAnalysisData)
- [x] Enhance ResultsList component to display native status breakdown
- [x] Add visual indicators (charts/percentages) for native vs introduced species
- [x] Create CrossAnalysisSummary component with beautiful progress bars
- [x] Add sorting by native status in species list
- [x] Test cross-analysis with various countries and polygons

### Ecoregion Integration (Backend) ✅
- [x] Run existing ecoregion assignment script to populate geohash tiles (97% complete - 5.6M/5.8M tiles)
- [x] Import 847 WWF ecoregions with full metadata (biome, realm, area)
- [x] Create 7 ecoregion API endpoints:
  - [x] GET /api/geospatial/ecoregions/:ecoregion_id/species
  - [x] GET /api/geospatial/ecoregions/at-point
  - [x] POST /api/geospatial/ecoregions/intersect
  - [x] GET /api/geospatial/ecoregions/stats
  - [x] GET /api/geospatial/ecoregions/:ecoregion_id/export
  - [x] GET /api/geospatial/ecoregions/boundaries
  - [x] GET /api/geospatial/ecoregions/native-species/:ecoregion_name

### Analysis Features ✅
- [x] CSV export functionality in ResultsList component
- [x] Native/Introduced/Unknown status badges with percentages
- [x] Intact forest status badges
- [x] Commercial species indicators

---

## 🎯 Immediate Priorities (Next 1-2 weeks)

### Ecoregion Frontend Integration
- [ ] Display ecoregion data in CrossAnalysisSummary (show which ecoregion(s) the polygon overlaps)
- [ ] Add ecoregion-based analysis option alongside country-based analysis
- [ ] Create UI toggle to choose between country vs ecoregion analysis mode
- [ ] Show ecoregion metadata (name, biome, realm) in analysis results
- [ ] Test ecoregion-based queries with various polygons
- [ ] Add ecoregion boundary visualization on map (optional enhancement)

### Documentation Updates
- [ ] Document new `/api/geospatial/analyze-plot` cross-analysis response format in API.md
- [ ] Document all 7 ecoregion endpoints in API.md
- [ ] Add examples of cross-analysis responses to PUBLIC_API_GUIDE.md
- [ ] Update README with new analysis features

### Database Optimization
- [ ] Add indexes on countries_native and countries_introduced columns for faster analysis
- [ ] Optimize cross-analysis query performance with proper indexing strategy
- [ ] Monitor query performance with larger polygon analyses
- [ ] Complete remaining 3% of ecoregion tile assignments (171k tiles)

---

## 🔧 Infrastructure & Performance

### Backend Enhancements
- [ ] Create helper functions for country name mapping and normalization
- [ ] Add caching for frequently accessed country polygon intersections
- [ ] Implement query result caching for repeated analysis requests
- [ ] Add request rate limiting for analysis endpoints

### Monitoring & Performance
- [ ] Set up query performance monitoring for spatial analyses
- [ ] Add logging for cross-analysis usage patterns
- [ ] Monitor memory usage during large polygon analyses
- [ ] Track most common analysis polygons and cache results

---

## 📊 Analysis Enhancement Options

### Advanced Cross-Analysis Features
- [ ] Multi-country polygon analysis (species crossing borders)
- [ ] Temporal analysis capabilities (species changes over time)
- [ ] Biodiversity metrics calculation (Shannon diversity, Simpson index)
- [ ] Species co-occurrence and community composition analysis
- [ ] Elevation-based analysis using terrain data
- [ ] Climate zone cross-referencing

### Data Enrichment
- [ ] Integrate climate data for species-environment correlations
- [ ] Add elevation data for elevation range analysis in polygons
- [ ] Consider IUCN Red List integration for conservation status analysis
- [ ] Explore trait data integration for functional diversity analysis

### User Experience Improvements
- [ ] Export as GeoJSON (species locations with metadata)
- [ ] Export as JSON (full analysis results)
- [ ] Analysis history and saved polygon management
- [ ] Comparison tools for multiple polygon analyses
- [ ] Interactive data visualization beyond basic species lists (D3.js charts?)
- [ ] Share analysis via unique URL

---

## 🧠 Knowledge Graph Integration Exploration

### Apache Jena/Fuseki Evaluation
- [ ] Assess current Blazegraph instance vs Fuseki capabilities for species data
- [ ] Research SPARQL query patterns for advanced species relationships
- [ ] Evaluate RDF data modeling for taxonomic hierarchies and ecological relationships
- [ ] Test semantic query capabilities with sample species data

### Graph Database Integration Planning
- [ ] Compare query capabilities: PostGIS spatial + semantic graphs vs pure relational
- [ ] Identify use cases where graph queries would enhance user experience
- [ ] Plan data modeling: species-ecosystem-location-taxonomy relationships in RDF
- [ ] Consider hybrid approach: PostGIS for spatial, graph for semantic relationships

### Advanced Query Capabilities Assessment
- [ ] Research complex ecological queries (food webs, habitat dependencies, co-occurrence)
- [ ] Evaluate SPARQL federation for linking external biodiversity databases
- [ ] Assess inference capabilities for taxonomic reasoning and ecological relationships
- [ ] Compare performance: graph queries vs complex SQL JOINs for multi-hop relationships

---

## 🔄 Technical Debt & Maintenance

### Code Quality
- [ ] Add comprehensive error handling for cross-analysis edge cases
- [ ] Write tests for native status analysis functionality
- [ ] Write tests for ecoregion endpoints
- [ ] Clean up temporary scripts in `/scripts/research/`
- [ ] Remove unused test files from recent migrations

### API Documentation
- [ ] Document cross-analysis response format
- [ ] Add examples for ecoregion endpoints
- [ ] Update Postman collection with new endpoints
- [ ] Add OpenAPI/Swagger documentation

### Data Quality
- [ ] Investigate remaining 171k tiles without ecoregion assignments (oceanic areas?)
- [ ] Verify country name matching accuracy in cross-analysis
- [ ] Audit intact forest data coverage
- [ ] Review commercial species flagging logic

---

## 🚀 Future Feature Ideas (Backlog)

### Community Features
- [ ] User accounts and saved analyses
- [ ] Public sharing of interesting analysis results
- [ ] Community-contributed species observations
- [ ] Collaborative research notes on species

### Advanced Visualizations
- [ ] 3D terrain visualization with species distribution
- [ ] Time-series animation of species spread
- [ ] Interactive phylogenetic trees
- [ ] Heat maps of biodiversity hotspots

### External Integrations
- [ ] GBIF (Global Biodiversity Information Facility) data sync
- [ ] iNaturalist observations integration
- [ ] eBird data for bird species
- [ ] Forest inventory data from national databases

---

**Priority Order**:
1. **Ecoregion Frontend Integration** (leverage completed backend work)
2. **Documentation Updates** (critical for API users)
3. **Database Optimization** (performance improvements)
4. **Testing & Code Quality** (technical debt)
5. **Advanced Features** (long-term enhancements)

**Next Sprint Goals**:
- Complete ecoregion frontend display
- Update all API documentation
- Add database indexes for performance
- Write tests for cross-analysis features
