# Treekipedia 🌳  
**Tree Intelligence Commons**

A decentralized, open-source knowledge repository for tree species data, powered by AI and blockchain technology.

---

## Overview  
Treekipedia is an open-source platform designed to make tree species data accessible, verifiable, and incentivized. Developed by [Silvi Protocol](https://silvi.earth), Treekipedia combines AI-driven research with blockchain transparency to support reforestation, ecological restoration, and biodiversity monitoring. By integrating AI research agents, Ethereum-based attestations, decentralized storage, and community contributions, Treekipedia is creating the most robust global tree knowledge infrastructure.

---

## The Problem: Fragmented and Static Tree Knowledge  
Tree-related ecological data is scattered across government databases, academic studies, and anecdotal field reports—over 70% of which exists in unstructured, non-machine-readable formats. Valuable insights from local stewards are often excluded from centralized repositories, making tree intelligence fragmented and hard to validate. With ecosystems evolving rapidly due to climate change, there is an urgent need for a dynamic, living database that adapts in real-time.

---

## Treekipedia’s Approach: A Unified, AI-Powered Database  
Treekipedia addresses the data fragmentation problem with a multilayered architecture combining AI, blockchain, and decentralized collaboration:

- **AI-Powered Research**: Automated research agents extract, synthesize, and update species information from academic papers, government records, and citizen science platforms.
- **Blockchain Verification**: Using the Ethereum Attestation Service (EAS), all research is cryptographically attested and pinned to IPFS, making it tamper-resistant and traceable.
- **Decentralized Storage**: IPFS (via Lighthouse) stores research outputs, ensuring long-term resilience and availability.
- **Incentivized Contributions**: Through **Contreebution NFTs**, users can fund new research (~$3 per species), earn digital recognition, and contribute to the growth of the knowledge base.
- **Interoperable Ontology**: A structured TaxonID system and over 50 taxonomic and ecological attributes support semantic querying and cross-platform compatibility.
- **Community Collaboration**: Tree stewards, researchers, and ecologists contribute observations and validate research using a standardized schema.

---

## Key Features  
- 🔍 **Search for a Tree Species**: Instantly access structured data on over 50,000 species.  
- ⚡ **Fund Research**: Trigger AI-powered research updates when data is outdated or missing.  
- ✅ **Verify Contributions**: All research is attested on-chain for credibility and traceability.  
- 🏆 **Earn Rewards**: Track your contributions and NFTs via the Treederboard.  
- 📤 **Open Data Exports**: Full dataset available via IPFS for external research and integration.

---

## Technical Architecture  

**Frontend**: Next.js app with React Query and Wagmi for blockchain interactions.  
**Backend**: Node.js/Express API, PostgreSQL database, Prisma ORM.  
**Blockchain**: Smart contracts deployed on Celo, Base, Optimism, and Arbitrum.  
**AI Integration**: OpenAI and Perplexity API for research generation.  
**Storage**: IPFS for decentralized data, Blazegraph for structured queries.

---

## Silvi and Treekipedia  
Treekipedia is developed and maintained by **Silvi**, a blockchain-powered reforestation protocol. It serves as the authoritative species database within the Silvi App, supporting Payments for Ecosystem Services (PES) and MRV (Monitoring, Reporting, Verification).

Over the past year, Silvi has aggregated and cleaned over 25 million raw records from datasets like GBIF, iNaturalist, SiBBr, and SpeciesLink. After deduplication and taxonomy validation, the dataset now includes:

- ✅ 50,000+ unique species  
- 📍 17.6 million geotagged observations  
- 📚 Ontology with 50+ ecological and taxonomic attributes  
- 🧬 Standardized TaxonID framework  
- 🌍 Distribution mapping using OneEarth’s bioregional model  

---

## Roadmap  

### ✅ Phase 1: Treekipedia v1.0 Launch  
- Tree Species Search  
- AI Research Agent  
- Species Knowledge Pages  
- Contreebution NFTs  
- EAS & IPFS Integration  
- Treederboard  
- Blazegraph Querying  

### 🛠️ Phase 2: Infrastructure Refinement  
- Blazegraph API  
- Ontology & Data Versioning  
- AI-Powered Data Validation  

### 🤝 Phase 3: Community & Governance  
- Working Groups  
- Peer Review Incentives  
- DeepTrees NFT Governance  

### 🧠 Phase 4: AI Intelligence Scaling  
- Autonomous Knowledge Updates  
- Multi-tier Credibility Scoring  
- Advanced Ecological Modeling  

### 🌐 Phase 5: Full Rollout  
- Treekipedia API  
- Global Partnerships  
- Silvi MRV Integration  