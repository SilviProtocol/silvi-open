"use client";

import { Button } from "@/components/ui/button";
import { useReadContract } from "wagmi";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const NFT_CONTRACT_ADDRESS = "0x5Ed6240fCC0B2A231887024321Cc9481ba07f3c6";

// Basic ERC721 ABI for balanceOf and tokenOfOwnerByIndex
const abi = [
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "uint256", name: "index", type: "uint256" },
    ],
    name: "tokenOfOwnerByIndex",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export default function NFTsPage() {
  const { address } = useAccount();
  const router = useRouter();
//   const params = useParams();

  const { data: nftBalance, isLoading: balanceLoading } = useReadContract({
    address: NFT_CONTRACT_ADDRESS,
    abi,
    functionName: "balanceOf",
    args: [address!],
    // enabled: !!address,
  });

  console.log(nftBalance);

  if (balanceLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">Loading NFTs...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Species
          </Button>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-lg">
          <h1 className="text-2xl font-bold mb-6">Your Research NFTs</h1>
          
          {!address ? (
            <div className="text-center py-8">
              Please connect your wallet to view NFTs
            </div>
          ) : nftBalance?.toString() === "0" ? (
            <div className="text-center py-8">
              No Research NFTs found in your wallet
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* You can add NFT card components here */}
              <div className="p-4 border rounded-lg">
                <div>Total NFTs: {nftBalance?.toString()}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
