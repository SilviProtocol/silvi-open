import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { TreeSpecies } from "@/lib/types";

interface SpeciesHeaderProps {
  species: TreeSpecies;
}

export function SpeciesHeader({ species }: SpeciesHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-3xl font-bold mb-2 italic">
        {species?.species_scientific_name || species?.species}
      </h1>
      <div className="text-xl text-white/80">
        <CommonNameDisplay commonNames={species?.common_name} />
      </div>
    </div>
  );
}

interface CommonNameDisplayProps {
  commonNames?: string;
}

export function CommonNameDisplay({ commonNames }: CommonNameDisplayProps) {
  const [expanded, setExpanded] = useState(false);

  if (!commonNames) return <span>No common names available</span>;

  // Function to process and deduplicate common names
  const processCommonNames = (names: string): { primary: string; others: string[] } => {
    // Split by semicolons and clean up
    const allNames = names
      .split(";")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    // Remove duplicates (case insensitive)
    const uniqueNames: string[] = [];
    const seenNames = new Set<string>();

    allNames.forEach((name) => {
      // Check if we've already seen this name (case-insensitive)
      const lowerName = name.toLowerCase();
      if (!seenNames.has(lowerName)) {
        seenNames.add(lowerName);
        uniqueNames.push(name);
      }
    });

    // Get primary name and other names
    const primary = uniqueNames.length > 0 ? uniqueNames[0] : "Unknown";
    const others = uniqueNames.slice(1);

    return { primary, others };
  };

  const { primary, others } = processCommonNames(commonNames);

  // If we have no additional names, just show the primary
  if (others.length === 0) {
    return <span>{primary}</span>;
  }

  // Character limit for collapsed view - adjust as needed
  const CHAR_LIMIT = 100;

  // Calculate display for collapsed view
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
      <div className="flex items-start gap-1">
        {expanded ? (
          // Show all names in a scrollable container when expanded
          <div className="w-full">
            <span className="font-medium">{primary}</span>
            <div className="mt-2 max-h-40 overflow-y-auto pr-2 text-white/70 scrollbar-thin scrollbar-thumb-emerald-900 scrollbar-track-transparent">
              {others.map((name, idx) => (
                <div key={idx} className="py-1 border-b border-white/10 last:border-0">
                  {name}
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Show limited names when collapsed
          <span>
            <span>{primary}</span>
            {visibleNames.slice(1).map((name, idx) => (
              <span key={idx} className="text-white/70">
                , {name}
              </span>
            ))}
            {hasMore && <span className="text-emerald-300">...</span>}
          </span>
        )}
      </div>

      {/* Only show toggle if we have more names */}
      {others.length > 3 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center text-emerald-400 hover:text-emerald-300 mt-1 text-sm transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              <span>Show Less</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              <span>Show All {others.length} Names</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}