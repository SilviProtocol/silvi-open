"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Search } from "lucide-react";

export function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  // const [preview, setPreview] = useState<TreeSpecies[]>([]);
  // const [isPreviewVisible, setIsPreviewVisible] = useState(false);
  // const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        router.push(`/species?q=${encodeURIComponent(query.trim())}`);
      } else {
        // Reset to default URL when query is empty
        router.push('/species');
      }
    }, 300);
  
    return () => clearTimeout(delayDebounceFn);
  }, [query, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/species?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/species');
    }
  };


  return (
    <div className="relative z-10 mb-8">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="max-w-2xl mx-auto w-full relative">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for any tree species..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full flex-grow px-6 py-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
            <button type="submit">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 w-6 h-6" />
            </button>
          </div>
          {/* {isPreviewVisible && preview.length > 0 && (
            <div
              ref={previewRef}
              className="absolute z-20 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto mt-1"
            >
              {preview.map((species) => (
                <div
                  key={species.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handlePreviewClick(species)}
                >
                  <p className="font-semibold text-left">{species.commonName}</p>
                  <p className="text-sm text-gray-600 italic text-left">
                    {species.scientificName}
                  </p>
                </div>
              ))}
            </div>
          )} */}
        </div>
      </form>
    </div>
  );
}
