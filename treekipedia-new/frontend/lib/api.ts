import axios from 'axios';
import { TreeSpecies, ResearchPayload, ResearchData } from './types';

// Set base URL for API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Get API key from environment variables
const API_KEY = process.env.NEXT_PUBLIC_API_KEY || '';

// Configure axios instance with headers
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': API_KEY
  }
});

// Define API endpoints based on new backend structure
export interface APITreeSpecies {
  taxon_id: string;
  species: string;
  common_name: string;
  family: string;
  genus: string;
  subspecies: string | null;
  taxonomic_class: string;
  taxonomic_order: string;
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
  const { data } = await apiClient.get(`/species/${taxon_id}`);
  return data;
};

/**
 * Fund research for a species (initiates the AI research process)
 */
export const fundResearch = async (
  taxon_id: string, 
  wallet_address: string, 
  chain: string,
  transaction_hash: string
): Promise<ResearchData> => {
  const { data } = await apiClient.post('/fund-research', {
    taxon_id,
    wallet_address,
    chain,
    transaction_hash
  });
  return data;
};

/**
 * Get Treederboard data (top contributors)
 */
export const getTreederboard = async () => {
  const { data } = await apiClient.get('/treederboard');
  return data;
};

/**
 * Get all NFTs minted by a specific wallet
 */
export const getUserNFTs = async (wallet_address: string) => {
  const { data } = await apiClient.get(`/user-nfts/${wallet_address}`);
  return data;
};

/**
 * Update user profile information
 */
export const updateUserProfile = async (wallet_address: string, display_name: string) => {
  const { data } = await apiClient.post('/user/profile', {
    wallet_address,
    display_name
  });
  return data;
};

/**
 * Get auto-complete suggestions for species search
 */
export const getSpeciesSuggestions = async (query: string) => {
  if (!query || query.length < 2) return [];
  const { data } = await apiClient.get(`/species/suggest?query=${query}`);
  return data;
};