#!/usr/bin/env node

/**
 * Grok Optimization Experiments
 * 
 * Tests different strategies to improve Grok's field completion rate
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_API_URL = 'https://api.x.ai/v1/chat/completions';

// Test species
const TEST_SPECIES = {
  scientific: "Ginkgo biloba",
  common: "Ginkgo, maidenhair tree"
};

async function callGrokAPI(systemPrompt, userPrompt, options = {}) {
  const payload = {
    model: 'grok-3-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: options.temperature || 0.3,
    max_tokens: options.maxTokens || 80000,
    reasoning_effort: options.reasoning || 'high',
    web_search_options: {
      search_context_size: options.searchContext || 'high'
    }
  };

  try {
    const start = Date.now();
    const response = await axios.post(XAI_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${XAI_API_KEY}`
      }
    });
    
    const content = response.data.choices[0].message.content;
    const duration = Date.now() - start;
    
    // Try to parse JSON
    let parsedData = null;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        parsedData = JSON.parse(jsonMatch[0]);
      } catch (e) {
        // Failed to parse
      }
    }
    
    return {
      success: !!parsedData,
      data: parsedData,
      raw: content,
      duration,
      usage: response.data.usage
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      duration: 0
    };
  }
}

// Experiment 1: More aggressive search instructions
async function experiment1_AggressiveSearch() {
  console.log('\n🧪 Experiment 1: Aggressive Search Instructions');
  
  const systemPrompt = `You are a botanical research expert with EXTENSIVE web search capabilities. Your mission is to find COMPREHENSIVE information about tree species.

SEARCH AGGRESSIVELY:
- Use multiple search queries per field if needed
- Search scientific databases, research papers, field guides, botanical gardens, nursery websites
- Look for specific measurements, ranges, and scientific data
- Cross-reference multiple sources for accuracy
- Don't give up easily - if initial searches don't yield results, try different search terms

EXTRACTION REQUIREMENTS:
- Extract specific numeric values when available (heights, ages, diameters)
- Convert units to standard formats (meters, years)
- Prefer scientific sources but include practical knowledge
- Only use "Data not available" as absolute last resort

Return valid JSON only.`;

  const userPrompt = `Research ${TEST_SPECIES.scientific} (${TEST_SPECIES.common}) and find these SPECIFIC morphological characteristics. Search extensively and extract precise data:

growth_form_ai: Specific growth form and architectural structure
leaf_type_ai: Detailed leaf characteristics and morphology  
deciduous_evergreen_ai: Leaf retention pattern
flower_color_ai: Specific flower colors and characteristics
fruit_type_ai: Type and characteristics of fruits
bark_characteristics_ai: Detailed bark appearance and texture
maximum_height_ai: Maximum recorded height in meters (NUMBER ONLY)
maximum_diameter_ai: Maximum trunk diameter in meters (NUMBER ONLY)
lifespan_ai: Typical lifespan information
maximum_tree_age_ai: Maximum recorded age in years (INTEGER ONLY)

SEARCH EXTENSIVELY. Look for measurements, ranges, specific descriptions. Return JSON with these exact field names.`;

  const result = await callGrokAPI(systemPrompt, userPrompt);
  
  console.log('Duration:', result.duration + 'ms');
  console.log('Success:', result.success);
  if (result.success) {
    const fields = Object.keys(result.data).filter(k => result.data[k] && result.data[k] !== 'Data not available');
    console.log(`Fields found: ${fields.length}/10`);
    console.log('Found fields:', fields);
    console.log('Sample data:', {
      maximum_height_ai: result.data.maximum_height_ai,
      maximum_diameter_ai: result.data.maximum_diameter_ai,
      maximum_tree_age_ai: result.data.maximum_tree_age_ai
    });
  } else {
    console.log('Error:', result.error);
  }
  
  return result;
}

// Experiment 2: Step-by-step guided search
async function experiment2_GuidedSearch() {
  console.log('\n🧪 Experiment 2: Step-by-Step Guided Search');
  
  const systemPrompt = `You are a botanical data specialist. Follow this EXACT process:

STEP 1: Search for "{species} maximum height" and "{species} size measurements"
STEP 2: Search for "{species} morphology" and "{species} leaf characteristics"  
STEP 3: Search for "{species} bark texture" and "{species} fruit description"
STEP 4: Search for "{species} lifespan" and "{species} age records"

For each search, extract SPECIFIC data. Return JSON only.`;

  const userPrompt = `Research ${TEST_SPECIES.scientific} systematically. Follow the 4-step search process and extract:

maximum_height_ai: Maximum height in meters (extract the NUMBER from search results)
maximum_diameter_ai: Maximum diameter in meters (extract the NUMBER)
bark_characteristics_ai: Bark description from botanical sources
fruit_type_ai: Fruit/seed characteristics
lifespan_ai: Lifespan information
maximum_tree_age_ai: Maximum age in years (extract the INTEGER)

Use the step-by-step search approach. Return JSON with exact field names.`;

  const result = await callGrokAPI(systemPrompt, userPrompt);
  
  console.log('Duration:', result.duration + 'ms');
  console.log('Success:', result.success);
  if (result.success) {
    const fields = Object.keys(result.data).filter(k => result.data[k] && result.data[k] !== 'Data not available');
    console.log(`Fields found: ${fields.length}/6`);
    console.log('Numeric fields:', {
      maximum_height_ai: result.data.maximum_height_ai,
      maximum_diameter_ai: result.data.maximum_diameter_ai,
      maximum_tree_age_ai: result.data.maximum_tree_age_ai
    });
  }
  
  return result;
}

// Experiment 3: Focused numeric extraction
async function experiment3_NumericFocus() {
  console.log('\n🧪 Experiment 3: Focused Numeric Extraction');
  
  const systemPrompt = `You are a data extraction specialist. Your job is to find NUMBERS for tree measurements.

CRITICAL: Extract actual numeric values from sources. Examples:
- "can reach 30-40 meters" → extract 40
- "typically grows to 25m" → extract 25  
- "specimens over 1000 years old" → extract 1000
- "trunk diameter of 3-5 feet" → convert to meters (1.5)

Search specifically for measurements, records, and scientific data.`;

  const userPrompt = `Find NUMERIC measurements for ${TEST_SPECIES.scientific}:

maximum_height_ai: Maximum height in meters (EXTRACT THE NUMBER)
maximum_diameter_ai: Maximum trunk diameter in meters (EXTRACT THE NUMBER)  
maximum_tree_age_ai: Maximum recorded age in years (EXTRACT THE INTEGER)

Search for: "Ginkgo biloba maximum height meters", "Ginkgo biloba trunk diameter", "Ginkgo biloba oldest tree age"

Return JSON with ONLY these 3 fields. Extract actual numbers from your search results.`;

  const result = await callGrokAPI(systemPrompt, userPrompt);
  
  console.log('Duration:', result.duration + 'ms');
  console.log('Success:', result.success);
  if (result.success) {
    console.log('Extracted numbers:', result.data);
    const numericFields = ['maximum_height_ai', 'maximum_diameter_ai', 'maximum_tree_age_ai'];
    const foundNumbers = numericFields.filter(f => result.data[f] && typeof result.data[f] === 'number');
    console.log(`Numbers found: ${foundNumbers.length}/3`);
  }
  
  return result;
}

// Experiment 4: Different reasoning settings
async function experiment4_ReasoningVariations() {
  console.log('\n🧪 Experiment 4: Reasoning Variations');
  
  const systemPrompt = `Find comprehensive botanical data. Return JSON only.`;
  const userPrompt = `Research ${TEST_SPECIES.scientific} elevation ranges, ecological function, and soil types:

elevation_ranges_ai: Specific elevation ranges in meters
ecological_function_ai: Ecological roles and functions  
compatible_soil_types_ai: Soil types and conditions

Return JSON with these exact fields.`;

  const settings = [
    { reasoning: 'low', searchContext: 'low', name: 'Low/Low' },
    { reasoning: 'low', searchContext: 'high', name: 'Low/High' },
    { reasoning: 'high', searchContext: 'low', name: 'High/Low' },
    { reasoning: 'high', searchContext: 'high', name: 'High/High' }
  ];
  
  for (const setting of settings) {
    console.log(`\n  Testing ${setting.name} (reasoning: ${setting.reasoning}, search: ${setting.searchContext})`);
    
    const result = await callGrokAPI(systemPrompt, userPrompt, {
      reasoning: setting.reasoning,
      searchContext: setting.searchContext
    });
    
    if (result.success) {
      const fields = Object.keys(result.data).filter(k => result.data[k] && result.data[k] !== 'Data not available');
      console.log(`    Fields found: ${fields.length}/3, Duration: ${result.duration}ms, Tokens: ${result.usage?.total_tokens}`);
    } else {
      console.log(`    Failed: ${result.error}`);
    }
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Run all experiments
async function runExperiments() {
  console.log('🚀 Starting Grok Optimization Experiments');
  console.log(`Testing with: ${TEST_SPECIES.scientific} (${TEST_SPECIES.common})`);
  
  const experiments = [
    experiment1_AggressiveSearch,
    experiment2_GuidedSearch, 
    experiment3_NumericFocus,
    experiment4_ReasoningVariations
  ];
  
  for (const experiment of experiments) {
    try {
      await experiment();
      await new Promise(resolve => setTimeout(resolve, 2000)); // Delay between experiments
    } catch (error) {
      console.error('Experiment failed:', error.message);
    }
  }
  
  console.log('\n✅ All experiments completed!');
}

runExperiments().catch(console.error);