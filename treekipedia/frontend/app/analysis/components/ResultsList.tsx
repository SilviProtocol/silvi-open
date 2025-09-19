'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PlotAnalysisResponse } from '@/lib/types';
import { getTopCommonNames } from '@/utils/commonNames';
import CrossAnalysisSummary from './CrossAnalysisSummary';

interface ResultsListProps {
  results: PlotAnalysisResponse | null;
  isLoading: boolean;
  error: string | null;
}

interface CompactCommonNameProps {
  commonNames?: string;
}

function CompactCommonNameDisplay({ commonNames }: CompactCommonNameProps) {
  const [expanded, setExpanded] = useState(false);

  if (!commonNames) return <span className="text-xs text-white/50">No common names</span>;

  // Use the optimized common names function with shorter limits for compact display
  const optimizedNames = getTopCommonNames(commonNames, 6, 120);
  
  // Split by commas
  const allNames = optimizedNames
    .split(',')
    .map(name => name.trim())
    .filter(name => name.length > 0);
    
  if (allNames.length === 0) return <span className="text-xs text-white/50">No common names</span>;

  const primary = allNames[0];
  const others = allNames.slice(1);
  
  // Character limit for collapsed view in compact mode
  const CHAR_LIMIT = 60;
  
  let displayText = primary;
  let hasMore = false;
  let visibleNames = [primary];

  for (const name of others) {
    if (displayText.length + name.length + 2 > CHAR_LIMIT && !expanded) {
      hasMore = true;
      break;
    }
    displayText += ", " + name;
    visibleNames.push(name);
  }

  return (
    <div>
      {expanded ? (
        <div className="text-xs text-white/70">
          <div className="font-medium text-emerald-300">{primary}</div>
          {others.length > 0 && (
            <div className="mt-1 max-h-24 overflow-y-auto text-white/60 text-xs">
              {others.slice(0, 8).map((name, idx) => (
                <div key={idx} className="truncate">
                  {name}
                </div>
              ))}
              {others.length > 8 && <div className="text-white/50">...and {others.length - 8} more</div>}
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs text-white/70">
          <span className="font-medium text-emerald-300">{primary}</span>
          {visibleNames.slice(1).map((name, idx) => (
            <span key={idx}>
              <span className="text-white/50">, </span>
              <span>{name}</span>
            </span>
          ))}
          {hasMore && <span className="text-emerald-400">...</span>}
        </div>
      )}
      
      {/* Show expand/collapse button if we have multiple names */}
      {others.length > 1 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center text-emerald-400 hover:text-emerald-300 mt-1 text-xs transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3 mr-1" />
              <span>Less</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3 mr-1" />
              <span>More</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}

export default function ResultsList({ results, isLoading, error }: ResultsListProps) {
  const [sortBy, setSortBy] = useState<'occurrences' | 'native-first'>('occurrences');
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
        </div>
        <p className="text-white/80 text-center">
          Analyzing species data...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="bg-red-600/20 backdrop-blur-md border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center">
            <div className="text-red-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-white">
                Analysis Error
              </h3>
              <p className="text-sm text-white/80 mt-1">
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
        <div className="text-white/40 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">
          No analysis yet
        </h3>
        <p className="text-white/80">
          Draw a polygon on the map or upload a KML file to see species results
        </p>
      </div>
    );
  }

  const { species, totalSpecies, totalOccurrences } = results;

  // Sort species based on selected option
  const getSortedSpecies = () => {
    if (!species || species.length === 0) return [];

    const speciesCopy = [...species];

    if (sortBy === 'native-first') {
      return speciesCopy.sort((a, b) => {
        // First sort by native status priority
        const getStatusPriority = (status: string | undefined) => {
          if (status === 'native') return 0;
          if (status === 'introduced') return 1;
          return 2; // unknown
        };

        const priorityDiff = getStatusPriority(a.nativeStatus) - getStatusPriority(b.nativeStatus);
        if (priorityDiff !== 0) return priorityDiff;

        // Within same status, sort by occurrences (descending)
        return b.occurrences - a.occurrences;
      });
    }

    // Default: sort by occurrences (descending)
    return speciesCopy.sort((a, b) => b.occurrences - a.occurrences);
  };

  const sortedSpecies = getSortedSpecies();

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="bg-emerald-600/20 backdrop-blur-md border border-emerald-500/30 rounded-xl p-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-emerald-300">
              {totalSpecies.toLocaleString()}
            </div>
            <div className="text-sm text-white/80">Species Found</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-300">
              {totalOccurrences.toLocaleString()}
            </div>
            <div className="text-sm text-white/80">Total Occurrences</div>
          </div>
        </div>
      </div>

      {/* Cross-analysis summary */}
      {results.crossAnalysis && (
        <CrossAnalysisSummary
          crossAnalysis={results.crossAnalysis}
          totalSpecies={totalSpecies}
        />
      )}

      {/* Species list */}
      {species.length > 0 ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          <div className="sticky top-0 bg-black/30 backdrop-blur-md py-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-emerald-300">
              Species List ({species.length})
            </h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'occurrences' | 'native-first')}
              className="text-xs bg-black/40 border border-white/20 rounded-md px-2 py-1 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="occurrences">Most Occurrences</option>
              <option value="native-first">Native First</option>
            </select>
          </div>
          
          {sortedSpecies.map((item, index) => (
            <div
              key={`${item.taxon_id}-${index}`}
              className="border border-white/20 bg-black/20 backdrop-blur-md rounded-xl p-3 hover:bg-black/40 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/species/${item.taxon_id}`}
                    className="block hover:underline"
                  >
                    <h4 className="font-medium text-white text-sm leading-tight mb-1">
                      {item.scientific_name || 'Unknown species'}
                    </h4>
                    <div className="mt-1">
                      <CompactCommonNameDisplay commonNames={item.common_name} />
                    </div>
                  </Link>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <p className="text-xs text-white/50">
                      ID: {item.taxon_id}
                    </p>
                    {item.family && (
                      <p className="text-xs text-white/50">
                        Family: {item.family}
                      </p>
                    )}
                  </div>

                  {/* Status badges */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {/* Native status badge with percentage */}
                    {item.nativeStatus && (
                      <span className={`px-2 py-1 text-xs rounded-full border ${
                        item.nativeStatus === 'native'
                          ? 'bg-green-600/20 text-green-400 border-green-600/30' :
                        item.nativeStatus === 'introduced'
                          ? 'bg-orange-600/20 text-orange-400 border-orange-600/30' :
                        'bg-gray-600/20 text-gray-400 border-gray-600/30'
                      }`}>
                        {item.nativeStatus === 'native' ? '🏠 Native' :
                         item.nativeStatus === 'introduced' ? '🌍 Introduced' : '❓ Unknown'}
                        {item.nativePercentage !== undefined && (
                          <span className="ml-1 font-medium">
                            {item.nativePercentage}%
                          </span>
                        )}
                      </span>
                    )}

                    {/* Intact forest badge */}
                    {item.intactForestStatus === 'present' && (
                      <span className="px-2 py-1 text-xs rounded-full bg-green-600/20 text-green-400 border border-green-600/30">
                        🌲 Intact Forest
                      </span>
                    )}

                    {/* Commercial badge */}
                    {item.isCommercial && (
                      <span className="px-2 py-1 text-xs rounded-full bg-yellow-600/20 text-yellow-400 border border-yellow-600/30">
                        💰 Commercial
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="text-right ml-4 flex-shrink-0">
                  <div className="text-sm font-medium text-emerald-300">
                    {item.occurrences.toLocaleString()}
                  </div>
                  <div className="text-xs text-white/70">
                    occurrences
                  </div>
                  {item.tile_count && (
                    <div className="text-xs text-white/50 mt-1">
                      {item.tile_count} tiles
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6">
          <div className="text-white/40 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <p className="text-white/80">
            No species found in the selected area
          </p>
        </div>
      )}

      {/* Export options */}
      {species.length > 0 && (
        <div className="border-t border-white/20 pt-4">
          <button
            onClick={() => {
              const csvContent = [
                'Scientific Name,Common Name,Family,Genus,Taxon ID,Occurrences,Tile Count',
                ...species.map(s => `"${s.scientific_name || ''}","${s.common_name || ''}","${s.family || ''}","${s.genus || ''}","${s.taxon_id}",${s.occurrences},${s.tile_count || ''}`)
              ].join('\n');
              const blob = new Blob([csvContent], { type: 'text/csv' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `species-analysis-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              window.URL.revokeObjectURL(url);
            }}
            className="w-full px-6 py-3 bg-emerald-600/80 hover:bg-emerald-600 backdrop-blur-md rounded-xl text-white font-semibold transition-colors"
          >
            Export as CSV
          </button>
        </div>
      )}
    </div>
  );
}