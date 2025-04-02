// deploy.js
const hre = require("hardhat");
const { ethers } = require("hardhat");
require("dotenv").config({ path: "../.env" });

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Get the contract factory
  const ContreebutionNFT = await ethers.getContractFactory("ContreebutionNFT");
  
  // Deploy the contract with deployer as the initial owner
  const contreebutionNFT = await ContreebutionNFT.deploy(deployer.address);
  
  // Wait for deployment to finish
  await contreebutionNFT.waitForDeployment();
  
  const contractAddress = await contreebutionNFT.getAddress();
  console.log("ContreebutionNFT deployed to:", contractAddress);
  
  // Log information for updating .env file
  console.log("\nAdd this address to your .env file for the current network:");
  
  // Determine which network we're on
  const chainId = (await ethers.provider.getNetwork()).chainId;
  
  let envVarName = "";
  if (chainId === 84532n) {
    envVarName = "BASE_SEPOLIA_NFT_CONTRACT_ADDRESS";
  } else if (chainId === 44787n) {
    envVarName = "CELO_ALFAJORES_NFT_CONTRACT_ADDRESS";
  } else if (chainId === 11155420n) {
    envVarName = "OPTIMISM_SEPOLIA_NFT_CONTRACT_ADDRESS";
  } else if (chainId === 421614n) {
    envVarName = "ARBITRUM_SEPOLIA_NFT_CONTRACT_ADDRESS";
  }
  
  console.log(`${envVarName}=${contractAddress}`);
  
  // Additional verification info
  console.log("\nVerify with:");
  console.log(`npx hardhat verify --network ${hre.network.name} ${contractAddress} ${deployer.address}`);
  
  return contractAddress;
}

// Execute the deployment
main()
  .then((deployedAddress) => {
    console.log("Deployment successful!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Deployment failed:", error);
    process.exit(1);
  });