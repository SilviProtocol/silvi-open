"use client";

import { Button } from "@/components/ui/button";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Network, Alchemy } from "alchemy-sdk";
import { useEffect, useState } from "react";
import Image from "next/image";

const NFT_CONTRACT_ADDRESS = "0x5Ed6240fCC0B2A231887024321Cc9481ba07f3c6";

// Configure Alchemy SDK
const alchemy = new Alchemy({
  apiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
  network: Network.BASE_SEPOLIA,
});

// NFT Card Component

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function NFTCard({ nft }: { nft: any }) {
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
          Quantity: {nft.balance}
        </div>
      </div>
    </div>
  );
}

export default function NFTsPage() {
  const { address } = useAccount();
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  console.log("nfts", nfts);

  useEffect(() => {
    async function fetchNFTs() {
      if (!address) {
        setLoading(false);
        return;
      }

      try {
        const response = await alchemy.nft.getNftsForOwner(
            address,
            {
              contractAddresses: [NFT_CONTRACT_ADDRESS],
              omitMetadata: false,
            }
          );

        // Transform the NFT data
        const nftData = await Promise.all(
          response.ownedNfts.map(async (nft) => {
            const metadata = nft?.raw.metadata;
            let image = metadata?.image || '';
            
            if (image.startsWith('ipfs://')) {
              image = image.replace('ipfs://', 'https://ipfs.io/ipfs/');
            }

            return {
              tokenId: nft.tokenId,
              title: metadata?.name || `NFT #${nft.tokenId}`,
              description: metadata?.description,
              image: image,
              // Add balance information since ERC1155 tokens can have multiple copies
              balance: nft.balance,
            };
          })
        );

        console.log("Fetched NFT data:", nftData);
        setNfts(nftData);
      } catch (error) {
        console.error("Error fetching NFTs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchNFTs();
  }, [address]);

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
          
          {!address ? (
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
