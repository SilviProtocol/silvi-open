import React from "react";
import { Leaf, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { TreeSpecies } from "@/lib/types";
import { useResearchProcess } from "../hooks/useResearchProcess";

interface ResearchCardProps {
  species: TreeSpecies;
  isResearched: boolean;
  taxonId: string;
  address: string | undefined;
  refetchSpecies: () => Promise<any>;
  refetchResearch: () => Promise<any>;
}

export function ResearchCard({
  species,
  isResearched,
  taxonId,
  address,
  refetchSpecies,
  refetchResearch,
}: ResearchCardProps) {
  const router = useRouter();
  const { isResearching, researchStatus, progressMessage, startResearch } = useResearchProcess(
    taxonId,
    species,
    address,
    refetchSpecies,
    refetchResearch
  );

  return (
    <div className="rounded-xl bg-black/30 backdrop-blur-md border border-white/20 p-6 text-white mb-6 sticky top-4">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Leaf className="w-5 h-5 mr-2 text-emerald-400" />
        Tree Intelligence Commons
      </h2>

      {isResearched ? (
        <div>
          <div className="p-4 rounded-lg bg-black/30 backdrop-blur-md border border-white/20 mb-4">
            <div className="mb-2 text-emerald-300 font-semibold">AI Research Complete</div>
            <p className="text-white/90 mb-2">
              This species has been researched with AI. Thank you to all contributors who have
              funded tree intelligence!
            </p>

            {/* Research data statistics would go here */}
          </div>
          <Button
            onClick={() => router.push("/profile")}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            View My Contreebutions
          </Button>
        </div>
      ) : (
        <div>
          {isResearching ? (
            <div className="p-4 rounded-lg bg-black/30 backdrop-blur-md border border-emerald-500/40 mb-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-white/90">Research Status:</span>
                <span className="font-bold text-emerald-300">Processing</span>
              </div>
              <div className="flex items-center justify-center gap-3 mb-3">
                <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                <span className="text-emerald-300 font-medium">{progressMessage}</span>
              </div>
              <div className="relative pt-1">
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-emerald-900/30">
                  <div
                    className="animate-pulse bg-emerald-500 h-full rounded"
                    style={{ width: "80%" }}
                  ></div>
                </div>
              </div>
              <p className="text-white/70 text-sm">
                This typically takes 20-30 seconds. The page will update automatically when complete.
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-black/30 backdrop-blur-md border border-white/20 mb-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-white/90">Fund Research:</span>
                <span className="font-bold text-emerald-300">$3.00</span>
              </div>
              <div className="space-y-2 text-sm text-white/70">
                <p>
                  <span className="inline-block w-5 h-5 text-center mr-1 rounded-full bg-white/10">
                    ✓
                  </span>
                  Unlock AI research for this species
                </p>
                <p>
                  <span className="inline-block w-5 h-5 text-center mr-1 rounded-full bg-white/10">
                    ✓
                  </span>
                  Receive a Contreebution NFT
                </p>
                <p>
                  <span className="inline-block w-5 h-5 text-center mr-1 rounded-full bg-white/10">
                    ✓
                  </span>
                  Earn points on the Treederboard
                </p>
                <p>
                  <span className="inline-block w-5 h-5 text-center mr-1 rounded-full bg-white/10">
                    ✓
                  </span>
                  Help build the tree knowledge commons
                </p>
              </div>
            </div>
          )}

          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            onClick={startResearch}
            disabled={isResearching || !address}
          >
            {!address
              ? "Connect Wallet to Fund"
              : isResearching
              ? "Processing Research..."
              : "Fund Research ($3)"}
          </Button>
        </div>
      )}

      {/* Research Process Info */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <h3 className="text-lg font-semibold mb-3">How It Works</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-900/50 text-emerald-400 flex items-center justify-center text-xs">
              1
            </div>
            <p className="text-white/80">Fund research for this species.</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-900/50 text-emerald-400 flex items-center justify-center text-xs">
              2
            </div>
            <p className="text-white/80">AI research agent collects & structures data.</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-900/50 text-emerald-400 flex items-center justify-center text-xs">
              3
            </div>
            <p className="text-white/80">
              Data is stored on IPFS & a Contreebution NFT is minted.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-900/50 text-emerald-400 flex items-center justify-center text-xs">
              4
            </div>
            <p className="text-white/80">Knowledge is available for everyone forever.</p>
          </div>
        </div>
      </div>
    </div>
  );
}