# Treekipedia Current State (Updated: July 2025)

## 🚀 What's Live and Working

### Deployment Status
- **Backend API**: Running at `https://treekipedia-api.silvi.earth` (PM2 managed, port 3000)
- **Frontend**: Deployed on Vercel at `https://treekipedia.silvi.earth`
- **Database**: PostgreSQL with 50,922 species, 18 researched, 8 users, 20 NFTs minted
- **PostGIS**: Spatial database extension enabled for geospatial queries
- **Blazegraph**: Knowledge graph running on port 9999
- **IPFS**: Lighthouse integration for decentralized storage

### Core Working Features ✅
1. **Species Search & Browse** - Users can search and view species details
2. **Species Images System** - Complete image carousel with 4,024 images across 1,576 species
3. **AI Research Process** - Research generation, IPFS storage, NFT minting
4. **User Registration** - Wallet-based user creation
5. **Treederboard** - Leaderboard showing contributor rankings
6. **Research Data Display** - Species pages show AI vs human data with visual indicators
7. **Geospatial Queries** - PostGIS-powered location-based species search (ready for data import)

## 🏗 Current Architecture

### Backend (`/backend/`)
- **Framework**: Node.js + Express
- **Database**: PostgreSQL with connection pooling + PostGIS spatial extension
- **Key Services**:
  - `aiResearch.js` - OpenAI/Perplexity research generation
  - `blockchain.js` - Multi-chain NFT minting (Base, Celo, Optimism, Arbitrum)
  - `ipfs.js` - Lighthouse IPFS storage
  - `researchQueue.js` - Background job processing
- **New Controllers**:
  - `geospatial.js` - Spatial queries for species distribution and nearby search

### Frontend (`/frontend/`)
- **Framework**: Next.js 14+ with TypeScript
- **Web3**: Wagmi v2 + Viem for wallet integration
- **UI**: Tailwind CSS + shadcn/ui components
- **State**: React Query for server state, custom hooks for complex logic

### Database Schema
- **Species table**: 50K+ species with taxonomic and research fields
- **Images table**: 4,024 images with full attribution and primary image designation
- **Users table**: Wallet addresses with points/contributions
- **Research NFTs table**: Minted NFT records with IPFS links
- **Sponsorships table**: Payment tracking (current system uses direct USDC transfers)
- **Geohash Species Tiles table**: STAC-compliant compressed occurrence data (PostGIS enabled, ready for Marina's data)

## 🔄 Current User Flows

### Working Flows:
1. **Search Species** → View details → See research data (if available)
2. **Connect Wallet** → Fund research → AI generates data → NFT minted → Points awarded
3. **View Treederboard** → See contributors and their points
4. **View Profile** → See personal NFTs and contribution history

### Payment System:
- **Current**: Direct USDC transfers (3 USDC per species research)
- **Tracking**: Sponsorship table tracks payments and research status
- **No smart contracts**: Direct wallet-to-wallet transfers, not contract-based

### Module/Code Issues:
- `performResearch is not a function` errors in logs
- ~~JSON parsing errors in API communication~~ - **FIXED**: Related to PM2 directory issue
- Database parameter validation issues ("null" strings vs NULL values)

### Cleanup Needed:
- `/scripts/research/` - 48 test files (4.1MB) from AI model testing, can be archived
- Uncommitted image system work (carousel, import scripts) needs to be reviewed and committed
- Large data file `database/treekipedia_images_full.json` should be gitignored

## 📁 Source of Truth Files

### ✅ Current and Maintained:
- `/API.md` - Comprehensive API documentation (updated with geospatial endpoints)
- `/backend/controllers/` - All controller files (research.js, species.js, geospatial.js)
- `/backend/routes/geospatial.js` - Spatial API endpoints
- `/backend/services/` - Core service modules
- `/frontend/app/` - Next.js app structure
- `/frontend/lib/types.ts` - TypeScript definitions
- `/database/current-schema.sql` - Current database structure
- `/database/01_enable_postgis.sql` - PostGIS extension setup
- `/database/02_create_geohash_tiles_table.sql` - Geospatial table schema
- `/database/create_images_table.sql` - Images table schema
- `/scripts/import_images.js` - Image data import script
- `/scripts/import_geohash_tiles.js` - Geospatial data import script

### ❓ Status Unknown (Need Review):
- Root directory `.md` files (15+ files, likely mix of current/outdated)
- `/contracts/` directory (may be outdated per user note)
- `/scripts/` directory (likely debug/one-off scripts)

### 🗂 Definitely Archive Later:
- Error logs and debug files
- Old migration scripts
- Temporary test files

## 🔧 Development Commands

### Backend:
```bash
cd backend && node server.js          # Run server
cd backend && nodemon server.js       # Development mode
```

### Frontend:
```bash
cd frontend && yarn dev               # Development server
cd frontend && yarn build             # Production build
cd frontend && yarn lint              # ESLint check
```

### Database:
```bash
# Connection via .env DATABASE_URL
# Schema in /database/current-schema.sql
# PostGIS setup: psql -d treekipedia < database/01_enable_postgis.sql
# Geospatial table: psql -d treekipedia < database/02_create_geohash_tiles_table.sql
```

### Geospatial Data Import:
```bash
# Generate sample data for testing
cd scripts && node import_geohash_tiles.js --generate-sample sample.json
# Import Marina's compressed geohash data
cd scripts && node import_geohash_tiles.js marina_tiles.json
```

## 📊 Current Metrics (As of Latest Check)

- **Species Database**: 50,922 total species
- **Images Database**: 4,024 images across 1,576 species (3.1% coverage)
- **Research Status**: 18 researched, 50,904 pending
- **Users**: 8 registered wallet addresses
- **NFTs**: 20 minted across 18 species
- **Contributors**: 7 unique wallets with contributions
- **Total Points**: 40 points awarded

## 🚧 Upcoming Development Priorities

### Recently Completed Major Features:
- **✅ Data Attribution & References**: Added comprehensive citation list to site footer with all 12+ data sources
- **✅ Species Images Database Integration**: Complete implementation with 4,024 images across 1,576 species
- **✅ API Endpoints for Images**: Full backend API support for image data and attribution
- **✅ Frontend Image Carousel**: Custom React carousel with navigation, attribution, and mobile support
- **✅ PM2 Infrastructure Fix**: Resolved critical deployment issue causing API failures

### Potential Web3 Pivot (Team Discussion Pending):
- Move from wallet-based to email-based users
- Make research free with email signup
- Optional donation system instead of required payments
- Focus on research quality and new features (Blazegraph integration)

### Planned Feature Development:

#### 1. 📚 **Data Attribution & References** ✅ **COMPLETED**
**Goal**: Add proper citations for data sources to frontend
**Status**: **COMPLETED** - Comprehensive attribution added to site footer
**Completed Tasks**:
- ✅ Added complete reference list for all 12+ data sources (GBIF, iNaturalist, SiBBr, SpeciesLink, etc.)
- ✅ Implemented site-wide footer with comprehensive citation list
- ✅ Ensured proper academic and legal attribution for all data sources
- ✅ Kept individual species pages clean without citation clutter

#### 2. 🖼️ **Species Images Database Integration** ✅ **COMPLETED**
**Goal**: Import species image URLs and create proper image management system
**Status**: **COMPLETED** - Full end-to-end image system with 4,024 images across 1,576 species
**Completed Tasks**:
- ✅ Created Images table with proper schema and constraints
- ✅ Built Node.js import script with species name matching
- ✅ Imported full dataset with 100% success rate
- ✅ Established primary image designation system
- ✅ Preserved full attribution (license, photographer, page_url)
- ✅ Built API endpoints for image data serving
- ✅ Created custom React image carousel component
- ✅ Integrated carousel into species overview pages
- ✅ Added mobile-responsive design and accessibility features
- ✅ Implemented proper Wikimedia Commons attribution display

#### 3. 🧠 **AI Research Process Enhancement** ⏸️ **IN PROGRESS - PAUSED**
**Goal**: Improve quality and depth of AI-generated species research
**Status**: Testing phase complete, analysis in progress
**Current State**: 
- Completed comprehensive testing of Claude 3.5 Haiku vs Grok 3 Mini
- Developed 3-group research strategy (Ecological, Morphological, Stewardship)
- Claude 3.5 Haiku achieved 100% field completion (24/24) vs current 75% (18/24)
- Grok 3 Mini optimized to 88% completion with 3.6x better token efficiency
- Built production-ready test infrastructure in `/scripts/research/`
**Testing Results**:
- **Claude 3.5 Haiku**: Best for production (100% completion, reliable)
- **Grok 3 Mini**: Best for cost-effective bulk processing (88% completion, very efficient)
- **Current Perplexity+GPT-4o**: Baseline (75% completion, higher token usage)
**Next Steps**: Analyze results and decide on production integration strategy

#### 4. 🌍 **Geospatial Querying Capabilities** ✅ **COMPLETED**
**Goal**: Enable coordinate-based species distribution analysis
**Status**: **COMPLETED** - Full PostGIS integration with STAC-compliant geohash support
**Completed Tasks**:
- ✅ Enabled PostGIS extension for spatial data support
- ✅ Created STAC-compliant geohash_species_tiles table (level 7, ~150m resolution)
- ✅ Built comprehensive geospatial API with 6 endpoints
- ✅ Implemented spatial query functions (nearby species, distribution maps, heatmaps)
- ✅ Created import pipeline for Marina's compressed occurrence data
- ✅ Added proper indexing for high-performance spatial queries
- ✅ STAC compliance with temporal filtering support
- ✅ GeoJSON output for easy frontend visualization
**Ready for**: Marina's compressed geohash data import (90M occurrences → ~150k tiles)

#### 5. 🔗 **Blazegraph Knowledge Graph Integration**
**Goal**: Full semantic querying capabilities for species data
**Multi-phase Implementation**:
- **Phase A - Data Import**: 
  - Import species data into Blazegraph RDF format
  - Establish proper ontology mappings
- **Phase B - Ontology Review**: 
  - Review and refine current taxonomic ontology
  - Ensure semantic relationships are properly defined
- **Phase C - SPARQL Query Development**: 
  - Create standard queries for common use cases
  - Develop query templates for researchers
- **Phase D - Frontend Integration**: 
  - Build SPARQL query interface in frontend
  - Allow users to construct and execute custom queries
  - Visualize query results appropriately
**Technical Stack**: Current Blazegraph instance on port 9999, will need API endpoints for query execution

#### 6. 📦 **Open Data Export & Accessibility**
**Goal**: Fulfill open source commitments by providing regular, accessible data exports
**Implementation Plan**:
- **Automated Monthly Exports**: 
  - Full Treekipedia dataset export to IPFS for decentralized access
  - Database schema documentation export to EAS (Ethereum Attestation Service)
  - Automated scheduling (cron jobs or similar)
- **Export Formats**: 
  - JSON/CSV for raw data consumption
  - RDF/Turtle for semantic web applications
  - API documentation and schema definitions
- **Version Control**: Track dataset versions and changes over time
- **Access Methods**: 
  - Direct IPFS links for researchers
  - API endpoints for programmatic access
  - Documentation for data usage and citation
**Technical Considerations**: Data compression, IPFS pinning strategy, EAS attestation costs

#### 7. 🌐 **Community Data Curation & Wiki Integration**
**Goal**: Enable community-driven data quality improvements through collaborative editing
**Vision**: User-suggested edits and data verification system
**Exploration Areas**:
- **Wiki Integration Options**:
  - MediaWiki integration with species pages
  - Custom wiki-like editing interface
  - Version control and change tracking
- **Community Features**:
  - User-suggested edits to species data
  - Data accuracy attestation/verification by experts
  - Crowdsourced data quality improvements
  - Edit history and contributor attribution
- **Data Synchronization**:
  - Bidirectional sync between wiki edits and PostgreSQL database
  - Moderation workflow for community contributions
  - Integration with existing research validation process
- **User Management**: 
  - Expert verification system
  - Community contributor rankings
  - Integration with existing user/wallet system
**Status**: Conceptual phase, requires research into MediaWiki API and community management tools

### Immediate Development Priorities:

#### 🧠 **AI Research Process Enhancement** - **NEXT PRIORITY**
**Goal**: Improve quality and depth of AI-generated species research
**Current Focus**: Scope out improvements to research quality and methodology

#### 📊 **Geospatial Data Population** - **READY FOR MARINA**
**Goal**: Import Marina's compressed geohash occurrence data
**Next Steps**: Coordinate with Marina to import processed tiles into production database

---

**Last Updated**: July 8, 2025  
**Next Review**: After geospatial data import and AI research enhancement  
**Maintainer**: Update this doc whenever major changes are made

### Latest Completed Work (July 8, 2025):
- **PostGIS Geospatial Integration**: Complete spatial database setup with STAC compliance
- **Geohash Tiles Support**: Level 7 geohash table ready for Marina's compressed occurrence data
- **Spatial API Endpoints**: 6 new endpoints for nearby species, distribution maps, and heatmaps  
- **Import Pipeline**: Ready-to-use script for importing compressed geohash data
- **Documentation Updates**: API.md and database README updated with spatial features

### Previous Major Work (June 16, 2025):
- **Data Attribution System**: Complete reference list added to site footer with all 12+ data sources
- **Images Database System**: Full implementation with schema, import tooling, and API integration
- **Frontend Image Carousel**: Custom React carousel with navigation, thumbnails, and attribution
- **API Documentation**: Updated with complete image endpoint specifications
- **Infrastructure Stability**: Fixed PM2 deployment issue that was causing API crashes

### Current Development Status:
- **Geospatial Backend**: ✅ Complete and ready for data import
- **Spatial API Endpoints**: ✅ Complete with full documentation  
- **PostGIS Database**: ✅ Enabled and configured
- **Import Tools**: ✅ Ready for Marina's data
- **Next Priority**: 🎯 Geospatial data import + AI Research Process Enhancement