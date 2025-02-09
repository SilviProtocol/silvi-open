import axios from 'axios';

export interface APITreeSpecies {
  id: number;
  species_common_name: string;
  species_scientific_name: string;
  subspecies: string | null;
  genus: string;
  family: string;
  taxonomic_class: string;
  taxonomic_order: string;
}

export const searchTreeSpecies = async (query: string): Promise<APITreeSpecies[]> => {
  const { data } = await axios.get(`http://localhost:8000/core/species/?search=${query}`);
  return data;
};