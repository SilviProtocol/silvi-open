import { SearchForm } from "@/components/search-form";
import { SearchResults } from "@/components/search-results";
import { Navbar } from "@/components/navbar";

export default function SpeciesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-100 to-green-200">
      <Navbar />
      <main className="w-full min-h-screen bg-white">
        <div
          className="relative min-h-screen flex flex-col"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?auto=format&fit=crop&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="max-w-6xl mx-auto pt-6 px-4 w-full">
            <h1 className="text-xl md:text-4xl font-bold mb-6 text-white text-center">
              The Open Encyclopedia of Trees
            </h1>
            {/* <p className="text-md md:text-lg mb-8 text-white">
              Discover, explore, and contribute to the world&apos;s largest tree
              database
            </p> */}
            <SearchForm />
          </div>

          <div className="flex-1 mx-auto w-full max-w-6xl px-4 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4 sticky top-0">
              Search Results
            </h2>
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 overflow-auto max-h-[calc(100vh-220px)]">
              <SearchResults />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
