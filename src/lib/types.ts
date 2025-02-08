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

