import { SearchForm } from "@/components/search-form";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Link from "next/link";

export default function SearchPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="min-h-screen flex flex-col">
          {/* Hero Section with Search */}
          <section className="relative w-full py-16 md:py-24 lg:py-32">
            <div className="container relative z-10 px-4 md:px-6 mx-auto">
              <div className="flex flex-col items-center justify-center space-y-10 text-center">
                {/* Logo and tagline group */}
                <div className="space-y-2 max-w-4xl">
                  <div className="flex justify-center">
                    <img 
                      src="/treekipedialogo.svg" 
                      alt="Treekipedia" 
                      className="h-20 text-silvi-mint filter brightness-100 saturate-0"
                      style={{ filter: 'brightness(0) saturate(100%) invert(98%) sepia(5%) saturate(401%) hue-rotate(53deg) brightness(103%) contrast(94%)' }}
                    />
                  </div>
                  <h1 className="text-3xl font-bold tracking-tighter">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-green-200 to-teal-300 animate-gradient-x">
                      A Public Database For Every Species On Earth
                    </span>
                  </h1>
                </div>

                {/* Search bar and explanation group */}
                <div className="space-y-3 w-full max-w-2xl">
                  <SearchForm />
                  <p className="mx-auto max-w-[800px] text-silvi-mint text-lg md:text-xl font-semibold">
                    Explore over 50,000 species, support new research, and help grow open access to global tree intelligence.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="w-full py-16 md:py-24 bg-black/30 backdrop-blur-md">
            <div className="container px-4 md:px-6 mx-auto">
              <div className="grid gap-10 lg:grid-cols-3 lg:gap-12">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="text-6xl mb-4">🌳</div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-silvi-mint">Discover Tree Species</h3>
                    <p className="text-silvi-mint/80">
                      Browse over 50,000 species with structured data on taxonomy, ecology, and habitat. Get the facts without digging through dense PDFs or scattered datasets.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="text-6xl mb-4">🧪</div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-silvi-mint">Fund Research</h3>
                    <p className="text-silvi-mint/80">
                      Help fill the gaps. When a species is missing key info, you can fund AI-powered research with a Contreebution NFT. One click. New data. Real impact.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="text-6xl mb-4">🥇</div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-silvi-mint">Climb the Treederboard</h3>
                    <p className="text-silvi-mint/80">
                      Every species you help research earns you points. Track your contributions and celebrate your place in the forest.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Intro Paragraph */}
          <section className="w-full py-16 md:py-20">
            <div className="container px-4 md:px-6 mx-auto">
              <div className="mx-auto max-w-3xl text-center">
                <p className="text-silvi-mint text-lg md:text-xl leading-relaxed">
                  Treekipedia is an open-source, AI-powered database of tree knowledge. It's built for land stewards, restoration practitioners, and anyone trying to understand which trees grow where, and why that matters.
                </p>
                <p className="text-silvi-mint text-lg md:text-xl leading-relaxed mt-4">
                  No paywalls. No gatekeeping. Just real data for real-world work.
                </p>
              </div>
            </div>
          </section>


          {/* What's Coming Section */}
          <section className="w-full py-16 md:py-20 bg-gradient-to-b from-black/10 to-black/30 backdrop-blur-md">
            <div className="container px-4 md:px-6 mx-auto">
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="text-3xl font-bold mb-6 text-silvi-mint">
                  📍 What's Coming
                </h2>
                <p className="text-silvi-mint text-xl mb-4">
                  This is just the beginning.
                </p>
                <p className="text-silvi-mint/80 text-lg mb-8">
                  Future versions will unlock collaborative editing, decentralized validation, open APIs, and integrations with climate and biodiversity platforms. We're building the infrastructure to make tree data usable, composable, and truly open.
                </p>
                <Link 
                  href="/about"
                  className="inline-flex px-8 py-3 bg-emerald-600/80 hover:bg-emerald-600 backdrop-blur-md rounded-xl text-silvi-mint font-semibold transition-colors"
                >
                  Learn About Our Mission
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}