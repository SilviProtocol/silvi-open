export interface TreeSpecies {
  id: number
  commonName: string
  scientificName: string
  family: string
  genus: string
  subspecies: string | null
  class: string
  order: string
  bestPractices?: string
  commonCountries?: string
  ecoregions?: string
  bioregions?: string
  biome?: string
  ecologicalFunctions?: string
  elevationRanges?: string
  soilTypes?: string
  conservationStatus?: string
}


export interface Species {
  id: string;
  species_common_name: string;
  species_scientific_name: string;
  family: string;
  genus: string;
  subspecies?: string;
  taxonomic_class: string;
  taxonomic_order: string;
  description?: string;
  // Add other fields from your API response
}

export interface ResearchPayload {
  scientificName: string;
  commonNames: string[];
  researcherWallet: string;
}


export interface ResearchData {
  taxon_id: string;
  general_description: string;
  native_adapted_habitats: string;
  stewardship_best_practices: string;
  planting_methods: string;
  ecological_function: string;
  agroforestry_use_cases: string;
  elevation_ranges: string;
  compatible_soil_types: string;
  conservation_status: string;
  research_status: string;
  created_at: string;
  updated_at: string;
  revision: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  revision_history: any[];
  ipfs_cid: string;
  researcher_wallet: string;
}