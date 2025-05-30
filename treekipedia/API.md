# Treekipedia API Documentation

This document outlines all API endpoints available for the Treekipedia frontend to interact with the backend services. The API provides access to tree species data, user management, leaderboard information, and research functionality.

## Base URL

All API requests should be made to the base URL of the backend server:

```
https://treekipedia-api.silvi.earth
```

---

## Species Endpoints

### Get Species by Search Term

Used for searching tree species by common or scientific name.

**Endpoint:** `GET /species`

**Query Parameters:**
- `search` (required): Search term to match against common_name or species field (scientific name)

**Response:**
```json
[
  {
    "taxon_id": "string",
    "common_name": "string",
    "species": "string",
    "accepted_scientific_name": "string",
    "family": "string",
    "genus": "string",
    // Additional species fields
  }
]
```

**Usage:** Primary search functionality on the homepage and search pages.

---

### Get Species Name Suggestions

Used for autocomplete functionality in search inputs.

**Endpoint:** `GET /species/suggest`

**Query Parameters:**
- `query` (required): Partial term to get suggestions for
- `field` (optional): Specify which field to search in ("common_name" or "species"). If not provided, searches in both fields.

**Response:**
```json
[
  {
    "taxon_id": "string",
    "common_name": "string",
    "species": "string",
    "accepted_scientific_name": "string"
  }
]
```

**Usage:** Powers the autocomplete dropdown in search fields.

---

### Get Species Details

Retrieve comprehensive information about a specific tree species.

**Endpoint:** `GET /species/:taxon_id`

**URL Parameters:**
- `taxon_id` (required): Unique identifier for the species

**Response:**
```json
{
  "taxon_id": "string",
  "common_name": "string",
  "species": "string",
  "accepted_scientific_name": "string",
  "family": "string",
  "genus": "string",
  "general_description": "string",
  "habitat": "string",
  // All species fields
}
```

**Usage:** Display detailed species information on the Species Page.

**Note:** The `common_name` field may contain very long strings with many names in different languages. When displaying common names in the UI, it's recommended to use the `getTopCommonNames` utility function (located in `/frontend/utils/commonNames.ts` and `/backend/utils/commonNames.js`) to optimize the display. This utility:
1. Properly splits the names by semicolons and commas
2. Prioritizes names based on their position in the list (first names are most important)
3. Ensures linguistic diversity in the displayed names
4. Limits the total character count for API calls and UI display

---

## Treederboard Endpoints

### Get Leaderboard

Retrieves the top contributors ranked by tree points.

**Endpoint:** `GET /treederboard`

**Query Parameters:**
- `limit` (optional): Maximum number of users to return (default: 20, max: 100)

**Response:**
```json
[
  {
    "id": "number",
    "wallet_address": "string",
    "total_points": "number",
    "contribution_count": "number",
    "first_contribution_at": "string",
    "last_contribution_at": "string"
  }
]
```

**Usage:** Display the Treederboard (leaderboard) page.

---

### Get User Profile

Retrieve a specific user's profile information and NFT collection.

**Endpoint:** `GET /treederboard/user/:wallet_address`

**URL Parameters:**
- `wallet_address` (required): User's blockchain wallet address

**Response:**
```json
{
  "id": "number",
  "wallet_address": "string",
  "total_points": "number",
  "contribution_count": "number",
  "first_contribution_at": "string",
  "last_contribution_at": "string",
  "nfts": [
    {
      "id": "number",
      "global_id": "number",
      "taxon_id": "string",
      "points": "number",
      "ipfs_cid": "string",
      "transaction_hash": "string",
      "created_at": "string"
    }
  ]
}
```

**Usage:** Display user profile page and NFT collection.

---

### Update User Profile

Updates a user's profile information, such as display name.

**Endpoint:** `PUT /treederboard/user/profile`

**Request Body:**
```json
{
  "wallet_address": "string",
  "display_name": "string"
}
```

**Response:**
```json
{
  "id": "number",
  "wallet_address": "string",
  "display_name": "string",
  "total_points": "number",
  "contribution_count": "number"
}
```

**Usage:** Allow users to update their display name for the Treederboard.

---

## Research Endpoints

### Fund Research (Legacy Method - Deprecated)

Initiates AI research for a tree species by funding through an NFT.

**Note:** This endpoint is deprecated in favor of the new payment system. New applications should use the payment contract and sponsorship webhook instead.

**Endpoint:** `POST /research/fund-research`

**Request Body:**
```json
{
  "taxon_id": "string",
  "wallet_address": "string",
  "chain": "string",
  "transaction_hash": "string",
  "ipfs_cid": "string",
  "scientific_name": "string"
}
```

**Parameters:**
- `taxon_id` (required): Unique identifier for the species
- `wallet_address` (required): User's blockchain wallet address
- `chain` (required): Blockchain chain to use for NFT minting - must be one of: `base`, `celo`, `optimism`, `arbitrum`
- `transaction_hash` (required): Transaction hash from the funding transaction
- `ipfs_cid` (optional): IPFS CID for the NFT metadata (can be empty, will be generated by the backend)
- `scientific_name` (required): Value from `species_scientific_name` or `species` field

**Error Responses:**
- `400 Bad Request`: Missing required fields or invalid chain selection
- `404 Not Found`: Species not found with provided taxon_id
- `409 Conflict`: Research for this species has already been funded

**Response:**
```json
{
  "success": true,
  "research_data": {
    "conservation_status": "string",
    "general_description": "string",
    "habitat": "string",
    // Other research fields
  },
  "ipfs_cid": "string",
  "attestation_uid": "string",
  "nft_details": {
    "id": "number",
    "taxon_id": "string",
    "wallet_address": "string",
    "points": "number",
    "ipfs_cid": "string",
    "transaction_hash": "string",
    "metadata": {
      "species": "string",
      "chain": "string",
      "attestation_uid": "string",
      "mint_receipt": "object",
      "research_date": "string"
    }
  }
}
```

**Usage:** This endpoint is now called internally by the sponsorship webhook handler when a payment is confirmed. It is no longer recommended for direct use by frontend applications.

---

### Get Research Data

Retrieve research data for a specific species.

**Endpoint:** `GET /research/research/:taxon_id`

**URL Parameters:**
- `taxon_id` (required): Unique identifier for the species

**Response:**
```json
{
  "taxon_id": "string",
  "species_scientific_name": "string",
  "researched": "boolean",
  "conservation_status_ai": "string",
  "conservation_status_human": "string",
  "general_description_ai": "string",
  "general_description_human": "string",
  "habitat_ai": "string",
  "habitat_human": "string",
  "elevation_ranges_ai": "string",
  "elevation_ranges_human": "string",
  "compatible_soil_types_ai": "string",
  "compatible_soil_types_human": "string",
  "ecological_function_ai": "string",
  "ecological_function_human": "string",
  "native_adapted_habitats_ai": "string",
  "native_adapted_habitats_human": "string",
  "agroforestry_use_cases_ai": "string",
  "agroforestry_use_cases_human": "string",
  "growth_form_ai": "string",
  "growth_form_human": "string",
  "leaf_type_ai": "string",
  "leaf_type_human": "string",
  "deciduous_evergreen_ai": "string",
  "deciduous_evergreen_human": "string",
  "flower_color_ai": "string",
  "flower_color_human": "string",
  "fruit_type_ai": "string",
  "fruit_type_human": "string",
  "bark_characteristics_ai": "string",
  "bark_characteristics_human": "string",
  "maximum_height_ai": "number",
  "maximum_height_human": "number",
  "maximum_diameter_ai": "number",
  "maximum_diameter_human": "number",
  "lifespan_ai": "string",
  "lifespan_human": "string",
  "maximum_tree_age_ai": "number",
  "maximum_tree_age_human": "number",
  "stewardship_best_practices_ai": "string",
  "stewardship_best_practices_human": "string",
  "planting_recipes_ai": "string",
  "planting_recipes_human": "string",
  "pruning_maintenance_ai": "string",
  "pruning_maintenance_human": "string",
  "disease_pest_management_ai": "string",
  "disease_pest_management_human": "string",
  "fire_management_ai": "string",
  "fire_management_human": "string",
  "cultural_significance_ai": "string",
  "cultural_significance_human": "string",
  "verification_status": "string",
  "ipfs_cid": "string"
}
```

**Note:** If a species has no AI research data, this endpoint will return a 404 status code with a message indicating the species needs research.

**Usage:** Display research results on the Species Page.

---

## Server Information Endpoints

### Get Server Status

Basic endpoint to check if the server is running.

**Endpoint:** `GET /`

**Response:**
```json
{
  "message": "Treekipedia Backend is running!"
}
```

### Get API Information

Returns information about available API endpoints.

**Endpoint:** `GET /api`

**Response:**
```json
{
  "message": "Welcome to Treekipedia API",
  "version": "1.0.0",
  "endpoints": [
    "/species - Species search and details",
    "/treederboard - User contributions leaderboard",
    "/research - AI research and NFT minting",
    "/sponsorships - Sponsorship payment tracking and webhooks"
  ]
}
```

---

## Sponsorship Endpoints

### Webhook for Payment Events

Receives webhook events from Infura about sponsorship transactions.

**Endpoint:** `POST /sponsorships/webhook`

**Headers:**
- `x-infura-signature`: HMAC SHA-256 signature to verify authenticity

**Request Body:** (From Infura)
```json
{
  "network": "string",
  "chainId": "string",
  "event": "SponsorshipReceived",
  "transactionHash": "string",
  "args": {
    "sender": "string",
    "taxon_id": "string",
    "amount": "string",
    "transaction_hash": "string"
  }
}
```

**Response:**
```json
{
  "success": true
}
```

**Usage:** This endpoint is called by Infura when a payment is made through the payment contract. It is not meant to be called directly by frontend clients.

---

### Get Sponsorship by Transaction Hash

Retrieve details about a sponsorship by its transaction hash.

**Endpoint:** `GET /sponsorships/transaction/:transaction_hash`

**URL Parameters:**
- `transaction_hash` (required): Transaction hash from the blockchain

**Response:**
```json
{
  "transaction_hash": "string",
  "status": "string",
  "total_amount": "number",
  "wallet_address": "string",
  "chain": "string",
  "payment_timestamp": "string",
  "species_count": "number",
  "completed_count": "number",
  "species": [
    {
      "id": "number",
      "sponsorship_id": "number",
      "taxon_id": "string",
      "amount": "number",
      "research_status": "string",
      "nft_token_id": "number",
      "ipfs_cid": "string",
      "common_name": "string",
      "species_scientific_name": "string"
    }
  ]
}
```

**Usage:** Used to check the status of a payment after submission, typically on the transaction confirmation page.

---

### Get User Sponsorships

Retrieve all sponsorships made by a specific wallet address.

**Endpoint:** `GET /sponsorships/user/:wallet_address`

**URL Parameters:**
- `wallet_address` (required): User's blockchain wallet address

**Query Parameters:**
- `limit` (optional): Maximum number of sponsorships to return (default: 20)
- `offset` (optional): Number of sponsorships to skip (default: 0)

**Response:**
```json
[
  {
    "sponsorship_id": "number",
    "wallet_address": "string",
    "chain": "string",
    "transaction_hash": "string",
    "total_amount": "number",
    "payment_timestamp": "string",
    "payment_status": "string",
    "species_count": "number",
    "completed_count": "number",
    "taxon_ids": ["string"]
  }
]
```

**Usage:** Display a user's sponsorship history on their profile page.

---

### Get Species Sponsorships

Retrieve all sponsorships for a specific species.

**Endpoint:** `GET /sponsorships/species/:taxon_id`

**URL Parameters:**
- `taxon_id` (required): Unique identifier for the species

**Query Parameters:**
- `limit` (optional): Maximum number of sponsorships to return (default: 20)
- `offset` (optional): Number of sponsorships to skip (default: 0)

**Response:**
```json
[
  {
    "id": "number",
    "wallet_address": "string",
    "transaction_hash": "string",
    "chain": "string",
    "total_amount": "number",
    "payment_timestamp": "string",
    "status": "string",
    "research_status": "string",
    "nft_token_id": "number",
    "ipfs_cid": "string"
  }
]
```

**Usage:** Show who has sponsored a particular species on the species details page.

---

## Missing API Endpoints

Based on the frontend requirements in the spec sheet, these endpoints may be needed but aren't currently implemented:

1. **User Authentication** - There's no explicit endpoint for authenticating users or verifying wallet connections.

2. **Display Name Retrieval** - While you can update a display name, there's no dedicated endpoint to just retrieve the display name for a wallet address (though it could be included in user profile data).

3. **Chain/Network Information** - An endpoint to retrieve available blockchain networks and their configuration details would be helpful.

4. **NFT Image/Metadata Retrieval** - There's no direct endpoint to fetch NFT images or complete metadata, which would be useful for the Profile page to display the NFTs visually.

These potential gaps should be discussed with the team to determine if they're necessary and how they should be implemented.