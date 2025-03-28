"use client"

import { useState, useEffect } from "react"
import { Trophy } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { treederboardAPI } from "@/lib/api"

export default function TreederboardPage() {
  const [leaderboardData, setLeaderboardData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState("all-time")
  const [userRank, setUserRank] = useState<any>(null)

  // Fetch leaderboard data
  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true)
      setError(null)

      try {
        const data = await treederboardAPI.getLeaderboard(50)
        setLeaderboardData(data)

        // In a real app, we would fetch the user's rank separately
        // For now, we'll simulate it with a mock user
        setUserRank({
          rank: 42,
          total_points: 3250,
          contribution_count: 8,
          total_users: 1245,
        })
      } catch (error) {
        console.error("Error fetching leaderboard:", error)
        setError("Failed to load leaderboard data. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [timeframe])

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
            <p className="mt-4 text-muted-foreground">Loading Treederboard...</p>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
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
            <h2 className="text-xl font-bold">Error Loading Treederboard</h2>
            <p className="mt-2 text-muted-foreground">{error}</p>
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
        <div className="relative w-full py-16 overflow-hidden bg-silvi-darkgreen">
          <div className="container relative z-10 px-4 text-center">
            <h1 className="text-4xl font-bold text-silvi-mint mb-4">Treederboard</h1>
            <p className="text-white/80 max-w-2xl mx-auto">
              This leaderboard showcases our top contributors. Rankings are based on the score earned for research
              funding and social media shares.
            </p>
          </div>
        </div>
        <div className="container px-4 py-6 md:py-8 -mt-8">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-[3fr_1fr]">
            <div className="space-y-6">
              <Tabs
                defaultValue="all-time"
                onValueChange={setTimeframe}
                className="bg-silvi-darkgreen/10 p-4 rounded-lg"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">Top Contreebutors</h2>
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">LIVE RANKINGS</span>
                  </div>
                  <TabsList className="bg-black/20 w-full sm:w-auto">
                    <TabsTrigger
                      value="all-time"
                      className="data-[state=active]:bg-silvi-green data-[state=active]:text-white"
                    >
                      All Time
                    </TabsTrigger>
                    <TabsTrigger
                      value="monthly"
                      className="data-[state=active]:bg-silvi-green data-[state=active]:text-white"
                    >
                      Monthly
                    </TabsTrigger>
                    <TabsTrigger
                      value="weekly"
                      className="data-[state=active]:bg-silvi-green data-[state=active]:text-white"
                    >
                      Weekly
                    </TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="all-time" className="pt-4">
                  <Table className="text-white">
                    <TableHeader>
                      <TableRow className="border-white/10">
                        <TableHead className="w-16">Rank</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead className="text-right">Wallet</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboardData.map((user, index) => (
                        <TableRow key={user.id} className="border-white/10">
                          <TableCell className="font-medium">
                            <span
                              className={`inline-block w-6 h-6 rounded-full text-center text-sm ${
                                index === 0
                                  ? "bg-yellow-500"
                                  : index === 1
                                    ? "bg-gray-400"
                                    : index === 2
                                      ? "bg-amber-700"
                                      : "bg-transparent"
                              }`}
                            >
                              {index + 1}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="rounded-full overflow-hidden h-8 w-8">
                                <Image
                                  src={user.avatar || "/placeholder.svg"}
                                  alt={user.display_name || user.wallet_address}
                                  width={32}
                                  height={32}
                                  className="object-cover"
                                />
                              </div>
                              <span>
                                {user.display_name ||
                                  user.wallet_address.substring(0, 6) +
                                    "..." +
                                    user.wallet_address.substring(user.wallet_address.length - 4)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs text-white/70">
                            {user.wallet_address.substring(0, 6) +
                              "..." +
                              user.wallet_address.substring(user.wallet_address.length - 4)}
                          </TableCell>
                          <TableCell className="text-right text-silvi-mint font-bold">
                            {user.total_points.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent value="monthly" className="pt-4">
                  <div className="text-center py-8">
                    <p className="text-white/70">Monthly leaderboard data would appear here</p>
                  </div>
                </TabsContent>
                <TabsContent value="weekly" className="pt-4">
                  <div className="text-center py-8">
                    <p className="text-white/70">Weekly leaderboard data would appear here</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <div className="space-y-6">
              {userRank && (
                <Card className="bg-silvi-darkgreen/10 text-silvi-darkgreen border-none rounded-lg">
                  <CardHeader>
                    <CardTitle>Your Ranking</CardTitle>
                    <CardDescription className="text-white/70">
                      See how you compare to other tree enthusiasts
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border border-white/10 p-4 text-center">
                      <p className="text-sm text-white/70">You are ranked</p>
                      <p className="text-3xl font-bold mt-1">#{userRank.rank}</p>
                      <p className="text-sm text-white/70 mt-1">out of {userRank.total_users} users</p>
                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-black/20 p-2">
                          <p className="font-medium text-silvi-mint">{userRank.total_points}</p>
                          <p className="text-xs text-white/70">Points</p>
                        </div>
                        <div className="rounded-lg bg-black/20 p-2">
                          <p className="font-medium text-silvi-mint">{userRank.contribution_count}</p>
                          <p className="text-xs text-white/70">NFTs</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button className="w-full bg-silvi-green hover:bg-silvi-green/90" asChild>
                        <Link href="/profile">View Profile</Link>
                      </Button>
                      <Button className="bg-transparent border border-white/20 hover:bg-white/10">Share on X</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card className="bg-silvi-darkgreen/10 text-white border-none rounded-lg">
                <CardHeader>
                  <CardTitle>How to Earn Points</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between rounded-lg p-2 hover:bg-white/5">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-silvi-green/20 p-1.5">
                        <Trophy className="h-4 w-4 text-silvi-mint" />
                      </div>
                      <span className="text-sm">Mint an NFT</span>
                    </div>
                    <span className="font-medium text-silvi-mint">+500 pts</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg p-2 hover:bg-white/5">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-silvi-green/20 p-1.5">
                        <Trophy className="h-4 w-4 text-silvi-mint" />
                      </div>
                      <span className="text-sm">Fund a species</span>
                    </div>
                    <span className="font-medium text-silvi-mint">+1000 pts</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg p-2 hover:bg-white/5">
                    <div className="flex items-center gap-2">
                      <div className="rounded-full bg-silvi-green/20 p-1.5">
                        <Trophy className="h-4 w-4 text-silvi-mint" />
                      </div>
                      <span className="text-sm">Refer a friend</span>
                    </div>
                    <span className="font-medium text-silvi-mint">+250 pts</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

