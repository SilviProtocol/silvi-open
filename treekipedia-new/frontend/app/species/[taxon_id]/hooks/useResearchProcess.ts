import { useState, useCallback, useRef, useEffect } from "react";
import { toast } from "sonner";
import { fundResearch } from "@/lib/api";
import { TreeSpecies } from "@/lib/types";

/**
 * Custom hook for managing the research funding process
 */
export function useResearchProcess(
  taxonId: string,
  species: TreeSpecies | undefined,
  address: string | undefined,
  refetchSpecies: () => Promise<any>,
  refetchResearch: () => Promise<any>
) {
  const [isResearching, setIsResearching] = useState(false);
  const [researchStatus, setResearchStatus] = useState<
    "idle" | "starting" | "processing" | "complete" | "error" | "timeout"
  >("idle");
  const [progressMessage, setProgressMessage] = useState("");
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const messageIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cycling research messages
  const researchMessages = [
    "Scanning the forest canopy...",
    "Consulting botanical references...",
    "Exploring native habitats...",
    "Analyzing growth patterns...",
    "Documenting ecological relationships...",
    "Examining soil preferences...",
    "Cataloging cultural significance...",
    "Mapping geographical distribution...",
    "Calculating conservation status...",
    "Determining stewardship practices..."
  ];

  // Start the research process
  const startResearch = useCallback(async () => {
    if (!species || !address || isResearching) return;

    setIsResearching(true);
    setResearchStatus("starting");

    try {
      // Use a randomly generated transaction hash for testing
      // In production, this would come from an actual blockchain transaction
      const transactionHash = `0x${Math.random().toString(16).substring(2, 42)}`;
      const tempIpfsCid = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
      const scientificName = species.species_scientific_name || species.species;

      setResearchStatus("processing");
      // Start cycling through messages
      let messageIndex = 0;
      messageIntervalRef.current = setInterval(() => {
        setProgressMessage(researchMessages[messageIndex % researchMessages.length]);
        messageIndex++;
      }, 3000);

      // Call the fundResearch API
      const response = await fundResearch(
        taxonId,
        address,
        "celo", // Default to Celo for now
        transactionHash,
        tempIpfsCid,
        scientificName
      );

      // Start polling for research completion
      startPollingForResearch();
    } catch (error: any) {
      setResearchStatus("error");
      console.error("Research error:", error);
      
      // Clear message interval
      if (messageIntervalRef.current) {
        clearInterval(messageIntervalRef.current);
      }
      
      // Show error to user
      toast.error(error.message || "Failed to start research");
      setIsResearching(false);
    }
  }, [taxonId, species, address, isResearching]);

  // Polling implementation with exponential backoff
  const startPollingForResearch = useCallback(() => {
    let attempts = 0;
    const maxAttempts = 20;
    const baseInterval = 3000; // Start with 3 seconds

    const pollForData = async () => {
      if (attempts >= maxAttempts) {
        // Clean up message cycling
        if (messageIntervalRef.current) {
          clearInterval(messageIntervalRef.current);
        }
        
        setResearchStatus("timeout");
        setIsResearching(false);
        toast.error("Research is taking longer than expected. Please check back later.");
        return;
      }

      attempts++;
      const backoffFactor = Math.min(1.5, 1 + attempts / 10); // Gradual backoff
      const nextInterval = baseInterval * backoffFactor;

      try {
        // Refetch both data sources
        const [speciesResult, researchResult] = await Promise.all([
          refetchSpecies(),
          refetchResearch(),
        ]);

        // Check if research completed
        const researchedFlag = speciesResult.data?.researched === true;
        const hasAiData = !!(
          researchResult.data?.general_description_ai ||
          speciesResult.data?.general_description_ai
        );

        if (researchedFlag || hasAiData) {
          // Clean up message cycling
          if (messageIntervalRef.current) {
            clearInterval(messageIntervalRef.current);
          }
          
          setResearchStatus("complete");
          setIsResearching(false);
          toast.success("Research completed successfully!");
          return;
        }

        // Schedule next poll with increasing interval
        pollIntervalRef.current = setTimeout(pollForData, nextInterval);
      } catch (error) {
        console.error("Polling error:", error);
        // Continue polling despite errors
        pollIntervalRef.current = setTimeout(pollForData, nextInterval);
      }
    };

    // Start polling after initial delay
    pollIntervalRef.current = setTimeout(pollForData, 2000);
  }, [refetchSpecies, refetchResearch]);

  // Clean up polling and message cycling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearTimeout(pollIntervalRef.current);
      }
      if (messageIntervalRef.current) {
        clearInterval(messageIntervalRef.current);
      }
    };
  }, []);

  return {
    isResearching,
    researchStatus,
    progressMessage,
    startResearch,
  };
}