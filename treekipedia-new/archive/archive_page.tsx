"use client";

import { Button } from "@/components/ui/button";
import { ResearchData, ResearchPayload, TreeSpecies } from "@/lib/types";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ArrowLeft, Leaf, Info, AlertCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import React, { useState, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import toast from "react-hot-toast";
import { fundResearch } from "@/lib/api";

const SpeciesDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const taxon_id = params.taxon_id as string;
  console.log("taxon_id:", taxon_id);
  const { address } = useAccount();
  console.log("address:", address);
  
  // Organize fields using the REVISED TREEPAGE.md structure
  const overviewFields = [
    { label: "Scientific Name", key: "species_scientific_name" },
    { label: "Common Name", key: "common_name" },
    { label: "General Description", key: "general_description", hasAiHuman: true },
    { label: "Accepted Scientific Name", key: "accepted_scientific_name" },
    { label: "Common Countries", key: "common_countries" },
    { label: "Taxon ID", key: "taxon_id" },
    { label: "Family", key: "family" },
    { label: "Genus", key: "genus" },
    { label: "Subspecies", key: "subspecies" },
    { label: "Specific Epithet", key: "specific_epithet" },
    { label: "Synonyms", key: "synonyms" },
    { label: "Taxonomic Order", key: "taxonomic_order" },
    { label: "Class", key: "class" }
  ];
  
  const geographicFields = [
    { label: "Biomes", key: "biomes" },
    { label: "Bioregions", key: "bioregions" },
    { label: "Ecoregions", key: "ecoregions" },
    { label: "Countries Introduced", key: "countries_introduced" },
    { label: "Countries Invasive", key: "countries_invasive" },
    { label: "Countries Native", key: "countries_native" },
    { label: "Elevation Ranges", key: "elevation_ranges", hasAiHuman: true }
  ];
  
  const ecologicalFields = [
    { label: "Ecological Function", key: "ecological_function", hasAiHuman: true },
    { label: "Conservation Status", key: "conservation_status", hasAiHuman: true },
    { label: "National Conservation Status", key: "national_conservation_status" },
    { label: "Habitat", key: "habitat", hasAiHuman: true },
    { label: "Native Adapted Habitats", key: "native_adapted_habitats", hasAiHuman: true },
    { label: "Forest Type", key: "forest_type" },
    { label: "Wetland Type", key: "wetland_type" },
    { label: "Urban Setting", key: "urban_setting" },
    { label: "Climate Change Vulnerability", key: "climate_change_vulnerability" },
    { label: "Associated Species", key: "associated_species" },
    { label: "Successional Stage", key: "successional_stage" },
    { label: "Tolerances", key: "tolerances" },
    { label: "Forest Layers", key: "forest_layers" },
    { label: "Threats", key: "threats" }
  ];
  
  const physicalFields = [
    { label: "Growth Form", key: "growth_form", hasAiHuman: true },
    { label: "Leaf Type", key: "leaf_type", hasAiHuman: true },
    { label: "Deciduous/Evergreen", key: "deciduous_evergreen", hasAiHuman: true },
    { label: "Flower Color", key: "flower_color", hasAiHuman: true },
    { label: "Fruit Type", key: "fruit_type", hasAiHuman: true },
    { label: "Bark Characteristics", key: "bark_characteristics", hasAiHuman: true },
    { label: "Maximum Height (m)", key: "maximum_height", hasAiHuman: true },
    { label: "Maximum Diameter (m)", key: "maximum_diameter", hasAiHuman: true },
    { label: "Lifespan", key: "lifespan", hasAiHuman: true },
    { label: "Maximum Tree Age (Years)", key: "maximum_tree_age", hasAiHuman: true },
    { label: "Allometric Models", key: "allometric_models" },
    { label: "Allometric Curve", key: "allometric_curve" }
  ];
  
  const stewardshipFields = [
    { label: "Stewardship Best Practices", key: "stewardship_best_practices", hasAiHuman: true },
    { label: "Agroforestry Use Cases", key: "agroforestry_use_cases", hasAiHuman: true },
    { label: "Compatible Soil Types", key: "compatible_soil_types", hasAiHuman: true },
    { label: "Planting Recipes", key: "planting_recipes", hasAiHuman: true },
    { label: "Pruning & Maintenance", key: "pruning_maintenance", hasAiHuman: true },
    { label: "Disease & Pest Management", key: "disease_pest_management", hasAiHuman: true },
    { label: "Fire Management", key: "fire_management", hasAiHuman: true },
    { label: "Cultural Significance", key: "cultural_significance", hasAiHuman: true },
    { label: "Timber Value", key: "timber_value" },
    { label: "Non-Timber Products", key: "non_timber_products" },
    { label: "Cultivars", key: "cultivars" },
    { label: "Nutritional/Caloric Value", key: "nutritional_caloric_value" },
    { label: "Cultivation Details", key: "cultivation_details" }
  ];
  
  const researchDataFields = [
    { label: "Total Occurrences", key: "total_occurrences" },
    { label: "Verification Status", key: "verification_status" },
    { label: "Data Sources", key: "data_sources" },
    { label: "Reference List", key: "reference_list" },
    { label: "IPFS CID", key: "ipfs_cid" },
    { label: "Last Updated", key: "last_updated_date" }
  ];
  
  // Tabs for better organization
  const [activeTab, setActiveTab] = useState('overview');
  const [isResearchFunding, setIsResearchFunding] = useState(false);
  
  // Get species data
  const {
    data: species,
    isLoading,
    isError,
    refetch: refetchSpecies
  } = useQuery<TreeSpecies>({
    queryKey: ["species", taxon_id],
    queryFn: async () => {
      if (!taxon_id) throw new Error("No taxon_id provided");
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://treekipedia-api.silvi.earth'}/species/${taxon_id}`
      );
      return data;
    },
    enabled: !!taxon_id, // Only run query if taxon_id exists
    staleTime: 10000, // Consider data fresh for 10 seconds
  });

  const {
    data: researchData,
    isLoading: isResearchLoading,
    refetch: refetchResearch,
  } = useQuery<ResearchData>({
    queryKey: ["research", taxon_id],
    queryFn: async () => {
      if (!taxon_id)
        throw new Error("No taxon_id available");
      const { data } = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://treekipedia-api.silvi.earth'}/research/research/${taxon_id}`
      );
      return data;
    },
    enabled: !!taxon_id,
    staleTime: 5000, // Consider research data fresh for only 5 seconds
    retry: 2, // Retry failed requests twice
    // If we get a 404 for research data, it's probably because research isn't available yet
    retryOnMount: true, 
    refetchOnWindowFocus: true, // Refetch when user focuses window
  });

  // Create a unified helper function to get field data - ONLY AI or human fields, no legacy
  const getFieldData = (fieldName: string): { 
    value: any, 
    source: 'ai' | 'human' | null 
  } => {
    const aiField = `${fieldName}_ai`;
    const humanField = `${fieldName}_human`;
    
    // Check human data first (highest priority)
    if (species?.[humanField as keyof TreeSpecies] || 
        (researchData && researchData[humanField as keyof ResearchData])) {
      return { 
        value: species?.[humanField as keyof TreeSpecies] || 
               (researchData && researchData[humanField as keyof ResearchData]), 
        source: 'human' 
      };
    }
    
    // Then check AI data
    if (species?.[aiField as keyof TreeSpecies] || 
        (researchData && researchData[aiField as keyof ResearchData])) {
      return { 
        value: species?.[aiField as keyof TreeSpecies] || 
               (researchData && researchData[aiField as keyof ResearchData]), 
        source: 'ai' 
      };
    }
    
    // No legacy fields - either AI, human, or nothing
    return { value: null, source: null };
  };

  // Helper function to determine if this species has been researched
  const isResearched = (): boolean => {
    console.log("DEBUG isResearched() - species:", species?.taxon_id);
    console.log("DEBUG researched flag:", species?.researched);
    
    // ONLY check the researched flag from the species data
    // This is set by the backend when AI research is completed
    if (species?.researched === true) {
      console.log("✅ Species is marked as researched (from backend flag)");
      return true;
    }
    
    // No fallback checks - we're strictly using the researched flag
    console.log("❌ Species is NOT researched (researched flag is not true)");
    return false;
  };
  
  // Helper function to determine if a specific field has been researched
  const isFieldResearched = (fieldName: string): boolean => {
    // ONLY check AI or human data fields
    const aiField = `${fieldName}_ai`;
    const humanField = `${fieldName}_human`;
    
    // Very strict checking for AI data - must be non-empty strings
    const hasAiData = !!(
      (species && 
       species[aiField as keyof TreeSpecies] !== undefined && 
       species[aiField as keyof TreeSpecies] !== null && 
       species[aiField as keyof TreeSpecies] !== '' &&
       typeof species[aiField as keyof TreeSpecies] === 'string' &&
       (species[aiField as keyof TreeSpecies] as string).trim() !== '') || 
      (researchData && 
       researchData[aiField as keyof ResearchData] !== undefined && 
       researchData[aiField as keyof ResearchData] !== null &&
       researchData[aiField as keyof ResearchData] !== '' &&
       typeof researchData[aiField as keyof ResearchData] === 'string' &&
       (researchData[aiField as keyof ResearchData] as string).trim() !== '')
    );
    
    // Very strict checking for human data - must be non-empty strings
    const hasHumanData = !!(
      (species && 
       species[humanField as keyof TreeSpecies] !== undefined && 
       species[humanField as keyof TreeSpecies] !== null && 
       species[humanField as keyof TreeSpecies] !== '' &&
       typeof species[humanField as keyof TreeSpecies] === 'string' &&
       (species[humanField as keyof TreeSpecies] as string).trim() !== '') || 
      (researchData && 
       researchData[humanField as keyof ResearchData] !== undefined && 
       researchData[humanField as keyof ResearchData] !== null &&
       researchData[humanField as keyof ResearchData] !== '' &&
       typeof researchData[humanField as keyof ResearchData] === 'string' &&
       (researchData[humanField as keyof ResearchData] as string).trim() !== '')
    );
    
    // Log for debugging
    console.log(`DEBUG field ${fieldName} - AI data: ${hasAiData}, Human data: ${hasHumanData}`);
    
    // ONLY consider AI or human data
    return hasAiData || hasHumanData;
  };
  
  // Helper function to get a compact count of available research fields
  const getResearchFieldCount = () => {
    // Define the categories to check
    const categoryFields = {
      overview: ['general_description'],
      geographic: ['elevation_ranges', 'native_adapted_habitats'],
      ecological: ['conservation_status', 'ecological_function', 'habitat'],
      physical: ['growth_form', 'leaf_type', 'deciduous_evergreen', 'flower_color', 
                'fruit_type', 'bark_characteristics', 'maximum_height', 'maximum_diameter', 
                'lifespan', 'maximum_tree_age'],
      stewardship: ['stewardship_best_practices', 'agroforestry_use_cases', 'compatible_soil_types',
                   'planting_recipes', 'pruning_maintenance', 'disease_pest_management',
                   'fire_management', 'cultural_significance']
    };
    
    const counts: {
      total: number;
      byCategory: Record<string, number>;
    } = {
      total: 0,
      byCategory: {}
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
  };
  
  console.log("Species has research data:", species ? isResearched() : false);
  console.log("Research data:", researchData);

  // Create a reference for the polling interval
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup function for the polling interval
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearTimeout(pollingIntervalRef.current);
      }
    };
  }, []);

  // Implement robust polling function
  const startPollingForResearch = () => {
    let pollingCount = 0;
    const maxPolls = 20;       // Maximum number of polling attempts
    const pollInterval = 3000; // 3 seconds between attempts
    
    const pollForResearchData = async () => {
      if (pollingCount >= maxPolls) {
        console.log("Max polling attempts reached");
        // Final attempt
        await Promise.all([refetchSpecies(), refetchResearch()]);
        setIsResearchFunding(false);
        toast("Research process is taking longer than expected. The data will appear shortly.");
        return;
      }
      
      pollingCount++;
      console.log(`Polling for research data (attempt ${pollingCount}/${maxPolls})...`);
      
      try {
        // Refetch both datasets
        const [speciesResult, researchResult] = await Promise.all([
          refetchSpecies(), 
          refetchResearch()
        ]);
        
        // Check for research data using our helper function
        const keyFields = ['general_description', 'ecological_function', 'growth_form'];
        const hasResearchData = keyFields.some(field => {
          const { source } = getFieldData(field);
          return source === 'ai';
        });
        
        if (hasResearchData) {
          console.log("Research data confirmed, stopping polling");
          toast.success("Research data is now available!");
          setIsResearchFunding(false);
        } else {
          // Schedule next poll and save reference for cleanup
          pollingIntervalRef.current = setTimeout(pollForResearchData, pollInterval);
        }
      } catch (err) {
        console.error("Error polling for research data:", err);
        
        // On error, only stop polling if we've reached max attempts
        if (pollingCount >= maxPolls - 1) {
          setIsResearchFunding(false);
        } else {
          // Continue polling despite errors
          pollingIntervalRef.current = setTimeout(pollForResearchData, pollInterval);
        }
      }
    };
    
    // Start the polling process after a short delay
    pollingIntervalRef.current = setTimeout(pollForResearchData, 2000);
  };

  // Unified error handler for research API calls
  const handleResearchError = (error: any): string => {
    console.error("Research funding error:", error);
    
    // Clear research funding state
    setIsResearchFunding(false);
    
    // Log detailed error info
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error("API ERROR RESPONSE:", {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        // Handle specific error types
        if (error.response.data) {
          const errorData = error.response.data;
          
          if (errorData.error === 'Duplicate entry' || errorData.error === 'Species already researched') {
            return 'This species has already been researched.';
          } else if (errorData.error === 'Missing required fields' && errorData.required) {
            return `Missing fields: ${errorData.required.join(', ')}`;
          } else if (errorData.message) {
            return `Research Failed: ${errorData.message}`;
          } else if (errorData.error) {
            return `Research Failed: ${errorData.error}`;
          }
        }
        
        return `Request failed with status ${error.response.status}`;
      } else if (error.request) {
        return "Network Error: No response received from server.";
      } 
    }
    
    return error.message || 'Failed to fund research. Please try again.';
  };

  // Main research handler function
  const handleResearch = async () => {
    if (!species || !address || isResearchFunding) return;

    // Set loading state
    setIsResearchFunding(true);

    // Mock data for development purposes
    const transactionHash = `0x${Math.random().toString(16).substring(2, 42)}`;
    const tempIpfsCid = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
    const scientificName = species.species_scientific_name || species.species;

    // Switch to overview tab
    setActiveTab('overview'); 
    
    // Debug log
    console.log("Funding research with params:", {
      taxon_id, address, chain: "celo", 
      transactionHash, ipfs_cid: tempIpfsCid, scientificName
    });
    
    // Use toast.promise for better user experience
    toast.promise(
      fundResearch(
        taxon_id, address, "celo", 
        transactionHash, tempIpfsCid, scientificName
      )
      .then(response => {
        console.log("Research funded successfully");
        // Start polling for results
        startPollingForResearch();
        return response;
      })
      .catch(error => {
        const errorMessage = handleResearchError(error);
        throw new Error(errorMessage);
      }),
      {
        loading: 'Processing research funding...',
        success: 'Research funded successfully! You earned 2 tree points!',
        error: (err) => err.message
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-16 flex justify-center items-center">
          <div className="rounded-xl bg-black/40 backdrop-blur-md border border-white/20 p-8 w-full max-w-2xl">
            <div className="flex items-center justify-center mb-6">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
            </div>
            <div className="animate-pulse">
              <div className="h-8 bg-white/20 rounded-xl w-1/3 mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-4 bg-white/20 rounded-xl w-3/4"
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-16 flex justify-center items-center">
          <div className="rounded-xl bg-black/40 backdrop-blur-md border border-white/20 p-8 w-full max-w-2xl text-center text-white">
            <h2 className="text-2xl font-bold mb-4">
              Error loading species data
            </h2>
            <p className="text-white/70 mb-6">
              Sorry, we encountered an error while trying to load this species. Please try again later.
            </p>
            <Button
              onClick={() => router.push('/search')}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Return to Search
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!species) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-16 flex justify-center items-center">
          <div className="rounded-xl bg-black/40 backdrop-blur-md border border-white/20 p-8 w-full max-w-2xl text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Species not found</h2>
            <p className="text-white/70 mb-6">
              We couldn't find information about this species. It may not exist in our database.
            </p>
            <Button
              onClick={() => router.push('/search')}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Return to Search
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen">
      <div
        className="min-h-screen py-8"
      >
        <div className="max-w-7xl w-full mx-auto px-4 py-2">
          {/* Data Source Legend */}
          <div className="flex items-center justify-end gap-4 pb-2 text-sm text-white/70">
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-white"></span>
              <span>Human-Verified Data</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-emerald-400"></span>
              <span>AI-Generated Data</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 py-4">
            <Button
              onClick={() => router.push('/search')}
              variant="outline"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Search
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Information Column */}
            <div className="lg:col-span-2">
              <div className="rounded-xl bg-black/30 backdrop-blur-md border border-white/20 p-6 text-white mb-6">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold mb-2 italic">
                    {species?.species_scientific_name || species?.species}
                  </h1>
                  <div className="text-xl text-white/80">
                    <CommonNameDisplay commonNames={species?.common_name} />
                  </div>
                </div>

                {/* Tab Navigation - Based on REVISED TREEPAGE.md */}
                <div className="flex border-b border-white/20 mb-6 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 ${
                      activeTab === 'overview'
                        ? 'border-b-2 border-green-400 text-green-400'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('geographic')}
                    className={`px-4 py-2 ${
                      activeTab === 'geographic'
                        ? 'border-b-2 border-green-400 text-green-400'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    Geographic
                  </button>
                  <button
                    onClick={() => setActiveTab('ecological')}
                    className={`px-4 py-2 ${
                      activeTab === 'ecological'
                        ? 'border-b-2 border-green-400 text-green-400'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    Ecological
                  </button>
                  <button
                    onClick={() => setActiveTab('physical')}
                    className={`px-4 py-2 ${
                      activeTab === 'physical'
                        ? 'border-b-2 border-green-400 text-green-400'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    Physical
                  </button>
                  <button
                    onClick={() => setActiveTab('stewardship')}
                    className={`px-4 py-2 ${
                      activeTab === 'stewardship'
                        ? 'border-b-2 border-green-400 text-green-400'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    Stewardship
                  </button>
                  <button
                    onClick={() => setActiveTab('research')}
                    className={`px-4 py-2 ${
                      activeTab === 'research'
                        ? 'border-b-2 border-green-400 text-green-400'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    Research Data
                  </button>
                </div>

                {/* OVERVIEW TAB */}
                {activeTab === 'overview' && (
                  <div>
                    <div className="space-y-6">
                      {/* General Description - Special treatment */}
                      <div className="mb-6">
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                          <Leaf className="w-5 h-5 mr-2 text-green-400" />
                          General Description
                        </h2>
                        <div className="p-4 rounded-lg bg-black/30 backdrop-blur-md border border-white/10">
                          {/* Human content first (if available) */}
                          {(species?.general_description_human || researchData?.general_description_human) && (
                            <div className="text-white leading-relaxed mb-4">
                              {formatFieldValue(species?.general_description_human || researchData?.general_description_human, true)}
                            </div>
                          )}
                          
                          {/* AI content second (if available) */}
                          {(species?.general_description_ai || researchData?.general_description_ai) && (
                            <div className="text-white leading-relaxed bg-emerald-800/20 border-l-4 border-emerald-400 pl-3 py-1 rounded">
                              {formatFieldValue(species?.general_description_ai || researchData?.general_description_ai, true)}
                            </div>
                          )}
                          
                          {/* No legacy field fallback */}
                          {(!species?.general_description_human && !researchData?.general_description_human && 
                            !species?.general_description_ai && !researchData?.general_description_ai) && (
                            <div className="text-white/50 italic flex items-center gap-2">
                              {isResearched() ? 
                                <>No description available</> :
                                <>
                                  <AlertCircle className="w-4 h-4 text-amber-400" />
                                  <span>Awaiting research</span>
                                </>
                              }
                            </div>
                          )}
                          
                          {/* Show research needed message if no content available */}
                          {!species?.general_description_human && !researchData?.general_description_human && 
                           !species?.general_description_ai && !researchData?.general_description_ai && (
                            <div className="flex items-start gap-3 text-white/70">
                              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                              <p>
                                This species needs research. Fund research to generate a detailed description 
                                using AI. Your contribution helps build the Treekipedia knowledge commons.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Taxonomy Information */}
                      <div>
                        <h2 className="text-xl font-semibold mb-4 flex items-center">
                          <Info className="w-5 h-5 mr-2 text-blue-400" />
                          Taxonomy & Classification
                        </h2>
                        <div className="space-y-3">
                          {overviewFields.slice(3).map(field => (
                            species?.[field.key as keyof TreeSpecies] && (
                              <div key={field.key} className="p-3 rounded-lg bg-black/30 border border-white/10 flex justify-between items-start">
                                <span className="font-medium text-white/70">{field.label}:</span>
                                <span className="text-right max-w-[60%]">{formatFieldValue(species[field.key as keyof TreeSpecies], false)}</span>
                              </div>
                            )
                          ))}
                        </div>
                      </div>
                      
                      {/* Research Status Card */}
                      <div className="p-4 rounded-lg bg-emerald-900/30 border border-emerald-500/30">
                        <h3 className="text-lg font-semibold mb-2 flex items-center">
                          <Leaf className="w-5 h-5 mr-2 text-emerald-400" />
                          {isResearched() ? "AI Research Available" : "AI Research Status"}
                        </h3>
                        <p className="text-white/80 mb-4">
                          {isResearched()
                            ? "This species has been researched with AI. View the other tabs for detailed insights."
                            : "Fund AI research to unlock detailed information about this species. Your contribution helps build the tree knowledge commons."}
                        </p>
                        {/* Debug info to verify what counts are showing */}
                        <div className="text-xs text-white/50 mb-2">
                          {(() => {
                            const counts = getResearchFieldCount();
                            return isResearched() 
                              ? `AI research data available (${counts.total}/23 fields)`
                              : "No AI research data yet";
                          })()}
                        </div>
                        <Button
                          onClick={() => setActiveTab('ecological')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {isResearched()
                            ? "View Ecological Data" 
                            : "View Research Options"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* GEOGRAPHIC DISTRIBUTION TAB */}
                {activeTab === 'geographic' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold">
                        Geographic Distribution
                      </h2>
                      {!isResearched() && (
                        <div className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Some Fields Need Research
                        </div>
                      )}
                    </div>
                    
                    {!isResearched() && (
                      <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-500/30 mb-6 flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-amber-300 mb-1">Research Needed</h3>
                          <p className="text-white/80">
                            Some geographic fields need research to be populated. Fund research with a 
                            small contribution to unlock detailed information about this species.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      {geographicFields.map((field) => (
                        <div key={field.key} className="p-3 rounded-lg bg-black/30 border border-white/10">
                          <h4 className="font-medium text-white/70 mb-2">{field.label}:</h4>
                          
                          {/* Display method for fields with human/AI versions */}
                          {field.hasAiHuman ? (
                            <div>
                              {/* Human content first (if available) */}
                              {(species?.[`${field.key}_human` as keyof TreeSpecies] || 
                                researchData?.[`${field.key}_human` as keyof ResearchData]) && (
                                <div className="text-white mb-2">
                                  {formatFieldValue(
                                    species?.[`${field.key}_human` as keyof TreeSpecies] || 
                                    researchData?.[`${field.key}_human` as keyof ResearchData], 
                                    true
                                  )}
                                </div>
                              )}
                              
                              {/* AI content second (if available) */}
                              {(species?.[`${field.key}_ai` as keyof TreeSpecies] || 
                                researchData?.[`${field.key}_ai` as keyof ResearchData]) && (
                                <div className="text-white bg-emerald-800/20 border-l-4 border-emerald-400 pl-3 py-1 rounded">
                                  {formatFieldValue(
                                    species?.[`${field.key}_ai` as keyof TreeSpecies] || 
                                    researchData?.[`${field.key}_ai` as keyof ResearchData], 
                                    true
                                  )}
                                </div>
                              )}
                              
                              {/* Legacy fallback and "not available" check */}
                              {!species?.[`${field.key}_human` as keyof TreeSpecies] && 
                               !researchData?.[`${field.key}_human` as keyof ResearchData] && 
                               !species?.[`${field.key}_ai` as keyof TreeSpecies] && 
                               !researchData?.[`${field.key}_ai` as keyof ResearchData] && (
                                species?.[field.key as keyof TreeSpecies] ? (
                                  <div className="text-white">
                                    {formatFieldValue(species[field.key as keyof TreeSpecies], false)}
                                  </div>
                                ) : (
                                  <div className="text-white/50 italic flex items-center gap-2">
                                    {isResearched() ? (
                                      <>No data available</>
                                    ) : (
                                      <>
                                        <AlertCircle className="w-4 h-4 text-amber-400" />
                                        Awaiting research
                                      </>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            // Regular fields without AI/human versions
                            <div className="text-white">
                              {species?.[field.key as keyof TreeSpecies] ? 
                                formatFieldValue(species[field.key as keyof TreeSpecies], false) : 
                                <span className="text-white/50">Not available</span>
                              }
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ECOLOGICAL CHARACTERISTICS TAB */}
                {activeTab === 'ecological' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold">
                        Ecological Characteristics
                      </h2>
                      {!isResearched() && (
                        <div className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Some Fields Need Research
                        </div>
                      )}
                    </div>
                    
                    {!isResearched() && (
                      <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-500/30 mb-6 flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-amber-300 mb-1">Research Needed</h3>
                          <p className="text-white/80">
                            Some ecological fields need research to be populated. Fund research with a 
                            small contribution to unlock detailed information about this species.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Highlight conservation status if available */}
                    {(species?.conservation_status_human || species?.conservation_status_ai || 
                      researchData?.conservation_status_human || researchData?.conservation_status_ai || 
                      species?.conservation_status) && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">Conservation Status</h3>
                        <div className={`p-3 rounded-lg border ${getConservationStatusColor(
                          species?.conservation_status_human || 
                          researchData?.conservation_status_human || 
                          species?.conservation_status_ai || 
                          researchData?.conservation_status_ai || 
                          ""
                        )}`}>
                          <p className="font-bold text-center text-lg">
                            {species?.conservation_status_human || 
                            researchData?.conservation_status_human || 
                            species?.conservation_status_ai || 
                            researchData?.conservation_status_ai || 
                            "Unknown"}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Display ecological fields */}
                    <div className="space-y-4">
                      {ecologicalFields.map((field) => (
                        <div key={field.key} className="p-3 rounded-lg bg-black/30 border border-white/10">
                          <h4 className="font-medium text-white/70 mb-2">{field.label}:</h4>
                          
                          {/* Display method for fields with human/AI versions */}
                          {field.hasAiHuman ? (
                            <div>
                              {/* Human content first (if available) */}
                              {(species?.[`${field.key}_human` as keyof TreeSpecies] || 
                                researchData?.[`${field.key}_human` as keyof ResearchData]) && (
                                <div className="text-white mb-2">
                                  {formatFieldValue(
                                    species?.[`${field.key}_human` as keyof TreeSpecies] || 
                                    researchData?.[`${field.key}_human` as keyof ResearchData], 
                                    true
                                  )}
                                </div>
                              )}
                              
                              {/* AI content second (if available) */}
                              {(species?.[`${field.key}_ai` as keyof TreeSpecies] || 
                                researchData?.[`${field.key}_ai` as keyof ResearchData]) && (
                                <div className="text-white bg-emerald-800/20 border-l-4 border-emerald-400 pl-3 py-1 rounded">
                                  {formatFieldValue(
                                    species?.[`${field.key}_ai` as keyof TreeSpecies] || 
                                    researchData?.[`${field.key}_ai` as keyof ResearchData], 
                                    true
                                  )}
                                </div>
                              )}
                              
                              {/* Legacy fallback and "not available" check */}
                              {!species?.[`${field.key}_human` as keyof TreeSpecies] && 
                               !researchData?.[`${field.key}_human` as keyof ResearchData] && 
                               !species?.[`${field.key}_ai` as keyof TreeSpecies] && 
                               !researchData?.[`${field.key}_ai` as keyof ResearchData] && (
                                species?.[field.key as keyof TreeSpecies] ? (
                                  <div className="text-white">
                                    {formatFieldValue(species[field.key as keyof TreeSpecies], false)}
                                  </div>
                                ) : (
                                  <div className="text-white/50 italic flex items-center gap-2">
                                    {isResearched() ? (
                                      <>No data available</>
                                    ) : (
                                      <>
                                        <AlertCircle className="w-4 h-4 text-amber-400" />
                                        Awaiting research
                                      </>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            // Regular fields without AI/human versions
                            <div className="text-white">
                              {species?.[field.key as keyof TreeSpecies] ? 
                                formatFieldValue(species[field.key as keyof TreeSpecies], false) : 
                                <span className="text-white/50">Not available</span>
                              }
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PHYSICAL CHARACTERISTICS TAB */}
                {activeTab === 'physical' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold">
                        Physical Characteristics
                      </h2>
                      {!isResearched() && (
                        <div className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Some Fields Need Research
                        </div>
                      )}
                    </div>
                    
                    {!isResearched() && (
                      <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-500/30 mb-6 flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-amber-300 mb-1">Research Needed</h3>
                          <p className="text-white/80">
                            Some physical characteristic fields need research to be populated. Fund research with a 
                            small contribution to unlock detailed information about this species.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      {physicalFields.map((field) => (
                        <div key={field.key} className="p-3 rounded-lg bg-black/30 border border-white/10">
                          <h4 className="font-medium text-white/70 mb-2">{field.label}:</h4>
                          
                          {/* Display method for fields with human/AI versions */}
                          {field.hasAiHuman ? (
                            <div>
                              {/* Human content first (if available) */}
                              {(species?.[`${field.key}_human` as keyof TreeSpecies] || 
                                researchData?.[`${field.key}_human` as keyof ResearchData]) && (
                                <div className="text-white mb-2">
                                  {formatFieldValue(
                                    species?.[`${field.key}_human` as keyof TreeSpecies] || 
                                    researchData?.[`${field.key}_human` as keyof ResearchData], 
                                    true,
                                    field.key
                                  )}
                                </div>
                              )}
                              
                              {/* AI content second (if available) */}
                              {(species?.[`${field.key}_ai` as keyof TreeSpecies] || 
                                researchData?.[`${field.key}_ai` as keyof ResearchData]) && (
                                <div className="text-white bg-emerald-800/20 border-l-4 border-emerald-400 pl-3 py-1 rounded">
                                  {formatFieldValue(
                                    species?.[`${field.key}_ai` as keyof TreeSpecies] || 
                                    researchData?.[`${field.key}_ai` as keyof ResearchData], 
                                    true,
                                    field.key
                                  )}
                                </div>
                              )}
                              
                              {/* Legacy fallback and "not available" check */}
                              {!species?.[`${field.key}_human` as keyof TreeSpecies] && 
                               !researchData?.[`${field.key}_human` as keyof ResearchData] && 
                               !species?.[`${field.key}_ai` as keyof TreeSpecies] && 
                               !researchData?.[`${field.key}_ai` as keyof ResearchData] && (
                                species?.[field.key as keyof TreeSpecies] ? (
                                  <div className="text-white">
                                    {formatFieldValue(species[field.key as keyof TreeSpecies], false, field.key)}
                                  </div>
                                ) : (
                                  <div className="text-white/50 italic flex items-center gap-2">
                                    {isFieldResearched(field.key) ? (
                                      <>No data available</>
                                    ) : isResearched() ? (
                                      <>
                                        <Info className="w-4 h-4 text-blue-400" />
                                        <span>Not available in AI research</span>
                                      </>
                                    ) : (
                                      <>
                                        <AlertCircle className="w-4 h-4 text-amber-400" />
                                        <span>Awaiting research</span>
                                      </>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            // Regular fields without AI/human versions
                            <div className="text-white">
                              {species?.[field.key as keyof TreeSpecies] ? 
                                formatFieldValue(species[field.key as keyof TreeSpecies], false, field.key) : 
                                <span className="text-white/50">Not available</span>
                              }
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* STEWARDSHIP TAB */}
                {activeTab === 'stewardship' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold">
                        Stewardship & Utility
                      </h2>
                      {isResearched() ? (
                        <div className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs flex items-center gap-1">
                          <Leaf className="w-3 h-3" />
                          {(() => {
                            const stats = getResearchFieldCount();
                            return `${stats.byCategory.stewardship}/8 Fields With Data`;
                          })()}
                        </div>
                      ) : (
                        <div className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Fields Need Research
                        </div>
                      )}
                    </div>
                    
                    {!isResearched() && (
                      <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-500/30 mb-6 flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-amber-300 mb-1">Research Needed</h3>
                          <p className="text-white/80">
                            Stewardship data needs research to be populated. Fund research with a 
                            small contribution to unlock detailed management information about this species.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      {stewardshipFields.map((field) => (
                        <div key={field.key} className="p-3 rounded-lg bg-black/30 border border-white/10">
                          <h4 className="font-medium text-white/70 mb-2">{field.label}:</h4>
                          
                          {/* Display method for fields with human/AI versions */}
                          {field.hasAiHuman ? (
                            <div>
                              {/* Human content first (if available) */}
                              {(species?.[`${field.key}_human` as keyof TreeSpecies] || 
                                researchData?.[`${field.key}_human` as keyof ResearchData]) && (
                                <div className="text-white mb-2">
                                  {formatFieldValue(
                                    species?.[`${field.key}_human` as keyof TreeSpecies] || 
                                    researchData?.[`${field.key}_human` as keyof ResearchData], 
                                    true
                                  )}
                                </div>
                              )}
                              
                              {/* AI content second (if available) */}
                              {(species?.[`${field.key}_ai` as keyof TreeSpecies] || 
                                researchData?.[`${field.key}_ai` as keyof ResearchData]) && (
                                <div className="text-white bg-emerald-800/20 border-l-4 border-emerald-400 pl-3 py-1 rounded">
                                  {formatFieldValue(
                                    species?.[`${field.key}_ai` as keyof TreeSpecies] || 
                                    researchData?.[`${field.key}_ai` as keyof ResearchData], 
                                    true
                                  )}
                                </div>
                              )}
                              
                              {/* Legacy fallback and "not available" check */}
                              {!species?.[`${field.key}_human` as keyof TreeSpecies] && 
                               !researchData?.[`${field.key}_human` as keyof ResearchData] && 
                               !species?.[`${field.key}_ai` as keyof TreeSpecies] && 
                               !researchData?.[`${field.key}_ai` as keyof ResearchData] && (
                                species?.[field.key as keyof TreeSpecies] ? (
                                  <div className="text-white">
                                    {formatFieldValue(species[field.key as keyof TreeSpecies], false)}
                                  </div>
                                ) : (
                                  <div className="text-white/50 italic flex items-center gap-2">
                                    {isFieldResearched(field.key) ? (
                                      <>No data available</>
                                    ) : isResearched() ? (
                                      <>
                                        <Info className="w-4 h-4 text-blue-400" />
                                        <span>Not available in AI research</span>
                                      </>
                                    ) : (
                                      <>
                                        <AlertCircle className="w-4 h-4 text-amber-400" />
                                        <span>Awaiting research</span>
                                      </>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          ) : (
                            // Regular fields without AI/human versions
                            <div className="text-white">
                              {species?.[field.key as keyof TreeSpecies] ? 
                                formatFieldValue(species[field.key as keyof TreeSpecies], false) : 
                                <span className="text-white/50">Not available</span>
                              }
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* RESEARCH DATA TAB */}
                {activeTab === 'research' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold">
                        Research & Data
                      </h2>
                    </div>
                    
                    <div className="space-y-4">
                      {researchDataFields.map((field) => (
                        <div key={field.key} className="p-3 rounded-lg bg-black/30 border border-white/10">
                          <h4 className="font-medium text-white/70 mb-2">{field.label}:</h4>
                          <div className="text-white">
                            {(species?.[field.key as keyof TreeSpecies] !== undefined && species?.[field.key as keyof TreeSpecies] !== null) || 
                             (researchData?.[field.key as keyof ResearchData] !== undefined && researchData?.[field.key as keyof ResearchData] !== null) ? 
                              formatFieldValue(
                                species?.[field.key as keyof TreeSpecies] !== undefined && species?.[field.key as keyof TreeSpecies] !== null ? 
                                  species?.[field.key as keyof TreeSpecies] : 
                                  researchData?.[field.key as keyof ResearchData],
                                false
                              ) : 
                              <span className="text-white/50">Not available</span>
                            }
                          </div>
                        </div>
                      ))}
                      
                      {/* If no data fields are available */}
                      {researchDataFields.every(field => 
                        (species?.[field.key as keyof TreeSpecies] === undefined || species?.[field.key as keyof TreeSpecies] === null) && 
                        (researchData?.[field.key as keyof ResearchData] === undefined || researchData?.[field.key as keyof ResearchData] === null)
                      ) && (
                        <div className="p-4 text-center text-white/60">
                          No detailed research data available yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Side Column */}
            <div className="lg:col-span-1">
              {/* Research Funding Card */}
              <div className="rounded-xl bg-black/30 backdrop-blur-md border border-white/20 p-6 text-white mb-6 sticky top-4">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Leaf className="w-5 h-5 mr-2 text-emerald-400" />
                  Tree Intelligence Commons
                </h2>
                
                {isResearched() ? (
                  <div>
                    <div className="p-4 rounded-lg bg-black/30 backdrop-blur-md border border-white/20 mb-4">
                      <div className="mb-2 text-emerald-300 font-semibold">AI Research Complete</div>
                      <p className="text-white/90 mb-2">
                        This species has been researched with AI. Thank you to all contributors who have funded tree intelligence!
                      </p>
                      
                      {/* Research data statistics */}
                      {(() => {
                        const stats = getResearchFieldCount();
                        return (
                          <div className="mt-2 text-sm">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-white/70">Fields with AI research data:</span>
                              <span className="text-emerald-400 font-semibold">{stats.total}/23</span>
                            </div>
                            <div className="bg-white/10 h-1.5 rounded-full w-full overflow-hidden">
                              <div 
                                className="bg-emerald-500 h-full rounded-full" 
                                style={{ width: `${(stats.total / 23) * 100}%` }}
                              ></div>
                            </div>
                            <div className="mt-2 text-white/60 text-xs">
                              <span className="mr-1">Overview: {stats.byCategory.overview}/1</span>•
                              <span className="mx-1">Physical: {stats.byCategory.physical}/10</span>•
                              <span className="mx-1">Ecological: {stats.byCategory.ecological}/3</span>•
                              <span className="ml-1">Stewardship: {stats.byCategory.stewardship}/8</span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                    <Button
                      onClick={() => router.push('/profile')}
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                    >
                      View My Contreebutions
                    </Button>
                  </div>
                ) : (
                  <div>
                    <div className="p-4 rounded-lg bg-black/30 backdrop-blur-md border border-white/20 mb-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-white/90">Fund Research:</span>
                        <span className="font-bold text-emerald-300">$3.00</span>
                      </div>
                      <div className="space-y-2 text-sm text-white/70">
                        <p>
                          <span className="inline-block w-5 h-5 text-center mr-1 rounded-full bg-white/10">✓</span>
                          Unlock AI research for this species
                        </p>
                        <p>
                          <span className="inline-block w-5 h-5 text-center mr-1 rounded-full bg-white/10">✓</span>
                          Receive a Contreebution NFT
                        </p>
                        <p>
                          <span className="inline-block w-5 h-5 text-center mr-1 rounded-full bg-white/10">✓</span>
                          Earn points on the Treederboard
                        </p>
                        <p>
                          <span className="inline-block w-5 h-5 text-center mr-1 rounded-full bg-white/10">✓</span>
                          Help build the tree knowledge commons
                        </p>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      onClick={handleResearch}
                      disabled={isResearchFunding || !address}
                    >
                      {!address 
                        ? "Connect Wallet to Fund" 
                        : isResearchFunding 
                          ? <div className="flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {"Processing Research..."}
                            </div>
                          : "Fund Research ($3)"}
                    </Button>
                    <button 
                      onClick={() => setActiveTab('stewardship')}
                      className="w-full text-xs text-white/50 hover:text-white/70 mt-2 underline"
                    >
                      See what data will be researched
                    </button>
                    <div className="text-xs text-center mt-2 text-white/60">
                      Powered by AI research agents & IPFS
                    </div>
                  </div>
                )}
                
                {/* Research Process Info */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <h3 className="text-lg font-semibold mb-3">How It Works</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-900/50 text-emerald-400 flex items-center justify-center text-xs">1</div>
                      <p className="text-white/80">Fund research for this species.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-900/50 text-emerald-400 flex items-center justify-center text-xs">2</div>
                      <p className="text-white/80">AI research agent collects & structures data.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-900/50 text-emerald-400 flex items-center justify-center text-xs">3</div>
                      <p className="text-white/80">Data is stored on IPFS & a Contreebution NFT is minted.</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-900/50 text-emerald-400 flex items-center justify-center text-xs">4</div>
                      <p className="text-white/80">Knowledge is available for everyone forever.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Common Name Display Component
const CommonNameDisplay = ({ commonNames }: { commonNames?: string }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!commonNames) return <span>No common names available</span>;
  
  // Function to process and deduplicate common names
  const processCommonNames = (names: string): { primary: string, others: string[] } => {
    // Split by semicolons and clean up
    const allNames = names.split(';')
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    // Remove duplicates (case insensitive)
    const uniqueNames: string[] = [];
    const seenNames = new Set<string>();
    
    allNames.forEach(name => {
      // Check if we've already seen this name (case-insensitive)
      const lowerName = name.toLowerCase();
      if (!seenNames.has(lowerName)) {
        seenNames.add(lowerName);
        uniqueNames.push(name);
      }
    });
    
    // Get primary name and other names
    const primary = uniqueNames.length > 0 ? uniqueNames[0] : 'Unknown';
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
    if ((displayText + ', ' + name).length > CHAR_LIMIT && !expanded) {
      hasMore = true;
      break;
    }
    displayText += ', ' + name;
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
                <div key={idx} className="py-1 border-b border-white/10 last:border-0">{name}</div>
              ))}
            </div>
          </div>
        ) : (
          // Show limited names when collapsed
          <span>
            <span>{primary}</span>
            {visibleNames.slice(1).map((name, idx) => (
              <span key={idx} className="text-white/70">, {name}</span>
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
};

// Create a reusable field component
type ResearchFieldProps = {
  field: string;
  label: string;
  isLongText?: boolean;
};

const ResearchField: React.FC<ResearchFieldProps> = ({ 
  field, 
  label, 
  isLongText = false 
}) => {
  // Re-using the parent component's getFieldData function
  // Need to define it locally as we can't use component references
  const getFieldDataLocal = (fieldName: string): { 
    value: any, 
    source: 'ai' | 'human' | null 
  } => {
    const aiField = `${fieldName}_ai`;
    const humanField = `${fieldName}_human`;
    
    // Check human data first (highest priority)
    if (species?.[humanField as keyof TreeSpecies] || 
        (researchData && researchData[humanField as keyof ResearchData])) {
      return { 
        value: species?.[humanField as keyof TreeSpecies] || 
               (researchData && researchData[humanField as keyof ResearchData]), 
        source: 'human' 
      };
    }
    
    // Then check AI data
    if (species?.[aiField as keyof TreeSpecies] || 
        (researchData && researchData[aiField as keyof ResearchData])) {
      return { 
        value: species?.[aiField as keyof TreeSpecies] || 
               (researchData && researchData[aiField as keyof ResearchData]), 
        source: 'ai' 
      };
    }
    
    // No legacy fields - either AI, human, or nothing
    return { value: null, source: null };
  };
  
  const { value: humanValue, source: humanSource } = getFieldDataLocal(`${field}_human`);
  const { value: aiValue, source: aiSource } = getFieldDataLocal(`${field}_ai`);
  const { value: legacyValue, source: legacySource } = getFieldDataLocal(field);
  
  // Need to redefine this here since we can't use parent component's function
  const isResearchedLocal = (): boolean => {
    // ONLY check the researched flag from the species data
    if (species?.researched === true) {
      return true;
    }
    return false;
  };
  
  return (
    <div className="p-3 rounded-lg bg-black/30 border border-white/10">
      <h4 className="font-medium text-white/70 mb-2">{label}:</h4>
      
      {/* Human data */}
      {humanValue && (
        <div className="text-white mb-2">
          {formatFieldValue(humanValue, isLongText, field)}
        </div>
      )}
      
      {/* AI data */}
      {aiValue && (
        <div className="text-white bg-emerald-800/20 border-l-4 border-emerald-400 pl-3 py-1 rounded">
          {formatFieldValue(aiValue, isLongText, field)}
        </div>
      )}
      
      {/* Legacy fallback */}
      {!humanValue && !aiValue && legacyValue && (
        <div className="text-white">
          {formatFieldValue(legacyValue, isLongText, field)}
        </div>
      )}
      
      {/* No data available */}
      {!humanValue && !aiValue && !legacyValue && (
        <div className="text-white/50 italic flex items-center gap-2">
          {isResearchedLocal() ? (
            <>No data available</>
          ) : (
            <>
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Awaiting research</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// Helper function to format field values with proper type safety
function formatFieldValue(
  value: string | number | boolean | null | undefined, 
  isLongText: boolean = false, 
  fieldKey: string = ''
): React.ReactNode {
  if (value === undefined || value === null) {
    return 'Not available';
  }
  
  // Format based on key
  if (fieldKey === 'common_name' && typeof value === 'string') {
    return <CommonNameDisplay commonNames={value} />;
  } else if (fieldKey.includes('maximum_height') && typeof value === 'number') {
    return `${value} m`;
  } else if (fieldKey.includes('maximum_diameter') && typeof value === 'number') {
    return `${value} m`;
  } else if (fieldKey.includes('maximum_tree_age') && typeof value === 'number') {
    return `${value} years`;
  } else if (fieldKey.includes('conservation_status')) {
    return value;
  } else if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  } else if (typeof value === 'string') {
    // For long text fields in research data, format with paragraphs
    if (isLongText && value.length > 100) {
      return value.split('\n').map((paragraph: string, i: number) => (
        <p key={i} className={i > 0 ? 'mt-2' : ''}>
          {paragraph}
        </p>
      ));
    }
    
    // Handle semicolon-separated lists for consistency
    if (value.includes(';') && value.length > 50) {
      return <CommonNameDisplay commonNames={value} />;
    }
  }
  
  return value;
}

// Helper function for conservation status colors

// Helper function for conservation status colors
function getConservationStatusColor(status: string) {
  if (!status) return 'border-gray-500 bg-gray-900/30';
  
  const statusLower = status.toLowerCase();
  
  if (statusLower.includes('extinct') || statusLower.includes('critically endangered')) {
    return 'border-red-500 bg-red-900/30';
  } else if (statusLower.includes('endangered')) {
    return 'border-orange-500 bg-orange-900/30';
  } else if (statusLower.includes('vulnerable')) {
    return 'border-yellow-500 bg-yellow-900/30';
  } else if (statusLower.includes('near threatened')) {
    return 'border-yellow-300 bg-yellow-700/30';
  } else if (statusLower.includes('concern') || statusLower.includes('least concern')) {
    return 'border-green-500 bg-green-900/30';
  } else {
    return 'border-gray-500 bg-gray-900/30';
  }
}

export default SpeciesDetailsPage;