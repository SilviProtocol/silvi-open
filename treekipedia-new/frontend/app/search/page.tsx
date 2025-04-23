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
          <section className="relative w-full py-16 md:py-20 lg:py-24">
            <div className="container relative z-10 px-4 md:px-6 mx-auto">
              <div className="flex flex-col items-center justify-center space-y-8 text-center">
                {/* Logo and Subtitle Group */}
                <div className="flex flex-col items-center">
                  <img 
                    src="/treekipedialogo.svg" 
                    alt="Treekipedia" 
                    className="h-[90px] text-silvi-mint filter brightness-100 saturate-0 mb-2"
                    style={{ filter: 'brightness(0) saturate(100%) invert(98%) sepia(5%) saturate(401%) hue-rotate(53deg) brightness(103%) contrast(94%)' }}
                  />

                  {/* Subtitle directly below logo with minimal spacing */}
                  <div className="max-w-3xl">
                    <h1 className="text-4xl font-bold tracking-tighter">
                      <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-green-200 to-teal-300 animate-gradient-x">
                        The Tree Intelligence Commons
                      </span>
                    </h1>
                  </div>
                </div>
                
                {/* Search bar with more separation */}
                <div className="w-full max-w-2xl mt-6">
                  <SearchForm />
                </div>
              </div>
            </div>
          </section>
          
          {/* Features Section - Moved higher */}
          <section className="w-full py-8 md:py-12">
            <div className="container px-4 md:px-6 mx-auto">
              <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
                <div className="p-5 rounded-xl bg-black/30 backdrop-blur-md border border-white/20 text-white">
                  <div className="flex flex-col">
                    <div className="flex items-center mb-3">
                      <div className="text-5xl mr-3">🌳</div>
                      <h3 className="text-xl font-bold text-emerald-300">Discover Tree Species</h3>
                    </div>
                    <p className="text-white text-lg leading-relaxed">
                      Browse over 50,000 species with structured data on taxonomy, ecology, and habitat. Get the facts without digging through dense PDFs or scattered datasets.
                    </p>
                  </div>
                </div>
                
                <div className="p-5 rounded-xl bg-black/30 backdrop-blur-md border border-white/20 text-white">
                  <div className="flex flex-col">
                    <div className="flex items-center mb-3">
                      <div className="text-5xl mr-3">🧪</div>
                      <h3 className="text-xl font-bold text-emerald-300">Fund Research</h3>
                    </div>
                    <p className="text-white text-lg leading-relaxed">
                      Help fill the gaps. When a species is missing key info, you can fund AI-powered research with a Contreebution NFT. One click. New data. Real impact.
                    </p>
                  </div>
                </div>
                
                <div className="p-5 rounded-xl bg-black/30 backdrop-blur-md border border-white/20 text-white">
                  <div className="flex flex-col">
                    <div className="flex items-center mb-3">
                      <div className="text-5xl mr-3">🥇</div>
                      <h3 className="text-xl font-bold text-emerald-300">Climb the Treederboard</h3>
                    </div>
                    <p className="text-white text-lg leading-relaxed">
                      Every species you help research earns you points. Track your contributions and celebrate your place in the forest.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Intro Paragraph */}
          <section className="w-full py-8 md:py-10">
            <div className="container px-4 md:px-6 mx-auto">
              <div className="mx-auto max-w-3xl">
                <div className="p-5 rounded-xl bg-black/30 backdrop-blur-md border border-white/20 text-white">
                  <div className="flex flex-col">
                    <div className="flex items-center mb-3">
                      <div className="text-5xl mr-3">📚</div>
                      <h3 className="text-xl font-bold text-emerald-300">No paywalls. No gatekeeping.</h3>
                    </div>
                    <p className="text-white text-lg leading-relaxed">
                      Treekipedia is an open-source, AI-powered database of tree knowledge. It's built for land stewards, restoration practitioners, and anyone trying to understand which trees grow where, and why that matters.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>


          {/* What's Coming Section */}
          <section className="w-full py-10 md:py-12">
            <div className="container px-4 md:px-6 mx-auto">
              <div className="mx-auto max-w-3xl">
                <div className="p-5 rounded-xl bg-black/30 backdrop-blur-md border border-white/20 text-white">
                  <div className="flex flex-col">
                    <div className="flex items-center mb-3">
                      <div className="text-5xl mr-3">📍</div>
                      <h3 className="text-xl font-bold text-emerald-300">This is just the beginning.</h3>
                    </div>
                    <p className="text-white text-lg leading-relaxed mb-6">
                      Future versions will unlock collaborative editing, decentralized validation, open APIs, and integrations with climate and biodiversity platforms. We're building the infrastructure to make tree data usable, composable, and truly open.
                    </p>
                    <div className="flex justify-start">
                      <Link 
                        href="/about"
                        className="inline-flex px-6 py-3 bg-emerald-600/80 hover:bg-emerald-600 backdrop-blur-md rounded-xl text-white font-semibold transition-colors"
                      >
                        Learn About Our Mission
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}