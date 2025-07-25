'use client';

import Link from 'next/link';
import { PlotAnalysisResponse } from '@/lib/types';

interface ResultsListProps {
  results: PlotAnalysisResponse | null;
  isLoading: boolean;
  error: string | null;
}

export default function ResultsList({ results, isLoading, error }: ResultsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <p className="text-sm text-gray-600 text-center">
          Analyzing species data...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Analysis Error
              </h3>
              <p className="text-sm text-red-700 mt-1">
                {error}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No analysis yet
        </h3>
        <p className="text-sm text-gray-600">
          Draw a polygon on the map or upload a KML file to see species results
        </p>
      </div>
    );
  }

  const { species, totalSpecies, totalOccurrences } = results;

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-700">
              {totalSpecies.toLocaleString()}
            </div>
            <div className="text-sm text-green-600">Species Found</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-700">
              {totalOccurrences.toLocaleString()}
            </div>
            <div className="text-sm text-green-600">Total Occurrences</div>
          </div>
        </div>
      </div>

      {/* Species list */}
      {species.length > 0 ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <h3 className="text-sm font-medium text-gray-900 sticky top-0 bg-white py-2">
            Species List ({species.length})
          </h3>
          
          {species.map((item, index) => (
            <div
              key={`${item.taxon_id}-${index}`}
              className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/species/${item.taxon_id}`}
                    className="block hover:underline"
                  >
                    <h4 className="font-medium text-gray-900 text-sm leading-tight">
                      {item.scientific_name || 'Unknown species'}
                    </h4>
                    {item.common_name && (
                      <p className="text-xs text-gray-600 mt-1">
                        {item.common_name}
                      </p>
                    )}
                  </Link>
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {item.taxon_id}
                  </p>
                </div>
                
                <div className="text-right ml-4 flex-shrink-0">
                  <div className="text-sm font-medium text-blue-600">
                    {item.occurrences.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    occurrences
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-sm text-gray-600">
            No species found in the selected area
          </p>
        </div>
      )}

      {/* Export options */}
      {species.length > 0 && (
        <div className="border-t pt-4">
          <button
            onClick={() => {
              const csvContent = [
                'Scientific Name,Common Name,Taxon ID,Occurrences',
                ...species.map(s => `"${s.scientific_name || ''}","${s.common_name || ''}","${s.taxon_id}",${s.occurrences}`)
              ].join('\n');
              
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `species-analysis-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              window.URL.revokeObjectURL(url);
            }}
            className="w-full text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg transition-colors"
          >
            Export as CSV
          </button>
        </div>
      )}
    </div>
  );
}