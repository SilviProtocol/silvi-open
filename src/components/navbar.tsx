"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

export function Navbar() {
  const handleConnect = () => {
    // Implement wallet connection logic here
    console.log("Connecting wallet...")
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png" // Make sure to add your logo file to the public directory
              alt="Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="ml-2 text-xl font-bold text-white">TreeDAO</span>
          </Link>
          
          <Button 
            onClick={handleConnect}
            variant="outline" 
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
          >
            Connect Wallet
          </Button>
        </div>
      </div>
    </nav>
  )
} 