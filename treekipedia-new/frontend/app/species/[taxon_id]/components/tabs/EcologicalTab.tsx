import React from "react";
import { AlertCircle } from "lucide-react";
import { TreeSpecies } from "@/lib/types";
import { DataField } from "../DataField";
import { FieldDefinition } from "../../hooks/useFieldDefinitions";
import { ConservationStatus } from "../display/ConservationStatus";

interface EcologicalTabProps {
  species: TreeSpecies;
  isResearched: boolean;
  getFieldValue: (fieldName: string) => { value: any; source: "human" | "ai" | "legacy" | null };
  fields: FieldDefinition[];
}

export function EcologicalTab({ species, isResearched, getFieldValue, fields }: EcologicalTabProps) {
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
  
  // Find conservation status field for special treatment
  const conservationStatusField = fields.find(f => f.key === "conservation_status");
  const { value: conservationStatus, source: conservationSource } = 
    conservationStatusField ? getFieldValue("conservation_status") : { value: null, source: null };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Ecological Characteristics</h2>
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
              Some ecological fields need research to be populated. Fund research with a small
              contribution to unlock detailed information about this species.
            </p>
          </div>
        </div>
      )}

      {/* Highlight conservation status if available */}
      {conservationStatus && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Conservation Status</h3>
          <ConservationStatus status={conservationStatus} source={conservationSource} />
        </div>
      )}

      {/* Fields display - skip conservation status as it's handled above */}
      <div className="space-y-4">
        {fields.filter(f => f.key !== "conservation_status").map((field) => (
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