import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { getSpeciesById, getResearchData } from "@/lib/api";
import { TreeSpecies, ResearchData } from "@/lib/types";

/**
 * Custom hook for fetching and managing species and research data
 * @param taxonId The ID of the species to fetch
 */
export function useSpeciesData(taxonId: string) {
  // Fetch species base data
  const speciesQuery = useQuery({
    queryKey: ["species", taxonId],
    queryFn: () => getSpeciesById(taxonId),
    staleTime: 10000, // Consider data fresh for 10 seconds
  });

  // Fetch research data (may not exist if species hasn't been researched)
  const researchQuery = useQuery({
    queryKey: ["research", taxonId],
    queryFn: () => getResearchData(taxonId),
    staleTime: 5000, // Consider research data fresh for only 5 seconds
    // Don't retry on 404 - it means research not available yet
    retry: (failureCount, error) => {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Determine if the species has been researched
  const isResearched = useMemo(() => {
    // ONLY check the explicit researched flag from the database
    // This is the source of truth and prevents treating species with
    // legacy content as being researched
    const hasResearchedFlag = speciesQuery.data?.researched === true;
    
    // Log debugging info without using it for the decision
    console.log(`Research detection check for ${taxonId}:`, {
      hasResearchedFlag,
      researchQueryStatus: researchQuery.status
    });
    
    // Only return true when the researched flag is explicitly set to true
    return hasResearchedFlag;
  }, [speciesQuery.data, researchQuery.status, taxonId]);

  // Helper for accessing field values with precedence:
  // 1. Human data (if available)
  // 2. AI data (if available)
  // 3. Legacy data (if available)
  const getFieldValue = useCallback(
    (fieldName: string): { value: any; source: "human" | "ai" | "legacy" | null } => {
      const humanField = `${fieldName}_human`;
      const aiField = `${fieldName}_ai`;
      let value = null;
      let source = null;

      // Check human data first (highest priority)
      if (
        speciesQuery.data?.[humanField as keyof TreeSpecies] ||
        researchQuery.data?.[humanField as keyof ResearchData]
      ) {
        value = speciesQuery.data?.[humanField as keyof TreeSpecies] || 
                researchQuery.data?.[humanField as keyof ResearchData];
        source = "human";
      }
      // Then check AI data
      else if (
        speciesQuery.data?.[aiField as keyof TreeSpecies] ||
        researchQuery.data?.[aiField as keyof ResearchData]
      ) {
        value = speciesQuery.data?.[aiField as keyof TreeSpecies] || 
                researchQuery.data?.[aiField as keyof ResearchData];
        source = "ai";
      }
      // Finally check legacy data (lowest priority)
      else if (speciesQuery.data?.[fieldName as keyof TreeSpecies]) {
        value = speciesQuery.data[fieldName as keyof TreeSpecies];
        source = "legacy";
      }

      return { value, source };
    },
    [speciesQuery.data, researchQuery.data]
  );

  // Helper to check if a specific field has been researched
  const isFieldResearched = useCallback(
    (fieldName: string): boolean => {
      const aiField = `${fieldName}_ai`;
      const humanField = `${fieldName}_human`;

      // Check if either AI or human data exists for this field
      const hasAiData = !!(
        (speciesQuery.data &&
          speciesQuery.data[aiField as keyof TreeSpecies] !== undefined &&
          speciesQuery.data[aiField as keyof TreeSpecies] !== null &&
          speciesQuery.data[aiField as keyof TreeSpecies] !== "" &&
          typeof speciesQuery.data[aiField as keyof TreeSpecies] === "string" &&
          (speciesQuery.data[aiField as keyof TreeSpecies] as string).trim() !== "") ||
        (researchQuery.data &&
          researchQuery.data[aiField as keyof ResearchData] !== undefined &&
          researchQuery.data[aiField as keyof ResearchData] !== null &&
          researchQuery.data[aiField as keyof ResearchData] !== "" &&
          typeof researchQuery.data[aiField as keyof ResearchData] === "string" &&
          (researchQuery.data[aiField as keyof ResearchData] as string).trim() !== "")
      );

      const hasHumanData = !!(
        (speciesQuery.data &&
          speciesQuery.data[humanField as keyof TreeSpecies] !== undefined &&
          speciesQuery.data[humanField as keyof TreeSpecies] !== null &&
          speciesQuery.data[humanField as keyof TreeSpecies] !== "" &&
          typeof speciesQuery.data[humanField as keyof TreeSpecies] === "string" &&
          (speciesQuery.data[humanField as keyof TreeSpecies] as string).trim() !== "") ||
        (researchQuery.data &&
          researchQuery.data[humanField as keyof ResearchData] !== undefined &&
          researchQuery.data[humanField as keyof ResearchData] !== null &&
          researchQuery.data[humanField as keyof ResearchData] !== "" &&
          typeof researchQuery.data[humanField as keyof ResearchData] === "string" &&
          (researchQuery.data[humanField as keyof ResearchData] as string).trim() !== "")
      );

      return hasAiData || hasHumanData;
    },
    [speciesQuery.data, researchQuery.data]
  );

  // Helper to count researched fields by category
  const getResearchFieldCount = useCallback(() => {
    // Define the categories to check
    const categoryFields = {
      overview: ["general_description"],
      geographic: ["elevation_ranges", "native_adapted_habitats"],
      ecological: ["conservation_status", "ecological_function", "habitat"],
      physical: [
        "growth_form", "leaf_type", "deciduous_evergreen", "flower_color",
        "fruit_type", "bark_characteristics", "maximum_height", "maximum_diameter",
        "lifespan", "maximum_tree_age"
      ],
      stewardship: [
        "stewardship_best_practices", "agroforestry_use_cases", "compatible_soil_types",
        "planting_recipes", "pruning_maintenance", "disease_pest_management",
        "fire_management", "cultural_significance"
      ]
    };

    const counts: {
      total: number;
      byCategory: Record<string, number>;
    } = {
      total: 0,
      byCategory: {
        overview: 0,
        geographic: 0,
        ecological: 0,
        physical: 0,
        stewardship: 0
      }
    };

    // Check each category
    Object.entries(categoryFields).forEach(([category, fields]) => {
      let categoryCount = 0;

      fields.forEach(field => {
        if (isFieldResearched(field)) {
          categoryCount++;
          counts.total++;
        }
      });

      counts.byCategory[category] = categoryCount;
    });

    return counts;
  }, [isFieldResearched]);

  return {
    species: speciesQuery.data,
    researchData: researchQuery.data,
    isLoading: speciesQuery.isLoading || researchQuery.isLoading,
    isError: speciesQuery.isError || researchQuery.isError,
    isResearched,
    getFieldValue,
    isFieldResearched,
    getResearchFieldCount,
    refetchSpecies: speciesQuery.refetch,
    refetchResearch: researchQuery.refetch
  };
}