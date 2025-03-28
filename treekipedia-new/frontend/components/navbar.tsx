"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useAccount, useBalance, useDisconnect, useChainId, useSwitchChain } from 'wagmi'
import { getChainName, chainsByNetwork } from '@/lib/chains'
import { ChevronDown, Wallet } from "lucide-react"

export function Navbar() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { data: balance } = useBalance({
    address: address
  })
  
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [chainMenuOpen, setChainMenuOpen] = useState(false)

  const toggleDropdown = () => setDropdownOpen(!dropdownOpen)
  const toggleChainMenu = () => setChainMenuOpen(!chainMenuOpen)
  
  // Format address for display (0x1234...5678)
  const formatAddress = (address?: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo on the left */}
          <Link href="/" className="flex items-center">
            <Image
              src="/silvi_logo.png" // Make sure to add your logo file to the public directory
              alt="Logo"
              width={100}
              height={100}
              className=""
            />
          </Link>

          {/* Treederboard link and wallet container on the right */}
          <div className="flex items-center space-x-6">
            <Link href="/treederboard" className="text-white hover:text-green-300 font-medium">
              Treederboard
            </Link>
            
            <div className="wallet-container relative">
              {!isConnected ? (
                // Connect Wallet Button
                <button
                  onClick={() => document.dispatchEvent(new CustomEvent('wagmi:connectWallet'))}
                  className="flex items-center space-x-2 bg-white text-black hover:bg-white/90 py-2 px-4 rounded-lg font-medium"
                >
                  <Wallet className="h-4 w-4" />
                  <span>Connect Wallet</span>
                </button>
              ) : (
                // Connected state with dropdown
                <div className="relative">
                  <button
                    onClick={toggleDropdown}
                    className="flex items-center space-x-2 bg-white text-black hover:bg-white/90 py-2 px-4 rounded-lg font-medium"
                  >
                    <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse"></div>
                    <span>{formatAddress(address)}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  
                  {/* Dropdown menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg py-2 z-10">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="font-semibold text-sm text-gray-700">{formatAddress(address)}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {balance && `${Number(balance.formatted).toFixed(4)} ${balance.symbol}`}
                        </div>
                      </div>
                      
                      {/* Chain selection */}
                      <div className="px-4 py-2 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Network</span>
                          <button 
                            onClick={toggleChainMenu}
                            className="text-sm font-medium text-gray-700 flex items-center"
                          >
                            {getChainName(chainId)} 
                            <ChevronDown className="h-3 w-3 ml-1" />
                          </button>
                        </div>
                        
                        {/* Chain selection dropdown */}
                        {chainMenuOpen && (
                          <div className="mt-2 bg-gray-50 rounded-md p-2">
                            <div className="mb-1">
                              <div className="text-xs font-semibold text-gray-500 mb-1">Mainnets</div>
                              <div className="grid grid-cols-2 gap-1">
                                {chainsByNetwork.mainnet.map((chain) => (
                                  <button
                                    key={chain.id}
                                    onClick={() => {
                                      switchChain({ chainId: chain.id })
                                      setChainMenuOpen(false)
                                    }}
                                    className={`text-xs py-1 px-2 rounded ${
                                      chainId === chain.id 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'hover:bg-gray-200'
                                    }`}
                                  >
                                    {chain.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-500 mb-1">Testnets</div>
                              <div className="grid grid-cols-2 gap-1">
                                {chainsByNetwork.testnet.map((chain) => (
                                  <button
                                    key={chain.id}
                                    onClick={() => {
                                      switchChain({ chainId: chain.id })
                                      setChainMenuOpen(false)
                                    }}
                                    className={`text-xs py-1 px-2 rounded ${
                                      chainId === chain.id 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'hover:bg-gray-200'
                                    }`}
                                  >
                                    {chain.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Links */}
                      <a 
                        href="https://keys.coinbase.com" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Wallet
                      </a>
                      <a 
                        href="https://t.me/SilviProtocol/1" 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Silvi Telegram
                      </a>
                      
                      {/* Disconnect button */}
                      <button
                        onClick={() => {
                          disconnect()
                          setDropdownOpen(false)
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                      >
                        Disconnect
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}