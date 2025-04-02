import { Navbar } from "@/components/navbar";

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="w-full min-h-screen">
        <div
          className="min-h-screen py-12 px-4 sm:px-6"
        >
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">About Treekipedia</h1>

            <div className="grid gap-6">
              <div className="p-6 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white">
                <h2 className="text-xl font-semibold mb-4">Our Mission</h2>
                <p className="mb-4">
                  Treekipedia is dedicated to creating the world&apos;s most comprehensive, accessible database of tree species information. 
                  Our platform combines traditional research with blockchain technology to incentivize and fund new discoveries.
                </p>
                <p>
                  By minting NFTs to fund research, we create a sustainable ecosystem where users directly contribute to expanding 
                  our collective knowledge about the world&apos;s trees - connecting technology with nature in a meaningful way.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white">
                <h2 className="text-xl font-semibold mb-4">How It Works</h2>
                <div className="grid gap-4">
                  <div className="p-4 rounded-lg bg-black/30 border border-white/10">
                    <h3 className="font-medium mb-2">1. Search for a Tree Species</h3>
                    <p className="text-sm text-white/80">
                      Use our search functionality to find any tree species by common or scientific name.
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-black/30 border border-white/10">
                    <h3 className="font-medium mb-2">2. Discover Missing Information</h3>
                    <p className="text-sm text-white/80">
                      Some species have incomplete research data. These represent opportunities for contribution.
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-black/30 border border-white/10">
                    <h3 className="font-medium mb-2">3. Fund Research with NFTs</h3>
                    <p className="text-sm text-white/80">
                      Mint a Contreebution NFT for $3 to fund AI-powered research for a species missing data.
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-black/30 border border-white/10">
                    <h3 className="font-medium mb-2">4. Earn Tree Points</h3>
                    <p className="text-sm text-white/80">
                      Each contribution earns you points displayed on the Treederboard, recognizing your impact.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white">
                <h2 className="text-xl font-semibold mb-4">Blockchain Integration</h2>
                <p className="mb-4">
                  Treekipedia leverages blockchain technology in several innovative ways:
                </p>
                <ul className="list-disc list-inside space-y-2 text-white/80">
                  <li>
                    <strong>Multi-Chain Support:</strong> Deploy on your preferred network (Base, Celo, Optimism, or Arbitrum)
                  </li>
                  <li>
                    <strong>NFT Minting:</strong> Each contribution is recorded as a unique NFT representing your support
                  </li>
                  <li>
                    <strong>Ethereum Attestation Service:</strong> Research data is attested on-chain for permanence and verification
                  </li>
                  <li>
                    <strong>IPFS Storage:</strong> Complete research data is stored on IPFS for decentralized access
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}