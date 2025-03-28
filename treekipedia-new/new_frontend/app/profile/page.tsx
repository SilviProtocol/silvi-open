"use client"

import { useState, useEffect } from "react"
import { Edit, Save, Wallet } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { WalletConnectDialog } from "@/components/wallet-connect-dialog"
import { treederboardAPI } from "@/lib/api"
import { mockUserProfile } from "@/lib/mock-data"

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [bio, setBio] = useState("")

  // Fetch user data
  useEffect(() => {
    async function fetchUserData() {
      setLoading(true)
      setError(null)

      try {
        // In a real app, we would get the wallet address from a context or state
        const walletAddress = localStorage.getItem("walletAddress")

        // If we have a wallet address, fetch the user profile
        if (walletAddress) {
          try {
            console.log("Fetching user profile for wallet:", walletAddress)
            const data = await treederboardAPI.getUserProfile(walletAddress)
            console.log("User profile data:", data)
            setUserData(data)
            setDisplayName(data.display_name || "")
            setBio(
              data.bio ||
                "Tree lover and conservation advocate. I'm passionate about preserving our forests for future generations.",
            )
          } catch (error) {
            console.error("Error fetching user profile:", error)
            // Fall back to mock data if API call fails
            console.log("Using fallback mock data")
            setUserData({
              ...mockUserProfile,
              wallet_address: walletAddress,
              walletConnected: true,
            })
            setDisplayName(mockUserProfile.display_name)
            setBio(
              "Tree lover and conservation advocate. I'm passionate about preserving our forests for future generations.",
            )
          }
        } else {
          // Mock data for demonstration when no wallet is connected
          console.log("No wallet connected, using mock data")
          setUserData({
            ...mockUserProfile,
            walletConnected: false,
          })
          setDisplayName(mockUserProfile.display_name)
          setBio(
            "Tree lover and conservation advocate. I'm passionate about preserving our forests for future generations.",
          )
        }
      } catch (error) {
        console.error("Error in profile page:", error)
        setError("Failed to load user profile. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const handleSaveProfile = async () => {
    try {
      // In a real app, we would get the wallet address from a context or state
      const walletAddress = userData.wallet_address

      // Update the user profile
      const updatedProfile = await treederboardAPI.updateUserProfile(walletAddress, displayName)

      // Update local state
      setUserData({
        ...userData,
        display_name: updatedProfile.display_name,
      })

      setIsEditing(false)
    } catch (error) {
      console.error("Error updating profile:", error)
      // Show error message to user
    }
  }

  const handleConnectWallet = () => {
    setIsWalletDialogOpen(true)
  }

  const handleWalletConnected = (address: string) => {
    // Save wallet address to localStorage
    localStorage.setItem("walletAddress", address)

    // Update user data with connected wallet
    setUserData({
      ...userData,
      wallet_address: address,
      walletConnected: true,
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
          <div className="container flex h-16 items-center justify-between px-4">
            <MainNav />
            <div className="ml-auto flex items-center space-x-4">
              <UserNav />
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading profile...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error || !userData) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
          <div className="container flex h-16 items-center justify-between px-4">
            <MainNav />
            <div className="ml-auto flex items-center space-x-4">
              <UserNav />
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-bold">Error Loading Profile</h2>
            <p className="mt-2 text-muted-foreground">{error || "Profile not found"}</p>
            <Button className="mt-4" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          <MainNav />
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="relative h-48 w-full overflow-hidden md:h-64 bg-silvi-green/20">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-silvi-green/10"></div>
        </div>
        <div className="container px-4">
          <div className="relative -mt-20 mb-6 flex flex-col md:flex-row md:items-end">
            <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-background md:h-40 md:w-40 mx-auto md:mx-0">
              <Image
                src={userData.avatar || "/placeholder.svg?height=200&width=200"}
                alt={userData.display_name || userData.wallet_address}
                fill
                className="object-cover"
              />
            </div>
            <div className="ml-0 md:ml-4 mb-4 text-center md:text-left mt-4 md:mt-0">
              <h1 className="text-2xl font-bold md:text-3xl">{userData.display_name || "Set Display Name"}</h1>
              <p className="text-muted-foreground">
                @
                {userData.username ||
                  userData.wallet_address.substring(0, 6) +
                    "..." +
                    userData.wallet_address.substring(userData.wallet_address.length - 4)}
              </p>
            </div>
            <div className="ml-0 md:ml-auto mb-4 flex gap-2 justify-center md:justify-end mt-4 md:mt-0">
              {isEditing ? (
                <Button className="bg-silvi-green hover:bg-silvi-green/90 text-white" onClick={handleSaveProfile}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Profile
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              )}
              {!userData.walletConnected && (
                <Button className="bg-silvi-green hover:bg-silvi-green/90 text-white" onClick={handleConnectWallet}>
                  <Wallet className="mr-2 h-4 w-4" />
                  Connect Wallet
                </Button>
              )}
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile</CardTitle>
                  {isEditing && <CardDescription>Edit your profile information</CardDescription>}
                </CardHeader>
                <CardContent className="space-y-4">
                  {isEditing ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="bio">Bio</Label>
                        <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4} />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium">Bio</h3>
                        <p className="text-sm text-muted-foreground">{bio}</p>
                      </div>
                      <Separator />
                      <div className="space-y-1">
                        <h3 className="text-sm font-medium">Stats</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-lg bg-muted p-2">
                            <p className="text-xs text-muted-foreground">Points</p>
                            <p className="font-medium">{userData.total_points?.toLocaleString() || 0}</p>
                          </div>
                          <div className="rounded-lg bg-muted p-2">
                            <p className="text-xs text-muted-foreground">Rank</p>
                            <p className="font-medium">#{userData.rank || 0}</p>
                          </div>
                          <div className="rounded-lg bg-muted p-2">
                            <p className="text-xs text-muted-foreground">NFTs</p>
                            <p className="font-medium">{userData.nfts?.length || 0}</p>
                          </div>
                          <div className="rounded-lg bg-muted p-2">
                            <p className="text-xs text-muted-foreground">Species</p>
                            <p className="font-medium">{userData.nfts?.length || 0}</p>
                          </div>
                        </div>
                      </div>
                      {userData.walletConnected && (
                        <>
                          <Separator />
                          <div className="space-y-1">
                            <h3 className="text-sm font-medium">Wallet</h3>
                            <p className="text-sm font-mono text-muted-foreground">{userData.wallet_address}</p>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Achievements</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="flex aspect-square flex-col items-center justify-center rounded-lg bg-muted p-2"
                      >
                        <div className="rounded-full bg-primary/10 p-2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="h-6 w-6 text-primary"
                          >
                            <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
                            <path d="M10 2c1 .5 2 2 2 5" />
                          </svg>
                        </div>
                        <p className="mt-1 text-center text-xs font-medium">
                          {i === 0
                            ? "First NFT"
                            : i === 1
                              ? "Tree Expert"
                              : i === 2
                                ? "Collector"
                                : i === 3
                                  ? "Researcher"
                                  : i === 4
                                    ? "Conservationist"
                                    : "Explorer"}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-6">
              <Tabs defaultValue="nfts">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="nfts">My NFTs</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>
                <TabsContent value="nfts" className="pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Tree NFT Collection</CardTitle>
                      <CardDescription>NFTs you&apos;ve minted to support tree research</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {userData.nfts && userData.nfts.length > 0 ? (
                          userData.nfts.map((nft: any) => (
                            <div
                              key={nft.id}
                              className="overflow-hidden rounded-lg border bg-background transition-colors hover:bg-accent"
                            >
                              <div className="aspect-square overflow-hidden">
                                <Image
                                  src={nft.metadata?.image || "/placeholder.svg"}
                                  alt={nft.metadata?.name || `NFT #${nft.id}`}
                                  width={300}
                                  height={300}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="p-3">
                                <h3 className="font-semibold">{nft.metadata?.name || `NFT #${nft.id}`}</h3>
                                <p className="text-xs text-muted-foreground">
                                  Species: {nft.metadata?.species || nft.taxon_id}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Minted: {new Date(nft.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full flex flex-col items-center justify-center py-8">
                            <p className="text-center text-muted-foreground">You haven&apos;t minted any NFTs yet.</p>
                            <Button className="mt-4" asChild>
                              <Link href="/species">Explore Species</Link>
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="activity" className="pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>Your recent actions and contributions</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {userData.nfts && userData.nfts.length > 0 ? (
                          userData.nfts.map((nft: any) => (
                            <div key={nft.id} className="flex items-center justify-between rounded-lg border p-4">
                              <div>
                                <p className="font-medium">Minted NFT</p>
                                <p className="text-sm text-muted-foreground">
                                  {nft.metadata?.name || `NFT #${nft.id}`}
                                </p>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {new Date(nft.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8">
                            <p className="text-center text-muted-foreground">No activity to display yet.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      <WalletConnectDialog
        open={isWalletDialogOpen}
        onOpenChange={setIsWalletDialogOpen}
        onSuccess={handleWalletConnected}
      />
    </div>
  )
}

