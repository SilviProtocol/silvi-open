#!/usr/bin/env node

/**
 * 3-Group Strategy Research Testing
 * 
 * Tests the Anthropic API with 3-group strategy for tree species research.
 * Designed to test ONE species at a time with manual control.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Load test species data for reference
const testSpecies = require('./test-species.json');

// API configuration
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// Enhanced system prompt with anti-hallucination measures
const SYSTEM_PROMPT = `You are a botanical research expert with access to web search capabilities. Your task is to research tree species with scientific rigor and thoroughness.

CRITICAL REQUIREMENTS:
1. Use web search extensively to find comprehensive information from diverse sources
2. NEVER make up or generalize information - if specific data isn't available, explicitly state "Data not available" or "No specific information found"
3. Search broadly across scientific databases, gardening communities, forestry resources, cultivation guides, and practical experience forums
4. When providing measurements, always specify units and include ranges when available
5. Distinguish between verified scientific data, practical experience, and anecdotal information

RESEARCH APPROACH:
- Cast a wide net for information sources - don't limit to academic sources only
- Value practical knowledge from growers, foresters, and gardening communities
- Cross-reference claims across multiple source types when possible
- Be transparent about source quality and information confidence

RESPONSE FORMAT:
- Return responses as valid JSON only
- Use "Data not available" for fields where no specific information is found
- Prefer specific, species-specific data over general information
- Web search citations will be handled automatically by the system

ANTI-HALLUCINATION MEASURES:
- If you cannot find specific information about a species, do NOT provide generic information that could apply to any tree
- Be explicit about uncertainty: "Limited information available" vs "Data not available"
- Prefer specific, measurable data over general descriptions
- When in doubt, err on the side of saying "Data not available"
- Never extrapolate beyond what sources actually state`;

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

Search scientific databases (GBIF, iNaturalist, IUCN), botanical institutions, and environmental research. Return a JSON object with these exact field names as keys. Focus on ecological relationships and environmental preferences specific to this species. For any field where you cannot find specific information, use "Data not available" as the value.

IMPORTANT: Return ONLY valid JSON. All string values must be enclosed in double quotes. Example format:
{
  "habitat_ai": "Natural forest habitat description here",
  "elevation_ranges_ai": "500-1500 meters",
  "ecological_function_ai": "Data not available"
}`;
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

Search botanical databases, field guides, taxonomic resources, and tree identification sites. Return a JSON object with these exact field names as keys. For numerical fields (maximum_height_ai, maximum_diameter_ai, maximum_tree_age_ai), provide only the number without units. Focus on observable physical characteristics specific to this species. For any field where you cannot find specific information, use "Data not available" as the value.

IMPORTANT: Return ONLY valid JSON. All string values must be enclosed in double quotes. Numeric values should not have quotes. Example format:
{
  "growth_form_ai": "Tree with spreading crown",
  "maximum_height_ai": 25,
  "maximum_tree_age_ai": 150,
  "leaf_type_ai": "Data not available"
}`;
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
 * Call Anthropic API with web search
 */
async function callAnthropicAPI(userPrompt) {
  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01'
  };

  const payload = {
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 4000,
    temperature: 0.3,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: userPrompt
      }
    ],
    tools: [{
      type: "web_search_20250305",
      name: "web_search",
      max_uses: 10
    }]
  };

  try {
    const response = await axios.post(ANTHROPIC_API_URL, payload, { headers });
    
    if (response.data && response.data.content) {
      let finalText = '';
      let citations = [];
      
      for (const block of response.data.content) {
        if (block.type === 'text') {
          finalText += block.text;
        }
      }
      
      // Extract JSON from the response
      const jsonMatch = finalText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          // Try to clean up common JSON formatting issues
          let jsonText = jsonMatch[0];
          
          // Fix missing quotes around string values
          jsonText = jsonText.replace(/:\s*([^",\{\}\[\]]+)(?=\s*[,\}])/g, (match, value) => {
            // Don't quote numbers, booleans, or null
            if (/^\d+(\.\d+)?$/.test(value.trim()) || 
                /^(true|false|null)$/i.test(value.trim())) {
              return match;
            }
            // Quote string values
            return `: "${value.trim()}"`;
          });
          
          // Remove trailing commas
          jsonText = jsonText.replace(/,\s*\}/g, '}');
          jsonText = jsonText.replace(/,\s*\]/g, ']');
          
          const parsedData = JSON.parse(jsonText);
          return {
            success: true,
            data: parsedData,
            raw_response: finalText,
            usage: response.data.usage
          };
        } catch (parseError) {
          console.error('JSON parsing error:', parseError.message);
          
          // Try a more aggressive approach - extract key-value pairs manually
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
            partial_success: true  // We got a response, just couldn't parse it
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
      error: error.message
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
  console.log('\n📡 Making 3 parallel API calls...');
  const [ecologicalResult, morphologicalResult, stewardshipResult] = await Promise.all([
    callAnthropicAPI(prompts.ecological_general),
    callAnthropicAPI(prompts.morphological),
    callAnthropicAPI(prompts.stewardship)
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
  const totalTokens = (ecologicalResult.usage?.input_tokens || 0) + 
                     (ecologicalResult.usage?.output_tokens || 0) +
                     (morphologicalResult.usage?.input_tokens || 0) + 
                     (morphologicalResult.usage?.output_tokens || 0) +
                     (stewardshipResult.usage?.input_tokens || 0) + 
                     (stewardshipResult.usage?.output_tokens || 0);
  
  // Prepare final result
  const result = {
    metadata: {
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
  const outputDir = path.join(__dirname, 'test-results', '3group');
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
3-Group Strategy Research Testing

This script tests ONE species at a time using the 3-group strategy.

Usage:
  node test-3group-research.js --species <taxon_id>
  node test-3group-research.js --custom "<scientific_name>" "<common_names>"
  node test-3group-research.js --list

Options:
  --species <taxon_id>   Test a species from test-species.json by taxon_id
  --custom               Test a custom species (provide scientific and common names)
  --list                 List available test species
  --help, -h             Show this help message

Examples:
  # Test Ginkgo biloba from test species
  node test-3group-research.js --species AngGiGiGN21141-00
  
  # Test a custom species
  node test-3group-research.js --custom "Quercus robur" "English oak, European oak"
  
  # List available test species
  node test-3group-research.js --list
`);
    return;
  }
  
  // Check for API key
  if (!ANTHROPIC_API_KEY) {
    console.error('❌ ANTHROPIC_API_KEY not found in .env file');
    console.error('Please add ANTHROPIC_API_KEY=your_key_here to your .env file');
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