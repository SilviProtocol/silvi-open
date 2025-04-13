Overview
The AI Research Agent gathers detailed data on tree species to populate the Treekipedia database, focusing on ecological, morphological, and practical stewardship knowledge. This process uses two AI services: Perplexity for initial data collection and ChatGPT 4o for structuring the results. It references both the scientific name (species_scientific_name) and common name(s) (common_name, which may be a list) of each species for comprehensive research.

The process is designed to efficiently collect and structure data for the species table in PostgreSQL, handling the _ai versions of all relevant fields—ecological, morphological, and stewardship-related. Perplexity returns raw text to keep costs low, while ChatGPT 4o processes this text into a structured JSON format ready for database storage.

Process Flow
Input Preparation

For a given species, retrieve its species_scientific_name (e.g., "Quercus robur") and common_name (e.g., "English oak") from the species table.

These names are injected into two Perplexity prompts to maximize search accuracy and coverage.

Parallel Perplexity Queries

Query 1 (Ecological + Stewardship Data):
Requests information for the following _ai fields:

stewardship_best_practices_ai

planting_recipes_ai

pruning_maintenance_ai

disease_pest_management_ai

fire_management_ai

compatible_soil_types_ai

cultural_significance_ai

conservation_status_ai

general_description_ai

habitat_ai

elevation_ranges_ai

ecological_function_ai

native_adapted_habitats_ai

agroforestry_use_cases_ai

Prompt Example


"Provide detailed ecological and practical stewardship information for [species_scientific_name], also known as [common_name], covering stewardship best practices, planting recipes, pruning maintenance, disease/pest management, fire management, compatible soil types, cultural significance, conservation status, general description, habitat, elevation ranges, ecological function, native adapted habitats, and agroforestry use cases."
Query 2 (Morphological Data):
Requests information for the following _ai fields:

growth_form_ai

leaf_type_ai

deciduous_evergreen_ai

flower_color_ai

fruit_type_ai

bark_characteristics_ai

maximum_height_ai

maximum_diameter_ai

lifespan_ai

maximum_tree_age_ai

Prompt Example


"Provide detailed morphological characteristics for [species_scientific_name], also known as [common_name], including growth form, leaf type, deciduous or evergreen status, flower color, fruit type, bark characteristics, maximum height, maximum diameter, lifespan, and maximum tree age."
Both queries run concurrently (e.g., with Promise.all) to reduce processing time.

Output: Two raw text strings—one covering ecological + stewardship data, one covering morphological data.

Consolidation

Combine the two raw text outputs into a single input for ChatGPT 4o.

Label them clearly (e.g., "Ecological + Stewardship Data: [text]" and "Morphological Data: [text]").

ChatGPT 4o Structuring

Pass the consolidated text to ChatGPT 4o with a prompt to extract the information into a predefined JSON schema containing all _ai fields.

ChatGPT 4o assigns null to any field where data is missing or appears inaccurate.

Output: A structured JSON object ready for database insertion.

Database Storage

Insert or update the JSON data in the species table, matching the record by taxon_id.

Fields set to null remain as-is for future review or additional research.

Key Considerations
Cost Efficiency: Perplexity returns raw text (no JSON) to minimize API costs; ChatGPT 4o handles the structuring.

Data Quality: ChatGPT 4o sets unclear or contradictory data to null, simplifying initial validation.

Scalability: This two-query setup is efficient for both small and large databases, covering all key fields while remaining cost-conscious.

Prompt 3: ChatGPT 4o Structuring Prompt
Example:

php
Copy
Edit
"You have been provided with raw text data from two sources about the tree species [species_scientific_name], also known as [common_name]. 
The first source contains ecological + stewardship information, and the second source contains morphological characteristics. 

Your task is to extract and structure the relevant information into a JSON object matching this schema:

{
  "stewardship_best_practices_ai": "string",
  "planting_recipes_ai": "string",
  "pruning_maintenance_ai": "string",
  "disease_pest_management_ai": "string",
  "fire_management_ai": "string",
  "compatible_soil_types_ai": "string",
  "cultural_significance_ai": "string",
  "conservation_status_ai": "string",
  "general_description_ai": "string",
  "habitat_ai": "string",
  "elevation_ranges_ai": "string",
  "ecological_function_ai": "string",
  "native_adapted_habitats_ai": "string",
  "agroforestry_use_cases_ai": "string",
  "growth_form_ai": "string",
  "leaf_type_ai": "string",
  "deciduous_evergreen_ai": "string",
  "flower_color_ai": "string",
  "fruit_type_ai": "string",
  "bark_characteristics_ai": "string",
  "maximum_height_ai": "number",
  "maximum_diameter_ai": "number",
  "lifespan_ai": "string",
  "maximum_tree_age_ai": "integer"
}

For each field:
- If data is missing or contradictory, set that field to null.
- For maximum_height_ai, parse out a numeric value (in meters), using up to 2 decimals.
- For maximum_diameter_ai, parse out a numeric value (in meters), using up to 2 decimals.
- For maximum_tree_age_ai, parse out an integer (in years).

Return the structured JSON object, ensuring it’s suitable for PostgreSQL insertion."
This final prompt ensures all _ai fields—ecological, morphological, and stewardship—are collected and formatted consistently, ready to be stored in Treekipedia’s database.