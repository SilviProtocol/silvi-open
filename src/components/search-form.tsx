"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Search } from "lucide-react";

export function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
 

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
        </div>
      </form>
    </div>
  );
}
