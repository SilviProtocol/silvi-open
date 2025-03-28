# Treekipedia API Documentation

This document outlines all API endpoints available for the Treekipedia frontend to interact with the backend services. The API provides access to tree species data, user management, leaderboard information, and research functionality.

## Base URL

All API requests should be prefixed with the base URL of the backend server:

```
/api
```

---

## Species Endpoints

### Get Species by Search Term

Used for searching tree species by common or scientific name.

**Endpoint:** `GET /species`

**Query Parameters:**
- `search` (required): Search term to match against common_name or accepted_scientific_name

**Response:**
```json
[
  {
    "taxon_id": "string",
    "common_name": "string",
    "accepted_scientific_name": "string",
    "species": "string",
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

**Response:**
```json
[
  {
    "taxon_id": "string",
    "common_name": "string",
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
  "accepted_scientific_name": "string",
  "species": "string",
  "family": "string",
  "genus": "string",
  "general_description": "string",
  "habitat": "string",
  // All species fields
}
```

**Usage:** Display detailed species information on the Species Page.

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

### Fund Research

Initiates AI research for a tree species by funding through an NFT.

**Endpoint:** `POST /research/fund-research`

**Request Body:**
```json
{
  "taxon_id": "string",
  "wallet_address": "string",
  "chain": "string",
  "transaction_hash": "string"
}
```

The `chain` value must be one of: `base`, `celo`, `optimism`, `arbitrum`.

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

**Usage:** Called after a user completes the NFT funding process for an unresearched species.

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
  "conservation_status": "string",
  "general_description": "string",
  "habitat": "string",
  "elevation_ranges": "string",
  "compatible_soil_types": "string",
  "ecological_function": "string",
  "native_adapted_habitats": "string",
  "agroforestry_use_cases": "string",
  "growth_form": "string",
  "leaf_type": "string",
  "deciduous_evergreen": "string",
  "flower_color": "string",
  "fruit_type": "string",
  "bark_characteristics": "string",
  "maximum_height": "number",
  "maximum_diameter": "number",
  "lifespan": "string",
  "maximum_tree_age": "number",
  "verification_status": "string",
  "ipfs_cid": "string"
}
```

**Usage:** Display research results on the Species Page.

---

## Missing API Endpoints

Based on the frontend requirements in the spec sheet, these endpoints may be needed but aren't currently implemented:

1. **User Authentication** - There's no explicit endpoint for authenticating users or verifying wallet connections.

2. **Display Name Retrieval** - While you can update a display name, there's no dedicated endpoint to just retrieve the display name for a wallet address (though it could be included in user profile data).

3. **Chain/Network Information** - An endpoint to retrieve available blockchain networks and their configuration details would be helpful.

4. **NFT Image/Metadata Retrieval** - There's no direct endpoint to fetch NFT images or complete metadata, which would be useful for the Profile page to display the NFTs visually.

These potential gaps should be discussed with the team to determine if they're necessary and how they should be implemented.