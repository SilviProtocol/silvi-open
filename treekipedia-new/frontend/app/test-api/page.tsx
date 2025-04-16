"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import ApiTest from "@/components/api-test";
import { toast } from "react-hot-toast";

export default function TestApiPage() {
  // Test the search functionality directly on this page
  const [query, setQuery] = useState("oak");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("https://treekipedia-api.silvi.earth");

  const endpoints = [
    'http://167.172.143.162:3000',        // Original HTTP endpoint
    'https://treekipedia-api.silvi.earth' // New HTTPS endpoint
  ];

  useEffect(() => {
    // Run test when component mounts
    handleSearch();
  }, [selectedEndpoint]);

  const handleEndpointChange = (endpoint: string) => {
    setSelectedEndpoint(endpoint);
  };

  const handleSearch = async () => {
    if (!query) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${selectedEndpoint}/species/suggest?query=${encodeURIComponent(query)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'omit'
        }
      );
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      setResults(data);
      toast.success(`Found ${data.length} results using ${selectedEndpoint}`);
    } catch (err) {
      console.error("Search error:", err);
      setError(err instanceof Error ? err.message : String(err));
      toast.error(`Error: ${err instanceof Error ? err.message : String(err)}`);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div
          className="min-h-screen flex flex-col py-24"
        >
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold mb-8 text-white text-center">API Connection Test</h1>
            
            {/* Endpoint selector */}
            <div className="mb-8 max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold mb-4 text-white">Test Different Endpoints</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {endpoints.map((endpoint) => (
                  <button
                    key={endpoint}
                    onClick={() => handleEndpointChange(endpoint)}
                    className={`p-4 rounded-lg text-white text-left ${
                      selectedEndpoint === endpoint
                        ? "bg-emerald-600 border-2 border-emerald-400"
                        : "bg-gray-800/50 border border-white/10 hover:bg-gray-700/50"
                    }`}
                  >
                    <div className="font-medium text-sm mb-1">
                      {endpoint.includes('https') ? '🔒 HTTPS:' : '🌐 HTTP:'}
                    </div>
                    <code className="text-xs block truncate">{endpoint}</code>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Search test */}
            <div className="mb-8 bg-black/30 backdrop-blur-md p-6 rounded-xl border border-white/10 max-w-2xl mx-auto">
              <h2 className="text-xl font-semibold mb-4 text-white">Test Search Functionality</h2>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter search term..."
                  className="flex-1 px-4 py-2 rounded-lg bg-black/30 border border-white/20 text-white"
                />
                <button
                  onClick={handleSearch}
                  disabled={isLoading}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50"
                >
                  {isLoading ? "Searching..." : "Search"}
                </button>
              </div>
              
              {/* Search results */}
              <div className="mt-4">
                <div className="text-sm text-white/70 mb-2">
                  Status: {isLoading ? "Loading..." : error ? `Error: ${error}` : `Found ${results.length} results`}
                </div>
                
                {results.length > 0 && (
                  <div className="bg-black/20 rounded-lg p-4 max-h-96 overflow-y-auto border border-white/10">
                    <table className="w-full text-white">
                      <thead className="text-left text-xs uppercase text-emerald-400 border-b border-white/10">
                        <tr>
                          <th className="py-2">Common Name</th>
                          <th className="py-2">Scientific Name</th>
                          <th className="py-2">ID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {results.map((item, index) => (
                          <tr key={index} className="hover:bg-white/5">
                            <td className="py-2">{item.common_name}</td>
                            <td className="py-2 italic">{item.species}</td>
                            <td className="py-2 text-xs text-white/50">{item.taxon_id}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {error && (
                  <div className="bg-red-900/30 border border-red-700 p-4 rounded-lg text-white mt-4">
                    <h3 className="font-medium mb-1">Error Details</h3>
                    <pre className="text-xs overflow-auto">{error}</pre>
                  </div>
                )}
              </div>
            </div>
            
            {/* Original API Test Component */}
            <ApiTest />
          </div>
        </div>
      </main>
    </div>
  );
}