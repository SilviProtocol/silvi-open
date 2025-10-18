#!/usr/bin/env node

/**
 * Isolated AI Research Testing Playground
 * 
 * This script tests different AI research approaches without touching the main database.
 * Results are saved to JSON files for analysis and comparison.
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Load test species data
const testSpecies = require('./test-species.json');

// Claude API configuration
const CLAUDE_API_KEY = process.env.ANTHROPIC_API_KEY; // Using ANTHROPIC_API_KEY from .env
const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';

// All 24 research fields grouped by category (matches database schema)
const RESEARCH_FIELDS = {
  ecological: [
    'habitat_ai',
    'elevation_ranges_ai', 
    'ecological_function_ai',
    'native_adapted_habitats_ai',
    'agroforestry_use_cases_ai',
    'conservation_status_ai'
  ],
  morphological: [
    'growth_form_ai',
    'leaf_type_ai',
    'deciduous_evergreen_ai',
    'flower_color_ai',
    'fruit_type_ai',
    'bark_characteristics_ai',
    'maximum_height_ai',
    'maximum_diameter_ai',
    'lifespan_ai',
    'maximum_tree_age_ai'
  ],
  stewardship: [
    'stewardship_best_practices_ai',
    'planting_recipes_ai',
    'pruning_maintenance_ai',
    'disease_pest_management_ai',
    'fire_management_ai',
    'cultural_significance_ai'
  ],
  general: [
    'general_description_ai',
    'compatible_soil_types_ai'
  ]
};

/**
 * Call Claude API with web search capability
 */
async function callClaudeAPI(systemPrompt, userPrompt, model = 'claude-3-5-sonnet-latest') {
  if (!CLAUDE_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not found in environment variables');
  }

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': CLAUDE_API_KEY,
    'anthropic-version': '2023-06-01'
  };

  const payload = {
    model: model,
    max_tokens: 4000,
    temperature: 0.3,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt
      }
    ],
    tools: [{
      type: "web_search_20250305",
      name: "web_search",
      max_uses: 5
      // No domain filtering - allow broad web search for comprehensive research
    }]
  };

  try {
    console.log(`Calling Claude API with web search for research...`);
    const response = await axios.post(CLAUDE_API_URL, payload, { headers });
    
    if (response.data && response.data.content) {
      // Extract the final text response from the content array
      let finalText = '';
      let citations = [];
      
      for (const block of response.data.content) {
        if (block.type === 'text') {
          finalText += block.text;
          // Collect citations if present
          if (block.citations) {
            citations.push(...block.citations);
          }
        }
      }
      
      return {
        text: finalText,
        citations: citations,
        full_response: response.data
      };
    } else {
      throw new Error('Unexpected API response format');
    }
  } catch (error) {
    console.error('Claude API Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Test different field grouping strategies
 */
const GROUPING_STRATEGIES = {
  current_2group: {
    name: "Current 2-Group (Ecological+Stewardship vs Morphological)",
    groups: [
      [...RESEARCH_FIELDS.ecological, ...RESEARCH_FIELDS.stewardship, ...RESEARCH_FIELDS.general],
      RESEARCH_FIELDS.morphological
    ]
  },
  logical_3group: {
    name: "Logical 3-Group (Ecological, Morphological, Stewardship)",
    groups: [
      [...RESEARCH_FIELDS.ecological, ...RESEARCH_FIELDS.general],
      RESEARCH_FIELDS.morphological,
      RESEARCH_FIELDS.stewardship
    ]
  },
  focused_4group: {
    name: "Focused 4-Group (Habitat, Physical, Management, Cultural)",
    groups: [
      ['habitat_ai', 'elevation_ranges_ai', 'native_adapted_habitats_ai', 'conservation_status_ai'], // Habitat
      [...RESEARCH_FIELDS.morphological, 'compatible_soil_types_ai'], // Physical
      ['stewardship_best_practices_ai', 'planting_recipes_ai', 'pruning_maintenance_ai', 'disease_pest_management_ai', 'fire_management_ai'], // Management
      ['cultural_significance_ai', 'agroforestry_use_cases_ai', 'ecological_function_ai', 'general_description_ai'] // Cultural/Functional
    ]
  }
};

/**
 * Generate enhanced system prompt for scientific accuracy
 */
function generateSystemPrompt() {
  return `You are a botanical research expert with access to web search capabilities. Your task is to research tree species with scientific rigor and thoroughness.

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
}

/**
 * Generate user prompt for specific field group
 */
function generateUserPrompt(species, fields, groupName) {
  const scientificName = species.species_scientific_name;
  const commonNames = species.common_name;
  
  const fieldDescriptions = {
    'habitat_ai': 'Natural habitat and ecosystem types where this species naturally occurs',
    'elevation_ranges_ai': 'Specific elevation ranges in meters where this species is found',
    'ecological_function_ai': 'Specific ecological roles and functions this species serves in its ecosystem',
    'native_adapted_habitats_ai': 'Original native range and adapted habitat types',
    'agroforestry_use_cases_ai': 'Specific applications in agroforestry and sustainable agriculture',
    'conservation_status_ai': 'Current conservation status from IUCN or other authorities',
    'growth_form_ai': 'Specific growth form and architectural structure',
    'leaf_type_ai': 'Detailed leaf characteristics and morphology',
    'deciduous_evergreen_ai': 'Leaf retention pattern (deciduous/evergreen/semi-deciduous)',
    'flower_color_ai': 'Specific flower colors and characteristics',
    'fruit_type_ai': 'Type and characteristics of fruits produced',
    'bark_characteristics_ai': 'Detailed bark appearance and texture',
    'maximum_height_ai': 'Maximum recorded height in meters (number only)',
    'maximum_diameter_ai': 'Maximum trunk diameter in meters (number only)',
    'lifespan_ai': 'Typical lifespan or longevity information',
    'maximum_tree_age_ai': 'Maximum recorded age in years (integer only)',
    'stewardship_best_practices_ai': 'Specific cultivation and care practices for this species',
    'planting_recipes_ai': 'Specific planting requirements and techniques',
    'pruning_maintenance_ai': 'Species-specific pruning and maintenance practices',
    'disease_pest_management_ai': 'Common diseases, pests, and management strategies',
    'fire_management_ai': 'Fire tolerance and fire management considerations',
    'cultural_significance_ai': 'Cultural, traditional, or ceremonial uses and significance',
    'general_description_ai': 'Comprehensive botanical description of the species',
    'compatible_soil_types_ai': 'Specific soil types and conditions this species tolerates'
  };

  // Determine research approach based on field groups
  let researchApproach = '';
  const ecologicalFields = ['habitat_ai', 'elevation_ranges_ai', 'ecological_function_ai', 'native_adapted_habitats_ai', 'agroforestry_use_cases_ai', 'conservation_status_ai', 'general_description_ai', 'compatible_soil_types_ai'];
  const morphologicalFields = ['growth_form_ai', 'leaf_type_ai', 'deciduous_evergreen_ai', 'flower_color_ai', 'fruit_type_ai', 'bark_characteristics_ai', 'maximum_height_ai', 'maximum_diameter_ai', 'lifespan_ai', 'maximum_tree_age_ai'];
  const stewardshipFields = ['stewardship_best_practices_ai', 'planting_recipes_ai', 'pruning_maintenance_ai', 'disease_pest_management_ai', 'fire_management_ai', 'cultural_significance_ai'];
  
  if (fields.some(f => ecologicalFields.includes(f))) {
    researchApproach = 'Focus on scientific databases, environmental studies, botanical surveys, and conservation resources. Search scientific databases (GBIF, iNaturalist, IUCN), botanical institutions, and environmental research.';
  } else if (fields.some(f => morphologicalFields.includes(f))) {
    researchApproach = 'Focus on botanical descriptions, field guides, taxonomic databases, and visual identification resources. Search botanical databases, field guides, taxonomic resources, and tree identification sites.';
  } else if (fields.some(f => stewardshipFields.includes(f))) {
    researchApproach = 'Focus on practical cultivation sources including gardening forums, nursery guides, grower communities, forestry practices, and cultural resources. Search gardening websites, cultivation forums, nursery resources, forestry guides, ethnobotanical sources, and practical grower experiences. Value practical knowledge from experienced cultivators and traditional uses.';
  }

  let prompt = `Research the tree species ${scientificName} (commonly known as ${commonNames}) and provide specific information for the following characteristics. ${researchApproach}\n\n`;
  
  fields.forEach(field => {
    prompt += `${field}: ${fieldDescriptions[field] || 'Specific information about this characteristic'}\n`;
  });

  prompt += `\nReturn a JSON object with these exact field names as keys. For any field where you cannot find specific information about this species, use "Data not available" as the value. Do not provide generic information that could apply to any tree species.`;

  return prompt;
}

/**
 * Run research test for a specific species and grouping strategy
 */
async function runResearchTest(species, strategyKey, strategy) {
  console.log(`\n=== Testing ${species.species_scientific_name} with ${strategy.name} ===`);
  
  const results = {
    species: species,
    strategy: strategyKey,
    strategy_name: strategy.name,
    timestamp: new Date().toISOString(),
    groups: [],
    aggregated_data: {},
    errors: []
  };

  const systemPrompt = generateSystemPrompt();

  // Process each group
  for (let i = 0; i < strategy.groups.length; i++) {
    const groupFields = strategy.groups[i];
    const groupName = `Group ${i + 1}`;
    
    console.log(`  Processing ${groupName} (${groupFields.length} fields)...`);
    
    try {
      const userPrompt = generateUserPrompt(species, groupFields, groupName);
      const apiResponse = await callClaudeAPI(systemPrompt, userPrompt);
      
      // Try to parse JSON response from the text
      let parsedData;
      try {
        // Extract JSON from response - try multiple approaches
        let jsonText = apiResponse.text;
        
        // First, try to find a complete JSON object
        const jsonMatch = jsonText.match(/\{[\s\S]*?\n?\s*\}/);
        if (jsonMatch) {
          jsonText = jsonMatch[0];
        }
        
        // Clean up common formatting issues
        jsonText = jsonText
          .replace(/,\s*\n?\s*\}/g, '}')  // Remove trailing commas
          .replace(/"\s*\n\s*"/g, '", "')  // Fix line breaks in strings
          .replace(/,\s*\n?\s*]/g, ']');   // Remove trailing commas in arrays
        
        parsedData = JSON.parse(jsonText);
      } catch (parseError) {
        console.error(`JSON parsing error for ${groupName}:`, parseError.message);
        console.error(`Raw response snippet:`, apiResponse.text.substring(0, 200) + '...');
        
        // Try to extract field values manually as fallback
        try {
          parsedData = {};
          for (const field of groupFields) {
            const fieldMatch = apiResponse.text.match(new RegExp(`"${field}":\\s*"([^"]*)"`, 's'));
            if (fieldMatch) {
              parsedData[field] = fieldMatch[1];
            } else {
              parsedData[field] = 'Data not available';
            }
          }
          console.log(`Fallback parsing succeeded for ${groupName}`);
        } catch (fallbackError) {
          results.errors.push(`${groupName}: JSON parsing failed - ${parseError.message}`);
          parsedData = { error: 'JSON parsing failed', raw_response: apiResponse.text };
        }
      }

      results.groups.push({
        group_number: i + 1,
        group_name: groupName,
        fields: groupFields,
        raw_response: apiResponse.text,
        citations: apiResponse.citations,
        full_api_response: apiResponse.full_response,
        parsed_data: parsedData
      });

      // Aggregate data
      if (parsedData && typeof parsedData === 'object' && !parsedData.error) {
        Object.assign(results.aggregated_data, parsedData);
      }

      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`Error processing ${groupName}:`, error.message);
      results.errors.push(`${groupName}: ${error.message}`);
      
      // Add empty group result to maintain structure
      results.groups.push({
        group_number: i + 1,
        group_name: groupName,
        fields: groupFields,
        error: error.message,
        raw_response: null,
        citations: [],
        parsed_data: null
      });
    }
  }

  return results;
}

/**
 * Main testing function
 */
async function runTests() {
  console.log('🧪 Starting AI Research Testing Playground');
  console.log(`Testing ${testSpecies.length} species with ${Object.keys(GROUPING_STRATEGIES).length} grouping strategies`);

  if (!CLAUDE_API_KEY) {
    console.error('❌ CLAUDE_API_KEY not found in .env file');
    console.error('Please add CLAUDE_API_KEY=your_key_here to your .env file');
    return;
  }

  const allResults = [];

  // Test each species with each strategy
  for (const species of testSpecies) {
    for (const [strategyKey, strategy] of Object.entries(GROUPING_STRATEGIES)) {
      try {
        const result = await runResearchTest(species, strategyKey, strategy);
        allResults.push(result);
        
        // Save individual result
        const filename = `${species.taxon_id}_${strategyKey}_${Date.now()}.json`;
        const filepath = path.join(__dirname, 'test-results', filename);
        fs.writeFileSync(filepath, JSON.stringify(result, null, 2));
        console.log(`✅ Saved result to ${filename}`);
        
      } catch (error) {
        console.error(`❌ Failed test for ${species.species_scientific_name} with ${strategy.name}:`, error.message);
      }
    }
  }

  // Save aggregated results
  const summaryPath = path.join(__dirname, 'test-results', `summary_${Date.now()}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify({
    test_run: {
      timestamp: new Date().toISOString(),
      total_tests: allResults.length,
      species_tested: testSpecies.length,
      strategies_tested: Object.keys(GROUPING_STRATEGIES).length
    },
    results: allResults
  }, null, 2));

  console.log(`\n🎉 Testing complete! Results saved to test-results directory`);
  console.log(`📊 Summary saved to ${path.basename(summaryPath)}`);
}

/**
 * CLI interface
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
AI Research Testing Playground

Usage:
  node test-ai-research.js [options]

Options:
  --help, -h          Show this help message
  --species <id>      Test only specific species by taxon_id
  --strategy <key>    Test only specific strategy
  --list              List available species and strategies

Examples:
  node test-ai-research.js
  node test-ai-research.js --species test_1
  node test-ai-research.js --strategy current_2group
  node test-ai-research.js --list
`);
    return;
  }

  if (args.includes('--list')) {
    console.log('\n📋 Available Test Species:');
    testSpecies.forEach(s => {
      console.log(`  ${s.taxon_id}: ${s.species_scientific_name} (${s.complexity})`);
    });
    
    console.log('\n📋 Available Grouping Strategies:');
    Object.entries(GROUPING_STRATEGIES).forEach(([key, strategy]) => {
      console.log(`  ${key}: ${strategy.name}`);
    });
    return;
  }

  // Run tests
  runTests().catch(error => {
    console.error('❌ Testing failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runResearchTest,
  GROUPING_STRATEGIES,
  RESEARCH_FIELDS,
  testSpecies
};