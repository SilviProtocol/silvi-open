import React from "react";
import { Info } from "lucide-react";
import { TreeSpecies } from "@/lib/types";
import { DataField } from "../DataField";
import { FieldDefinition } from "../../hooks/useFieldDefinitions";

interface ResearchDataTabProps {
  species: TreeSpecies;
  isResearched: boolean;
  getFieldValue: (fieldName: string) => { value: any; source: "human" | "ai" | "legacy" | null };
  fields: FieldDefinition[];
}

export function ResearchDataTab({ species, isResearched, getFieldValue, fields }: ResearchDataTabProps) {
  // Check how many fields have data
  const fieldsWithDataCount = fields.filter(field => {
    const { value } = getFieldValue(field.key);
    return !!value;
  }).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Research & Data</h2>
      </div>

      {isResearched ? (
        <div>
          {/* Research funding info */}
          <div className="p-4 rounded-lg bg-emerald-900/20 border border-emerald-500/20 mb-6">
            <h3 className="font-semibold text-emerald-300 mb-2">Research Status</h3>
            <p className="text-white/80 mb-2">
              This species has been researched using our AI research process. The data has been stored
              permanently on IPFS and is available to everyone in the tree knowledge commons.
            </p>
            {species.ipfs_cid && (
              <div className="mt-4 text-sm">
                <span className="text-white/60">IPFS CID: </span>
                <a 
                  href={`https://ipfs.io/ipfs/${species.ipfs_cid}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:text-emerald-300 break-all"
                >
                  {species.ipfs_cid}
                </a>
              </div>
            )}
          </div>

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
      ) : (
        <div className="p-6 text-center border border-white/10 rounded-lg bg-black/20">
          <div className="flex justify-center mb-4">
            <Info className="w-12 h-12 text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">No Research Data Available</h3>
          <p className="text-white/70 mb-6 max-w-md mx-auto">
            This species hasn't been researched yet. Fund research to generate comprehensive
            data and help build the tree knowledge commons.
          </p>
        </div>
      )}
    </div>
  );
}