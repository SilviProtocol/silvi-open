"use client"

import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createConfig, http, WagmiProvider } from 'wagmi'
import { base, baseSepolia, celo, celoAlfajores, optimism, optimismSepolia, arbitrum, arbitrumSepolia } from 'wagmi/chains'
import { Toaster } from 'react-hot-toast'
import { ThemeProvider } from 'next-themes'

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
] as const

// Get Infura API key from environment
const infuraApiKey = process.env.NEXT_PUBLIC_INFURA_API_KEY || '03ccdfb9f1b1421b803e7c9e0fbee198';

// Create wagmi config with Infura provider
const config = createConfig({
  chains,
  transports: {
    [base.id]: http(`https://base-mainnet.infura.io/v3/${infuraApiKey}`),
    [baseSepolia.id]: http(`https://base-sepolia.infura.io/v3/${infuraApiKey}`),
    [celo.id]: http(`https://celo-mainnet.infura.io/v3/${infuraApiKey}`),
    [celoAlfajores.id]: http(`https://celo-alfajores.infura.io/v3/${infuraApiKey}`),
    [optimism.id]: http(`https://optimism-mainnet.infura.io/v3/${infuraApiKey}`),
    [optimismSepolia.id]: http(`https://optimism-sepolia.infura.io/v3/${infuraApiKey}`),
    [arbitrum.id]: http(`https://arbitrum-mainnet.infura.io/v3/${infuraApiKey}`),
    [arbitrumSepolia.id]: http(`https://arbitrum-sepolia.infura.io/v3/${infuraApiKey}`),
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
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster position="top-right" />
        </QueryClientProvider>
      </WagmiProvider>
    </ThemeProvider>
  )
}