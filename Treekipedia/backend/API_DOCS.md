Begin copying here (everything between the triple backticks):

markdown
Copy
Edit
# DeepTrees API Documentation

This document outlines the available API endpoints for the DeepTrees project, **hosted at**:
http://64.227.23.153:3000

markdown
Copy
Edit
*(Replace with your actual domain or IP if different.)*

---

## Table of Contents

1. [Overview](#overview)  
2. [Base URL](#base-url)  
3. [Endpoints](#endpoints)  
   - [GET / (Health Check)](#get--health-check)  
   - [POST /ai/research](#post-airesearch)  
   - [GET /ai/research/:scientificName](#get-airesearchscientificname)  
4. [Example Usage](#example-usage)  
   - [POST /ai/research via cURL](#post-airesearch-via-curl)  
   - [GET /ai/research/:scientificName via cURL](#get-airesearchscientificname-via-curl)  
5. [Notes & Future Plans](#notes--future-plans)

---

## Overview

DeepTrees is an AI-driven Web3 platform that aggregates, structures, and tokenizes scientific knowledge about tree species. This API allows you to:

1. **Initiate AI Research** with `POST /ai/research`  
   - Gathers data via Perplexity.  
   - Refines results via ChatGPT 4o.  
   - Uploads structured JSON to IPFS (Lighthouse).  
   - Stores final data in PostgreSQL.

2. **Retrieve Stored Research** with `GET /ai/research/:scientificName`  
   - Fetch data for a specific species using its scientific name.

*(Future endpoints will cover on-chain attestations and NFT minting.)*

---

## Base URL

Our API is currently running on **port 3000** at the following IP address:
http://64.227.23.153:3000

yaml
Copy
Edit
> **Note:**  
> - If the service is not responding externally, ensure your firewall settings allow inbound requests on port 3000.  
> - In a production environment, you’d typically secure this with HTTPS and use a custom domain.

---

## Endpoints

### GET / (Health Check)

**URL:**  
GET /

makefile
Copy
Edit
**Description:**  
Returns a simple message confirming the API is running.

**Response:**  
DeepTrees API is running.

yaml
Copy
Edit

---

### POST /ai/research

**URL:**  
POST /ai/research

swift
Copy
Edit

**Description:**  
Triggers the AI research workflow. Uses the provided `scientificName` (treated as our internal `taxon_id`), along with `commonNames` and `researcherWallet`. Results in a structured JSON record stored in PostgreSQL, plus a CID from IPFS.

**Request Body:**  
```json
{
  "scientificName": "string (required)",
  "commonNames": ["array of strings (required)"],
  "researcherWallet": "string (required, e.g., 0xYourWalletAddress)"
}
Field	Type	Description
scientificName	string	Unique name, e.g. "Quercus robur"
commonNames	array of string	List of common names, e.g. ["English Oak", "Pedunculate Oak"]
researcherWallet	string	Ethereum wallet address of the researcher
Sample Response:

json
Copy
Edit
{
  "status": "success",
  "data": {
    "taxon_id": "Quercus robur",
    "general_description": "AI-generated description...",
    "native_adapted_habitats": "...",
    "stewardship_best_practices": "...",
    "planting_methods": "...",
    "ecological_function": "...",
    "agroforestry_use_cases": "...",
    "elevation_ranges": "...",
    "compatible_soil_types": "...",
    "conservation_status": "...",
    "ipfs_cid": "Qm...CID",
    "on_chain": {
      "attestation_id": "dummy_attestation_id",
      "nftree_token_id": "dummy_nftree_token_id",
      "contreebution_token_id": "dummy_contreebution_token_id"
    }
  }
}
GET /ai/research/:scientificName
URL:

bash
Copy
Edit
GET /ai/research/{scientificName}
(URL-encode spaces if needed.)

Description:
Fetches a stored research record for the specified scientificName.

Response Example:

json
Copy
Edit
{
  "taxon_id": "Quercus robur",
  "general_description": "AI-generated description...",
  "native_adapted_habitats": "...",
  "stewardship_best_practices": "...",
  "planting_methods": "...",
  "ecological_function": "...",
  "agroforestry_use_cases": "...",
  "elevation_ranges": "...",
  "compatible_soil_types": "...",
  "conservation_status": "...",
  "research_status": "unverified",
  "ipfs_cid": "Qm...CID",
  "researcher_wallet": "0xYourWalletAddress",
  "created_at": "2025-02-08T19:37:54.072Z",
  "updated_at": "2025-02-08T19:37:54.072Z",
  "revision": 1,
  "revision_history": "[]"
}
If no record is found, returns:

json
Copy
Edit
{
  "error": "No research data found for scientificName: Quercus robur"
}
Example Usage
POST /ai/research via cURL
bash
Copy
Edit
curl -X POST http://64.227.23.153:3000/ai/research \
  -H "Content-Type: application/json" \
  -d '{
    "scientificName": "Quercus robur",
    "commonNames": ["English Oak", "Pedunculate Oak"],
    "researcherWallet": "0xYourWalletAddress"
  }'
Expected Response: JSON with status: "success" and an embedded data object containing AI-generated fields, IPFS CID, and dummy on-chain details.

GET /ai/research/:scientificName via cURL
bash
Copy
Edit
curl http://64.227.23.153:3000/ai/research/Quercus%20robur
Expected Response: JSON object with the stored research details.

Notes & Future Plans
Authentication & Security:
Currently, there is no API key or token-based authentication. In a real production environment, you should secure this service (e.g., require an API key, use HTTPS).

On-Chain Actions:
The on_chain object returns dummy data. Soon, we will integrate real on-chain attestations and NFT minting via AgentKit. Endpoints like POST /attest/research and POST /mint/nftree are planned.

Error Handling:
We use standard HTTP response codes (e.g., 400, 404, 500). The client must handle these appropriately.

Updates & Revisions:
Each time POST /ai/research is called with the same scientificName, the data is updated (and the revision increments in the ai_research table).
