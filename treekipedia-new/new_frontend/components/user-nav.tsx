"use client"

import { useState, useEffect } from "react"
import { LogOut, Settings, User } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { WalletConnectDialog } from "@/components/wallet-connect-dialog"

export function UserNav() {
  const pathname = usePathname()
  const [isWalletDialogOpen, setIsWalletDialogOpen] = useState(false)
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Check if user is logged in
  useEffect(() => {
    const checkUserLogin = async () => {
      try {
        // In a real app, we would check if the user is logged in via a context or state
        // For now, we'll check localStorage for a wallet address
        const walletAddress = localStorage.getItem("walletAddress")

        if (walletAddress) {
          // Fetch user data
          // In a real app, this would be an API call
          setUserData({
            isLoggedIn: true,
            displayName: "Alex Johnson",
            username: "TreeEnthusiast",
            avatar: "/placeholder.svg?height=32&width=32",
            points: 3250,
            walletConnected: true,
          })
        } else {
          setUserData({
            isLoggedIn: false,
          })
        }
      } catch (error) {
        console.error("Error checking user login:", error)
        setUserData({
          isLoggedIn: false,
        })
      } finally {
        setLoading(false)
      }
    }

    checkUserLogin()
  }, [])

  const handleConnectWallet = () => {
    setIsWalletDialogOpen(true)
  }

  const handleWalletConnected = (address: string) => {
    // Save wallet address to localStorage
    localStorage.setItem("walletAddress", address)

    // Update user data
    setUserData({
      isLoggedIn: true,
      displayName: "User",
      username: address.substring(0, 6) + "..." + address.substring(address.length - 4),
      avatar: "/placeholder.svg?height=32&width=32",
      points: 0,
      walletConnected: true,
    })
  }

  if (loading) {
    return <div className="h-8 w-8 rounded-full bg-muted animate-pulse"></div>
  }

  return (
    <div className="flex items-center space-x-2">
      <Button variant="ghost" size="icon" asChild>
        <Link href="/profile">
          <User className="h-5 w-5" />
          <span className="sr-only">Profile</span>
        </Link>
      </Button>

      {userData?.isLoggedIn ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={userData.avatar} alt={userData.username} />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              {userData.points > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-silvi-green text-[10px] text-white">
                  {userData.points > 999 ? "999+" : userData.points}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userData.displayName}</p>
                <p className="text-xs leading-none text-muted-foreground">@{userData.username}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              {!userData.walletConnected && (
                <DropdownMenuItem onClick={handleConnectWallet}>
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
                    className="mr-2 h-4 w-4"
                  >
                    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
                  </svg>
                  <span>Connect Wallet</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                localStorage.removeItem("walletAddress")
                window.location.reload()
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button className="bg-silvi-green hover:bg-silvi-green/90 text-white" onClick={handleConnectWallet}>
          Connect Wallet
        </Button>
      )}
      <WalletConnectDialog
        open={isWalletDialogOpen}
        onOpenChange={setIsWalletDialogOpen}
        onSuccess={handleWalletConnected}
      />
    </div>
  )
}

