"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useAccount } from 'wagmi';
import { toast } from "sonner";

export function SearchForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const { address } = useAccount();

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim()) {
        if (!address) {
          toast.error("Please connect your wallet to search");
          return;
        }
        router.push(`/species?q=${encodeURIComponent(query.trim())}`);
      } else {
        router.push('/species');
      }
    }, 300);
  
    return () => clearTimeout(delayDebounceFn);
  }, [query, router, address]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) {
      toast.error("Please connect your wallet to search");
      return;
    }
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
              placeholder={address ? "Search for any tree species..." : "Connect wallet to search..."}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full flex-grow px-6 py-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-white/70 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              disabled={!address}
            />
            <button 
              type="submit"
              disabled={!address}
            >
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 w-6 h-6" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
