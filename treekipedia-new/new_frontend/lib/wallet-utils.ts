export const SUPPORTED_CHAINS = [
  {
    id: "base",
    name: "Base",
    icon: "🔵",
    rpcUrl: "https://mainnet.base.org",
  },
  {
    id: "celo",
    name: "Celo",
    icon: "🟢",
    rpcUrl: "https://forno.celo.org",
  },
  {
    id: "optimism",
    name: "Optimism",
    icon: "🔴",
    rpcUrl: "https://mainnet.optimism.io",
  },
  {
    id: "arbitrum",
    name: "Arbitrum",
    icon: "🔷",
    rpcUrl: "https://arb1.arbitrum.io/rpc",
  },
]

// NFT contract addresses by chain
export const NFT_CONTRACT_ADDRESSES: Record<string, string> = {
  base: "0x1234567890123456789012345678901234567890",
  celo: "0x2345678901234567890123456789012345678901",
  optimism: "0x3456789012345678901234567890123456789012",
  arbitrum: "0x4567890123456789012345678901234567890123",
}

// Connect to wallet provider
export async function connectWallet() {
  // In preview mode, simulate wallet connection
  return {
    provider: {},
    signer: {},
    address: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
  }
}

// Sign message for wallet verification
export async function signMessage(message: string) {
  // In preview mode, simulate message signing
  return "0xsignature123456789"
}

// Mint NFT for a species
export async function mintNFT(chainId: string, taxonId: string, price = "0.05") {
  // In preview mode, simulate NFT minting
  return {
    transactionHash: "0x5678901234abcdef5678901234abcdef5678901234abcdef5678901234abcdef",
    blockNumber: 12345678,
    tokenId: "42",
  }
}

