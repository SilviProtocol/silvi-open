# GG24 Pilot Pool Proposal: Treekipedia Open Interoperability Layer

## Problem Being Solved*

Climate and reforestation projects building on Ethereum lack access to verifiable, composable ecological data primitives. While Treekipedia has aggregated 67,000+ tree species with 100M occurrence records across 13 biodiversity datasets—all cryptographically attested via EAS—this intelligence is currently locked in a closed system.

**The UX Challenge:** Developers building climate applications need to integrate ecological intelligence (species verification, habitat suitability, biodiversity assessment) but have no standardized way to query or verify this data on-chain. This forces projects to either build redundant databases, trust centralized APIs, or skip ecological rigor entirely.

**This pilot tests:** Can we open Treekipedia as composable infrastructure by co-designing interoperability primitives with 3+ partner projects? We don't know what abstractions builders need yet—this is a discovery process.

---

## Team*

**Afolabi Aiyeloja** – Project Lead & Technical Architect
- Founded Silvi Protocol (blockchain reforestation infrastructure)
- Built Treekipedia v1.0: 67k species, 100M records, EAS integration
- Previously: Ecosystem development at various Web3 climate projects

**[Backend Engineer Name]** – API & SDK Development
- Node.js/Express backend, PostgreSQL + PostGIS
- Experience with RESTful API design and developer tools
- [Notable past projects if applicable]

**[Frontend/Integration Engineer Name]** – SDK & Documentation
- TypeScript/JavaScript SDK development
- Technical documentation and developer experience
- [Past work with developer tooling]

**Community & Partnerships**
- Active in Celo Climate Collective, GreenPill Network
- Established relationships with Gitcoin Climate Round projects

---

## Karma GAP Profile*

[To be created - https://gap.karmahq.xyz]

---

## Github Repo or Organization (If Multiple Repos)*

https://github.com/[your-org]/treekipedia

*Note: Currently public repo but designed for internal use. This pilot will refactor for external composability.*

---

## Project Tech Stack*

**Current Stack:**
- Next.js (frontend)
- Node.js/Express (backend API)
- PostgreSQL + PostGIS (spatial database)
- Prisma ORM
- React Query + Wagmi (blockchain interactions)

**Interoperability Primitives (Already Integrated):**
- **EAS (Ethereum Attestation Service)** – All AI-generated research cryptographically attested
- **IPFS (Lighthouse)** – Decentralized storage for research outputs
- **Multi-chain deployment** – Celo, Base, Optimism, Arbitrum

**Adding for Pilot:**
- **Hypercerts** – Impact certification for research contributions
- **OpenAPI 3.0** – Standardized API specification
- **TypeScript SDK** – Developer-friendly integration library

---

## Collaborations*

**Confirmed:**
- **Silvi Protocol** – Parent organization, existing integration for reforestation projects
- **[13 Biodiversity Data Sources]** – GBIF, iNaturalist, SiBBr, SpeciesLink, etc.

**Pilot Partners (In Discussion):**
- **Celo Climate Collective projects** – Testing species verification for on-chain forestry claims
- **GG24 Climate Round grantees** – Co-designing ecological data standards (outreach in progress)
- **Hypercerts team** – Joint development of ecological impact claim schemas

**Seeking:**
- 2-3 additional Ethereum climate projects for co-design sessions
- EAS ecosystem projects interested in ecological attestation standards

---

## Deliverables*

**D1: Open Source Treekipedia SDK + Public API (MVP)**

*What:* Lightweight TypeScript/JavaScript SDK enabling external projects to query Treekipedia's 67k species and 100M occurrence records. Core functions:
- `getSpeciesByLocation(lat, lng, radius)` – Geospatial species lookup
- `verifyEcologicalClaim(attestationUID)` – On-chain verification via EAS
- `getSpeciesTraits(taxonId)` – Access to 50+ ecological attributes

*Acceptance Criteria:*
- Published on npm with full TypeScript types
- OpenAPI 3.0 specification documented
- Integrated into 2+ pilot partner projects
- GitHub repo with example implementations and quickstart guide
- **Verification:** Live demos from partner projects + public npm package

**D2: Collaborative Ecological Data Standard (Draft Specification)**

*What:* Host 3 co-design workshops with climate project builders to define:
- Common API patterns for ecological queries
- Standardized EAS schema for species/habitat attestations
- Hypercerts templates for ecological research contributions
- Best practices for integrating biodiversity data on-chain

*Acceptance Criteria:*
- Published specification document (e.g., "Ethereum Ecological Data Standard v0.1")
- 3+ projects commit to implementing/testing the standard
- Feedback incorporated from GreenPill Dev Guild and Celo Climate Collective
- **Verification:** Public GitHub repo with standard docs + workshop recordings/notes

---

## Budget*

**Amount Requested: $6,500**

**Breakdown:**

- **Engineering (SDK + API):** $3,000
  - Refactor backend for external access
  - Build TypeScript SDK with core query functions
  - Implement rate limiting and public endpoint security

- **Collaboration & Co-Design:** $1,500
  - Host 3 virtual workshops with pilot partners
  - Partnership development and integration support
  - Community feedback synthesis

- **Documentation & Standards:** $1,000
  - OpenAPI spec documentation
  - Developer quickstart guides and tutorials
  - Draft Ecological Data Standard specification

- **Project Management:** $1,000
  - Coordinate pilot partners
  - Impact reporting (Karma GAP)
  - Demo preparation for Dec 9 showcase

**Risks & Mitigations:**

*Risk 1:* Difficulty recruiting 3+ pilot partners by mid-November
- *Mitigation:* Already have Silvi App as committed partner; proactive outreach to Celo/GG24 Climate projects starting now; fallback to 2 deep integrations vs. 3 shallow ones

*Risk 2:* Partners request features beyond current database capabilities
- *Mitigation:* Scope pilot to read-only queries of existing 67k species data; complex features (e.g., on-demand recommendations) deferred to future Growth Pool application

*Risk 3:* EAS schema design complexity delays standard publication
- *Mitigation:* Start with minimal viable schema (species ID + research hash), iterate based on feedback; publish draft even if incomplete

---

## GTM & Adoption Plan*

**Initial Users/Integrators:**

1. **Silvi App** (committed) – Enhanced species verification for reforestation projects
2. **Celo Climate Collective projects** (in outreach) – Native species validation for on-chain environmental claims
3. **GG24 Climate Round grantees** (targeted) – Shared ecological data layer for grant applications

**Promotion Strategy:**

- **Oct 21:** Present at GG24 PG Tooling Showcase with live demo
- **Nov:** Co-design workshops with pilot partners (livestreamed to build in public)
- **Dec 9:** Impact demo showing 2+ integrations + SDK usage metrics
- **Ongoing:** Developer office hours in GreenPill Dev Guild Telegram

**Post-Round Sustainability:**

- **If successful:** Apply for Growth Pool in next GG round to scale API infrastructure (rate limits, SLAs, advanced features)
- **Revenue model:** Freemium API (generous free tier for public goods projects, premium for enterprise/high-volume)
- **Ongoing funding:** Contreebution NFTs continue supporting data expansion
- **Maintenance:** Core team funded by Silvi Protocol; SDK maintained as open-source with community contributions

**Success Metrics:**
- 500+ npm downloads by Dec 9
- 2+ production integrations launched
- 3+ projects committed to Ecological Data Standard
- 10k+ API calls from external projects

---

## Additional Links and Resources

**Project Links:**
- **Live Platform:** https://treekipedia.org
- **GitHub Repo:** https://github.com/[your-org]/treekipedia *(will be linked)*
- **EAS Attestations:** [Your EAS schema link on relevant chain]
- **Lightpaper:** [Link to LIGHTPAPER.md or hosted version]

**Technical Documentation:**
- **Data Architecture:** 67,000 species across 13 datasets (GBIF, iNaturalist, SiBBr, SpeciesLink, etc.)
- **Database Stats:** 100M occurrence records, 50+ taxonomic/ecological attributes per species
- **Verification System:** All AI research attested via EAS + IPFS pinning

**Context & Vision:**
- **Extensive Technical Overview:** [Link to TREEKIPEDIA_EXTENSIVE.md or summarized blog post]
- **Use Case Examples:**
  - Species recommendation engine for reforestation site planning
  - Biodiversity verification for carbon credit MRV
  - Invasive species risk assessment for land restoration

**Community:**
- **Telegram:** [Your project Telegram if available]
- **Twitter/X:** [Your project social handle]
- **Discord:** [If applicable]

**Parent Organization:**
- **Silvi Protocol:** https://silvi.earth – Blockchain-powered reforestation protocol using Treekipedia as authoritative species database

---

## Pilot Hypothesis Statement

**We believe** that opening Treekipedia as composable infrastructure will enable 10+ climate projects to integrate verifiable ecological intelligence within 6 months.

**We will test this by** co-designing an SDK and data standard with 3 pilot partners, measuring adoption via npm downloads, API calls, and integration commitments.

**We will know we're right when** at least 2 external projects deploy production integrations by Dec 9, and the Ecological Data Standard is referenced by projects in the next GG Climate Round.

**If we're wrong,** we'll have documented what *doesn't* work about ecological data interoperability, providing valuable insights for the ecosystem—and we'll have spent only $6,500 to learn it.

---

*This proposal represents the transition of Treekipedia from a powerful but closed system to open, composable public goods infrastructure for the Ethereum climate ecosystem.*
