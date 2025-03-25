import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import { Suspense } from "react";

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
  viewport: {
    width: 'device-width',
    initialScale: 1
  },
  description: 'Treekipedia is an open-source, comprehensive database of tree knowledge.',
  keywords: ['Web3', 'Reforestation', 'Environment', 'Climate Change', 'Blockchain', 'NFT', 'Trees', 'Ecology'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <Suspense>
            {children}
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}