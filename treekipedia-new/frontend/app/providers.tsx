"use client"

import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createConfig, http, WagmiProvider } from 'wagmi'
import { base, baseSepolia, celo, celoAlfajores, optimism, optimismSepolia, arbitrum, arbitrumSepolia } from 'wagmi/chains'
import { Toaster } from 'react-hot-toast'

// Configure chains based on the spec (Base, Celo, Optimism, Arbitrum - mainnet and testnet)
const chains = [
  base,
  baseSepolia,
  celo,
  celoAlfajores,
  optimism,
  optimismSepolia,
  arbitrum,
  arbitrumSepolia
]

// Create wagmi config
const config = createConfig({
  chains,
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
    [celo.id]: http(),
    [celoAlfajores.id]: http(),
    [optimism.id]: http(),
    [optimismSepolia.id]: http(),
    [arbitrum.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
})

export default function Providers({ children }: { children: React.ReactNode }) {
  // Create React Query client
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position="top-right" />
      </QueryClientProvider>
    </WagmiProvider>
  )
}