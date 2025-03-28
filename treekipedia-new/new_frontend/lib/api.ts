// API utility functions for Treekipedia
import { mockSpecies, mockLeaderboard, mockUserProfile } from "./mock-data"

/**
 * Base API URL for all requests
 */
const API_BASE_URL = "/api"

/**
 * ALWAYS use mock data in preview environments to avoid HTML errors
 * This is a temporary fix until the real API is available
 */
// Force mock mode to true to prevent any real API calls
const FORCE_MOCK_MODE = true

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Always use mock data in preview mode or when forced
  if (FORCE_MOCK_MODE) {
    console.log(`Using mock data for endpoint: ${endpoint}`)
    return await mockAPIResponse<T>(endpoint, options)
  }

  try {
    console.log(`Fetching API: ${API_BASE_URL}${endpoint}`)
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    })

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `API error: ${response.status} ${response.statusText}`
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorMessage
      } catch (e) {
        // If we can't parse JSON, try to get text
        try {
          const errorText = await response.text()
          // Only use the first 100 chars to avoid huge error messages
          errorMessage = `${errorMessage} - ${errorText.substring(0, 100)}...`
        } catch (textError) {
          // If we can't get text either, just use the status
        }
      }
      throw new Error(errorMessage)
    }

    return await response.json()
  } catch (error) {
    console.error(`API request failed: ${endpoint}`, error)
    throw error
  }
}

/**
 * Mock API response for preview environment
 */
async function mockAPIResponse<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  console.log(`Generating mock response for: ${endpoint}`)

  // Parse the endpoint to determine what data to return
  if (endpoint.startsWith("/species/suggest")) {
    const url = new URL(`http://localhost${endpoint}`)
    const query = url.searchParams.get("query") || ""
    const field = url.searchParams.get("field")

    return mockSpeciesSuggestions(query, field as any) as unknown as T
  }

  if (endpoint.startsWith("/species/") && !endpoint.includes("suggest")) {
    const taxonId = endpoint.split("/species/")[1]
    return mockSpeciesDetails(taxonId) as unknown as T
  }

  if (endpoint.startsWith("/treederboard") && !endpoint.includes("user")) {
    return mockLeaderboard as unknown as T
  }

  // Fix for user profile endpoint - handle any variation of the user endpoint
  if (endpoint.startsWith("/treederboard/user/")) {
    // Check if it's an update request
    if (endpoint.includes("profile") && options?.method === "PUT") {
      const body = JSON.parse((options.body as string) || "{}")
      return mockUpdateUserProfile(body.display_name) as unknown as T
    }
    // Return mock user profile for any user ID
    return mockUserProfile as unknown as T
  }

  if (endpoint.startsWith("/research/fund-research") && options?.method === "POST") {
    const body = JSON.parse((options.body as string) || "{}")
    return mockFundResearch(body.taxon_id) as unknown as T
  }

  if (endpoint.startsWith("/wallet/verify") && options?.method === "POST") {
    return { verified: true, user_id: 42 } as unknown as T
  }

  // Default fallback
  console.log(`No specific mock data available for endpoint: ${endpoint}, returning empty object`)
  return {} as T
}

/**
 * Mock species suggestions based on query
 */
function mockSpeciesSuggestions(query: string, field?: "common_name" | "accepted_scientific_name") {
  if (!query) return []

  const lowerQuery = query.toLowerCase()

  return mockSpecies
    .filter((species) => {
      if (field === "common_name") {
        return species.common_name.toLowerCase().includes(lowerQuery)
      } else if (field === "accepted_scientific_name") {
        return species.accepted_scientific_name.toLowerCase().includes(lowerQuery)
      } else {
        return (
          species.common_name.toLowerCase().includes(lowerQuery) ||
          species.accepted_scientific_name.toLowerCase().includes(lowerQuery)
        )
      }
    })
    .map((species) => ({
      taxon_id: species.taxon_id,
      common_name: species.common_name,
      accepted_scientific_name: species.accepted_scientific_name,
    }))
}

/**
 * Mock species details
 */
function mockSpeciesDetails(taxonId: string) {
  const species = mockSpecies.find((s) => s.taxon_id === taxonId)
  if (!species) {
    throw new Error(`Species not found: ${taxonId}`)
  }
  return species
}

/**
 * Mock fund research
 */
function mockFundResearch(taxonId: string) {
  const species = mockSpecies.find((s) => s.taxon_id === taxonId)
  if (!species) {
    throw new Error(`Species not found: ${taxonId}`)
  }

  return {
    success: true,
    research_data: {
      conservation_status: "Vulnerable",
      general_description: species.general_description,
      habitat: species.habitat,
    },
    ipfs_cid: "ipfs://bafybeihbmin5h7ektpjqgr7rdnmtxcaujjgxcxz6nu5ynvkqirtbxj7xt4",
    attestation_uid: "att_123456789",
    nft_details: {
      id: 105,
      taxon_id: taxonId,
      wallet_address: "0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b",
      points: 500,
      ipfs_cid: "ipfs://bafybeihbmin5h7ektpjqgr7rdnmtxcaujjgxcxz6nu5ynvkqirtbxj7xt4",
      transaction_hash: "0x5678901234abcdef5678901234abcdef5678901234abcdef5678901234abcdef",
      metadata: {
        species: species.common_name,
        chain: "base",
        attestation_uid: "att_123456789",
        mint_receipt: {},
        research_date: new Date().toISOString(),
      },
    },
  }
}

/**
 * Mock update user profile
 */
function mockUpdateUserProfile(displayName: string) {
  return {
    ...mockUserProfile,
    display_name: displayName,
  }
}

/**
 * Species API functions
 */
export const speciesAPI = {
  // Get species suggestions for autocomplete
  getSuggestions: (query: string, field?: "common_name" | "accepted_scientific_name") =>
    fetchAPI<Array<{ taxon_id: string; common_name: string; accepted_scientific_name: string }>>(
      `/species/suggest?query=${encodeURIComponent(query)}${field ? `&field=${field}` : ""}`,
    ),

  // Get species by search term
  searchSpecies: (search: string) =>
    fetchAPI<Array<{ taxon_id: string; common_name: string; accepted_scientific_name: string }>>(
      `/species?search=${encodeURIComponent(search)}`,
    ),

  // Get detailed species information
  getSpeciesDetails: (taxonId: string) =>
    fetchAPI<{
      taxon_id: string
      common_name: string
      accepted_scientific_name: string
      species: string
      family: string
      genus: string
      general_description: string
      habitat: string
      isResearched: boolean
      // Additional fields will be present if researched
    }>(`/species/${taxonId}`),
}

/**
 * Treederboard API functions
 */
export const treederboardAPI = {
  // Get leaderboard data
  getLeaderboard: (limit = 20) =>
    fetchAPI<
      Array<{
        id: number
        wallet_address: string
        display_name?: string
        total_points: number
        contribution_count: number
        first_contribution_at: string
        last_contribution_at: string
      }>
    >(`/treederboard?limit=${limit}`),

  // Get user profile
  getUserProfile: (walletAddress: string) =>
    fetchAPI<{
      id: number
      wallet_address: string
      display_name?: string
      total_points: number
      contribution_count: number
      first_contribution_at: string
      last_contribution_at: string
      nfts: Array<{
        id: number
        global_id: number
        taxon_id: string
        points: number
        ipfs_cid: string
        transaction_hash: string
        created_at: string
      }>
    }>(`/treederboard/user/${walletAddress}`),

  // Update user profile
  updateUserProfile: (walletAddress: string, displayName: string) =>
    fetchAPI<{
      id: number
      wallet_address: string
      display_name: string
      total_points: number
      contribution_count: number
    }>(`/treederboard/user/profile`, {
      method: "PUT",
      body: JSON.stringify({ wallet_address: walletAddress, display_name: displayName }),
    }),
}

/**
 * Research API functions
 */
export const researchAPI = {
  // Fund research for a species
  fundResearch: (taxonId: string, walletAddress: string, chain: string, transactionHash: string) =>
    fetchAPI<{
      success: boolean
      research_data: {
        conservation_status: string
        general_description: string
        habitat: string
        // Other research fields
      }
      ipfs_cid: string
      attestation_uid: string
      nft_details: {
        id: number
        taxon_id: string
        wallet_address: string
        points: number
        ipfs_cid: string
        transaction_hash: string
        metadata: {
          species: string
          chain: string
          attestation_uid: string
          mint_receipt: object
          research_date: string
        }
      }
    }>(`/research/fund-research`, {
      method: "POST",
      body: JSON.stringify({
        taxon_id: taxonId,
        wallet_address: walletAddress,
        chain,
        transaction_hash: transactionHash,
      }),
    }),

  // Get research data for a species
  getResearchData: (taxonId: string) =>
    fetchAPI<{
      taxon_id: string
      conservation_status: string
      general_description: string
      habitat: string
      // Additional research fields
    }>(`/research/research/${taxonId}`),
}

/**
 * Wallet API functions
 */
export const walletAPI = {
  // Verify wallet connection
  verifyWallet: (walletAddress: string, signature: string, message: string) =>
    fetchAPI<{
      verified: boolean
      user_id?: number
    }>(`/wallet/verify`, {
      method: "POST",
      body: JSON.stringify({ wallet_address: walletAddress, signature, message }),
    }),
}

export default {
  species: speciesAPI,
  treederboard: treederboardAPI,
  research: researchAPI,
  wallet: walletAPI,
}

