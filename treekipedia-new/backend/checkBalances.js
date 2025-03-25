const { ethers, JsonRpcProvider, formatEther } = require('ethers');
require('dotenv').config({ path: '../.env' });

const chains = [
  { name: 'Arbitrum', rpcUrl: process.env.ARBITRUM_RPC_URL },
  { name: 'Base', rpcUrl: process.env.BASE_RPC_URL },
  { name: 'Celo', rpcUrl: process.env.CELO_RPC_URL },
  { name: 'Optimism', rpcUrl: process.env.OPTIMISM_RPC_URL },
];

const privateKey = process.env.PRIVATE_KEY;
const wallet = new ethers.Wallet(privateKey);
const walletAddress = wallet.address;

console.log(`Checking balances for wallet: ${walletAddress}`);

async function checkBalance(chain) {
  try {
    const provider = new JsonRpcProvider(chain.rpcUrl);
    const balance = await provider.getBalance(walletAddress);
    const balanceInEth = formatEther(balance); // Use formatEther directly
    console.log(`${chain.name}: ${balanceInEth} ETH`);
  } catch (error) {
    console.error(`Error checking balance on ${chain.name}:`, error.message);
  }
}

async function main() {
  for (const chain of chains) {
    await checkBalance(chain);
  }
}

main();