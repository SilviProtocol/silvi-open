'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { PlotAnalysisResponse } from '@/lib/types';

// Import components - Map dynamically to avoid SSR issues with Leaflet
const Map = dynamic(() => import('./components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-black/30">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div>
        <p className="text-white/80">Loading map...</p>
      </div>
    </div>
  )
});

import FileUpload from './components/FileUpload';
import ResultsList from './components/ResultsList';

export default function AnalysisPage() {
  const [analysisResults, setAnalysisResults] = useState<PlotAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysisComplete = (results: PlotAnalysisResponse) => {
    setAnalysisResults(results);
    setError(null);
  };

  const handleAnalysisError = (errorMessage: string) => {
    setError(errorMessage);
    setAnalysisResults(null);
  };

  const handleLoadingChange = (loading: boolean) => {
    setIsLoading(loading);
  };

  const clearResults = () => {
    setAnalysisResults(null);
    setError(null);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center mb-3">
              <div className="text-5xl mr-3">🗺️</div>
              <h1 className="text-4xl font-bold text-white">
                Species Analysis
              </h1>
            </div>
            <p className="text-white/80 text-lg leading-relaxed">
              Draw a polygon on the map or upload a KML file to discover species in that area
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map column - takes up 2/3 on large screens */}
          <div className="lg:col-span-2">
            <div className="rounded-xl bg-black/30 backdrop-blur-md border border-white/20">
              <div className="p-5 border-b border-white/20">
                <h2 className="text-xl font-bold text-emerald-300 mb-2">
                  Interactive Map
                </h2>
                <p className="text-white/80">
                  Draw a polygon to analyze species in that area
                </p>
              </div>
              <div className="h-[600px] rounded-b-xl overflow-hidden">
                <Map
                  onAnalysisComplete={handleAnalysisComplete}
                  onAnalysisError={handleAnalysisError}
                  onLoadingChange={handleLoadingChange}
                  onClear={clearResults}
                />
              </div>
            </div>
          </div>

          {/* Sidebar column - takes up 1/3 on large screens */}
          <div className="space-y-6">
            {/* File Upload */}
            <div className="rounded-xl bg-black/30 backdrop-blur-md border border-white/20">
              <div className="p-5 border-b border-white/20">
                <h2 className="text-xl font-bold text-emerald-300 mb-2">
                  KML Upload
                </h2>
                <p className="text-white/80">
                  Upload a KML file to analyze species in those boundaries
                </p>
              </div>
              <div className="p-5">
                <FileUpload
                  onAnalysisComplete={handleAnalysisComplete}
                  onAnalysisError={handleAnalysisError}
                  onLoadingChange={handleLoadingChange}
                />
              </div>
            </div>

            {/* Results */}
            <div className="rounded-xl bg-black/30 backdrop-blur-md border border-white/20">
              <div className="p-5 border-b border-white/20">
                <h2 className="text-xl font-bold text-emerald-300 mb-2">
                  Analysis Results
                </h2>
                {analysisResults && (
                  <p className="text-white/80">
                    {analysisResults.totalSpecies} species found with{' '}
                    {analysisResults.totalOccurrences.toLocaleString()} total occurrences
                  </p>
                )}
              </div>
              <div className="p-5">
                <ResultsList
                  results={analysisResults}
                  isLoading={isLoading}
                  error={error}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}