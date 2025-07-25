# User Prompt Templates for Field Groups

## Current 2-Group Strategy

### Group 1: Ecological + Stewardship + General
```
Research the tree species {scientific_name} (commonly known as {common_names}) and provide specific information for the following ecological, stewardship, and general characteristics:

habitat_ai: Natural habitat and ecosystem types where this species naturally occurs
elevation_ranges_ai: Specific elevation ranges in meters where this species is found
ecological_function_ai: Specific ecological roles and functions this species serves in its ecosystem
native_adapted_habitats_ai: Original native range and adapted habitat types
agroforestry_use_cases_ai: Specific applications in agroforestry and sustainable agriculture
conservation_status_ai: Current conservation status from IUCN or other authorities
stewardship_best_practices_ai: Specific cultivation and care practices for this species
planting_recipes_ai: Specific planting requirements and techniques
pruning_maintenance_ai: Species-specific pruning and maintenance practices
disease_pest_management_ai: Common diseases, pests, and management strategies
fire_management_ai: Fire tolerance and fire management considerations
cultural_significance_ai: Cultural, traditional, or ceremonial uses and significance
general_description_ai: Comprehensive botanical description of the species
compatible_soil_types_ai: Specific soil types and conditions this species tolerates

Return a JSON object with these exact field names as keys. For any field where you cannot find specific information about this species, use "Data not available" as the value. Do not provide generic information that could apply to any tree species.
```

### Group 2: Morphological
```
Research the tree species {scientific_name} (commonly known as {common_names}) and provide specific morphological characteristics:

growth_form_ai: Specific growth form and architectural structure
leaf_type_ai: Detailed leaf characteristics and morphology
deciduous_evergreen_ai: Leaf retention pattern (deciduous/evergreen/semi-deciduous)
flower_color_ai: Specific flower colors and characteristics
fruit_type_ai: Type and characteristics of fruits produced
bark_characteristics_ai: Detailed bark appearance and texture
maximum_height_ai: Maximum recorded height in meters (provide number only, no units)
maximum_diameter_ai: Maximum trunk diameter in meters (provide number only, no units)
lifespan_ai: Typical lifespan or longevity information
maximum_tree_age_ai: Maximum recorded age in years (provide integer only)

Return a JSON object with these exact field names as keys. For numerical fields (maximum_height_ai, maximum_diameter_ai, maximum_tree_age_ai), provide only the number without units. For any field where you cannot find specific information about this species, use "Data not available" as the value.
```

## Logical 3-Group Strategy

### Group 1: Ecological + General
```
Research the tree species {scientific_name} (commonly known as {common_names}) and provide specific ecological information. Focus on scientific databases, environmental studies, botanical surveys, and conservation resources:

habitat_ai: Natural habitat and ecosystem types where this species naturally occurs
elevation_ranges_ai: Specific elevation ranges in meters where this species is found
ecological_function_ai: Specific ecological roles and functions this species serves in its ecosystem
native_adapted_habitats_ai: Original native range and adapted habitat types
agroforestry_use_cases_ai: Specific applications in agroforestry and sustainable agriculture
conservation_status_ai: Current conservation status from IUCN or other authorities
general_description_ai: Comprehensive botanical description of the species
compatible_soil_types_ai: Specific soil types and conditions this species tolerates

Search scientific databases (GBIF, iNaturalist, IUCN), botanical institutions, and environmental research. Return a JSON object with these exact field names as keys. Focus on ecological relationships and environmental preferences specific to this species.
```

### Group 2: Morphological
```
Research the tree species {scientific_name} (commonly known as {common_names}) and provide specific morphological characteristics. Focus on botanical descriptions, field guides, taxonomic databases, and visual identification resources:

growth_form_ai: Specific growth form and architectural structure
leaf_type_ai: Detailed leaf characteristics and morphology
deciduous_evergreen_ai: Leaf retention pattern (deciduous/evergreen/semi-deciduous)
flower_color_ai: Specific flower colors and characteristics
fruit_type_ai: Type and characteristics of fruits produced
bark_characteristics_ai: Detailed bark appearance and texture
maximum_height_ai: Maximum recorded height in meters (provide number only, no units)
maximum_diameter_ai: Maximum trunk diameter in meters (provide number only, no units)
lifespan_ai: Typical lifespan or longevity information
maximum_tree_age_ai: Maximum recorded age in years (provide integer only)

Search botanical databases, field guides, taxonomic resources, and tree identification sites. Return a JSON object with these exact field names as keys. For numerical fields (maximum_height_ai, maximum_diameter_ai, maximum_tree_age_ai), provide only the number without units. Focus on observable physical characteristics specific to this species.
```

### Group 3: Stewardship
```
Research the tree species {scientific_name} (commonly known as {common_names}) and provide specific stewardship and management information. Focus on practical cultivation sources including gardening forums, nursery guides, grower communities, forestry practices, and cultural resources:

stewardship_best_practices_ai: Specific cultivation and care practices for this species
planting_recipes_ai: Specific planting requirements and techniques
pruning_maintenance_ai: Species-specific pruning and maintenance practices
disease_pest_management_ai: Common diseases, pests, and management strategies
fire_management_ai: Fire tolerance and fire management considerations
cultural_significance_ai: Cultural, traditional, or ceremonial uses and significance

Search gardening websites, cultivation forums, nursery resources, forestry guides, ethnobotanical sources, and practical grower experiences. Value practical knowledge from experienced cultivators and traditional uses. Return a JSON object with these exact field names as keys. Focus on practical management and cultural aspects specific to this species.
```

## Focused 4-Group Strategy

### Group 1: Habitat & Distribution
```
Research the tree species {scientific_name} (commonly known as {common_names}) for habitat and distribution information:

habitat_ai: Natural habitat and ecosystem types where this species naturally occurs
elevation_ranges_ai: Specific elevation ranges in meters where this species is found
native_adapted_habitats_ai: Original native range and adapted habitat types
conservation_status_ai: Current conservation status from IUCN or other authorities

Return a JSON object focusing on where this species naturally occurs and its conservation status.
```

### Group 2: Physical Characteristics
```
Research the tree species {scientific_name} (commonly known as {common_names}) for physical characteristics:

growth_form_ai: Specific growth form and architectural structure
leaf_type_ai: Detailed leaf characteristics and morphology
deciduous_evergreen_ai: Leaf retention pattern (deciduous/evergreen/semi-deciduous)
flower_color_ai: Specific flower colors and characteristics
fruit_type_ai: Type and characteristics of fruits produced
bark_characteristics_ai: Detailed bark appearance and texture
maximum_height_ai: Maximum recorded height in meters (number only)
maximum_diameter_ai: Maximum trunk diameter in meters (number only)
lifespan_ai: Typical lifespan or longevity information
maximum_tree_age_ai: Maximum recorded age in years (integer only)
compatible_soil_types_ai: Specific soil types and conditions this species tolerates

Return a JSON object focusing on physical appearance and growth characteristics.
```

### Group 3: Management & Stewardship
```
Research the tree species {scientific_name} (commonly known as {common_names}) for management practices:

stewardship_best_practices_ai: Specific cultivation and care practices for this species
planting_recipes_ai: Specific planting requirements and techniques
pruning_maintenance_ai: Species-specific pruning and maintenance practices
disease_pest_management_ai: Common diseases, pests, and management strategies
fire_management_ai: Fire tolerance and fire management considerations

Return a JSON object focusing on practical cultivation and management.
```

### Group 4: Cultural & Functional Uses
```
Research the tree species {scientific_name} (commonly known as {common_names}) for cultural and functional information:

cultural_significance_ai: Cultural, traditional, or ceremonial uses and significance
agroforestry_use_cases_ai: Specific applications in agroforestry and sustainable agriculture
ecological_function_ai: Specific ecological roles and functions this species serves in its ecosystem
general_description_ai: Comprehensive botanical description of the species

Return a JSON object focusing on how this species is used by humans and its ecological role.
```

## Sample Species for Testing

Replace `{scientific_name}` and `{common_names}` with:

1. **Quercus robur** / "English oak, European oak" (Well-documented)
2. **Plumeria rubra** / "Red frangipani, temple tree" (Moderate documentation)
3. **Adenanthera pavonina** / "Red sandalwood, saga seed tree" (Limited documentation)
4. **Betula pendula** / "Silver birch, European white birch" (Common species)
5. **Dipteryx odorata** / "Tonka bean, cumaru" (Specialized/rare)