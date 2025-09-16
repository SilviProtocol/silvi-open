# Treekipedia TODO - Next Development Steps

## 🎯 Immediate Priorities (Next 1-2 weeks)

### Native Status Cross-Analysis Frontend Integration
- [ ] Update backend `/api/geospatial/analyze-plot` endpoint with native status analysis
- [ ] Add country detection and native percentage calculation to response
- [ ] Update frontend types.ts with new response structure
- [ ] Enhance ResultsList component to display native status breakdown
- [ ] Add visual indicators (charts/percentages) for native vs introduced species
- [ ] Test cross-analysis with various countries and polygons

### Ecoregion Integration
- [ ] Run existing ecoregion assignment script to populate geohash tiles
- [ ] Test ecoregion-based species queries and cross-analysis
- [ ] Add ecoregion data to analysis results (alternative to country-based analysis)
- [ ] Consider frontend UI for choosing country vs ecoregion analysis

## 🔧 Infrastructure & Performance

### Database Optimization
- [ ] Add indexes on countries_native and countries_introduced columns for faster analysis
- [ ] Optimize cross-analysis query performance with proper indexing strategy
- [ ] Monitor query performance with larger polygon analyses

### Backend Enhancements
- [ ] Create helper functions for country name mapping and normalization
- [ ] Add caching for frequently accessed country polygon intersections
- [ ] Implement query result caching for repeated analysis requests

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

## 📊 Analysis Enhancement Options

### Data Enrichment
- [ ] Integrate climate data for species-environment correlations
- [ ] Add elevation data for elevation range analysis in polygons
- [ ] Consider IUCN Red List integration for conservation status analysis
- [ ] Explore trait data integration for functional diversity analysis

### Advanced Cross-Analysis Features
- [ ] Multi-country polygon analysis (species crossing borders)
- [ ] Temporal analysis capabilities (species changes over time)
- [ ] Biodiversity metrics calculation (Shannon diversity, Simpson index)
- [ ] Species co-occurrence and community composition analysis

### User Experience Improvements
- [ ] Analysis result export functionality (CSV, JSON, GeoJSON)
- [ ] Analysis history and saved polygon management
- [ ] Comparison tools for multiple polygon analyses
- [ ] Interactive data visualization beyond basic species lists

## 🔄 Technical Debt & Maintenance

### Code Quality
- [ ] Add comprehensive error handling for cross-analysis edge cases
- [ ] Write tests for new native status analysis functionality
- [ ] Document API changes and new endpoints
- [ ] Clean up temporary scripts and files from recent imports

### Monitoring & Performance
- [ ] Set up query performance monitoring for spatial analyses
- [ ] Add logging for cross-analysis usage patterns
- [ ] Monitor memory usage during large polygon analyses
- [ ] Implement rate limiting for analysis endpoints if needed

---

**Created**: September 16, 2025
**Priority**: Focus on native status frontend integration first, then ecoregion mapping
**Timeline**: Aim for native status analysis in frontend within 1 week