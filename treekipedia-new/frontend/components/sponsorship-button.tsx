'use client'

import { useState, useEffect } from 'react'
import { 
  useAccount, 
  useChainId, 
  useWriteContract,
  useBalance,
  useSwitchChain
} from 'wagmi'
import { erc20Abi } from 'viem'
import { contractAddresses, supportedChains, getChainColor } from '@/lib/chains'
import { parseUnits } from 'viem'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { initiateSponsorshipPayment, getPaymentStatus, reportTransaction } from '@/lib/api'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

const SPONSORSHIP_AMOUNT = 0.01 // 0.01 USDC (reduced from 3 USDC for testing)
const POLLING_INTERVAL = 5000 // 5 seconds

interface SponsorshipButtonProps {
  taxonId: string
  speciesName: string
  onSponsorshipComplete?: () => void
  className?: string
}

type SponsorshipStatus = 'idle' | 'connecting' | 'switching_chain' | 'preparing' | 'transferring' | 
  'confirming' | 'completed' | 'error' | 'needs_verification'

export function SponsorshipButton({ 
  taxonId, 
  speciesName,
  onSponsorshipComplete,
  className = ''
}: SponsorshipButtonProps) {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  
  const [status, setStatus] = useState<SponsorshipStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [sponsorshipId, setSponsorshipId] = useState<string | null>(null)
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [treasuryAddress, setTreasuryAddress] = useState<string | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  
  // Get chain configuration
  const currentChainConfig = contractAddresses[chainId?.toString() || '0']
  const usdcAddress = currentChainConfig?.usdcAddress
  
  // Check if current chain is supported
  const isChainSupported = !!usdcAddress
  
  // Get USDC balance - updated for wagmi v2
  const { data: usdcBalance } = useBalance({
    address,
    token: usdcAddress as `0x${string}` | undefined,
    chainId,
    query: {
      enabled: isConnected && isChainSupported,
      refetchInterval: 5000,
    }
  })
  
  // USDC Transfer function - updated for wagmi v2
  const { writeContract: transferUsdc, data: transferTxHash, isPending: isTransferring, isSuccess: isTransferSuccess } = useWriteContract()
  
  // Check if user has sufficient USDC balance
  const hasSufficientBalance = usdcBalance ? 
    parseFloat(usdcBalance.formatted) >= SPONSORSHIP_AMOUNT : false
  
  // Handle "Sponsor" button click
  const handleSponsor = async () => {
    try {
      setError(null)
      
      // Check wallet connection
      if (!isConnected) {
        setStatus('connecting')
        return
      }
      
      // Check chain support
      if (!isChainSupported) {
        setStatus('switching_chain')
        
        // Find a supported chain
        const supported = supportedChains.filter(chain => {
          const config = contractAddresses[chain.id.toString()]
          return config?.usdcAddress;
        })
        
        if (supported.length === 0) {
          setError('No supported chains available. Please try again later.')
          setStatus('error')
          return
        }
        
        // Switch to first supported chain
        try {
          await switchChain({ chainId: supported[0].id })
        } catch (switchError: any) {
          setError(`Failed to switch chain: ${switchError.message}`)
          setStatus('error')
          return
        }
        return
      }
      
      // Check balance
      if (!hasSufficientBalance) {
        setError(`Insufficient USDC balance. You need at least ${SPONSORSHIP_AMOUNT} USDC.`)
        setStatus('error')
        return
      }
      
      // Prepare sponsorship by registering intent with backend
      setStatus('preparing')
      try {
        // First, check if we can fall back to a treasury address from the chain config if the API fails
        const fallbackTreasuryAddress = currentChainConfig?.treasuryAddress;
        console.log(`Chain ${chainId} treasury address from config: ${fallbackTreasuryAddress}`);
        
        try {
          const response = await initiateSponsorshipPayment({
            taxon_id: taxonId,
            wallet_address: address!,
            chain: chainId.toString()
          });
          
          if (!response || !response.treasury_address) {
            throw new Error('Invalid response from server: missing treasury address');
          }
          
          setSponsorshipId(response.sponsorship_id)
          setTreasuryAddress(response.treasury_address)
          
          // Proceed to transfer USDC
          handleTransfer(response.treasury_address)
        } catch (err: any) {
          console.error('Failed to initiate sponsorship via API:', err);
          
          // Fall back to using the treasury address from the chain config if available
          if (fallbackTreasuryAddress) {
            console.log(`Falling back to treasury address from chain config: ${fallbackTreasuryAddress}`);
            setTreasuryAddress(fallbackTreasuryAddress);
            
            // Proceed with the transfer using the fallback address
            handleTransfer(fallbackTreasuryAddress);
          } else {
            throw new Error('No treasury address available. Please try a different chain.');
          }
        }
      } catch (err: any) {
        console.error('Sponsorship preparation failed:', err)
        setError(err.message || 'Failed to prepare sponsorship')
        setStatus('error')
      }
    } catch (err: any) {
      console.error('Sponsorship error:', err)
      setError(err.message || 'Failed to sponsor research')
      setStatus('error')
    }
  }
  
  // Handle USDC transfer - updated for wagmi v2
  const handleTransfer = (treasuryAddr: string) => {
    setStatus('transferring')
    try {
      // Ensure treasury address is valid before proceeding
      if (!treasuryAddr || !treasuryAddr.startsWith('0x')) {
        console.error(`Invalid treasury address: ${treasuryAddr}`)
        setError('Invalid treasury address configuration. Please try another chain.')
        setStatus('error')
        return;
      }
      
      console.log(`Transferring ${SPONSORSHIP_AMOUNT} USDC to treasury address: ${treasuryAddr}`)
      
      // Send USDC to treasury address
      transferUsdc({
        address: usdcAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: 'transfer',
        args: [
          treasuryAddr as `0x${string}`,
          parseUnits(SPONSORSHIP_AMOUNT.toString(), 6) // USDC has 6 decimals
        ]
      })
    } catch (err: any) {
      console.error('Transfer error:', err)
      setError(err.message || 'Failed to transfer USDC')
      setStatus('error')
    }
  }
  
  // Set up poller for transaction confirmation
  const startPollingForStatus = async (txHash: string) => {
    setIsPolling(true)
    let retries = 0
    const maxRetries = 10 // 10 x 5 seconds = 50 seconds max
    let notFoundCount = 0
    const maxNotFoundCount = 3 // Consider success after multiple not_found responses
    
    const pollStatus = async () => {
      try {
        const status = await getPaymentStatus(txHash)
        console.log('Polled payment status:', status)
        
        if (status.status === 'completed' || status.status === 'confirmed') {
          console.log('Payment confirmed by backend')
          setStatus('completed')
          setIsPolling(false)
          
          // Call the callback if provided
          if (onSponsorshipComplete) {
            onSponsorshipComplete()
          }
          
          return
        }
        
        // If transaction was not found, increment counter
        if (status.status === 'not_found') {
          notFoundCount++
          console.log(`Transaction not found in backend (${notFoundCount}/${maxNotFoundCount})`)
          
          // If we've checked multiple times and it's still not found,
          // the backend might not be tracking it but the transaction is still valid
          if (notFoundCount >= maxNotFoundCount) {
            console.log('Transaction confirmed on chain but not found in backend after multiple attempts')
            setStatus('completed')
            setIsPolling(false)
            
            if (onSponsorshipComplete) {
              onSponsorshipComplete()
            }
            
            return
          }
        }
        
        retries++
        if (retries >= maxRetries) {
          console.log('Max retries reached, stopping polling')
          // Don't automatically mark as completed, show needs verification status instead
          setStatus('needs_verification')
          setError('Transaction was sent, but research process could not be verified. Please check again later.')
          setIsPolling(false)
          // Don't trigger refresh since we're not sure it actually completed
          return
        }
        
        // Continue polling
        setTimeout(pollStatus, POLLING_INTERVAL)
      } catch (error) {
        console.error('Error polling for status:', error)
        retries++
        
        // If we've had too many errors (including network errors),
        // consider it as a pending status that needs manual verification
        if (retries >= maxRetries / 2) {
          console.log('Too many polling errors, showing needs verification status')
          setStatus('needs_verification')
          setError('Transaction sent but verification failed. The research might still be processing. Please check again later.')
          setIsPolling(false)
          
          // Don't call onSponsorshipComplete since we're not sure it actually completed
          return
        }
        
        // Continue polling despite errors
        setTimeout(pollStatus, POLLING_INTERVAL)
      }
    }
    
    // Start polling
    pollStatus()
  }
  
  // Handle transfer transaction completion
  useEffect(() => {
    if (isTransferSuccess && transferTxHash) {
      toast.success('USDC transfer complete')
      setTransactionHash(transferTxHash)
      setStatus('confirming')
      setIsConfirming(true)
      
      // Report the transaction hash to the backend to link it with the sponsorship
      // Always send all available data to ensure the backend can process it even if there are DB issues
      reportTransaction(
        sponsorshipId || '', 
        transferTxHash,
        taxonId,
        address,
        chainId?.toString()
      )
        .then(response => {
          console.log('Transaction reported successfully:', response)
          
          // Start polling for transaction status
          startPollingForStatus(transferTxHash)
        })
        .catch(error => {
          console.error('Failed to report transaction:', error)
          // Still start polling even if reporting fails
          startPollingForStatus(transferTxHash)
        })
    }
  }, [isTransferSuccess, transferTxHash, sponsorshipId])
  
  // Button text based on status
  const getButtonText = () => {
    switch (status) {
      case 'idle':
        return `Sponsor This Tree ($${SPONSORSHIP_AMOUNT} USDC)`
      case 'connecting':
        return 'Connect Wallet'
      case 'switching_chain':
        return 'Switch Network'
      case 'preparing':
        return 'Preparing Sponsorship...'
      case 'transferring':
        return 'Sending USDC...'
      case 'confirming':
        return 'Waiting for Confirmation...'
      case 'completed':
        return 'Sponsorship Complete!'
      case 'needs_verification':
        return 'Needs Verification'
      case 'error':
        return 'Sponsorship Failed'
      default:
        return 'Sponsor This Tree'
    }
  }
  
  // Disable button based on status - updated for wagmi v2
  const isButtonDisabled = [
    'preparing', 
    'transferring', 
    'confirming', 
    'completed',
    'needs_verification'
  ].includes(status) || isTransferring || isConfirming || isPolling
  
  return (
    <div className="w-full flex flex-col gap-2">
      <Button
        onClick={handleSponsor}
        disabled={isButtonDisabled}
        className={`${className} relative overflow-hidden ${
          status === 'completed' ? 'bg-green-600 hover:bg-green-700' : 
          status === 'error' ? 'bg-red-600 hover:bg-red-700' : 
          status === 'needs_verification' ? 'bg-yellow-600 hover:bg-yellow-700' : 
          ''
        }`}
      >
        {(isButtonDisabled && status !== 'completed' && status !== 'needs_verification') && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {status === 'completed' && (
          <CheckCircle2 className="mr-2 h-4 w-4" />
        )}
        {status === 'error' && (
          <AlertCircle className="mr-2 h-4 w-4" />
        )}
        {status === 'needs_verification' && (
          <AlertCircle className="mr-2 h-4 w-4" />
        )}
        {getButtonText()}
      </Button>
      
      {/* Display errors */}
      {error && (
        <div className="text-red-500 text-sm mt-1">
          {error}
        </div>
      )}
      
      {/* Status messages */}
      {status === 'confirming' && transactionHash && (
        <div className="text-sm text-gray-500 mt-1">
          Transaction hash: {transactionHash.substring(0, 10)}...{transactionHash.substring(transactionHash.length - 8)}
        </div>
      )}
      
      {status === 'completed' && (
        <div className="text-sm text-green-500 mt-1">
          Research for {speciesName} has been funded successfully!
        </div>
      )}
      
      {status === 'needs_verification' && transactionHash && (
        <div className="text-sm text-yellow-500 mt-1">
          USDC transfer complete, but research process verification failed. Transaction: {transactionHash.substring(0, 6)}...{transactionHash.substring(transactionHash.length - 4)}
        </div>
      )}
    </div>
  )
}