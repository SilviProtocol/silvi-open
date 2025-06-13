require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config({ path: "../.env" });

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0000000000000000000000000000000000000000000000000000000000000000";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    "base-sepolia": {
      url: process.env.BASE_RPC_URL || "https://base-sepolia.infura.io/v3/03ccdfb9f1b1421b803e7c9e0fbee198",
      accounts: [PRIVATE_KEY],
      gasPrice: 1000000000, // 1 gwei
    },
    "celo": {
      url: "https://forno.celo.org",
      accounts: [PRIVATE_KEY],
      chainId: 42220,
    },
    "celo-alfajores": {
      url: process.env.CELO_RPC_URL || "https://alfajores-forno.celo-testnet.org",
      accounts: [PRIVATE_KEY],
    },
    "optimism-sepolia": {
      url: process.env.OPTIMISM_RPC_URL || "https://optimism-sepolia.infura.io/v3/03ccdfb9f1b1421b803e7c9e0fbee198",
      accounts: [PRIVATE_KEY],
    },
    "arbitrum-sepolia": {
      url: process.env.ARBITRUM_RPC_URL || "https://arbitrum-sepolia.infura.io/v3/03ccdfb9f1b1421b803e7c9e0fbee198",
      accounts: [PRIVATE_KEY],
    }
  },
  etherscan: {
    apiKey: {
      "base-sepolia": process.env.BASESCAN_API_KEY || "",
      "celo-alfajores": process.env.CELOSCAN_API_KEY || "",
      "optimism-sepolia": process.env.OPTIMISM_API_KEY || "",
      "arbitrum-sepolia": process.env.ARBISCAN_API_KEY || ""
    },
    customChains: [
      {
        network: "base-sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      }
    ]
  }
};
