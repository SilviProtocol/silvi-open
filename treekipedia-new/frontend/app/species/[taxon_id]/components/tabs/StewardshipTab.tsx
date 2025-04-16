import React from "react";
import { AlertCircle } from "lucide-react";
import { TreeSpecies } from "@/lib/types";
import { DataField } from "../DataField";
import { FieldDefinition } from "../../hooks/useFieldDefinitions";

interface StewardshipTabProps {
  species: TreeSpecies;
  isResearched: boolean;
  getFieldValue: (fieldName: string) => { value: any; source: "human" | "ai" | "legacy" | null };
  fields: FieldDefinition[];
}

export function StewardshipTab({ species, isResearched, getFieldValue, fields }: StewardshipTabProps) {
  // Check if we have AI/human researched fields in this category
  const hasResearchableFields = fields.some(field => field.hasAiHuman);
  
  // Count how many researched fields we have
  const researchedFieldsCount = fields.filter(field => {
    if (!field.hasAiHuman) return false;
    const { value } = getFieldValue(field.key);
    return !!value;
  }).length;
  
  // Calculate the total number of researched fields
  const totalResearchableFields = fields.filter(field => field.hasAiHuman).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Stewardship & Utility</h2>
        {hasResearchableFields && (
          <div className={`px-3 py-1 ${
            isResearched && researchedFieldsCount > 0 
              ? "bg-emerald-500/20 text-emerald-300" 
              : "bg-amber-500/20 text-amber-300"
            } rounded-full text-xs flex items-center gap-1`}
          >
            {isResearched && researchedFieldsCount > 0 ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                {researchedFieldsCount}/{totalResearchableFields} Fields Researched
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3" />
                Needs Research
              </>
            )}
          </div>
        )}
      </div>

      {/* Research Needed Banner */}
      {hasResearchableFields && !isResearched && (
        <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-500/30 mb-6 flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-300 mb-1">Research Needed</h3>
            <p className="text-white/80">
              Stewardship and utility information needs research to be populated. Fund research with a small
              contribution to unlock practical insights about this species.
            </p>
          </div>
        </div>
      )}

      {/* Fields display */}
      <div className="space-y-4">
        {fields.map((field) => (
          <DataField
            key={field.key}
            field={field}
            getFieldValue={getFieldValue}
            isResearched={isResearched}
            isFieldResearched={(fieldName) => {
              const { value } = getFieldValue(fieldName);
              return !!value;
            }}
          />
        ))}
      </div>
    </div>
  );
}