// deploy-all.js
const { execSync } = require("child_process");

// List of networks to deploy to
const networks = [
  "base-sepolia",
  "celo-alfajores",
  "optimism-sepolia",
  "arbitrum-sepolia"
];

// Deploy to each network
async function deployToAllNetworks() {
  console.log("====================================");
  console.log("DEPLOYING TO ALL TESTNETS");
  console.log("====================================");
  
  const results = {};
  
  for (const network of networks) {
    console.log(`\n\nDeploying to ${network}...`);
    console.log("------------------------------------");
    
    try {
      // Execute deployment command for the current network
      const output = execSync(`npx hardhat run scripts/deploy.js --network ${network}`, { 
        encoding: 'utf-8',
        stdio: 'inherit' // Show output in real-time
      });
      
      console.log(`✅ Deployment to ${network} successful!`);
      results[network] = { success: true };
    } catch (error) {
      console.error(`❌ Deployment to ${network} failed!`);
      console.error(error.message);
      results[network] = { success: false, error: error.message };
    }
  }
  
  // Print summary
  console.log("\n\n====================================");
  console.log("DEPLOYMENT SUMMARY");
  console.log("====================================");
  
  for (const network in results) {
    const status = results[network].success ? "✅ SUCCESS" : "❌ FAILED";
    console.log(`${network}: ${status}`);
  }
  
  // Check if any deployments failed
  const anyFailed = Object.values(results).some(result => !result.success);
  if (anyFailed) {
    console.log("\n❗Some deployments failed. Check the logs above for details.");
    process.exit(1);
  } else {
    console.log("\n🎉 All deployments successful!");
    
    console.log("\nAdd these to your .env file:");
    console.log("------------------------------------");
    console.log("Manually copy the contract addresses from the output above and update your .env file.");
    process.exit(0);
  }
}

// Execute deployments
deployToAllNetworks().catch(error => {
  console.error("Deployment script failed:", error);
  process.exit(1);
});