// Script to deploy the ResearchSponsorshipPayment contract to supported networks
const { ethers } = require("hardhat");

// USDC Contract addresses on each network
const USDC_ADDRESSES = {
  // Mainnets
  base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  celo: "0xcebA9300f2b948710d2653dD7B07f33A8B32118C",
  optimism: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
  arbitrum: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  
  // Testnets - Replace with actual testnet USDC addresses
  "base-sepolia": "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // Example, replace with actual
  "celo-alfajores": "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1", // Example, replace with actual
  "optimism-sepolia": "0x5fd84259d66Cd46123540766Be93DFE6D43130D7", // Example, replace with actual
  "arbitrum-sepolia": "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d"  // Example, replace with actual
};

async function main() {
  // Get network details
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "hardhat" : network.name;
  
  console.log(`Deploying ResearchSponsorshipPayment to ${networkName} (chainId: ${network.chainId})`);
  
  // Determine USDC address based on network
  const usdcAddress = USDC_ADDRESSES[networkName];
  
  if (!usdcAddress) {
    console.error(`No USDC address configured for network: ${networkName}`);
    return;
  }
  
  console.log(`Using USDC address: ${usdcAddress}`);
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);
  
  // Deploy contract
  const ResearchSponsorshipPayment = await ethers.getContractFactory("ResearchSponsorshipPayment");
  const sponsorshipPayment = await ResearchSponsorshipPayment.deploy(usdcAddress);
  
  await sponsorshipPayment.waitForDeployment();
  const contractAddress = await sponsorshipPayment.getAddress();
  
  console.log(`ResearchSponsorshipPayment deployed to: ${contractAddress}`);
  console.log("Transaction hash:", sponsorshipPayment.deploymentTransaction().hash);
  
  // Log deployment information for frontend configuration
  console.log("\nUpdate your frontend configuration with:");
  console.log(`"${networkName}": {`);
  console.log(`  "paymentContract": "${contractAddress}",`);
  console.log(`  "usdcAddress": "${usdcAddress}"`);
  console.log("},");
  
  // Wait for confirmation blocks
  console.log("\nWaiting for contract deployment to be confirmed...");
  await sponsorshipPayment.deploymentTransaction().wait(5); // Wait for 5 confirmations
  
  console.log("Contract deployment confirmed!");
  console.log(`Verify with: npx hardhat verify --network ${networkName} ${contractAddress} ${usdcAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });