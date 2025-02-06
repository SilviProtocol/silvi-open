# Agentic-ETH-Hackathon---Treekipedia-
DeepTrees: AI-Agentic Research & NFTrees 🌱
🚀 Built for ETHGlobal’s "Agentic Ethereum" Hackathon

🌍 Project Vision
DeepTrees is an AI-driven, agent-centric Web3 project that automates the discovery, validation, and enrichment of scientific knowledge on tree species. It integrates AI agents with Web3 to create dynamically evolving NFTs ("NFTrees"), funding continuous ecological research.

🔬 How It Works
1️⃣ Users search for a tree species via the front-end.
2️⃣ If data exists, they can mint an NFTree, linked to evolving research.
3️⃣ If no research exists, users can trigger an AI research agent by funding knowledge discovery.
4️⃣ AI agents gather, validate, and store data on-chain and in Treekipedia.
5️⃣ NFTrees dynamically update their metadata as new research is verified.

🛠️ Core Technologies
AI Agents → AgentKit automates tree species research & verification
Knowledge Graph → Blazegraph stores validated scientific research
NFTrees → Dynamic NFTs linked to on-chain research data
Base L2 → Cost-efficient Ethereum L2 for smart contracts & attestations
PostgreSQL → Stores structured AI-generated research before merging into Treekipedia
React + OnchainKit → Frontend for search, minting, and research tracking

💻 Project Setup
1️⃣ Clone the Repository
sh
Copy
Edit
git clone git@github.com:sevnightingale/Agentic-ETH-Hackathon---Treekipedia-.git
cd Agentic-ETH-Hackathon---Treekipedia-
2️⃣ Install Dependencies
Backend (API & Database)

sh
Copy
Edit
cd backend
pip install -r requirements.txt  # Python dependencies (if using Flask/FastAPI)
Smart Contracts (Hardhat)

sh
Copy
Edit
cd smart-contracts
npm install
3️⃣ Run the Backend
sh
Copy
Edit
cd backend
python app.py  # Adjust based on the framework (Flask/FastAPI/Django)
4️⃣ Deploy Smart Contracts
sh
Copy
Edit
cd smart-contracts
npx hardhat run scripts/deploy.js --network base
5️⃣ Start the Frontend
sh
Copy
Edit
cd frontend
npm install
npm run dev
📌 Project Structure
perl
Copy
Edit
Agentic-ETH-Hackathon---Treekipedia-/
│── ai-agent/           # AI-powered research agents
│── backend/            # API and database
│── docs/               # Documentation and hackathon resources
│── smart-contracts/    # Solidity contracts for NFTrees & attestations
│── README.md           # Project Overview & Setup Guide
📢 Contributing
1️⃣ Fork the repo & clone your copy
2️⃣ Create a feature branch (git checkout -b my-feature)
3️⃣ Commit changes (git commit -m "Added new feature")
4️⃣ Push & submit a PR (git push origin my-feature)

🚀 Next Steps
 Integrate AgentKit for AI research automation
 Deploy NFTree smart contracts on Base L2
 Connect AI-generated research to Treekipedia
 Develop real-time NFT metadata updates
🌱 Let’s build the future of AI-driven ecological research! 🚀


