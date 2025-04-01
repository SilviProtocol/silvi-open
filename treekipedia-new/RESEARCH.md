# AI Research Process for Treekipedia

## Overview
The AI Research Agent gathers detailed data on tree species to populate the Treekipedia database, focusing on ecological and morphological characteristics. This process leverages two AI services: Perplexity for initial data collection and ChatGPT 4o for structuring the results. It uses both the scientific name (`scientific_species_name`) and common name(s) (`common_name`, which may be a list) of each species to ensure comprehensive research.

The process is designed to efficiently collect and structure data for the `species` table in PostgreSQL, handling 18 key fields across ecological and morphological categories. Perplexity queries return raw text (not JSON) to keep costs low, while ChatGPT 4o processes this text into a structured JSON format suitable for database storage.

## Process Flow
1. **Input Preparation**:  
   - For a given species, retrieve its `scientific_species_name` (e.g., "Quercus robur") and `common_name` (e.g., "English oak" or a list like "English oak, pedunculate oak") from the `species` table.
   - These names are injected into two Perplexity prompts to maximize search accuracy and coverage.

2. **Parallel Perplexity Queries**:  
   - **Query 1 (Ecological Data)**: Requests ecological information (e.g., conservation status, habitat) for the species, using both scientific and common names.  
   - **Query 2 (Morphological Characteristics)**: Requests physical traits (e.g., growth form, maximum height) for the species, also using both names.  
   - Both queries run concurrently using asynchronous operations (e.g., `Promise.all` in Node.js) to reduce processing time.  
   - **Output**: Two separate raw text strings—one for ecological data, one for morphological characteristics.

3. **Consolidation**:  
   - Combine the two raw text outputs into a single input for ChatGPT 4o.  
   - The consolidated input is formatted as a single string with labeled sections (e.g., "Ecological Data: [text]" and "Morphological Characteristics: [text]") to maintain clarity.

4. **ChatGPT 4o Structuring**:  
   - Pass the consolidated text to ChatGPT 4o with a prompt to extract and structure the data into a predefined JSON schema containing all 18 fields (8 ecological, 10 morphological).  
   - ChatGPT 4o evaluates the text and assigns `null` to any field where data is missing or appears inaccurate (e.g., vague or contradictory).  
   - **Output**: A structured JSON object with consistent units (e.g., meters for height, years for age), ready for database insertion.

5. **Database Storage**:  
   - Insert or update the structured JSON data into the `species` table in PostgreSQL, using the `taxon_id` as the key to match existing records.  
   - Fields with `null` values remain as-is, allowing for future manual review or additional research.

## Key Considerations
- **Cost Efficiency**: Perplexity returns raw text instead of JSON to minimize API costs, with ChatGPT 4o handling the structuring step.
- **Data Quality**: ChatGPT 4o performs a basic quality check by setting unreliable or missing data to `null`, simplifying the process until a more robust validation system is implemented.
- **Scalability**: Parallel queries ensure efficient data collection for the 50,922 species already in the database, with room to expand to additional fields later.

This process ensures that Treekipedia’s species data is enriched with high-value ecological and morphological details, leveraging AI to scale research while maintaining a clear path from raw data to structured storage.


Prompt 1: Ecological Data (Perplexity)
Prompt:

"Provide detailed ecological information for [scientific_species_name], also known as [common_name], covering conservation status, general description, habitat, elevation ranges, compatible soil types, ecological function, native adapted habitats, and agroforestry use cases."

Details:
Uses both scientific and common names for broader search coverage.
Specifies 8 fields clearly and concisely.
Expects raw text output (e.g., paragraphs or bullet points).

Prompt 2: Morphological Characteristics (Perplexity)
Prompt:

"Provide detailed morphological characteristics for [scientific_species_name], also known as [common_name], including growth form, leaf type, deciduous or evergreen status, flower color, fruit type, bark characteristics, maximum height, maximum diameter, lifespan, and maximum tree age."

Details:
Incorporates both names to improve accuracy.
Lists 10 fields explicitly for focused results.
Returns raw text, no JSON.
Prompt 3: ChatGPT 4o Structuring Prompt
Prompt:

Here’s the revised ChatGPT 4o structuring prompt, updated to handle the parsing of maximum_height, maximum_diameter, and maximum_tree_age from strings to their respective numeric/integer types as required by the Treekipedia spec sheet schema. This ensures the JSON output aligns perfectly with the species table for database storage.

Revised ChatGPT 4o Structuring Prompt
Prompt
Prompt:

"You have been provided with raw text data from two sources about the tree species [scientific_species_name], also known as [common_name]. The first source contains ecological information, and the second source contains morphological characteristics. Your task is to:

Extract and structure the relevant information from the raw text into a JSON object matching this schema:
json

Collapse

Wrap

Copy
{
  "conservation_status": "string",
  "general_description": "string",
  "habitat": "string",
  "elevation_ranges": "string",
  "compatible_soil_types": "string",
  "ecological_function": "string",
  "native_adapted_habitats": "string",
  "agroforestry_use_cases": "string",
  "growth_form": "string",
  "leaf_type": "string",
  "deciduous_evergreen": "string",
  "flower_color": "string",
  "fruit_type": "string",
  "bark_characteristics": "string",
  "maximum_height": "number",
  "maximum_diameter": "number",
  "lifespan": "string",
  "maximum_tree_age": "integer"
}
For each field, extract the relevant data from the text. If data is missing or seems inaccurate (e.g., vague, contradictory, or implausible), set that field to null.
For specific fields, apply these formatting rules:
maximum_height: Parse the text to extract a numeric value (e.g., from "30.5 meters" or "30.5 m" to 30.5). Assume meters as the unit unless otherwise specified, and strip the unit from the output. Use up to 2 decimal places. Set to null if no clear number is found.
maximum_diameter: Parse the text to extract a numeric value (e.g., from "1.2 meters" to 1.2). Assume meters as the unit unless otherwise specified, and strip the unit from the output. Use up to 2 decimal places. Set to null if no clear number is found.
maximum_tree_age: Parse the text to extract an integer value (e.g., from "200 years" to 200). Assume years as the unit unless otherwise specified, and strip the unit from the output. Set to null if no clear integer is found.
For all other fields, keep the data as a string, preserving the original text as closely as possible.
Ensure the structured data is ready for database storage in PostgreSQL, adhering to the schema’s type requirements.
Provide the structured JSON object based on the input text."

Details:
Takes raw text from both Perplexity queries as input.
Structures all 18 fields into a single JSON object.
Uses null for missing/inaccurate data, simplifying the output.
Includes unit consistency for database readiness.