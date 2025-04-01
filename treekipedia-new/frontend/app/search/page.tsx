import { SearchForm } from "@/components/search-form";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import Link from "next/link";

export default function SearchPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div
          className="min-h-screen flex flex-col"
        >
          {/* Hero Section with Search */}
          <section className="relative w-full py-12 md:py-16 lg:py-20">
            <div className="container relative z-10 px-4 md:px-6 mx-auto">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-4">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-green-200 to-teal-300 animate-gradient-x">
                      The Open Encyclopedia of Trees
                    </span>
                  </h1>
                  <p className="mx-auto max-w-[700px] text-white/70 text-sm md:text-base">
                    Discover, search, and contribute to research about tree species around the world.
                  </p>
                </div>
                <div className="w-full max-w-2xl">
                  <SearchForm />
                </div>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="w-full py-24 md:py-32 backdrop-blur-md">
            <div className="container px-4 md:px-6 mx-auto">
              <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="h-16 w-16 rounded-full bg-emerald-500/20 backdrop-blur-md flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-8 w-8 text-emerald-300"
                    >
                      <path d="M17 14c-3 0-6-2-6-5a3 3 0 0 1 3-3c2 0 3 1 4 2-2-3-6-4-8-3a5 5 0 0 0-3 5c1 2 2 3 4 4 1 1 2 1 3 1" />
                      <path d="M14 13c3 3 3 6 1 8-1 1-3 2-5 1-1-1-1-2-1-3 0-2 1-3 2-4 1-2 3-2 3-2" />
                      <path d="M13 14c-3 3-6 3-8 1-1-1-2-3-1-5 1-1 2-1 3-1 2 0 3 1 4 2 2 1 2 3 2 3Z" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">Discover Tree Species</h3>
                    <p className="text-white/70">
                      Explore our extensive database of tree species from around the world.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="h-16 w-16 rounded-full bg-emerald-500/20 backdrop-blur-md flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-8 w-8 text-emerald-300"
                    >
                      <path d="M18 6h-5c-1.1 0-2 .9-2 2v8" />
                      <path d="M9 10a2 2 0 0 1-2 2H4" />
                      <path d="M11 14a2 2 0 0 0-2 2v2" />
                      <path d="M14 16a2 2 0 0 0-2 2v2" />
                      <path d="M17 12a2 2 0 0 0-2 2v2" />
                      <path d="M20 8a2 2 0 0 0-2 2v2" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">Fund Research</h3>
                    <p className="text-white/70">
                      Support scientific research by minting NFTs for undiscovered species.
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="h-16 w-16 rounded-full bg-emerald-500/20 backdrop-blur-md flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-8 w-8 text-emerald-300"
                    >
                      <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
                      <path d="M10 2c1 .5 2 2 2 5" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">Join the Treederboard</h3>
                    <p className="text-white/70">
                      Compete with other tree enthusiasts and climb the leaderboard.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Featured Species Section */}
          <section className="w-full py-12 md:py-24">
            <div className="container px-4 md:px-6 mx-auto">
              <div className="flex flex-col items-center justify-center space-y-8 text-center">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-300 via-green-200 to-teal-300">
                      Featured Species
                    </span>
                  </h2>
                  <p className="mx-auto max-w-[700px] text-white/70 md:text-xl">
                    Explore some of our most popular tree species
                  </p>
                </div>
                <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {[
                    {
                      name: "Giant Sequoia",
                      scientificName: "Sequoiadendron giganteum",
                      taxonId: "48513",
                    },
                    {
                      name: "Japanese Maple",
                      scientificName: "Acer palmatum",
                      taxonId: "48297",
                    },
                    {
                      name: "Baobab",
                      scientificName: "Adansonia",
                      taxonId: "59759",
                    },
                    {
                      name: "Weeping Willow",
                      scientificName: "Salix babylonica",
                      taxonId: "63772",
                    },
                  ].map((tree, index) => (
                    <Link
                      key={index}
                      href={`/species/${tree.taxonId}`}
                      className="group relative overflow-hidden rounded-lg bg-black/10 backdrop-blur-md border border-white/20 p-4 transition-colors hover:bg-black/20"
                    >
                      <div className="aspect-square overflow-hidden rounded-md bg-black/20 mb-3"></div>
                      <div className="p-2">
                        <h3 className="font-semibold text-white">{tree.name}</h3>
                        <p className="text-sm italic text-white/70">{tree.scientificName}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <Link 
                  href="/species"
                  className="px-6 py-3 bg-emerald-600/80 hover:bg-emerald-600 backdrop-blur-md rounded-xl text-white font-semibold transition-colors"
                >
                  View All Species
                </Link>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}