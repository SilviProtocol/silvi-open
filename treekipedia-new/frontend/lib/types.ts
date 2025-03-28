// Generic interface for all tree species data based on the new database schema
export interface TreeSpecies {
  taxon_id: string;
  species: string;
  family: string;
  genus: string;
  subspecies: string | null;
  specific_epithet: string;
  accepted_scientific_name: string;
  synonyms: string;
  common_name: string;
  common_countries: string;
  countries_introduced: string;
  countries_invasive: string;
  countries_native: string;
  taxonomic_class: string;
  taxonomic_order: string;
  ecoregions: string;
  biomes: string;
  habitat: string;
  forest_type: string;
  wetland_type: string;
  urban_setting: string;
  elevation_ranges: string;
  compatible_soil_types: string;
  associated_species: string;
  native_adapted_habitats: string;
  agroforestry_use_cases: string;
  successional_stage: string;
  tolerances: string;
  forest_layers: string;
  growth_form: string;
  leaf_type: string;
  deciduous_evergreen: string;
  flower_color: string;
  fruit_type: string;
  bark_characteristics: string;
  maximum_height: number | null;
  maximum_diameter: number | null;
  lifespan: string;
  maximum_tree_age: number | null;
  conservation_status: string;
  climate_change_vulnerability: string;
  national_conservation_status: string;
  verification_status: string;
  threats: string;
  timber_value: string;
  non_timber_products: string;
  cultural_significance: string;
  cultivars: string;
  nutritional_caloric_value: string;
  cultivation_details: string;
  stewardship_best_practices: string;
  planting_recipes: string;
  pruning_maintenance: string;
  disease_pest_management: string;
  fire_management: string;
  general_description: string;
  associated_media: string;
  ecological_function: string;
  default_image: string;
  total_occurrences: number | null;
  allometric_models: string;
  allometric_curve: string;
  reference_list: string;
  data_sources: string;
  ipfs_cid: string;
  last_updated_date: string;
  created_at: string;
  updated_at: string;
}

// Legacy interface for backward compatibility with existing components
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
}

// Payload for research funding request
export interface ResearchPayload {
  taxon_id: string;
  wallet_address: string;
  chain: string;
  transaction_hash: string;
}

// Research data structure
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
  verification_status: string;
  ipfs_cid: string;
  researcher_wallet: string;
  created_at: string;
  updated_at: string;
}

// User data from Treederboard
export interface User {
  id: number;
  wallet_address: string;
  display_name: string | null;
  total_points: number;
  contribution_count: number;
  first_contribution_at: string;
  last_contribution_at: string;
  created_at: string;
  updated_at: string;
}

// Contreebution NFT data
export interface ContreebutionNFT {
  id: number;
  global_id: number;
  taxon_id: string;
  wallet_address: string;
  points: number;
  ipfs_cid: string;
  transaction_hash: string;
  metadata: Record<string, unknown>; // Typed as a generic object
  created_at: string;
}

// Chain type matching wagmi's chain structure
export interface Chain {
  id: number;
  name: string;
  network: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: {
    default: {
      http: string[];
    };
  };
  blockExplorers?: {
    default: {
      name: string;
      url: string;
    };
  };
  testnet: boolean;
}