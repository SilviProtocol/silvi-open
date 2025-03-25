module.exports = {
  openaiApiKey: process.env.OPENAI_API_KEY,
  cdp: {
    apiKey: process.env.CDP_API_KEY,
    apiSecret: process.env.CDP_API_SECRET,
  },
  wallet: {
    privateKey: process.env.AGENTKIT_WALLET_PRIVATE_KEY,
  },
  blockchain: {
    rpcUrl: process.env.BASE_L2_RPC_URL,
    network: 'base-l2-testnet', // adjust as needed based on your provider
  },
  // Add any other AgentKit-specific settings here
};
