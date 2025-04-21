'use client'

import { useState, useEffect } from 'react'
import { 
  useAccount, 
  useChainId, 
  useContractWrite, 
  useContractRead,
  useWaitForTransaction,
  useBalance,
  useSwitchChain
} from 'wagmi'
import { contractAddresses, supportedChains, getChainColor } from '@/lib/chains'
import { erc20ABI } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { getPaymentStatus } from '@/lib/api'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

// ABI for the payment contract's sponsorSpecies function
const sponsorshipABI = [
  {
    inputs: [
      {
        internalType: 'string',
        name: 'taxon_id',
        type: 'string',
      },
    ],
    name: 'sponsorSpecies',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
]

const SPONSORSHIP_AMOUNT = 3 // 3 USDC
const POLLING_INTERVAL = 5000 // 5 seconds

interface SponsorshipButtonProps {
  taxonId: string
  speciesName: string
  onSponsorshipComplete?: () => void
  className?: string
}

type SponsorshipStatus = 'idle' | 'connecting' | 'switching_chain' | 'checking_allowance' | 'approving' | 'approved' | 
  'sponsoring' | 'confirming' | 'completed' | 'error'

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
  const [transactionHash, setTransactionHash] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  
  // Get contract addresses for current chain
  const currentChainConfig = contractAddresses[chainId?.toString() || '0']
  const paymentContractAddress = currentChainConfig?.paymentContract
  const usdcAddress = currentChainConfig?.usdcAddress
  
  // Check if current chain is supported
  const isChainSupported = !!paymentContractAddress && paymentContractAddress !== '0x0000000000000000000000000000000000000000'
  
  // Get USDC balance
  const { data: usdcBalance } = useBalance({
    address: address,
    token: usdcAddress,
    chainId,
    watch: true,
    enabled: isConnected && isChainSupported,
  })
  
  // Check USDC allowance
  const { data: allowance, refetch: refetchAllowance } = useContractRead({
    address: usdcAddress,
    abi: erc20ABI,
    functionName: 'allowance',
    args: [address!, paymentContractAddress!],
    chainId,
    enabled: isConnected && isChainSupported && !!address && !!paymentContractAddress,
  })

  // Approve USDC spending
  const { write: approveUsdc, data: approveTxData, isLoading: isApproving } = useContractWrite({
    address: usdcAddress,
    abi: erc20ABI,
    functionName: 'approve',
    chainId,
  })
  
  // Wait for approval transaction
  const { isLoading: isApprovalPending, isSuccess: isApprovalSuccess } = useWaitForTransaction({
    hash: approveTxData?.hash,
    enabled: !!approveTxData?.hash,
  })
  
  // Sponsor research
  const { write: sponsorResearch, data: sponsorTxData, isLoading: isSponsoring } = useContractWrite({
    address: paymentContractAddress,
    abi: sponsorshipABI,
    functionName: 'sponsorSpecies',
    chainId,
  })
  
  // Wait for sponsorship transaction
  const { isLoading: isSponsorshipPending, isSuccess: isSponsorshipSuccess } = useWaitForTransaction({
    hash: sponsorTxData?.hash,
    enabled: !!sponsorTxData?.hash,
  })
  
  // Check if user has sufficient USDC balance
  const hasSufficientBalance = usdcBalance ? 
    parseFloat(usdcBalance.formatted) >= SPONSORSHIP_AMOUNT : false
  
  // Check if allowance is sufficient
  const requiredAllowance = parseUnits(SPONSORSHIP_AMOUNT.toString(), 6) // USDC has 6 decimals
  const hasAllowance = allowance ? BigInt(allowance) >= requiredAllowance : false
  
  // Handle "Sponsor" button click
  const handleSponsor = async () => {
    try {
      setError(null)
      
      // Check wallet connection
      if (!isConnected) {
        setStatus('connecting')
        // Let the ConnectButton handle this
        return
      }
      
      // Check chain support
      if (!isChainSupported) {
        setStatus('switching_chain')
        
        // Find a supported chain
        const supported = supportedChains.filter(chain => {
          const config = contractAddresses[chain.id.toString()]
          return config?.paymentContract && config.paymentContract !== '0x0000000000000000000000000000000000000000'
        })
        
        if (supported.length === 0) {
          setError('No supported chains available. Please try again later.')
          setStatus('error')
          return
        }
        
        // Switch to first supported chain
        try {
          await switchChain({ chainId: supported[0].id })
          // The component will re-render with the new chain
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
      
      // Check allowance
      setStatus('checking_allowance')
      await refetchAllowance()
      
      if (!hasAllowance) {
        setStatus('approving')
        // Approve USDC spending
        approveUsdc({
          args: [paymentContractAddress, requiredAllowance]
        })
        return // Wait for approval to complete
      }
      
      // If we already have allowance, proceed to sponsorship
      handleSponsorship()
      
    } catch (err: any) {
      console.error('Sponsorship error:', err)
      setError(err.message || 'Failed to sponsor research')
      setStatus('error')
    }
  }
  
  // Handle sponsorship after approval
  const handleSponsorship = () => {
    setStatus('sponsoring')
    try {
      sponsorResearch({
        args: [taxonId],
      })
    } catch (err: any) {
      console.error('Sponsorship error:', err)
      setError(err.message || 'Failed to sponsor research')
      setStatus('error')
    }
  }
  
  // Set up poller for transaction confirmation
  const startPollingForStatus = async (txHash: string) => {
    setIsPolling(true)
    let retries = 0
    const maxRetries = 30 // 30 x 5 seconds = 2.5 minutes max
    
    const pollStatus = async () => {
      try {
        const status = await getPaymentStatus(txHash)
        console.log('Polled payment status:', status)
        
        if (status.status === 'completed' || status.status === 'confirmed') {
          setStatus('completed')
          setIsPolling(false)
          
          // Call the callback if provided
          if (onSponsorshipComplete) {
            onSponsorshipComplete()
          }
          
          return
        }
        
        retries++
        if (retries >= maxRetries) {
          console.log('Max retries reached, stopping polling')
          setIsPolling(false)
          // Don't set an error, the transaction might still be processing
          // The user can still see status on their profile page
          return
        }
        
        // Continue polling
        setTimeout(pollStatus, POLLING_INTERVAL)
      } catch (error) {
        console.error('Error polling for status:', error)
        // Continue polling despite errors
        setTimeout(pollStatus, POLLING_INTERVAL)
      }
    }
    
    // Start polling
    pollStatus()
  }

  // Handle approval transaction completion
  useEffect(() => {
    if (isApprovalSuccess) {
      toast.success('USDC spending approved')
      setStatus('approved')
      
      // Refetch allowance to confirm
      refetchAllowance().then(() => {
        // Proceed to sponsorship
        handleSponsorship()
      })
    }
  }, [isApprovalSuccess])
  
  // Handle sponsorship transaction completion
  useEffect(() => {
    if (isSponsorshipSuccess && sponsorTxData?.hash) {
      toast.success('Sponsorship transaction sent')
      setTransactionHash(sponsorTxData.hash)
      setStatus('confirming')
      
      // Start polling for transaction status
      startPollingForStatus(sponsorTxData.hash)
    }
  }, [isSponsorshipSuccess, sponsorTxData])
  
  // Button text based on status
  const getButtonText = () => {
    switch (status) {
      case 'idle':
        return `Sponsor This Tree ($${SPONSORSHIP_AMOUNT} USDC)`
      case 'connecting':
        return 'Connect Wallet'
      case 'switching_chain':
        return 'Switch Network'
      case 'checking_allowance':
        return 'Checking Allowance...'
      case 'approving':
        return 'Approving USDC...'
      case 'approved':
        return 'Approved, Starting Sponsorship...'
      case 'sponsoring':
        return 'Confirming Sponsorship...'
      case 'confirming':
        return 'Waiting for Confirmation...'
      case 'completed':
        return 'Sponsorship Complete!'
      case 'error':
        return 'Sponsorship Failed'
      default:
        return 'Sponsor This Tree'
    }
  }
  
  // Disable button based on status
  const isButtonDisabled = [
    'checking_allowance', 
    'approving', 
    'approved', 
    'sponsoring', 
    'confirming', 
    'completed'
  ].includes(status) || isApproving || isApprovalPending || isSponsoring || isSponsorshipPending || isPolling
  
  return (
    <div className="w-full flex flex-col gap-2">
      <Button
        onClick={handleSponsor}
        disabled={isButtonDisabled}
        className={`${className} relative overflow-hidden ${status === 'completed' ? 'bg-green-600 hover:bg-green-700' : status === 'error' ? 'bg-red-600 hover:bg-red-700' : ''}`}
      >
        {isButtonDisabled && status !== 'completed' && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {status === 'completed' && (
          <CheckCircle2 className="mr-2 h-4 w-4" />
        )}
        {status === 'error' && (
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
    </div>
  )
}