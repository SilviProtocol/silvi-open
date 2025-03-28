import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          <MainNav />
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container px-4 py-12 max-w-4xl">
          <h1 className="text-3xl font-bold mb-6">About Treekipedia</h1>

          <div className="prose prose-green max-w-none">
            <p className="text-lg mb-4">
              Treekipedia is the world's first decentralized encyclopedia of trees, combining scientific research with
              blockchain technology to create a sustainable model for environmental knowledge sharing.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Our Mission</h2>
            <p>
              Our mission is to document and preserve knowledge about every tree species on Earth, while creating
              economic incentives for conservation and research. By connecting tree enthusiasts, scientists, and
              conservationists through our platform, we aim to build a comprehensive database that serves as a resource
              for future generations.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">How It Works</h2>
            <p>
              Treekipedia uses blockchain technology to fund research on understudied tree species. Users can mint NFTs
              (Non-Fungible Tokens) that represent their contribution to researching a specific tree species. The funds
              generated from NFT minting go directly toward scientific research, data collection, and platform
              maintenance.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">The Treederboard</h2>
            <p>
              Our unique "Treederboard" gamifies conservation by ranking contributors based on their involvement in
              funding research and sharing knowledge. By climbing the Treederboard, users gain recognition within our
              community and earn exclusive benefits.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Join Our Community</h2>
            <p>
              Whether you're a casual tree enthusiast, a professional botanist, or a conservation advocate, there's a
              place for you in the Treekipedia community. Connect your wallet to start contributing to tree research and
              conservation today.
            </p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Contact Us</h2>
            <p>
              For inquiries, partnership opportunities, or technical support, please reach out to us at
              info@treekipedia.org.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

