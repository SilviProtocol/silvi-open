#!/usr/bin/env node

/**
 * Grok 3 Mini Testing Script
 * 
 * Tests the XAI Grok API with 3-group strategy for tree species research.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Load test species data for reference
const testSpecies = require('./test-species.json');

// API configuration
const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';

// Enhanced system prompt with aggressive search instructions  
const SYSTEM_PROMPT = `You are a botanical research expert with EXTENSIVE web search capabilities. Your mission is to find COMPREHENSIVE information about tree species.

SEARCH AGGRESSIVELY AND EXTENSIVELY:
1. Use multiple search queries per field if needed - don't give up after one search
2. Search scientific databases, research papers, field guides, botanical gardens, nursery websites, forestry resources
3. Look for specific measurements, ranges, and scientific data in all sources
4. Cross-reference multiple sources for accuracy and completeness
5. Try different search terms and approaches if initial searches don't yield results

EXTRACTION REQUIREMENTS:
- Extract specific numeric values when available (heights, ages, diameters)
- Convert measurements to standard units (meters for height/diameter, years for age)
- Prefer scientific sources but include practical knowledge from growers and gardening communities
- Parse measurements from text (e.g., "grows 20-30m tall" → extract 30 for maximum)
- Only use "Data not available" as ABSOLUTE LAST RESORT after extensive searching

RESPONSE FORMAT:
- Return responses as valid JSON only
- For numeric fields, provide only the number without units
- Prefer specific, species-specific data over general information
- Search comprehensively before declaring data unavailable

ANTI-HALLUCINATION MEASURES:
- Base all information on web search results
- If you cannot find specific information after thorough searching, use "Data not available"
- Never extrapolate beyond what sources actually state
- Distinguish between verified data and estimates`;

// Group 1: Ecological + General (8 fields)
function getEcologicalPrompt(scientificName, commonNames) {
  return `Research the tree species ${scientificName} (commonly known as ${commonNames}) and provide specific ecological information. Focus on scientific databases, environmental studies, botanical surveys, and conservation resources:

habitat_ai: Natural habitat and ecosystem types where this species naturally occurs
elevation_ranges_ai: Specific elevation ranges in meters where this species is found
ecological_function_ai: Specific ecological roles and functions this species serves in its ecosystem
native_adapted_habitats_ai: Original native range and adapted habitat types
agroforestry_use_cases_ai: Specific applications in agroforestry and sustainable agriculture
conservation_status_ai: Current conservation status from IUCN or other authorities
general_description_ai: Comprehensive botanical description of the species
compatible_soil_types_ai: Specific soil types and conditions this species tolerates

SEARCH EXTENSIVELY across scientific databases (GBIF, iNaturalist, IUCN), botanical institutions, environmental research, and field studies. Use multiple search queries if needed. Try different search terms for elevation ranges, habitat types, and ecological functions.

Return a JSON object with these exact field names as keys. Search comprehensively for each field before using "Data not available". Extract specific measurements and ranges when available.

IMPORTANT: Return ONLY valid JSON. All string values must be enclosed in double quotes. For elevation_ranges_ai, extract specific elevation ranges in meters from your search results.`;
}

// Group 2: Morphological (10 fields)
function getMorphologicalPrompt(scientificName, commonNames) {
  return `Research the tree species ${scientificName} (commonly known as ${commonNames}) and provide specific morphological characteristics. Focus on botanical descriptions, field guides, taxonomic databases, and visual identification resources:

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

SEARCH AGGRESSIVELY across botanical databases, field guides, taxonomic resources, tree identification sites, and scientific literature. Use multiple search queries for measurements and characteristics.

CRITICAL for numeric fields: Extract actual numbers from search results:
- For maximum_height_ai: Search for "maximum height", "tallest specimens", "size records"
- For maximum_diameter_ai: Search for "trunk diameter", "dbh records", "girth measurements"  
- For maximum_tree_age_ai: Search for "oldest specimens", "age records", "longevity studies"

Return a JSON object with these exact field names as keys. For numerical fields, provide ONLY the number without units. Search extensively before using "Data not available".

IMPORTANT: Return ONLY valid JSON. Extract specific measurements from your search results.`;
}

// Group 3: Stewardship (6 fields)
function getStewardshipPrompt(scientificName, commonNames) {
  return `Research the tree species ${scientificName} (commonly known as ${commonNames}) and provide specific stewardship and management information. Focus on practical cultivation sources including gardening forums, nursery guides, grower communities, forestry practices, and cultural resources:

stewardship_best_practices_ai: Specific cultivation and care practices for this species
planting_recipes_ai: Specific planting requirements and techniques
pruning_maintenance_ai: Species-specific pruning and maintenance practices
disease_pest_management_ai: Common diseases, pests, and management strategies
fire_management_ai: Fire tolerance and fire management considerations
cultural_significance_ai: Cultural, traditional, or ceremonial uses and significance

Search gardening websites, cultivation forums, nursery resources, forestry guides, ethnobotanical sources, and practical grower experiences. Value practical knowledge from experienced cultivators and traditional uses. Return a JSON object with these exact field names as keys. Focus on practical management and cultural aspects specific to this species. For any field where you cannot find specific information, use "Data not available" as the value.

IMPORTANT: Return ONLY valid JSON. All string values must be enclosed in double quotes. Example format:
{
  "stewardship_best_practices_ai": "Plant in full sun with well-draining soil",
  "planting_recipes_ai": "Data not available",
  "cultural_significance_ai": "Sacred tree in many cultures"
}`;
}

/**
 * Call Grok API with search capability
 */
async function callGrokAPI(userPrompt) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${XAI_API_KEY}`
  };

  // Using Grok-specific format with web search
  const payload = {
    model: 'grok-3-mini',
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: userPrompt
      }
    ],
    temperature: 0.3,
    max_tokens: 80000, // Significantly increased for comprehensive reasoning and responses
    reasoning_effort: 'high', // low, medium, high - controls reasoning depth
    web_search_options: {
      search_context_size: 'high', // low, medium, high - controls search depth
      user_location: {
        type: 'approximate',
        approximate: {
          country: 'USA',
          timezone: 'UTC'
        }
      }
    }
  };

  try {
    const response = await axios.post(XAI_API_URL, payload, { headers });
    
    if (response.data && response.data.choices && response.data.choices[0]) {
      const message = response.data.choices[0].message;
      let finalText = message.content || '';
      
      // Extract JSON from the response
      const jsonMatch = finalText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsedData = JSON.parse(jsonMatch[0]);
          return {
            success: true,
            data: parsedData,
            raw_response: finalText,
            usage: response.data.usage
          };
        } catch (parseError) {
          console.error('JSON parsing error:', parseError.message);
          
          // Try fallback parsing
          try {
            const fieldMatches = finalText.matchAll(/"(\w+_ai)":\s*"([^"]+)"/g);
            const parsedData = {};
            for (const match of fieldMatches) {
              parsedData[match[1]] = match[2];
            }
            
            if (Object.keys(parsedData).length > 0) {
              console.log('Fallback parsing recovered some data');
              return {
                success: true,
                data: parsedData,
                raw_response: finalText,
                usage: response.data.usage
              };
            }
          } catch (fallbackError) {
            // Ignore fallback errors
          }
          
          return {
            success: false,
            error: 'JSON parsing failed',
            raw_response: finalText,
            partial_success: true
          };
        }
      }
      
      return {
        success: false,
        error: 'No JSON found in response',
        raw_response: finalText,
        partial_success: finalText && finalText.length > 0
      };
    }
    
    return {
      success: false,
      error: 'Unexpected API response format'
    };
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message
    };
  }
}

/**
 * Research a single species using 3-group strategy
 */
async function researchSpecies(scientificName, commonNames, taxonId = null) {
  console.log(`\n🌳 Researching: ${scientificName}`);
  console.log(`   Common names: ${commonNames}`);
  if (taxonId) console.log(`   Taxon ID: ${taxonId}`);
  
  const startTime = Date.now();
  
  // Prepare all three prompts
  const prompts = {
    ecological_general: getEcologicalPrompt(scientificName, commonNames),
    morphological: getMorphologicalPrompt(scientificName, commonNames),
    stewardship: getStewardshipPrompt(scientificName, commonNames)
  };
  
  // Make all three API calls in parallel
  console.log('\n📡 Making 3 parallel API calls to Grok...');
  const [ecologicalResult, morphologicalResult, stewardshipResult] = await Promise.all([
    callGrokAPI(prompts.ecological_general),
    callGrokAPI(prompts.morphological),
    callGrokAPI(prompts.stewardship)
  ]);
  
  // Check for errors
  const errors = [];
  if (!ecologicalResult.success) errors.push(`Ecological: ${ecologicalResult.error}`);
  if (!morphologicalResult.success) errors.push(`Morphological: ${morphologicalResult.error}`);
  if (!stewardshipResult.success) errors.push(`Stewardship: ${stewardshipResult.error}`);
  
  if (errors.length > 0) {
    console.error('\n❌ Errors occurred:');
    errors.forEach(err => console.error(`   - ${err}`));
  }
  
  // Combine all results into final structure
  const combinedData = {
    // From ecological group
    ...(ecologicalResult.data || {}),
    // From morphological group
    ...(morphologicalResult.data || {}),
    // From stewardship group
    ...(stewardshipResult.data || {})
  };
  
  // Ensure all 24 fields exist (set to null if missing)
  const allFields = [
    'habitat_ai', 'elevation_ranges_ai', 'ecological_function_ai', 'native_adapted_habitats_ai',
    'agroforestry_use_cases_ai', 'conservation_status_ai', 'general_description_ai', 'compatible_soil_types_ai',
    'growth_form_ai', 'leaf_type_ai', 'deciduous_evergreen_ai', 'flower_color_ai',
    'fruit_type_ai', 'bark_characteristics_ai', 'maximum_height_ai', 'maximum_diameter_ai',
    'lifespan_ai', 'maximum_tree_age_ai', 'stewardship_best_practices_ai', 'planting_recipes_ai',
    'pruning_maintenance_ai', 'disease_pest_management_ai', 'fire_management_ai', 'cultural_significance_ai'
  ];
  
  allFields.forEach(field => {
    if (!(field in combinedData)) {
      combinedData[field] = null;
    }
  });
  
  // Convert numeric fields
  if (combinedData.maximum_height_ai && typeof combinedData.maximum_height_ai === 'string') {
    const height = parseFloat(combinedData.maximum_height_ai);
    combinedData.maximum_height_ai = isNaN(height) ? null : height;
  }
  if (combinedData.maximum_diameter_ai && typeof combinedData.maximum_diameter_ai === 'string') {
    const diameter = parseFloat(combinedData.maximum_diameter_ai);
    combinedData.maximum_diameter_ai = isNaN(diameter) ? null : diameter;
  }
  if (combinedData.maximum_tree_age_ai && typeof combinedData.maximum_tree_age_ai === 'string') {
    const age = parseInt(combinedData.maximum_tree_age_ai);
    combinedData.maximum_tree_age_ai = isNaN(age) ? null : age;
  }
  
  // Calculate token usage
  const totalTokens = (ecologicalResult.usage?.total_tokens || 0) +
                     (morphologicalResult.usage?.total_tokens || 0) +
                     (stewardshipResult.usage?.total_tokens || 0);
  
  // Prepare final result
  const result = {
    metadata: {
      model: 'grok-3-mini',
      species_scientific_name: scientificName,
      common_names: commonNames,
      taxon_id: taxonId,
      timestamp: new Date().toISOString(),
      api_calls: 3,
      total_tokens: totalTokens,
      duration_ms: Date.now() - startTime,
      errors: errors.length > 0 ? errors : null
    },
    research_data: combinedData,
    group_responses: {
      ecological_general: {
        success: ecologicalResult.success,
        data: ecologicalResult.data,
        raw_response: ecologicalResult.raw_response,
        usage: ecologicalResult.usage
      },
      morphological: {
        success: morphologicalResult.success,
        data: morphologicalResult.data,
        raw_response: morphologicalResult.raw_response,
        usage: morphologicalResult.usage
      },
      stewardship: {
        success: stewardshipResult.success,
        data: stewardshipResult.data,
        raw_response: stewardshipResult.raw_response,
        usage: stewardshipResult.usage
      }
    }
  };
  
  // Save to file
  const outputDir = path.join(__dirname, 'test-results', 'grok');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  const filename = `${scientificName.replace(/ /g, '_')}_${Date.now()}.json`;
  const filepath = path.join(outputDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
  
  console.log(`\n✅ Research complete!`);
  console.log(`   Duration: ${result.metadata.duration_ms}ms`);
  console.log(`   Total tokens: ${totalTokens}`);
  console.log(`   Saved to: ${filename}`);
  
  // Display summary of results
  console.log('\n📊 Field completion summary:');
  let filledCount = 0;
  let totalCount = 0;
  
  allFields.forEach(field => {
    totalCount++;
    const value = combinedData[field];
    const hasData = value && value !== 'Data not available' && value !== 'No specific information found';
    if (hasData) filledCount++;
    console.log(`   ${hasData ? '✓' : '✗'} ${field}: ${hasData ? 'Found data' : 'No data'}`);
  });
  
  console.log(`\n   Completion rate: ${filledCount}/${totalCount} (${Math.round(filledCount/totalCount*100)}%)`);
  
  return result;
}

/**
 * Main CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Grok 3 Mini Research Testing

This script tests ONE species at a time using the 3-group strategy with Grok.

Usage:
  node test-grok-research.js --species <taxon_id>
  node test-grok-research.js --custom "<scientific_name>" "<common_names>"
  node test-grok-research.js --list

Options:
  --species <taxon_id>   Test a species from test-species.json by taxon_id
  --custom               Test a custom species (provide scientific and common names)
  --list                 List available test species
  --help, -h             Show this help message

Examples:
  # Test Ginkgo biloba from test species
  node test-grok-research.js --species AngGiGiGN21141-00
  
  # Test a custom species
  node test-grok-research.js --custom "Quercus robur" "English oak, European oak"
  
  # List available test species
  node test-grok-research.js --list
`);
    return;
  }
  
  // Check for API key
  if (!XAI_API_KEY) {
    console.error('❌ XAI_API_KEY not found in .env file');
    console.error('Please add XAI_API_KEY=your_key_here to your .env file');
    return;
  }
  
  // List available species
  if (args.includes('--list')) {
    console.log('\n📋 Available test species:');
    testSpecies.forEach(s => {
      console.log(`\n  Taxon ID: ${s.taxon_id}`);
      console.log(`  Scientific: ${s.species_scientific_name}`);
      console.log(`  Common: ${s.common_name}`);
      console.log(`  Complexity: ${s.complexity}`);
    });
    return;
  }
  
  // Test specific species from test-species.json
  if (args.includes('--species')) {
    const taxonIdIndex = args.indexOf('--species') + 1;
    if (taxonIdIndex >= args.length) {
      console.error('❌ Please provide a taxon_id after --species');
      return;
    }
    
    const taxonId = args[taxonIdIndex];
    const species = testSpecies.find(s => s.taxon_id === taxonId);
    
    if (!species) {
      console.error(`❌ Species with taxon_id "${taxonId}" not found`);
      console.log('Use --list to see available species');
      return;
    }
    
    await researchSpecies(
      species.species_scientific_name,
      species.common_name,
      species.taxon_id
    );
    return;
  }
  
  // Test custom species
  if (args.includes('--custom')) {
    const customIndex = args.indexOf('--custom') + 1;
    if (customIndex + 1 >= args.length) {
      console.error('❌ Please provide both scientific name and common names after --custom');
      console.error('Example: --custom "Quercus robur" "English oak, European oak"');
      return;
    }
    
    const scientificName = args[customIndex];
    const commonNames = args[customIndex + 1];
    
    await researchSpecies(scientificName, commonNames);
    return;
  }
  
  console.error('❌ Invalid command. Use --help for usage information.');
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { researchSpecies };