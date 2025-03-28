Frontend Spec Sheet for Treekipedia
Project Overview
Treekipedia is a modern, sleek, and user-friendly web application that reimagines Wikipedia for tree species, blending tech and nature with blockchain and NFT integration. It serves as an educational platform where users can explore tree species, fund research for unresearched trees by minting NFTs, and earn points to compete on a leaderboard. The goal is to create an intuitive, visually appealing experience that combines Wikipedia’s functionality with a contemporary design and community-driven research funding.
Design Guidelines
Aesthetic: Modern and stylish with rounded edges, neumorphism, and frosted glass backgrounds for a tech-meets-nature vibe.
Color Scheme: Nature-inspired tones (e.g., greens, browns) with a clean, minimalistic feel.
Icons: Tree-related imagery, including a custom tree icon for tree points (user-provided).
Navigation: Simple and intuitive, using a hamburger menu in the header to reveal page options cleanly (no cluttered menus).
Typography: Clear and readable, with a focus on usability and visual hierarchy.
Page-by-Page Breakdown
1. Homepage
Description: The homepage doubles as the primary entry point (no separate landing page), inspired by Wikipedia’s search-centric layout but enhanced with explanatory sections.
Layout:
Search Bar: Main focus at the top, split into two fields: "Search Common Name" and "Search Scientific Name."
Explanatory Sections: Below the search bar, include placeholder sections (headers, icons, short descriptions) to explain Treekipedia’s purpose and features. Exact text can be added later.
Header: Contains a hamburger menu button (reveals navigation options as a clean list), a profile icon with tree score (visible in the menu), and a "Connect Wallet" button near the profile icon.
Purpose: Balances immediate functionality (search) with an introduction to Treekipedia’s mission.
2. Species Page
Description: A detailed view of a tree species, fetched using its taxon_id from the PostgreSQL database, with distinct layouts for researched vs. unresearched species.
URL Structure: Unique URL per species, e.g., /species/{taxon_id}.
Layout:
Researched Species: Displays full details (common name, scientific name, description, images, linked NFTs, etc.).
Unresearched Species:
Messages like "This tree is missing key datapoints. Can you help us research it?"
Prominent CTA button: "Fund this tree’s research by minting a Contreebution NFT for $3."
Funding Pop-Up: Triggered by the CTA, includes:
Explanation: "Funds support AI research agent costs, server costs, and human research."
Steps: "Select Chain" → "Connect Wallet" (if not connected) → "Mint Contreebution NFT."
Loading indicator during the research process.
Post-Research: Updates the page with new data and shows "Research complete! You earned 2 points! Check your rank on the Treederboard →" (links to Treederboard).
Purpose: Provides species information and encourages user participation via NFT minting.
3. Treederboard (Leaderboard)
Description: A simple leaderboard ranking users by tree points.
Layout:
List of users with their display name (or wallet address if not set).
Each entry includes a tree icon (custom, user-provided) with a number representing tree points.
Purpose: Motivates users by showcasing their contributions and rankings.
4. Profile Page
Description: A user hub combining personalization and NFT display.
Layout:
Display Name: Input field to "Add Display Name" for the Treederboard (replaces wallet address).
View My NFTs: Section showing the user’s Contreebution NFTs (e.g., images, details).
Purpose: Allows users to customize their identity and review their NFT collection.
Key Functionalities
Search and Autocomplete
Behavior: Real-time autocomplete in the search bar (both fields) as users type common or scientific names.
Implementation: Queries the PostgreSQL database for species names (specific field, not entire DB) via API calls.
Result: Clicking a suggestion navigates to /species/{taxon_id}.
Blockchain Integration
Wallet Connection: "Connect Wallet" button in the header initiates wallet linking.
NFT Minting:
User selects a chain (one of four options) and connects their wallet.
Mints a Contreebution NFT for $3 on the Species Page.
Captures taxon_id, wallet_address, and chain for backend processing.
Display: Shows tree points and NFTs in the Profile Page and Treederboard.
Research Workflow
Trigger: Begins after NFT minting transaction is confirmed.
Process:
Displays a loading bar/icon during AI research, EAS attestations, and NFT minting.
Updates the Species Page with new data upon completion.
Awards 2 tree points and links to the Treederboard.
Purpose: Seamlessly ties funding to content generation.
Technical Requirements
Frontend
Framework: Built with React and Next.js for performance and SEO.
Styling: Tailwind CSS and shadcn/ui components for a modern, responsive design.
Responsiveness: Adapts to all screen sizes (desktop, tablet, mobile).
Backend Integration
API Calls:
Fetch species names for autocomplete from PostgreSQL.
Retrieve full species data using taxon_id for Species Pages.
Send taxon_id, wallet_address, and chain to the backend for NFT minting and research.
Blockchain Services: Integrates with wallet providers and blockchain APIs for chain selection and NFT minting.
Database
Type: PostgreSQL.
Usage: Stores species data (common/scientific names, taxon_id, details) and user data (points, NFTs, display names).

