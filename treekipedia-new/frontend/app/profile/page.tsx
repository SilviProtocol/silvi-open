"use client";

import { Navbar } from "@/components/navbar";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { getUserProfile, updateUserProfile } from "@/lib/api";
import { SponsorshipStatus } from "@/components/sponsorship-status";

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [displayName, setDisplayName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function fetchUserProfile() {
      if (!address) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const profile = await getUserProfile(address);
        setUserProfile(profile);
        setDisplayName(profile.display_name || "");
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserProfile();
  }, [address]);

  const handleUpdateProfile = async () => {
    if (!address) return;

    try {
      setIsUpdating(true);
      setSaveSuccess(false); // Reset save success state
      
      const updatedProfile = await updateUserProfile(address, displayName);
      
      // Update the user profile with the new display name
      setUserProfile({
        ...userProfile,
        display_name: updatedProfile.display_name,
      });
      
      // Show success message
      setSaveSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="w-full min-h-screen">
        <div
          className="min-h-screen py-12 px-4 sm:px-6"
        >
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8">My Profile</h1>

            {!isConnected ? (
              <div className="p-8 rounded-xl bg-black/30 backdrop-blur-md border border-white/20 text-center text-white">
                <p className="mb-4 text-lg">Connect your wallet to view your profile</p>
              </div>
            ) : isLoading ? (
              <div className="p-8 rounded-xl bg-black/30 backdrop-blur-md border border-white/20 text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                <p className="mt-4">Loading your profile...</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {/* Profile Card */}
                <div className="p-6 rounded-xl bg-black/30 backdrop-blur-md border border-white/20 text-white">
                  <h2 className="text-xl font-semibold mb-4">Profile Information</h2>

                  <div className="grid gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Wallet Address</label>
                      <div className="p-3 rounded-lg bg-black/30 border border-white/10 font-mono text-sm overflow-auto">
                        {address}
                      </div>
                    </div>

                    <div>
                      <label htmlFor="displayName" className="block text-sm font-medium mb-1">
                        Display Name
                      </label>
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          <input
                            id="displayName"
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            placeholder="Enter display name"
                            className="p-3 rounded-lg bg-black/30 border border-white/10 w-full text-white"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleUpdateProfile();
                              }
                            }}
                          />
                          <Button onClick={handleUpdateProfile} disabled={isUpdating}>
                            {isUpdating ? "Saving..." : "Save"}
                          </Button>
                        </div>
                        
                        {/* Success message */}
                        {saveSuccess && (
                          <div className="text-emerald-400 text-sm px-2 py-1 rounded animate-pulse">
                            ✅ Display name saved successfully!
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Tree Points</label>
                      <div className="p-3 rounded-lg bg-black/30 border border-white/10">
                        {userProfile?.total_points || 0} points
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Trees Researched</label>
                      <div className="p-3 rounded-lg bg-black/30 border border-white/10">
                        {userProfile?.contribution_count || 0} trees
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sponsorship Status Card */}
                <SponsorshipStatus />

                {/* NFT Collection Card */}
                <div className="p-6 rounded-xl bg-black/30 backdrop-blur-md border border-white/20 text-white">
                  <h2 className="text-xl font-semibold mb-4">My Contreebution NFTs</h2>
                  {userProfile?.nfts && userProfile.nfts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {userProfile.nfts.map((nft: any) => (
                        <div
                          key={nft.id}
                          className="p-4 rounded-lg bg-black/30 border border-white/10"
                        >
                          <div className="aspect-square rounded-lg bg-gradient-to-br from-green-300/30 to-emerald-600/30 flex items-center justify-center mb-2">
                            NFT #{nft.global_id}
                          </div>
                          <div className="text-sm font-medium truncate">{nft.taxon_id}</div>
                          <div className="text-xs text-white/70">
                            Created: {new Date(nft.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-8">
                      <p className="text-lg mb-2">You don't have any NFTs yet</p>
                      <p className="text-sm text-white/70">
                        Fund research for a tree species to earn your first NFT
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}