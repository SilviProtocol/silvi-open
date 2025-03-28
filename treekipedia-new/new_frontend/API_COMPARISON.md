# API Implementation Comparison

This document compares the API implementation in the new v0-generated frontend with the actual backend API endpoints to identify matches, discrepancies, and potential improvements.

## Overview

The new frontend has been built with a comprehensive API client that implements all endpoints needed according to the spec sheet. However, it currently operates in forced mock mode (`FORCE_MOCK_MODE = true`), using mock data instead of making real API calls to the backend.

## API Endpoints Comparison

### Species Endpoints

| Backend API | Frontend Implementation | Status |
|-------------|-------------------------|--------|
| `GET /species?search=query` | `speciesAPI.searchSpecies(search)` | ✅ Matching |
| `GET /species/suggest?query=partial` | `speciesAPI.getSuggestions(query, field)` | ✅ Matching (with additional field parameter) |
| `GET /species/:taxon_id` | `speciesAPI.getSpeciesDetails(taxonId)` | ✅ Matching |

### Treederboard Endpoints

| Backend API | Frontend Implementation | Status |
|-------------|-------------------------|--------|
| `GET /treederboard` | `treederboardAPI.getLeaderboard(limit)` | ✅ Matching |
| `GET /treederboard/user/:wallet_address` | `treederboardAPI.getUserProfile(walletAddress)` | ✅ Matching |
| `PUT /treederboard/user/profile` | `treederboardAPI.updateUserProfile(walletAddress, displayName)` | ✅ Matching |

### Research Endpoints

| Backend API | Frontend Implementation | Status |
|-------------|-------------------------|--------|
| `POST /research/fund-research` | `researchAPI.fundResearch(taxonId, walletAddress, chain, transactionHash)` | ✅ Matching |
| `GET /research/research/:taxon_id` | `researchAPI.getResearchData(taxonId)` | ✅ Matching |

### Additional Frontend APIs (Not in Backend)

| Frontend API | Backend Equivalent | Status |
|--------------|-------------------|--------|
| `walletAPI.verifyWallet(walletAddress, signature, message)` | None | ⚠️ Missing in backend |

## Notable Observations

1. **Mock Data Mode**: The frontend is currently operating in forced mock mode, providing simulated data rather than connecting to the actual backend. This allows for development and testing without a live backend but will need to be disabled when integrating with real API endpoints.

2. **Enhanced Error Handling**: The frontend API implementation includes sophisticated error handling logic that attempts to extract detailed error messages from API responses, providing better user feedback.

3. **Wallet Verification**: The frontend includes a `walletAPI.verifyWallet()` function that doesn't correspond to any existing backend endpoint. This functionality would be important for properly authenticating users with their blockchain wallets.

4. **Field Parameter for Suggestions**: The frontend's implementation of the species suggestions endpoint includes an optional `field` parameter that doesn't exist in the backend API, allowing for more targeted suggestions (common name vs. scientific name).

5. **TypeScript Typing**: The frontend API implementation includes comprehensive TypeScript type definitions for all API responses, improving type safety and development experience.

## Integration Recommendations

1. **Disable Mock Mode**: When ready to integrate with the backend, set `FORCE_MOCK_MODE = false` in the API client.

2. **Add Wallet Verification Endpoint**: Implement the missing wallet verification endpoint in the backend to support the frontend's wallet authentication feature.

3. **Add Field Parameter to Suggestions**: Consider enhancing the backend's `/species/suggest` endpoint to support the `field` parameter for more targeted search suggestions.

4. **Implement Error Response Format**: Ensure all backend API endpoints provide error responses in a consistent format that the frontend error handling can parse correctly.

5. **Implement Real-time Research Updates**: Consider implementing WebSocket or SSE (Server-Sent Events) to provide real-time updates during the research process, rather than the simulated progress currently implemented in the frontend.

## Conclusion

The new frontend's API implementation is comprehensive and well-structured, covering all the endpoints provided by the current backend with some additional features. The main hurdle for integration will be disabling mock mode and ensuring the backend endpoints respond with the expected data structures.

The API client's error handling, TypeScript typing, and organization make it a solid foundation for the production application, needing only minor adjustments to work with the real backend.