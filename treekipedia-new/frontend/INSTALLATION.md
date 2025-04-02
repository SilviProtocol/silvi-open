# Treekipedia Frontend Installation Guide

This guide explains how to set up and install the Treekipedia frontend with custom wallet connection.

## React Version Compatibility

The frontend is using React 18.3.1, which is fully compatible with all the dependencies we're using.

## Custom Wallet Connection

Instead of using third-party wallet connection libraries with security vulnerabilities, we've implemented a custom wallet connection UI using wagmi hooks directly. This approach:

1. Reduces external dependencies and security risks
2. Maintains visual consistency with the frosted glass design
3. Provides all essential wallet connection features

## Installation

1. Install basic dependencies:

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install
```

2. Start the development server:

```bash
npm run dev
```

Or with a custom port:

```bash
PORT=3001 npm run dev
```

## Adding Additional Wallet Connectors

By default, the application supports injected wallets like MetaMask. To add support for more wallet types like WalletConnect:

1. Install WalletConnect package:

```bash
npm install @wagmi/connectors
```

2. Update the `providers.tsx` file to include additional connectors:

```typescript
import { walletConnect } from '@wagmi/connectors'

// Add in the config
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID'

const config = createConfig({
  chains,
  connectors: [
    injected(),
    walletConnect({ projectId })
  ],
  // ... rest of the config
})
```

3. Update the `wallet-connect-button.tsx` component to handle multiple connectors.

## Features

The current wallet connection implementation includes:

1. Connect/disconnect functionality
2. Chain switching between different networks
3. Balance display
4. Profile linking
5. Responsive UI with proper mobile support
6. Clean, frosted glass design that matches the rest of the UI

## Security Benefits

This implementation avoids the vulnerabilities found in third-party wallet connection libraries and their dependencies, particularly:

1. Critical vulnerabilities in crypto-es
2. High severity issues in Web3Onboard packages
3. Various moderate vulnerabilities in related dependencies

By using only wagmi and its core dependencies, we maintain a much more secure foundation for the application.