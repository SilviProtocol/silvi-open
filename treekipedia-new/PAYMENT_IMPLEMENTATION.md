# Treekipedia Payment System Implementation

This document provides instructions for setting up and configuring the payment system for Treekipedia. The payment system allows users to pay 3 USDC to sponsor research for tree species, with the payment triggering the AI research process.

## Overview

The payment system consists of:

1. **Smart Contract**: Deployed on Base, Celo, Optimism, and Arbitrum to accept USDC payments
2. **Backend Webhook**: Receives events from the blockchain when payments are made
3. **Database Schema**: Tracks payments and research status
4. **Frontend Components**: UI for users to make payments and view status

## Placeholder Values to Update

After deploying the contracts, the following placeholder values must be updated:

| Placeholder | File | Description |
|-------------|------|-------------|
| `0x0000000000000000000000000000000000000000` | `/frontend/lib/chains.ts` | Payment contract addresses for all chains |
| `replace-with-actual-webhook-secret-in-production` | `/.env` | Infura webhook secret for signature verification |
| `webhook-secret-placeholder` | `/backend/controllers/sponsorship.js` | Fallback webhook secret if env var is missing |

## Implementation Steps

### 1. Deploy Database Schema

Run the database schema update script to create the necessary tables:

```bash
# Connect to your PostgreSQL database
psql -U postgres -d treekipedia

# Run the schema update script
\i database/payment_schema_update.sql
```

### 2. Deploy Smart Contracts

The `ResearchSponsorshipPayment.sol` contract must be deployed to each supported chain (Base, Celo, Optimism, Arbitrum).

```bash
cd contracts

# Deploy to each network (example for Base)
npx hardhat run scripts/deploy-sponsorship.js --network base

# Verify on Etherscan
npx hardhat verify --network base CONTRACT_ADDRESS USDC_ADDRESS
```

After deployment, update the contract addresses in `frontend/lib/chains.ts`.

### 3. Configure Infura Webhooks

For each deployed contract, create an Infura webhook:

1. Go to [Infura Dashboard](https://infura.io/dashboard)
2. Navigate to Webhooks → Add Webhook
3. Select the network (Base, Celo, Optimism, or Arbitrum)
4. Filter for the `SponsorshipReceived` event from your deployed contract address
5. Set the webhook URL to: `https://treekipedia-api.silvi.earth/sponsorships/webhook`
6. Generate a webhook secret and update it in `.env` (INFURA_WEBHOOK_SECRET)

**Webhook Configuration Example:**
```json
{
  "name": "Treekipedia Sponsorships Base",
  "network": "base-mainnet",
  "addresses": ["YOUR_PAYMENT_CONTRACT_ADDRESS"],
  "events": ["SponsorshipReceived(address,string,uint256,string)"],
  "webhook_url": "https://treekipedia-api.silvi.earth/sponsorships/webhook",
  "webhook_type": "json"
}
```

### 4. Update the Environment Variables

In your `.env` file, update the following variables:

```
# Payment Contract Addresses
BASE_PAYMENT_CONTRACT_ADDRESS=0x...
CELO_PAYMENT_CONTRACT_ADDRESS=0x...
OPTIMISM_PAYMENT_CONTRACT_ADDRESS=0x...
ARBITRUM_PAYMENT_CONTRACT_ADDRESS=0x...

# Webhook Security
INFURA_WEBHOOK_SECRET=your-generated-webhook-secret
```

### 5. Update Frontend Chain Configuration

After deploying the contracts, update `frontend/lib/chains.ts` with the correct contract addresses:

```typescript
// Replace all instances of 0x0000000000000000000000000000000000000000 with actual addresses
[String(base.id)]: {
  // ... other addresses
  paymentContract: '0xActualBaseContractAddress',
},
```

### 6. Replace the Fund Research Button

Update the species page to use the new SponsorshipButton component:

1. Open `/frontend/app/species/[taxon_id]/components/ResearchCard.tsx`
2. Replace the current "Fund Research" button with the SponsorshipButton component:

```jsx
import { SponsorshipButton } from '@/components/sponsorship-button'

// Replace the existing button with:
<SponsorshipButton 
  taxonId={taxon_id} 
  speciesName={species?.species_scientific_name || species?.species || ''} 
  onSponsorshipComplete={refetchResearch}
  className="w-full"
/>
```

## Verification & Testing

### Smart Contract Testing

Run test transactions on testnets first to verify:
- USDC approval works correctly
- Payments are processed and events emitted
- Contract handles edge cases properly

### Webhook Testing

Test the webhook integration:
1. Create a test payment using the testnet contracts
2. Verify the webhook receives the event
3. Check that the sponsorship record is created in the database
4. Verify research process is triggered

### End-to-End Testing

1. Connect wallet on frontend
2. Approve USDC spending
3. Make a payment transaction
4. Verify webhook receives event 
5. Check that research is triggered
6. Verify NFT is minted
7. Check payment status displayed correctly on profile

## Troubleshooting

### Common Issues

#### Transaction Error: Insufficient Allowance
- User needs to approve USDC spending before making payment
- Check allowance with `useContractRead` hook for the ERC20 allowance function

#### Webhook Not Receiving Events
- Verify webhook URL is accessible
- Check Infura webhook configuration (correct contract address and event signature)
- Ensure webhook secret is properly configured
- Check server logs for signature verification errors

#### Research Not Triggered After Payment
- Check database for sponsorship record with status "confirmed"
- Verify the sponsorship controller can access the research controller
- Check for errors in the research process logs

## Deployment Checklist

- [ ] Database schema deployed
- [ ] Smart contracts deployed to all chains
- [ ] Contract addresses updated in frontend config
- [ ] Infura webhooks configured for all contracts
- [ ] Webhook secret updated in environment variables
- [ ] Frontend updated to use SponsorshipButton
- [ ] Test transactions completed successfully
- [ ] Payment status display working in user profile

## Contract Addresses Reference

| Chain | USDC Address | Payment Contract Address |
|-------|-------------|-------------------------|
| Base | 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 | [PLACEHOLDER] |
| Celo | 0xcebA9300f2b948710d2653dD7B07f33A8B32118C | [PLACEHOLDER] |
| Optimism | 0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85 | [PLACEHOLDER] |
| Arbitrum | 0xaf88d065e77c8cC2239327C5EDb3A432268e5831 | [PLACEHOLDER] |

## Testnet Addresses Reference

| Chain | USDC Address | Payment Contract Address |
|-------|-------------|-------------------------|
| Base Sepolia | 0x036CbD53842c5426634e7929541eC2318f3dCF7e | [PLACEHOLDER] |
| Celo Alfajores | 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1 | [PLACEHOLDER] |
| Optimism Sepolia | 0x5fd84259d66Cd46123540766Be93DFE6D43130D7 | [PLACEHOLDER] |
| Arbitrum Sepolia | 0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d | [PLACEHOLDER] |