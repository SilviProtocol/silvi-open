#!/usr/bin/env node

/**
 * Ginkgo biloba Comparison Tool
 * 
 * Compare new Claude-based research results against existing Perplexity+GPT-4o data
 */

const fs = require('fs');
const path = require('path');

// Existing Ginkgo biloba research data from the database
const EXISTING_GINKGO_DATA = {
  "taxon_id": "AngGiGiGN21141-00",
  "species_scientific_name": "Ginkgo biloba",
  "common_name": "",
  "conservation_status_ai": "Wild populations are extremely rare and threatened. Conservation focuses on protecting remaining wild populations and maintaining genetic diversity in cultivated specimens.",
  "general_description_ai": "Ginkgo biloba is a deciduous gymnosperm with fan-shaped leaves and is the sole surviving member of a lineage over 270 million years old, known for its resilience and adaptability.",
  "habitat_ai": "Native to regions with rocky terrain and thin soils, ginkgo trees have adapted to various climates and urban conditions.",
  "elevation_ranges_ai": "Not specifically mentioned, but adaptable to various elevations due to climate adaptability.",
  "compatible_soil_types_ai": "Tolerant of urban compacted soils, various pH levels, poor quality soils, drought conditions once established, and areas with salt exposure.",
  "ecological_function_ai": "Ginkgo provides high oxygen production, excellent air pollution filtration, soil stabilization, urban heat island effect mitigation, and carbon sequestration.",
  "native_adapted_habitats_ai": "Adapted to rocky terrains with thin soils; thrives in urban environments.",
  "agroforestry_use_cases_ai": "Used in urban forestry, windbreaks, medicinal cultivation, edible seed production, and ornamental planting.",
  "growth_form_ai": "Typically grows 20–35 meters with some over 50 meters, irregular crown shape that becomes broader or pyramidal with age.",
  "leaf_type_ai": "Fan-shaped leaves with dichotomous venation, turning bright yellow in autumn.",
  "deciduous_evergreen_ai": "Deciduous",
  "flower_color_ai": "Male plants produce small pollen cones without distinctive flower color.",
  "fruit_type_ai": "Mature seed with fleshy orange-yellow sarcotesta and hard bony sclerotesta.",
  "bark_characteristics_ai": "Bark becomes more rugged with age.",
  "maximum_height_ai": "50.00",
  "maximum_diameter_ai": null,
  "lifespan_ai": "Some specimens live over 2,500 years, making it one of the longest-lived species.",
  "maximum_tree_age_ai": 2500,
  "stewardship_best_practices_ai": "Ginkgo biloba requires site selection with full sun to partial shade, 25-40 feet spacing for mature specimens, and soil preparation with well-draining amendments. Male cultivars are preferred to avoid malodorous seeds.",
  "planting_recipes_ai": "Choose locations with full sun to partial shade and provide 25-40 feet spacing. Amend soil for better drainage if possible.",
  "pruning_maintenance_ai": "Prune in late winter during dormancy. Remove damaged or diseased branches and shape young trees to establish a strong branch structure while maintaining a central leader.",
  "disease_pest_management_ai": "Ginkgo is highly resistant to most microbial diseases and few insect pests. It is also resistant to fungal pathogens common to other landscape trees.",
  "fire_management_ai": "Ginkgo has thick bark providing some fire resistance and can regenerate from roots after severe damage, with low resin content reducing flammability.",
  "cultural_significance_ai": "Ginkgo is a symbol of longevity and resilience in East Asian cultures, valued in traditional medicine, and holds significance in bonsai artistry and sustainable urban planning."
};

/**
 * Load Ginkgo test results from the test-results directory
 */
function loadGinkgoResults() {
  const resultsDir = path.join(__dirname, '../test-results');
  
  if (!fs.existsSync(resultsDir)) {
    console.error('❌ No test-results directory found. Run tests first.');
    return [];
  }
  
  const files = fs.readdirSync(resultsDir).filter(f => 
    f.endsWith('.json') && 
    !f.startsWith('summary_') && 
    !f.startsWith('analysis_') &&
    f.includes('AngGiGiGN21141-00')
  );
  
  const results = [];
  
  for (const file of files) {
    try {
      const filePath = path.join(resultsDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      
      if (data.species && data.species.taxon_id === 'AngGiGiGN21141-00') {
        results.push({ filename: file, ...data });
      }
    } catch (error) {
      console.warn(`⚠️  Could not parse ${file}: ${error.message}`);
    }
  }
  
  return results;
}

/**
 * Compare two field values for similarity
 */
function compareFields(existing, newValue, fieldName) {
  if (!existing && !newValue) {
    return { score: 1.0, type: 'both_empty' };
  }
  
  if (!existing || !newValue) {
    return { score: 0.0, type: existing ? 'new_missing' : 'existing_missing' };
  }
  
  // Handle "Data not available" responses
  if (newValue === 'Data not available' || newValue === 'No specific information found') {
    return { score: 0.0, type: 'no_data_found' };
  }
  
  // For numerical fields, compare values directly
  if (fieldName.includes('maximum_height_ai') || fieldName.includes('maximum_diameter_ai') || fieldName.includes('maximum_tree_age_ai')) {
    const existingNum = parseFloat(existing);
    const newNum = parseFloat(newValue);
    
    if (isNaN(existingNum) || isNaN(newNum)) {
      return { score: 0.0, type: 'numeric_parse_error' };
    }
    
    const difference = Math.abs(existingNum - newNum) / Math.max(existingNum, newNum);
    return { 
      score: Math.max(0, 1 - difference), 
      type: 'numeric_comparison',
      existing_value: existingNum,
      new_value: newNum,
      difference: difference
    };
  }
  
  // For text fields, use simple string similarity
  const existingLower = existing.toLowerCase();
  const newLower = newValue.toLowerCase();
  
  // Exact match
  if (existingLower === newLower) {
    return { score: 1.0, type: 'exact_match' };
  }
  
  // Check for key concept overlap
  const existingWords = existingLower.split(/\s+/).filter(w => w.length > 3);
  const newWords = newLower.split(/\s+/).filter(w => w.length > 3);
  
  const commonWords = existingWords.filter(word => newWords.includes(word));
  const totalUniqueWords = [...new Set([...existingWords, ...newWords])].length;
  
  const conceptOverlap = totalUniqueWords > 0 ? commonWords.length / totalUniqueWords : 0;
  
  return {
    score: conceptOverlap,
    type: 'text_similarity',
    common_concepts: commonWords.length,
    total_concepts: totalUniqueWords,
    overlap_ratio: conceptOverlap
  };
}

/**
 * Analyze a single Ginkgo test result against existing data
 */
function analyzeGinkgoResult(result) {
  const analysis = {
    filename: result.filename,
    strategy: result.strategy,
    strategy_name: result.strategy_name,
    timestamp: result.timestamp,
    field_comparisons: {},
    summary: {
      total_fields: 0,
      improved_fields: 0,
      similar_fields: 0,
      degraded_fields: 0,
      new_data_fields: 0,
      lost_data_fields: 0,
      average_similarity: 0
    },
    improvements: [],
    concerns: []
  };
  
  const aggregatedData = result.aggregated_data || {};
  let totalScore = 0;
  let fieldCount = 0;
  
  // Compare each field
  for (const [field, existingValue] of Object.entries(EXISTING_GINKGO_DATA)) {
    if (field === 'taxon_id' || field === 'species_scientific_name' || field === 'common_name') {
      continue; // Skip metadata fields
    }
    
    const newValue = aggregatedData[field];
    const comparison = compareFields(existingValue, newValue, field);
    
    analysis.field_comparisons[field] = {
      existing_value: existingValue,
      new_value: newValue,
      ...comparison
    };
    
    fieldCount++;
    totalScore += comparison.score;
    analysis.summary.total_fields++;
    
    // Categorize the comparison
    if (comparison.score > 0.8) {
      analysis.summary.similar_fields++;
    } else if (comparison.score > 0.4) {
      if (newValue && newValue.length > (existingValue?.length || 0)) {
        analysis.summary.improved_fields++;
        analysis.improvements.push(`${field}: More detailed information provided`);
      } else {
        analysis.summary.degraded_fields++;
        analysis.concerns.push(`${field}: Less comprehensive than existing data`);
      }
    } else {
      if (comparison.type === 'no_data_found') {
        analysis.summary.lost_data_fields++;
        analysis.concerns.push(`${field}: Could not find data (existing system had data)`);
      } else if (comparison.type === 'new_missing') {
        analysis.summary.lost_data_fields++;
        analysis.concerns.push(`${field}: Missing in new results`);
      } else {
        analysis.summary.degraded_fields++;
        analysis.concerns.push(`${field}: Significantly different from existing data`);
      }
    }
  }
  
  analysis.summary.average_similarity = fieldCount > 0 ? totalScore / fieldCount : 0;
  
  // Look for new fields that might have been populated
  for (const [field, newValue] of Object.entries(aggregatedData)) {
    if (!EXISTING_GINKGO_DATA[field] && newValue && newValue !== 'Data not available') {
      analysis.summary.new_data_fields++;
      analysis.improvements.push(`${field}: New data found where none existed before`);
    }
  }
  
  return analysis;
}

/**
 * Generate comparison report
 */
function generateComparisonReport(results) {
  console.log('🌿 Ginkgo biloba Research Comparison Report');
  console.log('==========================================\n');
  
  if (results.length === 0) {
    console.log('❌ No Ginkgo biloba test results found.');
    console.log('Run tests first: node test-ai-research.js --species AngGiGiGN21141-00');
    return;
  }
  
  console.log(`📊 Analyzing ${results.length} test result(s) for Ginkgo biloba`);
  console.log(`🔬 Baseline: Existing Perplexity + GPT-4o research data\n`);
  
  for (const result of results) {
    const analysis = analyzeGinkgoResult(result);
    
    console.log(`📋 Strategy: ${analysis.strategy_name}`);
    console.log(`📁 File: ${analysis.filename}`);
    console.log(`⏰ Timestamp: ${new Date(analysis.timestamp).toLocaleString()}\n`);
    
    console.log(`📈 Overall Performance:`);
    console.log(`   Average Similarity: ${(analysis.summary.average_similarity * 100).toFixed(1)}%`);
    console.log(`   Total Fields: ${analysis.summary.total_fields}`);
    console.log(`   Similar Quality: ${analysis.summary.similar_fields} fields`);
    console.log(`   Improved: ${analysis.summary.improved_fields} fields`);
    console.log(`   Degraded: ${analysis.summary.degraded_fields} fields`);
    console.log(`   New Data Found: ${analysis.summary.new_data_fields} fields`);
    console.log(`   Data Lost: ${analysis.summary.lost_data_fields} fields\n`);
    
    if (analysis.improvements.length > 0) {
      console.log(`✅ Improvements:`);
      analysis.improvements.forEach(improvement => {
        console.log(`   • ${improvement}`);
      });
      console.log('');
    }
    
    if (analysis.concerns.length > 0) {
      console.log(`⚠️  Concerns:`);
      analysis.concerns.forEach(concern => {
        console.log(`   • ${concern}`);
      });
      console.log('');
    }
    
    // Highlight specific interesting comparisons
    console.log(`🔍 Notable Field Comparisons:`);
    
    const interestingFields = ['general_description_ai', 'conservation_status_ai', 'cultural_significance_ai', 'maximum_height_ai'];
    
    for (const field of interestingFields) {
      const comparison = analysis.field_comparisons[field];
      if (comparison) {
        console.log(`   ${field}:`);
        console.log(`     Similarity: ${(comparison.score * 100).toFixed(1)}%`);
        if (comparison.type === 'numeric_comparison') {
          console.log(`     Existing: ${comparison.existing_value}, New: ${comparison.new_value}`);
        } else if (comparison.new_value) {
          const preview = comparison.new_value.substring(0, 100) + (comparison.new_value.length > 100 ? '...' : '');
          console.log(`     New: "${preview}"`);
        }
      }
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
  }
  
  // Overall recommendations
  console.log(`💡 Recommendations:`);
  
  const allAnalyses = results.map(analyzeGinkgoResult);
  const avgSimilarity = allAnalyses.reduce((sum, a) => sum + a.summary.average_similarity, 0) / allAnalyses.length;
  
  if (avgSimilarity > 0.7) {
    console.log(`   ✅ Claude-based research is performing well (${(avgSimilarity * 100).toFixed(1)}% avg similarity)`);
  } else if (avgSimilarity > 0.5) {
    console.log(`   ⚠️  Claude-based research needs improvement (${(avgSimilarity * 100).toFixed(1)}% avg similarity)`);
  } else {
    console.log(`   ❌ Claude-based research significantly underperforming (${(avgSimilarity * 100).toFixed(1)}% avg similarity)`);
  }
  
  // Find best performing strategy
  const bestStrategy = allAnalyses.reduce((best, current) => 
    current.summary.average_similarity > best.summary.average_similarity ? current : best
  );
  
  console.log(`   🏆 Best performing strategy: ${bestStrategy.strategy_name}`);
  console.log(`       (${(bestStrategy.summary.average_similarity * 100).toFixed(1)}% similarity)`);
  
  // Common issues
  const commonConcerns = {};
  allAnalyses.forEach(analysis => {
    analysis.concerns.forEach(concern => {
      const field = concern.split(':')[0];
      commonConcerns[field] = (commonConcerns[field] || 0) + 1;
    });
  });
  
  if (Object.keys(commonConcerns).length > 0) {
    console.log(`   🎯 Focus improvement on these fields:`);
    Object.entries(commonConcerns)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .forEach(([field, count]) => {
        console.log(`       • ${field} (issues in ${count}/${allAnalyses.length} tests)`);
      });
  }
}

/**
 * Export detailed comparison data
 */
function exportDetailedComparison(results) {
  const analyses = results.map(analyzeGinkgoResult);
  
  const exportData = {
    baseline_data: EXISTING_GINKGO_DATA,
    test_results: analyses,
    summary: {
      total_tests: analyses.length,
      average_similarity: analyses.reduce((sum, a) => sum + a.summary.average_similarity, 0) / analyses.length,
      best_strategy: analyses.reduce((best, current) => 
        current.summary.average_similarity > best.summary.average_similarity ? current.strategy_name : best.strategy_name
      ),
      timestamp: new Date().toISOString()
    }
  };
  
  const exportPath = path.join(__dirname, '../test-results', `ginkgo_comparison_${Date.now()}.json`);
  fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));
  
  return exportPath;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Ginkgo biloba Research Comparison Tool

Usage:
  node compare-ginkgo.js [options]

Options:
  --help, -h     Show this help message
  --export       Export detailed comparison to JSON file
  --strategy <key> Analyze only specific strategy

Examples:
  node compare-ginkgo.js
  node compare-ginkgo.js --export
  node compare-ginkgo.js --strategy current_2group
`);
    return;
  }
  
  const results = loadGinkgoResults();
  
  // Filter by strategy if requested
  const strategyFilter = args.find((arg, i) => args[i-1] === '--strategy');
  let filteredResults = results;
  if (strategyFilter) {
    filteredResults = results.filter(r => r.strategy === strategyFilter);
  }
  
  generateComparisonReport(filteredResults);
  
  // Export if requested
  if (args.includes('--export')) {
    const exportPath = exportDetailedComparison(filteredResults);
    console.log(`📄 Detailed comparison exported to ${path.basename(exportPath)}`);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  EXISTING_GINKGO_DATA,
  loadGinkgoResults,
  compareFields,
  analyzeGinkgoResult,
  generateComparisonReport
};