import React from "react";
import { Leaf, AlertCircle } from "lucide-react";
import { TreeSpecies } from "@/lib/types";
import { DataField } from "../DataField";
import { FieldDefinition } from "../../hooks/useFieldDefinitions";
import { Button } from "@/components/ui/button";
import { ImageCarousel } from "../ImageCarousel";

interface OverviewTabProps {
  species: TreeSpecies;
  isResearched: boolean;
  getFieldValue: (fieldName: string) => { value: any; source: "human" | "ai" | "legacy" | null };
  fields: FieldDefinition[];
}

export function OverviewTab({ species, isResearched, getFieldValue, fields }: OverviewTabProps) {
  // Get general description field
  const generalDescriptionField = fields.find(
    (field) => field.key === "general_description"
  );

  // Get other taxonomy fields
  const taxonomyFields = fields.filter(
    (field) => field.key !== "species_scientific_name" && 
               field.key !== "common_name" && 
               field.key !== "general_description"
  );

  // Get description data
  const { value: descriptionValue, source: descriptionSource } = generalDescriptionField
    ? getFieldValue("general_description")
    : { value: null, source: null };

  return (
    <div>
      <div className="space-y-6">
        {/* Species Images Carousel */}
        <ImageCarousel taxonId={species.taxon_id} />
        
        {/* General Description - Special treatment */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Leaf className="w-5 h-5 mr-2 text-green-400" />
            General Description
          </h2>
          <div className="p-4 rounded-lg bg-black/30 backdrop-blur-md border border-white/10">
            {descriptionValue ? (
              <div
                className={`text-white leading-relaxed ${
                  descriptionSource === "ai"
                    ? "bg-emerald-800/20 border-l-4 border-emerald-400 pl-3 py-1 rounded"
                    : descriptionSource === "human"
                    ? "border-l-4 border-blue-400 pl-3 py-1 rounded"
                    : ""
                }`}
              >
                {typeof descriptionValue === "string" &&
                  descriptionValue.split("\n").map((paragraph, idx) => (
                    <p key={idx} className={idx > 0 ? "mt-2" : ""}>
                      {paragraph}
                    </p>
                  ))}
              </div>
            ) : (
              <div className="text-white/50 italic flex items-center gap-2">
                {isResearched ? (
                  <>No description available</>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>Awaiting research</span>
                  </>
                )}
              </div>
            )}

            {/* Show research needed message if no content available */}
            {!descriptionValue && !isResearched && (
              <div className="flex items-start gap-3 text-white/70 mt-4">
                <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p>
                  This species needs research. Fund research to generate a detailed description using
                  AI. Your contribution helps build the Treekipedia knowledge commons.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Taxonomy Information */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Taxonomy & Classification</h2>
          <div className="space-y-3">
            {taxonomyFields.map((field) => (
              <DataField
                key={field.key}
                field={field}
                getFieldValue={getFieldValue}
                isResearched={isResearched}
                isFieldResearched={() => true} // These fields aren't researched
              />
            ))}
          </div>
        </div>

        {/* Research Status Card */}
        {!isResearched && (
          <div className="p-4 rounded-lg bg-amber-900/30 border border-amber-500/30">
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-amber-400" />
              Research Status
            </h3>
            <p className="text-white/80 mb-4">
              This species hasn't been researched yet. Fund research to unlock detailed information
              and help build the tree knowledge commons.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}