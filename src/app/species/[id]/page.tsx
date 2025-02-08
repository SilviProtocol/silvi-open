"use client";

import { ResearchTable } from "@/components/research-table";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import React from "react";

interface Species {
  id: string;
  species_common_name: string;
  species_scientific_name: string;
  family: string;
  genus: string;
  subspecies?: string;
  taxonomic_class: string;
  taxonomic_order: string;
  // Add other fields from your API response
}

const SpeciesDetailsPage = () => {
  const params = useParams();
  const router = useRouter();
  const speciesId = params.id;
  console.log(speciesId);

  const {
    data: species,
    isLoading,
    isError,
  } = useQuery<Species>({
    queryKey: ["species", speciesId],
    queryFn: async () => {
      if (!speciesId) throw new Error("No species ID provided");
      const { data } = await axios.get(
        `http://localhost:8000/core/species/${speciesId}`
      );
      return data;
    },
    enabled: !!speciesId, // Only run query if speciesId exists
  });

  console.log(species);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Loading skeleton */}
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 rounded w-3/4"></div>
              ))}
            </div>
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-2 py-10">
        <ArrowLeft className="w-6 h-6" />
        <p onClick={() => router.back()} className="">
          Back to Search
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-6">
          {species.species_common_name}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">
              Scientific Classification
            </h2>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Scientific Name:</span>{" "}
                {species.species_scientific_name}
              </p>
              <p>
                <span className="font-medium">Family:</span> {species.family}
              </p>
              <p>
                <span className="font-medium">Genus:</span> {species.genus}
              </p>
              {species.subspecies && (
                <p>
                  <span className="font-medium">Subspecies:</span>{" "}
                  {species.subspecies}
                </p>
              )}
              <p>
                <span className="font-medium">Class:</span>{" "}
                {species.taxonomic_class}
              </p>
              <p>
                <span className="font-medium">Order:</span>{" "}
                {species.taxonomic_order}
              </p>
            </div>
          </div>

          {/* Add more sections for additional information */}
          <div>
            <div className="">
              <ResearchTable />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeciesDetailsPage;
