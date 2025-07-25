'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { PlotAnalysisResponse } from '@/lib/types';

// Import components - Map dynamically to avoid SSR issues with Leaflet
const Map = dynamic(() => import('./components/Map'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">Loading map...</p>
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Species Analysis
            </h1>
            <p className="mt-2 text-gray-600">
              Draw a polygon on the map or upload a KML file to discover species in that area
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map column - takes up 2/3 on large screens */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-medium text-gray-900">
                  Interactive Map
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Draw a polygon to analyze species in that area
                </p>
              </div>
              <div className="h-[600px]">
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
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-medium text-gray-900">
                  KML Upload
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Upload a KML file to analyze species in those boundaries
                </p>
              </div>
              <div className="p-4">
                <FileUpload
                  onAnalysisComplete={handleAnalysisComplete}
                  onAnalysisError={handleAnalysisError}
                  onLoadingChange={handleLoadingChange}
                />
              </div>
            </div>

            {/* Results */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-medium text-gray-900">
                  Analysis Results
                </h2>
                {analysisResults && (
                  <p className="text-sm text-gray-500 mt-1">
                    {analysisResults.totalSpecies} species found with{' '}
                    {analysisResults.totalOccurrences.toLocaleString()} total occurrences
                  </p>
                )}
              </div>
              <div className="p-4">
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