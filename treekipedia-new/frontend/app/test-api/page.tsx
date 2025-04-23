"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import ApiTest from "@/components/api-test";
import { toast } from "react-hot-toast";
import { getSpeciesById, getResearchData } from "@/lib/api";

export default function TestApiPage() {
  // Test the search functionality directly on this page
  const [query, setQuery] = useState("oak");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>("https://treekipedia-api.silvi.earth");
  const [researchFlagTest, setResearchFlagTest] = useState<any>(null);

  const endpoints = [
    'http://167.172.143.162:3000',        // Original HTTP endpoint
    'https://treekipedia-api.silvi.earth' // New HTTPS endpoint
  ];

  useEffect(() => {
    // Run test when component mounts
    handleSearch();
  }, [selectedEndpoint]);
  
  // Test the researched flag detection logic
  useEffect(() => {
    async function testResearchedFlag() {
      try {
        // Test with a known researched species: Plumeria rubra
        const taxonId = 'AngMaGepc37897-00' // Plumeria rubra taxon ID
        
        console.log('Testing researched flag detection logic for Plumeria rubra (taxon_id: AngMaGepc37897-00)')
        
        // Fetch species data
        const speciesData = await getSpeciesById(taxonId)
        console.log('Species data researched flag:', speciesData.researched)
        
        // Fetch research data
        let researchData
        try {
          researchData = await getResearchData(taxonId)
          console.log('Research data retrieved successfully')
        } catch (err) {
          console.log('Research data not found or error')
          researchData = null
        }
        
        // Determine if research flag is set correctly
        const hasResearchedFlag = speciesData?.researched === true
        
        // Set results for display
        setResearchFlagTest({
          taxonId,
          speciesName: speciesData?.species_scientific_name || speciesData?.species,
          hasResearchedFlag,
          speciesDataResearched: speciesData?.researched,
          hasResearchData: !!researchData,
          researchFieldsPopulated: researchData ? 
            Object.keys(researchData).filter(key => 
              key.endsWith('_ai') && 
              researchData[key] !== null && 
              researchData[key] !== undefined && 
              researchData[key] !== ''
            ).length : 0
        })
        
        toast.success('Research flag test completed')
      } catch (err) {
        console.error('Error testing researched flag:', err)
        setResearchFlagTest({ error: err.message })
        toast.error('Error testing researched flag')
      }
    }
    
    testResearchedFlag()
  }, [])

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
            
            {/* Research Flag Test Results */}
            {researchFlagTest && (
              <div className="mb-8 bg-black/30 backdrop-blur-md p-6 rounded-xl border border-white/10 max-w-2xl mx-auto">
                <h2 className="text-xl font-semibold mb-4 text-white">Research Flag Detection Test</h2>
                
                {researchFlagTest.error ? (
                  <div className="bg-red-900/30 border border-red-700 p-4 rounded-lg text-white">
                    <h3 className="font-medium mb-1">Error</h3>
                    <pre className="text-xs overflow-auto">{researchFlagTest.error}</pre>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-black/40 p-4 rounded-lg">
                        <div className="text-sm text-emerald-400 mb-1">Species</div>
                        <div className="font-medium text-white">{researchFlagTest.speciesName}</div>
                        <div className="text-xs text-white/50">ID: {researchFlagTest.taxonId}</div>
                      </div>
                      
                      <div className="bg-black/40 p-4 rounded-lg">
                        <div className="text-sm text-emerald-400 mb-1">Researched Flag</div>
                        <div className="font-medium text-white">
                          {researchFlagTest.hasResearchedFlag ? 
                            '✅ TRUE' : 
                            '❌ FALSE'
                          }
                        </div>
                        <div className="text-xs text-white/50">
                          Raw Value: {String(researchFlagTest.speciesDataResearched)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-black/40 p-4 rounded-lg">
                      <div className="text-sm text-emerald-400 mb-1">Research Data</div>
                      <div className="font-medium text-white">
                        {researchFlagTest.hasResearchData ? 
                          `✅ FOUND (${researchFlagTest.researchFieldsPopulated} AI fields populated)` : 
                          '❌ NOT FOUND'
                        }
                      </div>
                    </div>
                    
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <div className="text-sm text-white mb-1">Detection Logic Analysis</div>
                      <div className="text-white/80">
                        {researchFlagTest.hasResearchedFlag ? 
                          "This species will show as RESEARCHED because the database flag is set to TRUE." :
                          "This species will show as NOT RESEARCHED because the database flag is NOT set to TRUE, even if it has research data."
                        }
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Original API Test Component */}
            <ApiTest />
          </div>
        </div>
      </main>
    </div>
  );
}