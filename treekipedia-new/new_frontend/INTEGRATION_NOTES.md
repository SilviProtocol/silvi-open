# Frontend Integration Notes

This document outlines the changes made to integrate the v0-generated frontend with the Treekipedia backend API.

## Changes Made

### 1. Disabled Mock Mode

- Changed `FORCE_MOCK_MODE` from `true` to `false` in `/lib/api.ts`
- Added environment configuration via `.env.local`:
  - Set API URL to point to the production backend: `https://treekipedia-api.silvi.earth`
  - Added blockchain contract addresses from the main project configuration

### 2. Updated Wallet Verification

- Made wallet verification resilient to missing backend endpoint
- The frontend now gracefully continues if the wallet verification endpoint is not available
- This allows the MVP to function without this endpoint while preserving the code for future implementation

### 3. Enhanced Search Suggestions

- Improved search suggestions to work with or without the `field` parameter
- Added client-side filtering as a fallback when the backend ignores the field parameter
- This maintains the improved UX while ensuring compatibility with the current backend

### 4. Added Contract Addresses

- Updated NFT contract addresses to use values from environment variables
- Provided fallbacks to the contract addresses in the main project configuration

## Remaining Tasks

1. **Backend Wallet Verification**:
   - Consider implementing a backend endpoint for wallet verification (`/wallet/verify`) 
   - Not critical for MVP but would enhance security in production

2. **Search API Enhancement**:
   - Consider enhancing the backend's `/species/suggest` endpoint to support the `field` parameter
   - This would optimize search results by restricting to either common or scientific names

3. **Testing**:
   - Test all API integrations with real backend data
   - Verify wallet connection and NFT minting flows
   - Ensure research funding process connects correctly to the backend

## Production Deployment Notes

When deploying to production:

1. Ensure the API URL in `.env.local` points to the correct backend URL
2. Verify all environment variables are properly set
3. Test the application with real wallet connections to ensure proper blockchain integration