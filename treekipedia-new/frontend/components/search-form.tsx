"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useAccount } from 'wagmi';
import { toast } from "react-hot-toast";
import { getSpeciesSuggestions } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

export function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const { isConnected } = useAccount();
  const [isFocused, setIsFocused] = useState(false);

  const { data: suggestions = [] } = useQuery<string[]>({
    queryKey: ["suggestions", query],
    queryFn: () => getSpeciesSuggestions(query),
    enabled: !!query && query.length >= 2 && isFocused,
  });

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        if (!isConnected) {
          toast.error("Please connect your wallet to search");
          return;
        }
        router.push(`/species?q=${encodeURIComponent(query.trim())}`);
      } else {
        router.push('/species');
      }
    }, 300);
  
    return () => clearTimeout(delayDebounceFn);
  }, [query, router, isConnected]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected) {
      toast.error("Please connect your wallet to search");
      return;
    }
    if (query.trim()) {
      router.push(`/species?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push('/species');
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    router.push(`/species?q=${encodeURIComponent(suggestion)}`);
  };

  return (
    <div className="relative z-10 mb-8">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="max-w-2xl mx-auto w-full relative">
          <div className="relative">
            <input
              type="text"
              placeholder={isConnected ? "Search for any tree species..." : "Connect wallet to search..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              className="w-full flex-grow px-6 py-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              disabled={!isConnected}
            />
            <button 
              type="submit"
              disabled={!isConnected}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <Search className="text-white/70 w-6 h-6" />
            </button>
          </div>

          {/* Suggestions dropdown */}
          {isFocused && query.length >= 2 && suggestions.length > 0 && (
            <div className="absolute top-full mt-1 w-full bg-white rounded-md shadow-lg max-h-60 overflow-auto z-20">
              <ul>
                {suggestions.map((suggestion, index) => (
                  <li 
                    key={index}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-gray-800"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}