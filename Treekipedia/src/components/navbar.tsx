"use client"

import Image from "next/image"
import Link from "next/link"
import {
  ConnectWallet,
  Wallet,
  WalletDropdown,
  WalletDropdownLink,
  WalletDropdownDisconnect,
} from '@coinbase/onchainkit/wallet';
import {
  Address,
  Avatar,
  Name,
  Identity,
  EthBalance,
} from '@coinbase/onchainkit/identity';

export function Navbar() {
  

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center">
            <Image
              src="/silvi_logo.png" // Make sure to add your logo file to the public directory
              alt="Logo"
              width={100}
              height={100}
              className=""
            />
          </Link>
          
          <div className="wallet-container">
            <Wallet>
              <ConnectWallet className='bg-white text-black hover:bg-white hover:text-black'>
                <Avatar className="h-6 w-6 text-black" />
                <Name className="text-black" />
              </ConnectWallet>
              <WalletDropdown>
                <Identity className="px-4 pt-3 pb-2" hasCopyAddressOnClick>
                  <Avatar />
                  <Name />
                  <Address />
                  <EthBalance />
                </Identity>
                <WalletDropdownLink
                  icon="wallet"
                  href="https://keys.coinbase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Wallet
                </WalletDropdownLink>
                <WalletDropdownLink
                  icon="wallet"
                  href="https://t.me/SilviProtocol/1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Silvi Telegram
                </WalletDropdownLink>
                <WalletDropdownDisconnect />
              </WalletDropdown>
            </Wallet>
          </div>
        </div>
      </div>
    </nav>
  )
} 