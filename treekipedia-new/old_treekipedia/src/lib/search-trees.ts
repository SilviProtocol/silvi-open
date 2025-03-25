export interface TreeSpecies {
  id: number
  commonName: string
  scientificName: string
  family: string
  genus: string
  subspecies: string | null
  class: string
  order: string
  bestPractices: string
  commonCountries: string
  ecoregions: string
  bioregions: string
  biome: string
  ecologicalFunctions: string
  elevationRanges: string
  soilTypes: string
  conservationStatus: string
}

const treeData: TreeSpecies[] = [
  {
    id: 1,
    commonName: "Red Maple",
    scientificName: "Acer rubrum",
    family: "Sapindaceae",
    genus: "Acer",
    subspecies: null,
    class: "Magnoliopsida",
    order: "Sapindales",
    bestPractices: "Regular pruning, protect from wind damage",
    commonCountries: "USA, Canada",
    ecoregions: "Eastern North American forests",
    bioregions: "Temperate broadleaf and mixed forests",
    biome: "Temperate deciduous forest",
    ecologicalFunctions: "Provides habitat for wildlife, soil stabilization",
    elevationRanges: "0-900m",
    soilTypes: "Acidic, moist, well-drained",
    conservationStatus: "Least Concern",
  },
  {
    id: 2,
    commonName: "White Oak",
    scientificName: "Quercus alba",
    family: "Fagaceae",
    genus: "Quercus",
    subspecies: null,
    class: "Magnoliopsida",
    order: "Fagales",
    bestPractices: "Avoid overwatering, protect from pests",
    commonCountries: "USA, Canada, Europe",
    ecoregions: "Eastern North American forests, Western European forests",
    bioregions: "Temperate broadleaf and mixed forests",
    biome: "Temperate deciduous forest",
    ecologicalFunctions: "Provides habitat for wildlife, soil stabilization",
    elevationRanges: "0-1500m",
    soilTypes: "Well-drained, slightly acidic",
    conservationStatus: "Least Concern",
  },
  {
    id: 3,
    commonName: "Douglas Fir",
    scientificName: "Pseudotsuga menziesii",
    family: "Pinaceae",
    genus: "Pseudotsuga",
    subspecies: "menziesii",
    class: "Pinopsida",
    order: "Pinales",
    bestPractices: "Regular pruning, protect from fire",
    commonCountries: "USA, Canada",
    ecoregions: "Pacific Northwest forests",
    bioregions: "Temperate coniferous forests",
    biome: "Temperate coniferous forest",
    ecologicalFunctions: "Provides habitat for wildlife, timber production",
    elevationRanges: "0-3000m",
    soilTypes: "Well-drained, slightly acidic",
    conservationStatus: "Least Concern",
  },
  {
    id: 4,
    commonName: "Giant Sequoia",
    scientificName: "Sequoiadendron giganteum",
    family: "Cupressaceae",
    genus: "Sequoiadendron",
    subspecies: null,
    class: "Pinopsida",
    order: "Pinales",
    bestPractices: "Protect from fire, avoid overwatering",
    commonCountries: "USA",
    ecoregions: "Sierra Nevada forests",
    bioregions: "Temperate coniferous forests",
    biome: "Temperate coniferous forest",
    ecologicalFunctions: "Provides habitat for wildlife, carbon sequestration",
    elevationRanges: "1500-2500m",
    soilTypes: "Well-drained, slightly acidic",
    conservationStatus: "Least Concern",
  },
  {
    id: 5,
    commonName: "Sugar Maple",
    scientificName: "Acer saccharum",
    family: "Sapindaceae",
    genus: "Acer",
    subspecies: null,
    class: "Magnoliopsida",
    order: "Sapindales",
    bestPractices: "Regular pruning, protect from pests",
    commonCountries: "USA, Canada",
    ecoregions: "Eastern North American forests",
    bioregions: "Temperate broadleaf and mixed forests",
    biome: "Temperate deciduous forest",
    ecologicalFunctions: "Provides habitat for wildlife, maple syrup production",
    elevationRanges: "0-1500m",
    soilTypes: "Well-drained, slightly acidic",
    conservationStatus: "Least Concern",
  },
]

export async function searchTrees(query: string): Promise<TreeSpecies[]> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200))

  return treeData.filter(
    (tree) =>
      tree.commonName.toLowerCase().includes(query.toLowerCase()) ||
      tree.scientificName.toLowerCase().includes(query.toLowerCase()),
  )
}

