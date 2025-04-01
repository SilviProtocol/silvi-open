import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Suspense } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: 'Treekipedia',
    template: '%s | Treekipedia'
  },
  description: 'Treekipedia is an open-source, comprehensive database of tree knowledge.',
  keywords: ['Web3', 'Reforestation', 'Environment', 'Climate Change', 'Blockchain', 'NFT', 'Trees', 'Ecology'],
};

// Viewport must be in a separate export as per Next.js 14+ recommendations
export const viewport = {
  width: 'device-width',
  initialScale: 1
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased min-h-screen bg-[url('/background3.png')] bg-fixed bg-cover bg-center text-white flex flex-col`}>
        <Providers>
          <Navbar />
          <main className="flex-1 pt-16">
            <Suspense>
              {children}
            </Suspense>
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}