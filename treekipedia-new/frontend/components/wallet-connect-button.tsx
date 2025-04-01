"use client"

import { useState, useCallback, useRef, useEffect } from 'react'
import { useConnect, useAccount, useDisconnect, useChainId, useSwitchChain, useBalance } from 'wagmi'
import { getChainName, chainsByNetwork } from '@/lib/chains'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Wallet, ChevronDown, LogOut, Check, User } from 'lucide-react'
import Link from 'next/link'

/**
 * Custom wallet connection button component
 * Provides a clean UI for connecting and managing wallet connections
 * using wagmi hooks directly, without additional dependencies
 */
export function WalletConnectButton() {
  const { connectors, connect, isPending } = useConnect()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { data: balance } = useBalance({
    address: address
  })
  
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [chainMenuOpen, setChainMenuOpen] = useState(false)
  
  // Refs for handling outside clicks
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current && 
        buttonRef.current && 
        !dropdownRef.current.contains(event.target as Node) && 
        !buttonRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false)
        setChainMenuOpen(false)
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  // Format address for display (0x1234...5678)
  const formatAddress = useCallback((address?: string) => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }, [])
  
  // Handle connecting wallet
  const handleConnect = useCallback(() => {
    // Find injected connector (usually MetaMask)
    const injected = connectors.find(c => c.id === 'injected')
    if (injected) {
      connect({ connector: injected })
    }
  }, [connect, connectors])
  
  // Handle disconnecting wallet
  const handleDisconnect = useCallback(() => {
    disconnect()
    setDropdownOpen(false)
  }, [disconnect])
  
  const toggleDropdown = useCallback(() => {
    setDropdownOpen(!dropdownOpen)
    if (chainMenuOpen && !dropdownOpen) {
      setChainMenuOpen(false)
    }
  }, [dropdownOpen, chainMenuOpen])
  
  const toggleChainMenu = useCallback(() => {
    setChainMenuOpen(!chainMenuOpen)
  }, [chainMenuOpen])
  
  if (!isConnected) {
    return (
      <Button
        ref={buttonRef}
        onClick={handleConnect}
        disabled={isPending}
        className="flex items-center space-x-2 bg-black/30 backdrop-blur-md text-white hover:bg-black/40 rounded-lg font-medium border border-white/20 transition-colors"
      >
        <Wallet className="h-4 w-4" />
        <span>{isPending ? 'Connecting...' : 'Connect Wallet'}</span>
      </Button>
    )
  }
  
  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        onClick={toggleDropdown}
        className="flex items-center space-x-2 bg-black/30 backdrop-blur-md text-white hover:bg-black/40 rounded-lg font-medium border border-white/20 transition-colors"
      >
        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
        <span>{formatAddress(address)}</span>
        <ChevronDown className={cn("h-4 w-4 transition-transform", dropdownOpen && "rotate-180")} />
      </Button>
      
      {dropdownOpen && (
        <div 
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-72 bg-black/30 backdrop-blur-md rounded-lg shadow-lg py-2 z-20 border border-white/20 text-white overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-white/20">
            <div className="font-semibold text-sm">{formatAddress(address)}</div>
            <div className="text-xs text-white/70 mt-1">
              {balance && `${Number(balance.formatted).toFixed(4)} ${balance.symbol}`}
            </div>
          </div>
          
          {/* Chain selection */}
          <div className="px-4 py-2 border-b border-white/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/70">Network</span>
              <button 
                onClick={toggleChainMenu}
                className="text-sm font-medium text-white flex items-center"
              >
                {getChainName(chainId)} 
                <ChevronDown className={cn("h-3 w-3 ml-1 transition-transform", chainMenuOpen && "rotate-180")} />
              </button>
            </div>
            
            {/* Chain selection dropdown */}
            {chainMenuOpen && (
              <div className="mt-2 bg-black/30 rounded-md p-2">
                <div className="mb-1">
                  <div className="text-xs font-semibold text-white/70 mb-1">Mainnets</div>
                  <div className="grid grid-cols-2 gap-1">
                    {chainsByNetwork.mainnet.map((chain) => (
                      <button
                        key={chain.id}
                        onClick={() => {
                          switchChain({ chainId: chain.id })
                          setChainMenuOpen(false)
                        }}
                        className={cn(
                          "text-xs py-1 px-2 rounded flex items-center justify-between", 
                          chainId === chain.id 
                            ? "bg-green-800/80 text-green-300" 
                            : "hover:bg-white/10"
                        )}
                      >
                        <span>{chain.name}</span>
                        {chainId === chain.id && <Check className="h-3 w-3" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-white/70 mb-1">Testnets</div>
                  <div className="grid grid-cols-2 gap-1">
                    {chainsByNetwork.testnet.map((chain) => (
                      <button
                        key={chain.id}
                        onClick={() => {
                          switchChain({ chainId: chain.id })
                          setChainMenuOpen(false)
                        }}
                        className={cn(
                          "text-xs py-1 px-2 rounded flex items-center justify-between", 
                          chainId === chain.id 
                            ? "bg-green-800/80 text-green-300" 
                            : "hover:bg-white/10"
                        )}
                      >
                        <span>{chain.name}</span>
                        {chainId === chain.id && <Check className="h-3 w-3" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Links */}
          <Link
            href="/profile"
            className="flex items-center px-4 py-2 text-sm hover:bg-white/10 transition-colors"
            onClick={() => setDropdownOpen(false)}
          >
            <User className="h-4 w-4 mr-2" />
            My Profile
          </Link>
          
          {/* Disconnect button */}
          <button
            onClick={handleDisconnect}
            className="flex items-center w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </button>
        </div>
      )}
    </div>
  )
}