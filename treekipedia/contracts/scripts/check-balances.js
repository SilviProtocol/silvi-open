// check-balances.js
const { ethers } = require("ethers");
require("dotenv").config({ path: "../.env" });

const ADDRESS = process.env.ADDRESS;

// Network configurations
const networks = {
  "Base Sepolia": {
    url: process.env.BASE_RPC_URL || "https://base-sepolia.infura.io/v3/03ccdfb9f1b1421b803e7c9e0fbee198",
    symbol: "ETH"
  },
  "Celo Alfajores": {
    url: process.env.CELO_RPC_URL || "https://alfajores-forno.celo-testnet.org",
    symbol: "CELO"
  },
  "Optimism Sepolia": {
    url: process.env.OPTIMISM_RPC_URL || "https://optimism-sepolia.infura.io/v3/03ccdfb9f1b1421b803e7c9e0fbee198",
    symbol: "ETH"
  },
  "Arbitrum Sepolia": {
    url: process.env.ARBITRUM_RPC_URL || "https://arbitrum-sepolia.infura.io/v3/03ccdfb9f1b1421b803e7c9e0fbee198",
    symbol: "ETH"
  }
};

async function checkBalances() {
  console.log(`Checking balances for address: ${ADDRESS}\n`);
  
  for (const [networkName, networkData] of Object.entries(networks)) {
    try {
      const provider = new ethers.JsonRpcProvider(networkData.url);
      const balance = await provider.getBalance(ADDRESS);
      const formattedBalance = ethers.formatEther(balance);
      
      // Determine if there's enough for deployment (roughly)
      const hasEnough = parseFloat(formattedBalance) > 0.01;
      const status = hasEnough ? "✅ ENOUGH" : "❌ INSUFFICIENT";
      
      console.log(`${networkName}: ${formattedBalance} ${networkData.symbol} ${status}`);
    } catch (error) {
      console.error(`Error checking balance on ${networkName}:`, error.message);
    }
  }
  
  console.log("\nIf you need tokens, see FAUCET_GUIDE.md for instructions on how to obtain testnet tokens.");
}

checkBalances().catch(console.error);