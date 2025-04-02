"use client";

import { useState } from "react";

export default function ApiTest() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiUrls = [
    'http://167.172.143.162:3000',        // Direct IP HTTP - Original working endpoint
    'https://167.172.143.162:3000',       // Direct IP HTTPS - Has SSL certificate issues
    'http://treekipedia-api.silvi.earth', // Domain HTTP - Should redirect to HTTPS
    'https://treekipedia-api.silvi.earth' // Domain HTTPS - Preferred secure endpoint
  ];
  
  // Show recommendations based on test results
  const getRecommendations = () => {
    if (results['https://treekipedia-api.silvi.earth']?.status === 'Success') {
      return (
        <div className="mt-6 p-4 bg-emerald-600/20 border border-emerald-400/30 rounded-lg text-white">
          <h3 className="font-bold mb-2">✅ Recommendation</h3>
          <p className="mb-2">Use the following secure API URL:</p>
          <code className="block p-2 bg-black/40 rounded">const API_URL = 'https://treekipedia-api.silvi.earth';</code>
          <p className="mt-3 text-sm text-emerald-300">SSL is correctly configured and working!</p>
        </div>
      );
    } else if (results['http://167.172.143.162:3000']?.status === 'Success') {
      return (
        <div className="mt-6 p-4 bg-yellow-600/20 border border-yellow-400/30 rounded-lg text-white">
          <h3 className="font-bold mb-2">⚠️ Fallback Recommendation</h3>
          <p className="mb-2">The direct IP endpoint is still working but not secure:</p>
          <code className="block p-2 bg-black/40 rounded">const API_URL = 'http://167.172.143.162:3000';</code>
          <p className="mt-3 text-sm text-yellow-300">The HTTPS endpoint should be used when possible.</p>
        </div>
      );
    }
    return null;
  };

  const testEndpoint = async (baseUrl: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Test the root endpoint
      const response = await fetch(`${baseUrl}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Update results
      setResults(prev => ({
        ...prev,
        [baseUrl]: {
          status: 'Success',
          data
        }
      }));
    } catch (err) {
      console.error(`Error testing ${baseUrl}:`, err);
      
      // Update results with error
      setResults(prev => ({
        ...prev,
        [baseUrl]: {
          status: 'Error',
          error: err instanceof Error ? err.message : String(err)
        }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const testAllEndpoints = () => {
    // Reset results
    setResults({});
    
    // Test each API URL
    apiUrls.forEach(url => {
      testEndpoint(url);
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-white/10 backdrop-blur-md border border-white/20 rounded-xl">
      <h1 className="text-2xl font-bold mb-4 text-white">API Connection Test</h1>
      
      <div className="mb-6">
        <button
          onClick={testAllEndpoints}
          disabled={isLoading}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50"
        >
          {isLoading ? 'Testing...' : 'Test All API Endpoints'}
        </button>
      </div>
      
      <div className="space-y-4">
        {apiUrls.map(url => (
          <div key={url} className="p-4 border border-white/10 rounded-lg bg-black/30">
            <h2 className="font-semibold mb-2 text-emerald-300">{url}</h2>
            
            {results[url] ? (
              <div>
                <div className={`mb-2 font-medium ${
                  results[url].status === 'Success' ? 'text-green-400' : 'text-red-400'
                }`}>
                  Status: {results[url].status}
                </div>
                
                {results[url].status === 'Success' ? (
                  <pre className="p-2 bg-black/50 rounded overflow-auto text-sm text-gray-300">
                    {JSON.stringify(results[url].data, null, 2)}
                  </pre>
                ) : (
                  <div className="text-red-300">{results[url].error}</div>
                )}
              </div>
            ) : (
              <div className="text-gray-400">Click "Test All API Endpoints" to test</div>
            )}
          </div>
        ))}
        
        {/* Show recommendations based on test results */}
        {getRecommendations()}
      </div>
    </div>
  );
}