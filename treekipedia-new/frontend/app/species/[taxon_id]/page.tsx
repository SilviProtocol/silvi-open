"use client";

import { Button } from "@/components/ui/button";
import { ResearchData, ResearchPayload, TreeSpecies } from "@/lib/types";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { ArrowLeft, Leaf, Info, AlertCircle, Loader2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import React, { useState } from "react";
import { useAccount } from "wagmi";
import { toast } from "react-hot-toast";

const SpeciesDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const taxon_id = params.taxon_id as string;
  console.log("taxon_id:", taxon_id);
  const { address } = useAccount();
  console.log("address:", address);
  
  // Define which fields need AI research
  const researchNeededFields = [
    "general_description",
    "native_adapted_habitats",
    "stewardship_best_practices",
    "ecological_function",
    "agroforestry_use_cases",
    "compatible_soil_types",
    "growth_form",
    "leaf_type",
    "deciduous_evergreen",
    "flower_color",
    "fruit_type",
    "bark_characteristics",
    "maximum_height",
    "maximum_diameter",
    "lifespan",
    "planting_recipes",
    "pruning_maintenance",
    "disease_pest_management",
    "fire_management",
    "cultural_significance"
  ];

  // Helper function to check if a field needs research
  const needsResearch = (key: string) => researchNeededFields.includes(key);
  
  // Organize fields EXACTLY as specified in TREEPAGE.md
  const overviewFields = [
    { label: "General Description", key: "general_description", needsResearch: true },
    { label: "Accepted Scientific Name", key: "accepted_scientific_name" },
    { label: "Common Countries", key: "common_countries" },
    { label: "Taxon ID", key: "taxon_id" },
    { label: "Family", key: "family" },
    { label: "Genus", key: "genus" },
    { label: "Subspecies", key: "subspecies" },
    { label: "Specific Epithet", key: "specific_epithet" },
    { label: "Order", key: "taxonomic_order" },
    { label: "Class", key: "taxonomic_class" }
  ];
  
  const ecologyFields = [
    { label: "Ecological Function", key: "ecological_function", needsResearch: true },
    { label: "Conservation Status", key: "conservation_status" },
    { label: "Biomes", key: "biomes" },
    { label: "Bioregions", key: "bioregions" },
    { label: "Ecoregions", key: "ecoregions" },
    { label: "Habitat", key: "habitat" },
    { label: "Native/Adapted Habitats", key: "native_adapted_habitats", needsResearch: true },
    { label: "Countries Introduced", key: "countries_introduced" },
    { label: "Countries Invasive", key: "countries_invasive" },
    { label: "Countries Native", key: "countries_native" },
    { label: "Elevation Ranges", key: "elevation_ranges" },
    { label: "Growth Form", key: "growth_form", needsResearch: true },
    { label: "Leaf Type", key: "leaf_type", needsResearch: true },
    { label: "Deciduous/Evergreen", key: "deciduous_evergreen", needsResearch: true },
    { label: "Flower Color", key: "flower_color", needsResearch: true },
    { label: "Fruit Type", key: "fruit_type", needsResearch: true },
    { label: "Bark Characteristics", key: "bark_characteristics", needsResearch: true },
    { label: "Maximum Height (m)", key: "maximum_height", needsResearch: true },
    { label: "Maximum Diameter (m)", key: "maximum_diameter", needsResearch: true },
    { label: "Lifespan", key: "lifespan", needsResearch: true },
    { label: "Maximum Tree Age (Years)", key: "maximum_tree_age" }
  ];
  
  const stewardshipFields = [
    { label: "Stewardship Best Practices", key: "stewardship_best_practices", needsResearch: true },
    { label: "Agroforestry Use Cases", key: "agroforestry_use_cases", needsResearch: true },
    { label: "Compatible Soil Types", key: "compatible_soil_types", needsResearch: true },
    { label: "Planting Recipes", key: "planting_recipes", needsResearch: true },
    { label: "Pruning & Maintenance", key: "pruning_maintenance", needsResearch: true },
    { label: "Disease & Pest Management", key: "disease_pest_management", needsResearch: true },
    { label: "Fire Management", key: "fire_management", needsResearch: true },
    { label: "Cultural Significance", key: "cultural_significance", needsResearch: true }
  ];
  
  const scienceFields = [
    { label: "Total Occurrences", key: "total_occurrences" }
  ];
  
  const metadataFields = [
    { label: "Verification Status", key: "verification_status" },
    { label: "IPFS CID", key: "ipfs_cid" },
    { label: "Last Updated", key: "last_updated_date" }
  ];
  
  // Tabs for better organization
  const [activeTab, setActiveTab] = useState('overview');
  
  // Get species data
  const {
    data: species,
    isLoading,
    isError,
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
  });

  console.log("Research data:", researchData);

  const researchMutation = useMutation({
    mutationFn: async (payload: ResearchPayload) => {
      console.log("Sending research payload:", payload);
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://treekipedia-api.silvi.earth'}/research/fund-research`,
        payload
      );
      console.log("Research response:", response.data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log("Research mutation successful:", data);
      // Refetch research data after successful mutation
      refetchResearch();
      toast.success("Research funded successfully! You earned 2 tree points!");
    },
    onError: (error) => {
      console.error("Research mutation error:", error);
      
      if (axios.isAxiosError(error)) {
        // Check for specific error responses from the API
        if (error.response?.data?.error) {
          const errorData = error.response.data;
          console.error("API error details:", errorData);
          
          // Handle specific error types
          if (errorData.error === 'Missing required fields') {
            toast.error(`Missing fields: ${errorData.required.join(', ')}`);
          } else if (errorData.error === 'Duplicate entry') {
            toast.error("This species has already been researched.");
          } else if (errorData.message) {
            toast.error(`Research Failed: ${errorData.message}`);
          } else {
            toast.error(`Research Failed: ${errorData.error}`);
          }
        } else if (error.code === "ERR_NETWORK") {
          toast.error("Network Error: Unable to connect to the research server.");
        } else {
          toast.error("Research Failed: An unexpected error occurred. Please try again.");
        }
      } else {
        toast.error("Research Failed: An unexpected error occurred. Please try again.");
      }
    },
  });

  const handleResearch = () => {
    if (!species || !address) return;

    // In a production app, this transaction hash would come from an actual blockchain transaction
    // after user approves and completes payment
    // For now, we're simulating this with a placeholder transaction hash
    const transactionHash = `0x${Math.random().toString(16).substring(2, 42)}`;
    
    // In a production app, this IPFS CID would come from uploading metadata to IPFS
    // For this implementation, we'll use a placeholder that the backend will replace with actual data
    const tempIpfsCid = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
    
    const payload = {
      taxon_id: taxon_id,
      wallet_address: address,
      chain: "celo", // Using Celo for consistency
      transaction_hash: transactionHash,
      ipfs_cid: tempIpfsCid,
      scientific_name: species.species // Using the actual scientific name from the species data
    };

    console.log("Initiating research with payload:", payload);
    researchMutation.mutate(payload);
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
                    {species?.species}
                  </h1>
                  <p className="text-xl text-white/80">
                    {species?.common_name}
                  </p>
                </div>

                {/* Tab Navigation - EXACTLY as in TREEPAGE.md */}
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
                    onClick={() => setActiveTab('ecology')}
                    className={`px-4 py-2 ${
                      activeTab === 'ecology'
                        ? 'border-b-2 border-green-400 text-green-400'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    Ecology
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
                    onClick={() => setActiveTab('science')}
                    className={`px-4 py-2 ${
                      activeTab === 'science'
                        ? 'border-b-2 border-green-400 text-green-400'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    Science
                  </button>
                  <button
                    onClick={() => setActiveTab('metadata')}
                    className={`px-4 py-2 ${
                      activeTab === 'metadata'
                        ? 'border-b-2 border-green-400 text-green-400'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    Metadata
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'overview' && (
                  <div>
                    {/* Fields exactly in the order from TREEPAGE.md */}
                    <div className="space-y-6">
                      {overviewFields.map((field, index) => {
                        // Special treatment for general_description at the top
                        if (field.key === 'general_description') {
                          return (
                            <div key={field.key} className="mb-6">
                              <h2 className="text-xl font-semibold mb-4 flex items-center">
                                <Leaf className="w-5 h-5 mr-2 text-green-400" />
                                {field.label}
                              </h2>
                              <div className="p-4 rounded-lg bg-black/30 backdrop-blur-md border border-white/10">
                                {researchData?.general_description ? (
                                  <div className="text-white/90 leading-relaxed">
                                    {formatFieldValue(researchData, field.key, true)}
                                  </div>
                                ) : (
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
                          );
                        }
                        
                        // Group Taxonomy fields together 
                        else if (index === 1) {
                          return (
                            <div key="taxonomy-group">
                              <h2 className="text-xl font-semibold mb-4 flex items-center">
                                <Info className="w-5 h-5 mr-2 text-blue-400" />
                                Taxonomy & Classification
                              </h2>
                              <div className="space-y-3">
                                {overviewFields.slice(1).map(field => (
                                  species?.[field.key as keyof TreeSpecies] && (
                                    <div key={field.key} className="p-3 rounded-lg bg-black/30 border border-white/10 flex justify-between items-start">
                                      <span className="font-medium text-white/70">{field.label}:</span>
                                      <span className="text-right max-w-[60%]">{formatFieldValue(species, field.key)}</span>
                                    </div>
                                  )
                                ))}
                              </div>
                            </div>
                          );
                        }
                        
                        return null;
                      })}
                      
                      {/* Research Preview Card */}
                      <div className="p-4 rounded-lg bg-emerald-900/30 border border-emerald-500/30">
                        <h3 className="text-lg font-semibold mb-2 flex items-center">
                          <Leaf className="w-5 h-5 mr-2 text-emerald-400" />
                          AI Research Available
                        </h3>
                        <p className="text-white/80 mb-4">
                          {researchData?.general_description 
                            ? "This species has been researched with AI. View the ecology and stewardship tabs for detailed insights."
                            : "Fund AI research to unlock detailed information about this species. Your contribution helps build the tree knowledge commons."}
                        </p>
                        <Button
                          onClick={() => setActiveTab('ecology')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {researchData?.general_description 
                            ? "View Ecology Data" 
                            : "View Research Options"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ecology Tab - exactly as in TREEPAGE.md */}
                {activeTab === 'ecology' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold">
                        Ecology
                      </h2>
                      {!researchData?.ecological_function && (
                        <div className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Some Fields Need Research
                        </div>
                      )}
                    </div>
                    
                    {!researchData?.ecological_function && (
                      <div className="p-4 rounded-lg bg-amber-900/20 border border-amber-500/30 mb-6 flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-amber-300 mb-1">Research Needed</h3>
                          <p className="text-white/80">
                            Some ecology fields need research to be populated. Fund research with a 
                            small contribution to unlock detailed information about this species.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Highlight conservation status if available */}
                    {species?.conservation_status && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3">Conservation Status</h3>
                        <div className={`p-3 rounded-lg border ${getConservationStatusColor(species.conservation_status)}`}>
                          <p className="font-bold text-center text-lg">{species.conservation_status}</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Display ecology fields with subheadings */}
                    <div className="space-y-8">
                      {/* Group 1: Ecological Function */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-emerald-300">Ecological Information</h3>
                        <div className="space-y-4">
                          {ecologyFields.slice(0, 11).map((field) => (
                            <div key={field.key} className="p-3 rounded-lg bg-black/30 border border-white/10">
                              <h4 className="font-medium text-white/70 mb-2">{field.label}:</h4>
                              {field.needsResearch ? (
                                researchData?.[field.key as keyof ResearchData] ? (
                                  <div className="text-white/90">
                                    {formatFieldValue(researchData, field.key, true)}
                                  </div>
                                ) : (
                                  <div className="text-white/50 italic flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-amber-400" />
                                    Awaiting research
                                  </div>
                                )
                              ) : (
                                <div className="text-white/90">
                                  {species?.[field.key as keyof TreeSpecies] ? 
                                    formatFieldValue(species, field.key) : 
                                    <span className="text-white/50">Not available</span>
                                  }
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Group 2: Physical Characteristics */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-emerald-300">Physical Characteristics</h3>
                        <div className="space-y-4">
                          {ecologyFields.slice(11).map((field) => (
                            <div key={field.key} className="p-3 rounded-lg bg-black/30 border border-white/10">
                              <h4 className="font-medium text-white/70 mb-2">{field.label}:</h4>
                              {field.needsResearch ? (
                                researchData?.[field.key as keyof ResearchData] ? (
                                  <div className="text-white/90">
                                    {formatFieldValue(researchData, field.key, true)}
                                  </div>
                                ) : (
                                  <div className="text-white/50 italic flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-amber-400" />
                                    Awaiting research
                                  </div>
                                )
                              ) : (
                                <div className="text-white/90">
                                  {species?.[field.key as keyof TreeSpecies] ? 
                                    formatFieldValue(species, field.key) : 
                                    <span className="text-white/50">Not available</span>
                                  }
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stewardship Tab - exactly as in TREEPAGE.md */}
                {activeTab === 'stewardship' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold">
                        Stewardship
                      </h2>
                      {!researchData?.stewardship_best_practices && (
                        <div className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Fields Need Research
                        </div>
                      )}
                    </div>
                    
                    {!researchData?.stewardship_best_practices && (
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
                          <h3 className="font-medium text-white/70 mb-2">{field.label}:</h3>
                          {field.needsResearch ? (
                            researchData?.[field.key as keyof ResearchData] ? (
                              <div className="text-white/90">
                                {formatFieldValue(researchData, field.key, true)}
                              </div>
                            ) : (
                              <div className="text-white/50 italic flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-400" />
                                Awaiting research
                              </div>
                            )
                          ) : (
                            <div className="text-white/90">
                              {species?.[field.key as keyof TreeSpecies] ? 
                                formatFieldValue(species, field.key) : 
                                <span className="text-white/50">Not available</span>
                              }
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Science Tab - exactly as in TREEPAGE.md */}
                {activeTab === 'science' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold">
                        Science
                      </h2>
                    </div>
                    
                    <div className="space-y-4">
                      {scienceFields.map((field) => (
                        <div key={field.key} className="p-3 rounded-lg bg-black/30 border border-white/10">
                          <h3 className="font-medium text-white/70 mb-2">{field.label}:</h3>
                          <div className="text-white/90">
                            {species?.[field.key as keyof TreeSpecies] ? 
                              formatFieldValue(species, field.key) : 
                              <span className="text-white/50">Not available</span>
                            }
                          </div>
                        </div>
                      ))}
                      
                      {/* If no science fields are available */}
                      {scienceFields.every(field => !species?.[field.key as keyof TreeSpecies]) && (
                        <div className="p-4 text-center text-white/60">
                          No scientific data available yet.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Metadata Tab - exactly as in TREEPAGE.md */}
                {activeTab === 'metadata' && (
                  <div>
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold">
                        Metadata
                      </h2>
                    </div>
                    
                    <div className="space-y-4">
                      {metadataFields.map((field) => (
                        <div key={field.key} className="p-3 rounded-lg bg-black/30 border border-white/10">
                          <h3 className="font-medium text-white/70 mb-2">{field.label}:</h3>
                          <div className="text-white/90">
                            {species?.[field.key as keyof TreeSpecies] || researchData?.[field.key as keyof ResearchData] ? 
                              formatFieldValue(
                                species?.[field.key as keyof TreeSpecies] ? 
                                species : researchData, 
                                field.key
                              ) : 
                              <span className="text-white/50">Not available</span>
                            }
                          </div>
                        </div>
                      ))}
                      
                      {/* If no metadata fields are available */}
                      {metadataFields.every(field => 
                        !species?.[field.key as keyof TreeSpecies] && 
                        !researchData?.[field.key as keyof ResearchData]
                      ) && (
                        <div className="p-4 text-center text-white/60">
                          No metadata available yet.
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
                
                {researchData?.general_description ? (
                  <div>
                    <div className="p-4 rounded-lg bg-black/30 backdrop-blur-md border border-white/20 mb-4">
                      <div className="mb-2 text-emerald-300 font-semibold">Research Complete</div>
                      <p className="text-white/90">
                        This species has been researched. Thank you to all contributors who have funded tree intelligence!
                      </p>
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
                      disabled={researchMutation.isPending || !address}
                    >
                      {!address 
                        ? "Connect Wallet to Fund" 
                        : researchMutation.isPending 
                          ? <div className="flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {researchMutation.isPending ? "Processing Research..." : "Processing..."}
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

// Helper function to format field values for display
function formatFieldValue(data: any, key: string, isResearchField: boolean = false) {
  if (!data || data[key] === undefined || data[key] === null) {
    return 'Not available';
  }
  
  const value = data[key];
  
  // Format based on key
  switch (key) {
    case 'maximum_height':
      return typeof value === 'number' ? `${value} m` : value;
    case 'maximum_diameter':
      return typeof value === 'number' ? `${value} m` : value;
    case 'maximum_tree_age':
      return typeof value === 'number' ? `${value} years` : value;
    case 'conservation_status':
      return value;
    default:
      // For long text fields in research data, format with paragraphs
      if (isResearchField && typeof value === 'string' && value.length > 100) {
        return value.split('\n').map((paragraph: string, i: number) => (
          <p key={i} className={i > 0 ? 'mt-2' : ''}>
            {paragraph}
          </p>
        ));
      }
      return value;
  }
}

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