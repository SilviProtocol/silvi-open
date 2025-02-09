import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { ResearchProvider } from "@/context/research-context";
import Providers from "./providers";
import '@coinbase/onchainkit/styles.css'; 
import SilviLogo from '/public/SilviFaviconNew.svg'
import { Suspense } from "react";






const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
      default: 'Treekipedia',
      template: '%s | Treekipedia'
  },
  viewport: {
      width: 'device-width',
      initialScale: 1
  },
  description: 'Silvi is a reforestation project that uses blockchain technology to incentivize and track the planting of trees.',
  keywords: ['Web3', 'Reforestation', 'Environment', 'Climate Change', 'Base', 'Blockchain', 'Silvi', 'NFT'],
  icons: { icon: SilviLogo.src, shortcut: SilviLogo.src }
}



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {


  return (
    <html lang="en">
      <body
        className={montserrat.className}
      >
        
        <Providers>
          <ResearchProvider>
            <Suspense>
              {children}
            </Suspense>
            
            </ResearchProvider>
        </Providers>
        </body>
    </html>
  );
}
