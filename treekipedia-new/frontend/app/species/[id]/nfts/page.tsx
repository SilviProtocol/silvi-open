"use client";

import { Button } from "@/components/ui/button";
import { useAccount, useChainId } from "wagmi";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { contractAddresses } from "@/lib/chains";
import { createPublicClient, http, parseAbi } from "viem";
import { base, baseSepolia, celo, celoAlfajores, optimism, optimismSepolia, arbitrum, arbitrumSepolia } from "wagmi/chains";
import axios from "axios";

// NFT Contract Address (from Celo for now)
const NFT_CONTRACT_ADDRESS = contractAddresses[String(celo.id)].contreebutionNFT;

// NFT Contract ABI (only what we need)
const NFT_ABI = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string memory)",
]);

// Define the NFT metadata interface
interface NFTMetadata {
  tokenId: string;
  title: string;
  description?: string;
  image: string;
  balance: number;
  attributes?: Record<string, unknown>[];
}

// NFT Card Component
function NFTCard({ nft }: { nft: NFTMetadata }) {
  return (
    <div className="rounded-xl bg-gray-100 p-2 transform transition-all duration-300 hover:-translate-y-2
    shadow-[8px_8px_15px_#d1d1d1,-8px_-8px_15px_#ffffff]
    hover:shadow-[12px_12px_20px_#d1d1d1,-12px_-12px_20px_#ffffff]">
      <div className="relative w-full h-48 rounded-lg overflow-hidden">
        {nft.image ? (
          <Image
            src={nft.image}
            alt={nft.title || "NFT"}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center rounded-lg">
            No Image
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 text-gray-800">
          {nft.title || `Token ID: ${nft.tokenId}`}
        </h3>
        {nft.description && (
          <p className="text-sm text-gray-600 line-clamp-2">{nft.description}</p>
        )}
        <div className="mt-2 text-sm text-gray-700">
          Quantity: {nft.balance || 1}
        </div>
      </div>
    </div>
  );
}

export default function NFTsPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const router = useRouter();
  const [nfts, setNfts] = useState<NFTMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  // Find NFT contract address for current chain or fallback to Celo
  const getContractAddressForChain = (chainId: number) => {
    return contractAddresses[String(chainId)]?.contreebutionNFT || NFT_CONTRACT_ADDRESS;
  };

  // Get chain for RPC client
  const getChainForId = (chainId: number) => {
    const chainMap = {
      [base.id]: base,
      [baseSepolia.id]: baseSepolia,
      [celo.id]: celo,
      [celoAlfajores.id]: celoAlfajores,
      [optimism.id]: optimism,
      [optimismSepolia.id]: optimismSepolia,
      [arbitrum.id]: arbitrum,
      [arbitrumSepolia.id]: arbitrumSepolia,
    };
    return chainMap[chainId as keyof typeof chainMap] || celo;
  };

  useEffect(() => {
    async function fetchNFTs() {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        const chain = getChainForId(chainId);
        const contractAddress = getContractAddressForChain(chainId);
        
        // Create a public client using the current chain's RPC URL
        const publicClient = createPublicClient({
          chain,
          transport: http()
        });

        // Get the balance of NFTs for the current address
        const balance = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: NFT_ABI,
          functionName: 'balanceOf',
          args: [address]
        });

        if (!balance || Number(balance) === 0) {
          setNfts([]);
          setLoading(false);
          return;
        }

        // For each NFT, get the token ID and URI
        const tokenPromises = [];
        for (let i = 0; i < Number(balance); i++) {
          tokenPromises.push(
            publicClient.readContract({
              address: contractAddress as `0x${string}`,
              abi: NFT_ABI,
              functionName: 'tokenOfOwnerByIndex',
              args: [address, BigInt(i)]
            })
          );
        }

        const tokenIds = await Promise.all(tokenPromises);
        
        // For each token ID, get the token URI
        const uriPromises = tokenIds.map(tokenId => 
          publicClient.readContract({
            address: contractAddress as `0x${string}`,
            abi: NFT_ABI,
            functionName: 'tokenURI',
            args: [tokenId]
          })
        );

        const tokenURIs = await Promise.all(uriPromises);
        
        // Fetch metadata from each token URI (which is an IPFS URL)
        const metadataPromises = tokenURIs.map(async (uri, index) => {
          try {
            // Convert IPFS URI to HTTP URL through IPFS gateway
            let url = uri as string;
            if (url.startsWith('ipfs://')) {
              url = url.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }
            
            // Attempt to fetch metadata
            const response = await axios.get(url);
            const metadata = response.data;
            
            // Format image URL if it's an IPFS URL
            let imageUrl = metadata.image || '';
            if (imageUrl.startsWith('ipfs://')) {
              imageUrl = imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }
            
            return {
              tokenId: tokenIds[index].toString(),
              title: metadata.name || `NFT #${tokenIds[index].toString()}`,
              description: metadata.description,
              image: imageUrl,
              balance: 1, // ERC721 tokens have quantity 1
              attributes: metadata.attributes
            };
          } catch (error) {
            console.error(`Error fetching metadata for token ${tokenIds[index]}:`, error);
            return {
              tokenId: tokenIds[index].toString(),
              title: `NFT #${tokenIds[index].toString()}`,
              description: 'Metadata unavailable',
              image: '',
              balance: 1
            };
          }
        });

        const nftData = await Promise.all(metadataPromises);
        setNfts(nftData);
      } catch (error) {
        console.error("Error fetching NFTs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchNFTs();
  }, [address, chainId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col space-y-2 items-center justify-center gap-2 p-8 rounded-xl" style={{
            boxShadow: 'inset 5px 5px 10px #d1d1d1, inset -5px -5px 10px #ffffff'
          }}>
            <Loader2 className="w-10 h-10 animate-spin text-green-500" />
            Loading NFTs...
          </div>
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
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 text-black 
            shadow-[5px_5px_10px_#d1d1d1,-5px_-5px_10px_#ffffff] 
            hover:shadow-[inset_5px_5px_10px_#d1d1d1,inset_-5px_-5px_10px_#ffffff] 
            transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Species
          </Button>
        </div>

        <div className="rounded-xl p-8 bg-gray-100" style={{
          boxShadow: '10px 10px 20px #d1d1d1, -10px -10px 20px #ffffff'
        }}>
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Your Research NFTs</h1>
          
          {!isConnected ? (
            <div className="text-center py-8 rounded-xl bg-gray-100" style={{
              boxShadow: 'inset 5px 5px 10px #d1d1d1, inset -5px -5px 10px #ffffff'
            }}>
              Please connect your wallet to view NFTs
            </div>
          ) : nfts.length === 0 ? (
            <div className="text-center py-8 rounded-xl bg-gray-100" style={{
              boxShadow: 'inset 5px 5px 10px #d1d1d1, inset -5px -5px 10px #ffffff'
            }}>
              No Research NFTs found in your wallet
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {nfts.map((nft) => (
                <NFTCard key={nft.tokenId} nft={nft} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}