"use client";

import { ResearchTable } from "@/components/research-table";
import { Button } from "@/components/ui/button";
import { ResearchData, ResearchPayload, Species } from "@/lib/types";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import React from "react";
import { useAccount } from 'wagmi';



const SpeciesDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const speciesId = params.id;
  console.log(speciesId);
  const { address } = useAccount();
  console.log("address", address);

  const {
    data: species,
    isLoading,
    isError,
  } = useQuery<Species>({
    queryKey: ["species", speciesId],
    queryFn: async () => {
      if (!speciesId) throw new Error("No species ID provided");
      const { data } = await axios.get(
        `https://silviapi.herokuapp.com/core/species/${speciesId}`
      );
      return data;
    },
    enabled: !!speciesId, // Only run query if speciesId exists
  });

  const {
    data: researchData,
    isLoading: isResearchLoading,
    refetch: refetchResearch
  } = useQuery<ResearchData>({
    queryKey: ["research", species?.species_scientific_name],
    queryFn: async () => {
      if (!species?.species_scientific_name) throw new Error("No scientific name available");
      const { data } = await axios.get(
        `http://64.227.23.153:3000/ai/research/${(species?.species_scientific_name)}`
      );
      return data;
    },
    enabled: !!species?.species_scientific_name,
  });

  console.log('Research data:', researchData);

  const researchMutation = useMutation({
    mutationFn: async (payload: ResearchPayload) => {
      console.log('Sending research payload:', payload);
      const response = await axios.post(
        'http://64.227.23.153:3000/ai/research',
        payload
      );
      console.log('Research response:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Research mutation successful:', data);
      // Refetch research data after successful mutation
      refetchResearch();
    },
    onError: (error) => {
      console.error('Research mutation failed:', error);
    }
  });

  const handleResearch = () => {
    if (!species) return;
    
    const payload = {
      scientificName: species.species_scientific_name,
      commonNames: [species.species_common_name],
      researcherWallet: address!
    };
    
    console.log('Initiating research with payload:', payload);
    researchMutation.mutate(payload);
  };


  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 bg-gray-100">
        <div className="rounded-xl bg-gray-100 p-8 shadow-[inset_-12px_-12px_24px_#ffffff,inset_12px_12px_24px_#d1d1d1]">
          <div className="h-8 bg-gray-200 rounded-xl w-1/3 mb-6 shadow-[5px_5px_10px_#d1d1d1,-5px_-5px_10px_#ffffff]"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(6)].map((_, i) => (
              <div 
                key={i} 
                className="h-4 bg-gray-200 rounded-xl w-3/4 shadow-[5px_5px_10px_#d1d1d1,-5px_-5px_10px_#ffffff]"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">
            Error loading species data
          </h2>
          <Button
            onClick={() => router.back()}
            className="bg-green-800 hover:bg-green-700"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (!species) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-2xl font-bold mb-4">Species not found</h2>
          <Button
            onClick={() => router.back()}
            className="bg-green-800 hover:bg-green-700"
          >
            Go Back
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl w-full mx-auto px-4 py-2">
        <div className="flex items-center gap-2 py-4 ">
          <Button 
            onClick={() => router.back()}
            variant="outline"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gray-100 text-black 
            shadow-[5px_5px_10px_#d1d1d1,-5px_-5px_10px_#ffffff] 
            hover:shadow-[inset_5px_5px_10px_#d1d1d1,inset_-5px_-5px_10px_#ffffff] 
            transition-all duration-300"
          >
            <ArrowLeft className="w-6 h-6" />
            Back to Search
          </Button>
        </div>

        <div className="rounded-xl bg-gray-100 p-8 
          shadow-[12px_12px_24px_#d1d1d1,-12px_-12px_24px_#ffffff]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-xl bg-gray-100 
              shadow-[inset_8px_8px_16px_#d1d1d1,inset_-8px_-8px_16px_#ffffff]">
              <div className="mb-8">
                <h1 className="text-4xl font-bold mb-2 text-gray-800">
                  {species.species_scientific_name}
                </h1>
                <p className="text-2xl text-gray-600">
                  {species.species_common_name}
                </p>
              </div>

              <div className="flex gap-4 mb-8">
                <Button 
                  variant="primary" 
                  className="px-6 py-3 rounded-xl bg-green-600 
                  shadow-[5px_5px_10px_#d1d1d1,-5px_-5px_10px_#ffffff] 
                  hover:shadow-[inset_5px_5px_10px_#1b4332,inset_-5px_-5px_10px_#2d6a4f] 
                  transition-all duration-300"
                  onClick={handleResearch}
                  disabled={researchMutation.isPending}
                >
                  {researchMutation.isPending ? "Researching..." : "Research"}
                </Button>
                <Button 
                  variant="primary" 
                  className="px-6 py-3 rounded-xl bg-gray-200 text-black
                  shadow-[5px_5px_10px_#d1d1d1,-5px_-5px_10px_#ffffff] 
                  hover:shadow-[inset_5px_5px_10px_#d1d1d1,inset_-5px_-5px_10px_#ffffff] 
                  transition-all duration-300"
                  disabled={researchMutation.isPending}
                  onClick={() => router.push(`/species/${speciesId}/nfts`)}
                >
                  View NFT
                </Button>
              </div>

              <div className="p-6 rounded-xl bg-gray-100 
                shadow-[inset_8px_8px_16px_#d1d1d1,inset_-8px_-8px_16px_#ffffff]">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Taxonomy</h2>
                <div className="space-y-4">
                  <p className="flex justify-between items-center p-3 rounded-lg bg-gray-100 
                    shadow-[3px_3px_6px_#d1d1d1,-3px_-3px_6px_#ffffff]">
                    <span className="font-medium">Family:</span>
                    <span>{species.family}</span>
                  </p>
                  <p className="flex justify-between items-center p-3 rounded-lg bg-gray-100 
                    shadow-[3px_3px_6px_#d1d1d1,-3px_-3px_6px_#ffffff]">
                    <span className="font-medium">Genus:</span>
                    <span>{species.genus}</span>
                  </p>
                  {species.subspecies && (
                    <p className="flex justify-between items-center p-3 rounded-lg bg-gray-100 
                      shadow-[3px_3px_6px_#d1d1d1,-3px_-3px_6px_#ffffff]">
                      <span className="font-medium">Subspecies:</span>
                      <span>{species.subspecies}</span>
                    </p>
                  )}
                  <p className="flex justify-between items-center p-3 rounded-lg bg-gray-100 
                    shadow-[3px_3px_6px_#d1d1d1,-3px_-3px_6px_#ffffff]">
                    <span className="font-medium">Class:</span>
                    <span>{species.taxonomic_class}</span>
                  </p>
                  <p className="flex justify-between items-center p-3 rounded-lg bg-gray-100 
                    shadow-[3px_3px_6px_#d1d1d1,-3px_-3px_6px_#ffffff]">
                    <span className="font-medium">Order:</span>
                    <span>{species.taxonomic_order}</span>
                  </p>
                </div>

                <div className="mt-8">
                  <div className="">
                    <h2 className="text-xl font-semibold mb-4 text-gray-800">General Description</h2>
                    <div className="p-4 rounded-lg bg-gray-100 
                      shadow-[3px_3px_6px_#d1d1d1,-3px_-3px_6px_#ffffff]">
                      <p className="text-gray-700 leading-relaxed">
                        {researchData?.general_description || 
                          "This species is currently being researched. Description will be available soon."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 rounded-xl bg-gray-100 
              shadow-[inset_8px_8px_16px_#d1d1d1,inset_-8px_-8px_16px_#ffffff]">
              <ResearchTable 
                data={researchData} 
                isLoading={isResearchLoading} 
                researchMutation={researchMutation}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeciesDetailsPage;
