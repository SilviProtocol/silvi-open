import React, { useState } from "react";
import { ChevronDown, ChevronUp, AlertCircle, Info } from "lucide-react";
import { FieldDefinition } from "../hooks/useFieldDefinitions";

interface DataFieldProps {
  field: FieldDefinition;
  getFieldValue: (fieldName: string) => { value: any; source: "human" | "ai" | "legacy" | null };
  isResearched: boolean;
  isFieldResearched: (fieldName: string) => boolean;
}

export function DataField({ field, getFieldValue, isResearched, isFieldResearched }: DataFieldProps) {
  const [expanded, setExpanded] = useState(false);
  const { value: fieldValue, source: fieldSource } = getFieldValue(field.key);

  // Helper method to format values based on type
  const formatValue = (value: any, type?: string): React.ReactNode => {
    if (value === undefined || value === null) {
      return <span className="text-white/50 italic">Not available</span>;
    }

    // Handle numeric values
    if (type === "numeric" && typeof value === "number") {
      return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }

    // Handle date values
    if (type === "date" && (typeof value === "string" || value instanceof Date)) {
      try {
        return new Date(value).toLocaleDateString();
      } catch (e) {
        return value;
      }
    }

    // Handle string values
    if (typeof value === "string") {
      if (field.isLongText && value.length > 300) {
        return expanded ? (
          <div>
            {value.split("\n").map((paragraph, i) => (
              <p key={i} className={i > 0 ? "mt-2" : ""}>
                {paragraph}
              </p>
            ))}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(false);
              }}
              className="mt-2 text-emerald-400 hover:text-emerald-300 flex items-center text-sm"
            >
              <ChevronUp className="w-4 h-4 mr-1" />
              Show Less
            </button>
          </div>
        ) : (
          <div>
            <p>{value.substring(0, 300)}...</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(true);
              }}
              className="text-emerald-400 hover:text-emerald-300 flex items-center text-sm"
            >
              <ChevronDown className="w-4 h-4 mr-1" />
              Show More
            </button>
          </div>
        );
      }

      // For normal-sized text, just return it with newlines preserved
      return value.split("\n").map((paragraph, i) => (
        <p key={i} className={i > 0 ? "mt-2" : ""}>
          {paragraph}
        </p>
      ));
    }

    // For other types, just convert to string
    return String(value);
  };

  // Special case for field not researched yet
  if (!fieldValue && field.hasAiHuman && !isFieldResearched(field.key)) {
    return (
      <div className="p-3 rounded-lg bg-black/30 border border-white/10">
        <h4 className="font-medium text-white/70 mb-2">{field.label}:</h4>
        <div className="text-white/50 italic flex items-center gap-2">
          {isResearched ? (
            <>
              <Info className="w-4 h-4 text-blue-400" />
              <span>Not available in research data</span>
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Awaiting research</span>
            </>
          )}
        </div>
      </div>
    );
  }

  // The main return for the component
  return (
    <div className="p-3 rounded-lg bg-black/30 border border-white/10">
      <h4 className="font-medium text-white/70 mb-2">{field.label}:</h4>

      {/* Display content with source indicators */}
      <div className={`text-white ${fieldSource === "ai" ? "bg-emerald-800/20 border-l-4 border-emerald-400 pl-3 py-1 rounded" : fieldSource === "human" ? "border-l-4 border-blue-400 pl-3 py-1 rounded" : ""}`}>
        {formatValue(fieldValue, field.type)}
      </div>
    </div>
  );
}