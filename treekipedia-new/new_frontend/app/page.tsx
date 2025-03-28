import Link from "next/link"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { DualSearch } from "@/components/dual-search"
import { Logo } from "@/components/logo"

export default function HomePage() {
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
        <section className="relative w-full py-24 md:py-32 lg:py-40 overflow-hidden bg-silvi-green/10">
          <div className="container relative z-10 px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-6 text-center">
              <Logo showText={false} />
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tighter text-silvi-green sm:text-5xl md:text-6xl">
                  The Open Encyclopedia of Trees
                </h1>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Discover, learn, and contribute to tree species knowledge
                </p>
              </div>
              <div className="w-full max-w-2xl">
                <DualSearch />
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-silvi-teal/10">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="h-16 w-16 rounded-full bg-silvi-teal/20 flex items-center justify-center">
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
                    className="h-8 w-8 text-silvi-green"
                  >
                    <path d="M17 14c-3 0-6-2-6-5a3 3 0 0 1 3-3c2 0 3 1 4 2-2-3-6-4-8-3a5 5 0 0 0-3 5c1 2 2 3 4 4 1 1 2 1 3 1" />
                    <path d="M14 13c3 3 3 6 1 8-1 1-3 2-5 1-1-1-1-2-1-3 0-2 1-3 2-4 1-2 3-2 3-2" />
                    <path d="M13 14c-3 3-6 3-8 1-1-1-2-3-1-5 1-1 2-1 3-1 2 0 3 1 4 2 2 1 2 3 2 3Z" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Discover Tree Species</h3>
                  <p className="text-muted-foreground">
                    Explore our extensive database of tree species from around the world.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="h-16 w-16 rounded-full bg-silvi-teal/20 flex items-center justify-center">
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
                    className="h-8 w-8 text-silvi-green"
                  >
                    <path d="M18 6h-5c-1.1 0-2 .9-2 2v8" />
                    <path d="M9 10a2 2 0 0 1-2 2H4" />
                    <path d="M11 14a2 2 0 0 0-2 2v2" />
                    <path d="M14 16a2 2 0 0 0-2 2v2" />
                    <path d="M17 12a2 2 0 0 0-2 2v2" />
                    <path d="M20 8a2 2 0 0 0-2 2v2" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Fund Research</h3>
                  <p className="text-muted-foreground">
                    Support scientific research by minting NFTs for undiscovered species.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="h-16 w-16 rounded-full bg-silvi-teal/20 flex items-center justify-center">
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
                    className="h-8 w-8 text-silvi-green"
                  >
                    <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
                    <path d="M10 2c1 .5 2 2 2 5" />
                  </svg>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Join the Treederboard</h3>
                  <p className="text-muted-foreground">
                    Compete with other tree enthusiasts and climb the leaderboard.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter text-silvi-green sm:text-4xl md:text-5xl">
                  Featured Species
                </h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                  Explore some of our most popular tree species
                </p>
              </div>
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {[
                  {
                    name: "Giant Sequoia",
                    scientificName: "Sequoiadendron giganteum",
                    image: "/placeholder.svg?height=300&width=300",
                    taxonId: "giant-sequoia",
                  },
                  {
                    name: "Japanese Maple",
                    scientificName: "Acer palmatum",
                    image: "/placeholder.svg?height=300&width=300",
                    taxonId: "japanese-maple",
                  },
                  {
                    name: "Baobab",
                    scientificName: "Adansonia",
                    image: "/placeholder.svg?height=300&width=300",
                    taxonId: "baobab",
                  },
                  {
                    name: "Weeping Willow",
                    scientificName: "Salix babylonica",
                    image: "/placeholder.svg?height=300&width=300",
                    taxonId: "weeping-willow",
                  },
                ].map((tree, index) => (
                  <Link
                    key={index}
                    href={`/species/${tree.taxonId}`}
                    className="group relative overflow-hidden rounded-lg border bg-background p-2 transition-colors hover:bg-accent"
                  >
                    <div className="aspect-square overflow-hidden rounded-md">
                      <Image
                        src={tree.image || "/placeholder.svg"}
                        alt={tree.name}
                        width={300}
                        height={300}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <div className="p-2">
                      <h3 className="font-semibold">{tree.name}</h3>
                      <p className="text-sm italic text-muted-foreground">{tree.scientificName}</p>
                    </div>
                  </Link>
                ))}
              </div>
              <Button className="bg-silvi-green hover:bg-silvi-green/90 text-white" asChild>
                <Link href="/species">View All Species</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

