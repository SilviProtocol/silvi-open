"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, ExternalLink, Info, Share2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { WalletConnectDialog } from "@/components/wallet-connect-dialog"
import { ResearchProgress } from "@/components/research-progress"
import { speciesAPI, researchAPI } from "@/lib/api"
import { mintNFT } from "@/lib/wallet-utils"

export default function SpeciesDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false)
  const [speciesData, setSpeciesData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Research state
  const [isResearching, setIsResearching] = useState(false)
  const [researchComplete, setResearchComplete] = useState(false)
  const [researchStatus, setResearchStatus] = useState("")
  const [researchProgress, setResearchProgress] = useState(0)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [selectedChain, setSelectedChain] = useState<string | null>(null)

  // Fetch species data
  useEffect(() => {
    async function fetchSpeciesData() {
      setLoading(true)
      setError(null)

      try {
        const data = await speciesAPI.getSpeciesDetails(params.slug)
        setSpeciesData(data)
      } catch (error) {
        console.error("Error fetching species data:", error)
        setError("Failed to load species data. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchSpeciesData()
  }, [params.slug])

  const handleMintNFT = () => {
    setIsWalletDialogOpen(true)
  }

  const handleWalletConnected = async (address: string, chainId: string) => {
    setWalletAddress(address)
    setSelectedChain(chainId)

    try {
      // Start research process
      setIsResearching(true)
      setResearchStatus("Preparing to mint NFT...")
      setResearchProgress(10)

      // Mint NFT
      const mintResult = await mintNFT(chainId, speciesData.taxon_id)

      // Update progress
      setResearchStatus("NFT minted! Starting research process...")
      setResearchProgress(30)

      // Fund research with the backend
      const researchResult = await researchAPI.fundResearch(
        speciesData.taxon_id,
        address,
        chainId,
        mintResult.transactionHash,
      )

      // Update progress as research continues
      setResearchStatus("AI analyzing species data...")
      setResearchProgress(60)

      // Simulate research time (in a real app, this would be handled by the backend)
      setTimeout(() => {
        setResearchStatus("Generating research report...")
        setResearchProgress(80)

        setTimeout(() => {
          setResearchStatus("Finalizing research...")
          setResearchProgress(95)

          setTimeout(() => {
            // Update species data with research results
            setSpeciesData({
              ...speciesData,
              ...researchResult.research_data,
              isResearched: true,
            })

            // Complete research
            setResearchProgress(100)
            setResearchComplete(true)

            // After a delay, redirect to the updated species page
            setTimeout(() => {
              setIsResearching(false)
              router.refresh()
            }, 3000)
          }, 1000)
        }, 1500)
      }, 2000)
    } catch (error) {
      console.error("Error in research process:", error)
      setResearchStatus("Research process failed. Please try again.")
      setIsResearching(false)
    }
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
            <p className="mt-4 text-muted-foreground">Loading species information...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error || !speciesData) {
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
            <h2 className="text-xl font-bold">Error Loading Species</h2>
            <p className="mt-2 text-muted-foreground">{error || "Species not found"}</p>
            <Button className="mt-4" asChild>
              <Link href="/">Return Home</Link>
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
        <div className="container px-4 py-6 md:py-8">
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/species">
                <ArrowLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Link>
            </Button>
            <h1 className="text-2xl font-bold md:text-3xl">{speciesData.common_name}</h1>
            {speciesData.conservation_status && (
              <Badge variant="outline" className="ml-2">
                {speciesData.conservation_status}
              </Badge>
            )}
            <div className="ml-auto flex gap-2">
              <Button variant="ghost" size="icon">
                <Share2 className="h-4 w-4" />
                <span className="sr-only">Share</span>
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Info className="h-4 w-4" />
                    <span className="sr-only">Info</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>About this page</DialogTitle>
                    <DialogDescription>
                      This page displays information about tree species. For unresearched species, you can fund research
                      by minting an NFT.
                    </DialogDescription>
                  </DialogHeader>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <div className="overflow-hidden rounded-lg">
                <Image
                  src={speciesData.image || "/placeholder.svg?height=600&width=800"}
                  alt={speciesData.common_name}
                  width={800}
                  height={600}
                  className="w-full object-cover"
                />
              </div>
              <Tabs defaultValue="overview">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="habitat">Habitat</TabsTrigger>
                  <TabsTrigger value="gallery">Gallery</TabsTrigger>
                </TabsList>
                <TabsContent value="overview" className="space-y-4 pt-4">
                  <div>
                    <h2 className="text-xl font-semibold">Description</h2>
                    {speciesData.general_description ? (
                      <p className="mt-2 text-muted-foreground">{speciesData.general_description}</p>
                    ) : (
                      <p className="mt-2 text-muted-foreground">
                        This tree is missing key datapoints. Can you help us research it?
                      </p>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Scientific Classification</h2>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div className="rounded-lg border p-3">
                        <p className="text-sm font-medium">Scientific Name</p>
                        <p className="text-sm italic text-muted-foreground">{speciesData.accepted_scientific_name}</p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-sm font-medium">Family</p>
                        <p className="text-sm text-muted-foreground">{speciesData.family || "Unknown"}</p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-sm font-medium">Genus</p>
                        <p className="text-sm text-muted-foreground">{speciesData.genus || "Unknown"}</p>
                      </div>
                      <div className="rounded-lg border p-3">
                        <p className="text-sm font-medium">Species</p>
                        <p className="text-sm text-muted-foreground">{speciesData.species || "Unknown"}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="habitat" className="space-y-4 pt-4">
                  <div>
                    <h2 className="text-xl font-semibold">Habitat</h2>
                    {speciesData.habitat ? (
                      <p className="mt-2 text-muted-foreground">{speciesData.habitat}</p>
                    ) : (
                      <p className="mt-2 text-muted-foreground">
                        Habitat information is not available for this species yet. Fund research to learn more.
                      </p>
                    )}
                  </div>
                  {speciesData.native_adapted_habitats && (
                    <div>
                      <h2 className="text-xl font-semibold">Native Habitats</h2>
                      <p className="mt-2 text-muted-foreground">{speciesData.native_adapted_habitats}</p>
                    </div>
                  )}
                  <div className="aspect-video overflow-hidden rounded-lg bg-muted">
                    <div className="h-full w-full bg-muted flex items-center justify-center">
                      <p className="text-muted-foreground">Distribution map placeholder</p>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="gallery" className="pt-4">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="aspect-square overflow-hidden rounded-lg">
                        <Image
                          src={`/placeholder.svg?height=300&width=300&text=Image ${i + 1}`}
                          alt={`Gallery image ${i + 1}`}
                          width={300}
                          height={300}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <div className="space-y-6">
              {isResearching ? (
                <ResearchProgress
                  status={researchStatus}
                  progress={researchProgress}
                  isComplete={researchComplete}
                  points={2}
                />
              ) : !speciesData.isResearched ? (
                <Card className="overflow-hidden">
                  <CardHeader className="bg-primary/10 pb-4">
                    <CardTitle>Fund Research</CardTitle>
                    <CardDescription>This species needs more research. Fund it by minting an NFT.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="mb-6 rounded-lg border p-3">
                      <p className="text-sm">
                        By minting an NFT for $3, you&apos;ll fund scientific research for this species and receive a
                        unique digital collectible.
                      </p>
                      <p className="text-sm mt-2">
                        Funds support AI research agent costs, server costs, and human research.
                      </p>
                    </div>
                    <Button className="w-full" onClick={handleMintNFT}>
                      Mint NFT to Fund Research
                    </Button>
                    <p className="mt-2 text-center text-xs text-muted-foreground">Fixed contribution: $3.00</p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Research Status</CardTitle>
                    <CardDescription>This species has been fully researched.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border p-3">
                      <p className="text-sm">
                        All research goals for this species have been met. Thank you to all contributors!
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader>
                  <CardTitle>Related Species</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4">
                  {[
                    {
                      name: "Coast Redwood",
                      scientificName: "Sequoia sempervirens",
                      image: "/placeholder.svg?height=100&width=100",
                      taxonId: "coast-redwood",
                    },
                    {
                      name: "Dawn Redwood",
                      scientificName: "Metasequoia glyptostroboides",
                      image: "/placeholder.svg?height=100&width=100",
                      taxonId: "dawn-redwood",
                    },
                  ].map((tree, index) => (
                    <Link
                      key={index}
                      href={`/species/${tree.taxonId}`}
                      className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent"
                    >
                      <Image
                        src={tree.image || "/placeholder.svg"}
                        alt={tree.name}
                        width={50}
                        height={50}
                        className="h-12 w-12 rounded-md object-cover"
                      />
                      <div>
                        <p className="font-medium">{tree.name}</p>
                        <p className="text-xs italic text-muted-foreground">{tree.scientificName}</p>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>External Resources</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                  {[
                    { name: "Wikipedia", url: "#" },
                    { name: "IUCN Red List", url: "#" },
                    { name: "Global Trees Campaign", url: "#" },
                  ].map((resource, index) => (
                    <Link
                      key={index}
                      href={resource.url}
                      className="flex items-center justify-between rounded-lg p-2 transition-colors hover:bg-accent"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>{resource.name}</span>
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <WalletConnectDialog
        open={isWalletDialogOpen}
        onOpenChange={setIsWalletDialogOpen}
        onSuccess={handleWalletConnected}
        forMinting={true}
      />
    </div>
  )
}

