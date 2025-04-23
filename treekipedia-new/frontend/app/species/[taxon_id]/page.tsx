"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAccount } from "wagmi";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpeciesHeader } from "./components/SpeciesHeader";
import { TabContainer } from "./components/TabContainer";
import { ResearchCard } from "./components/ResearchCard";
import { useSpeciesData } from "./hooks/useSpeciesData";

export default function SpeciesDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const taxonId = params.taxon_id as string;
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState("overview");

  // taxonId from URL parameter

  // Use our custom hook that handles data fetching and merging
  const {
    species,
    researchData,
    isLoading,
    isError,
    isResearched,
    getFieldValue,
    isFieldResearched,
    refetchSpecies,
    refetchResearch,
  } = useSpeciesData(taxonId);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-16 flex justify-center items-center">
          <div className="rounded-xl bg-black/30 backdrop-blur-md border border-white/20 p-5 w-full max-w-2xl">
            <div className="flex items-center justify-center mb-6">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-300" />
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

  // Error state
  if (isError) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-16 flex justify-center items-center">
          <div className="rounded-xl bg-black/30 backdrop-blur-md border border-white/20 p-5 w-full max-w-2xl text-center text-white">
            <div className="flex flex-col">
              <div className="flex items-center justify-center mb-3">
                <div className="text-5xl mr-3">❌</div>
                <h3 className="text-xl font-bold text-emerald-300">Error Loading Species Data</h3>
              </div>
              <p className="text-white text-lg leading-relaxed mb-6">
                Sorry, we encountered an error while trying to load this species. Please try again later.
              </p>
              <Button
                onClick={() => router.push("/search")}
                className="inline-flex px-6 py-3 bg-emerald-600/80 hover:bg-emerald-600 backdrop-blur-md rounded-xl text-white font-semibold transition-colors"
              >
                Return to Search
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not found state
  if (!species) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-16 flex justify-center items-center">
          <div className="rounded-xl bg-black/30 backdrop-blur-md border border-white/20 p-5 w-full max-w-2xl text-center text-white">
            <div className="flex flex-col">
              <div className="flex items-center justify-center mb-3">
                <div className="text-5xl mr-3">🔍</div>
                <h3 className="text-xl font-bold text-emerald-300">Species Not Found</h3>
              </div>
              <p className="text-white text-lg leading-relaxed mb-6">
                We couldn't find information about this species. It may not exist in our database.
              </p>
              <Button
                onClick={() => router.push("/search")}
                className="inline-flex px-6 py-3 bg-emerald-600/80 hover:bg-emerald-600 backdrop-blur-md rounded-xl text-white font-semibold transition-colors"
              >
                Return to Search
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="min-h-screen py-8">
        <div className="max-w-7xl w-full mx-auto px-4 py-2">
          {/* Data Source Legend */}
          <div className="flex items-center justify-end gap-4 pb-2 text-base text-white/80">
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-blue-400"></span>
              <span>Human-Verified Data</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-full bg-emerald-400"></span>
              <span>AI-Generated Data</span>
            </div>
          </div>

          <div className="flex items-center gap-2 py-4">
            <Button
              onClick={() => router.push("/search")}
              variant="outline"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-black/30 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-colors font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Search
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Information Column */}
            <div className="lg:col-span-2">
              <div className="rounded-xl bg-black/30 backdrop-blur-md border border-white/20 p-6 text-white mb-6">
                <SpeciesHeader species={species} />

                {/* Tab Navigation */}
                <TabContainer 
                  activeTab={activeTab} 
                  setActiveTab={setActiveTab} 
                  species={species} 
                  researchData={researchData} 
                  isResearched={isResearched} 
                  getFieldValue={getFieldValue} 
                />
              </div>
            </div>

            {/* Side Column */}
            <div className="lg:col-span-1">
              <ResearchCard 
                species={species} 
                isResearched={isResearched} 
                taxonId={taxonId}
                address={address} 
                refetchSpecies={refetchSpecies}
                refetchResearch={refetchResearch}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}