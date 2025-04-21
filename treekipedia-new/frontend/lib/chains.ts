import { base, baseSepolia, celo, celoAlfajores, optimism, optimismSepolia, arbitrum, arbitrumSepolia } from 'wagmi/chains';

// Define all supported chains according to SPEC_SHEET
export const supportedChains = [
  base,
  baseSepolia,
  celo,
  celoAlfajores,
  optimism,
  optimismSepolia, 
  arbitrum,
  arbitrumSepolia
];

// Contract addresses interface
interface ContractAddresses {
  contreebutionNFT: string;
  eas: string;
  paymentContract: string;
  usdcAddress: string;
}

// Map chain IDs to their respective contract addresses
export const contractAddresses: Record<string, ContractAddresses> = {
  // Base Mainnet
  [String(base.id)]: {
    contreebutionNFT: '0x0000000000000000000000000000000000000000', // Replace with actual address when deployed
    eas: '0xF0D7BD87A38E4C1F14c7f95Bb3BD2A61ac8D1C3e', // EAS address on Base
    paymentContract: '0x0000000000000000000000000000000000000000', // Replace with actual address when deployed
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // USDC on Base
  },
  // Base Sepolia Testnet
  [String(baseSepolia.id)]: {
    contreebutionNFT: '0x0000000000000000000000000000000000000000', // Replace with actual address when deployed
    eas: '0x4200000000000000000000000000000000000021', // EAS address on Base Sepolia
    paymentContract: '0x0000000000000000000000000000000000000000', // Replace with actual address when deployed
    usdcAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e' // USDC on Base Sepolia
  },
  // Celo Mainnet
  [String(celo.id)]: {
    contreebutionNFT: '0x5Ed6240fCC0B2A231887024321Cc9481ba07f3c6', // From README
    eas: '0xA310a93BEF1B503984EDF8c854C9Eb5542f6e25A', // EAS address on Celo
    paymentContract: '0x0000000000000000000000000000000000000000', // Replace with actual address when deployed
    usdcAddress: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C' // USDC on Celo
  },
  // Celo Alfajores Testnet
  [String(celoAlfajores.id)]: {
    contreebutionNFT: '0x0000000000000000000000000000000000000000', // Replace with actual address when deployed
    eas: '0xaaB7b95246c714F32fb1636Ae95A775d8951e057', // EAS address on Celo Alfajores
    paymentContract: '0x0000000000000000000000000000000000000000', // Replace with actual address when deployed
    usdcAddress: '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1' // USDC on Celo Alfajores
  },
  // Optimism Mainnet
  [String(optimism.id)]: {
    contreebutionNFT: '0x0000000000000000000000000000000000000000', // Replace with actual address when deployed
    eas: '0x4200000000000000000000000000000000000021', // EAS address on Optimism
    paymentContract: '0x0000000000000000000000000000000000000000', // Replace with actual address when deployed
    usdcAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' // USDC on Optimism
  },
  // Optimism Sepolia Testnet
  [String(optimismSepolia.id)]: {
    contreebutionNFT: '0x0000000000000000000000000000000000000000', // Replace with actual address when deployed
    eas: '0x4200000000000000000000000000000000000021', // EAS address on Optimism Sepolia
    paymentContract: '0x0000000000000000000000000000000000000000', // Replace with actual address when deployed
    usdcAddress: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7' // USDC on Optimism Sepolia
  },
  // Arbitrum Mainnet
  [String(arbitrum.id)]: {
    contreebutionNFT: '0x0000000000000000000000000000000000000000', // Replace with actual address when deployed
    eas: '0xBD75f629A22Dc1ceD33dDA0b68c546A1c035c458', // EAS address on Arbitrum
    paymentContract: '0x0000000000000000000000000000000000000000', // Replace with actual address when deployed
    usdcAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' // USDC on Arbitrum
  },
  // Arbitrum Sepolia Testnet 
  [String(arbitrumSepolia.id)]: {
    contreebutionNFT: '0x0000000000000000000000000000000000000000', // Replace with actual address when deployed
    eas: '0xaEF4103A04090071165F78D45D83A0C0782c2B2a', // EAS address on Arbitrum Sepolia
    paymentContract: '0x0000000000000000000000000000000000000000', // Replace with actual address when deployed
    usdcAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d' // USDC on Arbitrum Sepolia
  }
};

// Helper function to get the main color of each chain for UI elements
export const getChainColor = (chainId: number) => {
  switch(chainId) {
    case base.id:
    case baseSepolia.id:
      return '#0052FF'; // Base blue
    case celo.id:
    case celoAlfajores.id:
      return '#FBCC5C'; // Celo yellow/gold
    case optimism.id:
    case optimismSepolia.id:
      return '#FF0420'; // Optimism red
    case arbitrum.id:
    case arbitrumSepolia.id:
      return '#28A0F0'; // Arbitrum blue
    default:
      return '#1E293B'; // Default slate color
  }
};

// Get human-readable name for each chain
export const getChainName = (chainId: number) => {
  const chain = supportedChains.find(chain => chain.id === chainId);
  return chain?.name || 'Unknown Chain';
};

// Get chain by ID
export const getChainById = (chainId: number) => {
  return supportedChains.find(chain => chain.id === chainId);
};

// Group chains by network (Mainnet vs Testnet)
export const chainsByNetwork = {
  mainnet: [base, celo, optimism, arbitrum],
  testnet: [baseSepolia, celoAlfajores, optimismSepolia, arbitrumSepolia]
};

export default supportedChains;