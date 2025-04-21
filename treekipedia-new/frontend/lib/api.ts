import axios from 'axios';
import { TreeSpecies, ResearchData } from './types';

// Set base URL for API - use the confirmed HTTPS endpoint
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://treekipedia-api.silvi.earth';

// Configure axios instance with headers - match the test script setup
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Define API endpoints based on new backend structure
export interface APITreeSpecies {
  taxon_id: string;
  species: string; // Legacy field
  species_scientific_name: string; // New field
  common_name: string;
  family: string;
  genus: string;
  subspecies: string | null;
  taxonomic_class: string;
  taxonomic_order: string;
  accepted_scientific_name?: string;
  // researched field removed as it's no longer used
}

/**
 * Search for tree species matching a query
 */
export const searchTreeSpecies = async (query: string): Promise<APITreeSpecies[]> => {
  const { data } = await apiClient.get(`/species?search=${query}`);
  return data;
};

/**
 * Get detailed information about a specific tree species by taxon_id
 */
export const getSpeciesById = async (taxon_id: string): Promise<TreeSpecies> => {
  // Add cache busting parameter to avoid browser caching
  const { data } = await apiClient.get(`/species/${taxon_id}?_=${Date.now()}`);
  
  // Ensure the researched flag is explicitly set as a boolean
  if (data.researched === undefined || data.researched === null) {
    data.researched = false;
  }
  
  return data;
};

/**
 * Fund research for a species (initiates the AI research process)
 */
export const fundResearch = async (
  taxon_id: string, 
  wallet_address: string, 
  chain: string,
  transaction_hash: string,
  ipfs_cid: string,
  scientific_name: string
): Promise<ResearchData> => {
  try {
    const { data } = await apiClient.post('/research/fund-research', {
      taxon_id,
      wallet_address,
      chain,
      transaction_hash,
      ipfs_cid,
      scientific_name
    });
    return data;
  } catch (error) {
    console.error('Error funding research:', error);
    if (axios.isAxiosError(error) && error.response?.status === 409) {
      // If we get a 409 Conflict, it means the species is already researched
      // Return a basic object indicating this to avoid showing an error
      return {
        taxon_id,
        // No researched flag
        message: 'This species has already been researched'
      } as ResearchData;
    }
    throw error;
  }
};

/**
 * Get research data for a specific species
 */
export const getResearchData = async (taxon_id: string): Promise<ResearchData> => {
  try {
    const { data } = await apiClient.get(`/research/research/${taxon_id}`);
    console.log("Research data retrieved successfully");
    return data;
  } catch (error) {
    // If we get a 404, it means research hasn't been done yet
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      console.log(`No research data available for taxon_id: ${taxon_id}`);
      // Include more fields to make detection easier
      return { 
        taxon_id,
        // No researched flag,
        general_description_ai: null,
        ecological_function_ai: null,
        habitat_ai: null,
      } as ResearchData; // Return basic stub with researched = false
    }
    // Re-throw other errors
    throw error;
  }
};

/**
 * Get Treederboard data (top contributors)
 */
export const getTreederboard = async (limit = 20) => {
  const { data } = await apiClient.get(`/treederboard?limit=${limit}`);
  return data;
};

/**
 * Get user profile by wallet address
 */
export const getUserProfile = async (wallet_address: string) => {
  const { data } = await apiClient.get(`/treederboard/user/${wallet_address}`);
  return data;
};

/**
 * Update user profile information
 */
export const updateUserProfile = async (wallet_address: string, display_name: string) => {
  const { data } = await apiClient.put('/treederboard/user/profile', {
    wallet_address,
    display_name
  });
  return data;
};

/**
 * Get payment status by transaction hash
 */
export const getPaymentStatus = async (transaction_hash: string) => {
  try {
    const { data } = await apiClient.get(`/sponsorships/transaction/${transaction_hash}`);
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return { 
        status: 'not_found',
        transaction_hash 
      };
    }
    throw error;
  }
};

/**
 * Get all sponsorships by a user's wallet address
 */
export const getUserSponsorships = async (wallet_address: string, limit = 20, offset = 0) => {
  try {
    const { data } = await apiClient.get(`/sponsorships/user/${wallet_address}`, {
      params: { limit, offset }
    });
    return data;
  } catch (error) {
    console.error('Error fetching user sponsorships:', error);
    return [];
  }
};

/**
 * Get all sponsorships for a specific species
 */
export const getSpeciesSponsorships = async (taxon_id: string, limit = 20, offset = 0) => {
  try {
    const { data } = await apiClient.get(`/sponsorships/species/${taxon_id}`, {
      params: { limit, offset }
    });
    return data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return [];
    }
    console.error('Error fetching species sponsorships:', error);
    return [];
  }
};

/**
 * Get auto-complete suggestions for species search
 * Follows the API.md specification for /species/suggest
 */
export const getSpeciesSuggestions = async (
  query: string, 
  field?: 'common_name' | 'species' | 'species_scientific_name'
) => {
  if (!query || query.length < 2) return [];
  
  try {
    // Create the params object according to API spec
    const params: Record<string, string> = { query };
    if (field) {
      params.field = field;
    }
    
    // Use the get method with params passed separately (not in URL)
    const response = await apiClient.get('/species/suggest', { params });
    
    // Return actual API response
    return response.data;
  } catch (error) {
    console.error("Error fetching species suggestions:", error);
    return []; // Return empty array on error
  }
};

