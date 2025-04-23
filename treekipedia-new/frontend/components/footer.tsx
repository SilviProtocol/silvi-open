import Link from "next/link"
import { Github, Twitter } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-black/30 backdrop-blur-md border-t border-white/10 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Treekipedia</h3>
            <p className="text-sm text-white/70">
              The open encyclopedia of trees, powered by community research and blockchain technology.
            </p>
            <div className="flex items-center space-x-4">
              <a 
                href="https://twitter.com/silviprotocol" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors"
              >
                <Twitter className="h-5 w-5" />
                <span className="sr-only">Twitter</span>
              </a>
              <a 
                href="https://github.com/SilviProtocol/silvi-open/tree/master" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors"
              >
                <Github className="h-5 w-5" />
                <span className="sr-only">GitHub</span>
              </a>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <nav className="flex flex-col space-y-2">
              <Link 
                href="/search" 
                className="text-white/70 hover:text-white transition-colors text-sm"
              >
                Search
              </Link>
              <Link 
                href="/treederboard" 
                className="text-white/70 hover:text-white transition-colors text-sm"
              >
                Treederboard
              </Link>
              <Link 
                href="/about" 
                className="text-white/70 hover:text-white transition-colors text-sm"
              >
                About
              </Link>
              <Link 
                href="/profile" 
                className="text-white/70 hover:text-white transition-colors text-sm"
              >
                My Profile
              </Link>
            </nav>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Powered By</h3>
            <div className="flex flex-wrap gap-2">
              <a 
                href="https://ethereum.org" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-3 py-1 text-xs rounded-full bg-black/30 hover:bg-black/40 transition-colors"
              >
                Ethereum
              </a>
              <a 
                href="https://base.org" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-3 py-1 text-xs rounded-full bg-black/30 hover:bg-black/40 transition-colors"
              >
                Base
              </a>
              <a 
                href="https://celo.org" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-3 py-1 text-xs rounded-full bg-black/30 hover:bg-black/40 transition-colors"
              >
                Celo
              </a>
              <a 
                href="https://optimism.io" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-3 py-1 text-xs rounded-full bg-black/30 hover:bg-black/40 transition-colors"
              >
                Optimism
              </a>
              <a 
                href="https://arbitrum.io" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-3 py-1 text-xs rounded-full bg-black/30 hover:bg-black/40 transition-colors"
              >
                Arbitrum
              </a>
              <a 
                href="https://attestationstation.xyz" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-3 py-1 text-xs rounded-full bg-black/30 hover:bg-black/40 transition-colors"
              >
                EAS
              </a>
              <a 
                href="https://ipfs.tech" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-3 py-1 text-xs rounded-full bg-black/30 hover:bg-black/40 transition-colors"
              >
                IPFS
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-4 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-sm text-white/50">
          <p>© {new Date().getFullYear()} Silvi Earth. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a 
              href="https://silvi.earth/terms" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-white/80 transition-colors"
            >
              Terms of Service
            </a>
            <a 
              href="https://silvi.earth/privacy" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-white/80 transition-colors"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}