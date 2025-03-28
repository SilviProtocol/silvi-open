"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { SUPPORTED_CHAINS, connectWallet, signMessage } from "@/lib/wallet-utils"
import { walletAPI } from "@/lib/api"

const wallets = [
  {
    value: "metamask",
    label: "MetaMask",
    icon: "🦊",
  },
  {
    value: "walletconnect",
    label: "WalletConnect",
    icon: "🔗",
  },
  {
    value: "coinbase",
    label: "Coinbase Wallet",
    icon: "🔵",
  },
  {
    value: "phantom",
    label: "Phantom",
    icon: "👻",
  },
]

interface WalletConnectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: (walletAddress: string, chainId: string) => void
  forMinting?: boolean
}

export function WalletConnectDialog({ open, onOpenChange, onSuccess, forMinting = false }: WalletConnectDialogProps) {
  const [blockchain, setBlockchain] = useState("")
  const [openBlockchainPopover, setOpenBlockchainPopover] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  // Check if wallet is already connected
  useEffect(() => {
    const checkWalletConnection = async () => {
      if (typeof window !== "undefined" && window.ethereum) {
        try {
          const provider = new (window as any).ethers.BrowserProvider(window.ethereum)
          const accounts = await provider.listAccounts()
          if (accounts.length > 0) {
            setWalletAddress(accounts[0].address)
          }
        } catch (error) {
          console.error("Error checking wallet connection:", error)
        }
      }
    }

    if (open) {
      checkWalletConnection()
    }
  }, [open])

  const handleConnect = async (walletValue: string) => {
    setConnecting(true)
    setError(null)

    try {
      // Connect wallet
      const { address } = await connectWallet()
      setWalletAddress(address)

      // If this is for minting, we need a blockchain selected
      if (forMinting && !blockchain) {
        setError("Please select a blockchain network first")
        setConnecting(false)
        return
      }

      // Sign message for verification
      const message = `Verify wallet ownership for Treekipedia: ${Date.now()}`
      const signature = await signMessage(message)

      // Verify wallet with backend
      await walletAPI.verifyWallet(address, signature, message)

      // Call success callback
      if (onSuccess) {
        onSuccess(address, blockchain)
      }

      // Close dialog after successful connection
      setTimeout(() => {
        setConnecting(false)
        onOpenChange(false)
      }, 1000)
    } catch (error) {
      console.error("Wallet connection error:", error)
      setError(error instanceof Error ? error.message : "Failed to connect wallet")
      setConnecting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{forMinting ? "Connect Wallet to Mint NFT" : "Connect Wallet"}</DialogTitle>
          <DialogDescription>
            {forMinting
              ? "Connect your wallet to mint an NFT and fund research for this tree species."
              : "Connect your wallet to track your contributions and view your NFTs."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4 py-4">
          {forMinting && (
            <div className="grid gap-2">
              <Popover open={openBlockchainPopover} onOpenChange={setOpenBlockchainPopover}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openBlockchainPopover}
                    className="justify-between"
                  >
                    {blockchain ? SUPPORTED_CHAINS.find((bc) => bc.id === blockchain)?.name : "Select blockchain"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search blockchain..." />
                    <CommandList>
                      <CommandEmpty>No blockchain found.</CommandEmpty>
                      <CommandGroup>
                        {SUPPORTED_CHAINS.map((bc) => (
                          <CommandItem
                            key={bc.id}
                            value={bc.id}
                            onSelect={(currentValue) => {
                              setBlockchain(currentValue === blockchain ? "" : currentValue)
                              setOpenBlockchainPopover(false)
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", blockchain === bc.id ? "opacity-100" : "opacity-0")} />
                            <span className="mr-2">{bc.icon}</span>
                            {bc.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="grid gap-2">
            <div className="text-sm font-medium">Select your wallet</div>
            <div className="grid grid-cols-2 gap-2">
              {wallets.map((wallet) => (
                <Button
                  key={wallet.value}
                  variant="outline"
                  className="flex h-24 flex-col items-center justify-center gap-2"
                  onClick={() => handleConnect(wallet.value)}
                  disabled={connecting || (forMinting && !blockchain)}
                >
                  <span className="text-2xl">{wallet.icon}</span>
                  <span className="text-xs">{wallet.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {walletAddress && (
            <div className="rounded-lg border p-3 bg-muted/50">
              <p className="text-sm font-medium">Connected Wallet</p>
              <p className="text-xs font-mono truncate">{walletAddress}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

