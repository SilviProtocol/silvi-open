#!/usr/bin/env node

/**
 * Results Analysis Tool for AI Research Testing
 * 
 * Analyzes and compares test results from different grouping strategies
 */

const fs = require('fs');
const path = require('path');

/**
 * Load all test result files from the test-results directory
 */
function loadTestResults() {
  const resultsDir = path.join(__dirname, '../test-results');
  
  if (!fs.existsSync(resultsDir)) {
    console.error('❌ No test-results directory found. Run tests first.');
    return [];
  }
  
  const files = fs.readdirSync(resultsDir).filter(f => f.endsWith('.json') && !f.startsWith('summary_'));
  const results = [];
  
  for (const file of files) {
    try {
      const filePath = path.join(resultsDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      results.push({ filename: file, ...data });
    } catch (error) {
      console.warn(`⚠️  Could not parse ${file}: ${error.message}`);
    }
  }
  
  return results;
}

/**
 * Calculate completeness metrics for a result
 */
function calculateCompleteness(result) {
  const totalFields = Object.values(result.groups).reduce((sum, group) => sum + group.fields.length, 0);
  const aggregatedData = result.aggregated_data || {};
  
  let filledFields = 0;
  let dataAvailableFields = 0;
  
  for (const [field, value] of Object.entries(aggregatedData)) {
    if (value !== null && value !== undefined && value !== '') {
      filledFields++;
      
      if (value !== 'Data not available' && value !== 'No specific information found') {
        dataAvailableFields++;
      }
    }
  }
  
  return {
    total_fields: totalFields,
    filled_fields: filledFields,
    data_available_fields: dataAvailableFields,
    completion_rate: totalFields > 0 ? (filledFields / totalFields) * 100 : 0,
    data_availability_rate: totalFields > 0 ? (dataAvailableFields / totalFields) * 100 : 0
  };
}

/**
 * Analyze citation quality
 */
function analyzeCitations(result) {
  let totalCitations = 0;
  let scientificSources = 0;
  const sourceTypes = {};
  
  for (const group of result.groups) {
    if (group.citations) {
      totalCitations += group.citations.length;
      
      for (const citation of group.citations) {
        const url = citation.url || '';
        
        // Categorize source types
        if (url.includes('gbif.org') || url.includes('eol.org') || url.includes('tropicos.org')) {
          sourceTypes.scientific_databases = (sourceTypes.scientific_databases || 0) + 1;
          scientificSources++;
        } else if (url.includes('kew.org') || url.includes('mobot.org')) {
          sourceTypes.botanical_institutions = (sourceTypes.botanical_institutions || 0) + 1;
          scientificSources++;
        } else if (url.includes('iucnredlist.org')) {
          sourceTypes.conservation_authorities = (sourceTypes.conservation_authorities || 0) + 1;
          scientificSources++;
        } else if (url.includes('wikipedia.org')) {
          sourceTypes.wikipedia = (sourceTypes.wikipedia || 0) + 1;
        } else if (url.includes('scholar.google.com') || url.includes('researchgate.net')) {
          sourceTypes.academic_papers = (sourceTypes.academic_papers || 0) + 1;
          scientificSources++;
        } else {
          sourceTypes.other = (sourceTypes.other || 0) + 1;
        }
      }
    }
  }
  
  return {
    total_citations: totalCitations,
    scientific_sources: scientificSources,
    scientific_ratio: totalCitations > 0 ? (scientificSources / totalCitations) * 100 : 0,
    source_types: sourceTypes
  };
}

/**
 * Analyze field-specific quality
 */
function analyzeFieldQuality(results) {
  const fieldAnalysis = {};
  
  for (const result of results) {
    const aggregatedData = result.aggregated_data || {};
    
    for (const [field, value] of Object.entries(aggregatedData)) {
      if (!fieldAnalysis[field]) {
        fieldAnalysis[field] = {
          total_attempts: 0,
          successful_extractions: 0,
          data_available_count: 0,
          average_length: 0,
          strategies: {}
        };
      }
      
      const analysis = fieldAnalysis[field];
      analysis.total_attempts++;
      
      if (value !== null && value !== undefined && value !== '') {
        analysis.successful_extractions++;
        
        if (value !== 'Data not available' && value !== 'No specific information found') {
          analysis.data_available_count++;
          analysis.average_length = (analysis.average_length + String(value).length) / 2;
        }
      }
      
      // Track by strategy
      const strategy = result.strategy;
      if (!analysis.strategies[strategy]) {
        analysis.strategies[strategy] = { attempts: 0, successes: 0 };
      }
      analysis.strategies[strategy].attempts++;
      if (value !== null && value !== undefined && value !== '') {
        analysis.strategies[strategy].successes++;
      }
    }
  }
  
  return fieldAnalysis;
}

/**
 * Generate comparison report
 */
function generateReport(results) {
  console.log('📊 AI Research Testing Analysis Report');
  console.log('=====================================\n');
  
  // Overview
  const totalTests = results.length;
  const uniqueSpecies = [...new Set(results.map(r => r.species.taxon_id))].length;
  const uniqueStrategies = [...new Set(results.map(r => r.strategy))].length;
  
  console.log(`🔍 Overview:`);
  console.log(`   Total tests: ${totalTests}`);
  console.log(`   Species tested: ${uniqueSpecies}`);
  console.log(`   Strategies tested: ${uniqueStrategies}\n`);
  
  // Strategy comparison
  console.log(`📈 Strategy Performance:`);
  const strategyStats = {};
  
  for (const result of results) {
    const strategy = result.strategy;
    if (!strategyStats[strategy]) {
      strategyStats[strategy] = {
        tests: 0,
        avg_completion: 0,
        avg_data_availability: 0,
        avg_citations: 0,
        total_errors: 0
      };
    }
    
    const stats = strategyStats[strategy];
    const completeness = calculateCompleteness(result);
    const citations = analyzeCitations(result);
    
    stats.tests++;
    stats.avg_completion += completeness.completion_rate;
    stats.avg_data_availability += completeness.data_availability_rate;
    stats.avg_citations += citations.total_citations;
    stats.total_errors += result.errors.length;
  }
  
  // Calculate averages
  for (const [strategy, stats] of Object.entries(strategyStats)) {
    stats.avg_completion = (stats.avg_completion / stats.tests).toFixed(1);
    stats.avg_data_availability = (stats.avg_data_availability / stats.tests).toFixed(1);
    stats.avg_citations = (stats.avg_citations / stats.tests).toFixed(1);
    
    console.log(`   ${strategy}:`);
    console.log(`     Completion Rate: ${stats.avg_completion}%`);
    console.log(`     Data Availability: ${stats.avg_data_availability}%`);
    console.log(`     Avg Citations: ${stats.avg_citations}`);
    console.log(`     Total Errors: ${stats.total_errors}`);
  }
  
  console.log('\n📋 Field-Specific Analysis:');
  const fieldAnalysis = analyzeFieldQuality(results);
  
  // Sort fields by success rate
  const sortedFields = Object.entries(fieldAnalysis)
    .sort(([,a], [,b]) => (b.data_available_count / b.total_attempts) - (a.data_available_count / a.total_attempts));
  
  console.log('\n   Top Performing Fields:');
  sortedFields.slice(0, 5).forEach(([field, analysis]) => {
    const successRate = ((analysis.data_available_count / analysis.total_attempts) * 100).toFixed(1);
    console.log(`     ${field}: ${successRate}% data availability (${analysis.data_available_count}/${analysis.total_attempts})`);
  });
  
  console.log('\n   Challenging Fields:');
  sortedFields.slice(-5).forEach(([field, analysis]) => {
    const successRate = ((analysis.data_available_count / analysis.total_attempts) * 100).toFixed(1);
    console.log(`     ${field}: ${successRate}% data availability (${analysis.data_available_count}/${analysis.total_attempts})`);
  });
  
  // Species-specific insights
  console.log('\n🌳 Species-Specific Results:');
  const speciesStats = {};
  
  for (const result of results) {
    const speciesId = result.species.taxon_id;
    const speciesName = result.species.species_scientific_name;
    
    if (!speciesStats[speciesId]) {
      speciesStats[speciesId] = {
        name: speciesName,
        complexity: result.species.complexity,
        tests: 0,
        avg_completion: 0,
        best_strategy: null,
        best_completion: 0
      };
    }
    
    const stats = speciesStats[speciesId];
    const completeness = calculateCompleteness(result);
    
    stats.tests++;
    stats.avg_completion += completeness.data_availability_rate;
    
    if (completeness.data_availability_rate > stats.best_completion) {
      stats.best_completion = completeness.data_availability_rate;
      stats.best_strategy = result.strategy;
    }
  }
  
  // Calculate averages and display
  for (const [speciesId, stats] of Object.entries(speciesStats)) {
    stats.avg_completion = (stats.avg_completion / stats.tests).toFixed(1);
    console.log(`   ${stats.name} (${stats.complexity}):`);
    console.log(`     Avg Data Availability: ${stats.avg_completion}%`);
    console.log(`     Best Strategy: ${stats.best_strategy} (${stats.best_completion.toFixed(1)}%)`);
  }
  
  console.log('\n💡 Recommendations:');
  
  // Find best overall strategy
  const bestStrategy = Object.entries(strategyStats)
    .sort(([,a], [,b]) => parseFloat(b.avg_data_availability) - parseFloat(a.avg_data_availability))[0];
  
  console.log(`   1. Best performing strategy: ${bestStrategy[0]}`);
  console.log(`      (${bestStrategy[1].avg_data_availability}% avg data availability)`);
  
  // Identify problematic fields
  const problemFields = sortedFields.slice(-3).map(([field]) => field);
  console.log(`   2. Focus on improving these fields: ${problemFields.join(', ')}`);
  
  // Citation quality
  const avgCitations = results.reduce((sum, r) => sum + analyzeCitations(r).total_citations, 0) / results.length;
  console.log(`   3. Average citations per test: ${avgCitations.toFixed(1)}`);
  
  if (avgCitations < 3) {
    console.log(`      Consider encouraging more source citation in prompts`);
  }
  
  console.log('\n✅ Analysis complete!');
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
AI Research Results Analysis Tool

Usage:
  node analyze-results.js [options]

Options:
  --help, -h     Show this help message
  --export       Export detailed analysis to JSON file
  --species <id> Analyze only specific species
  --strategy <key> Analyze only specific strategy

Examples:
  node analyze-results.js
  node analyze-results.js --export
  node analyze-results.js --species test_1
`);
    return;
  }
  
  const results = loadTestResults();
  
  if (results.length === 0) {
    console.error('❌ No test results found. Run some tests first with test-ai-research.js');
    return;
  }
  
  // Filter results if requested
  let filteredResults = results;
  
  const speciesFilter = args.find((arg, i) => args[i-1] === '--species');
  if (speciesFilter) {
    filteredResults = filteredResults.filter(r => r.species.taxon_id === speciesFilter);
  }
  
  const strategyFilter = args.find((arg, i) => args[i-1] === '--strategy');
  if (strategyFilter) {
    filteredResults = filteredResults.filter(r => r.strategy === strategyFilter);
  }
  
  if (filteredResults.length === 0) {
    console.error('❌ No results match the specified filters.');
    return;
  }
  
  generateReport(filteredResults);
  
  // Export detailed analysis if requested
  if (args.includes('--export')) {
    const detailedAnalysis = {
      overview: {
        total_tests: filteredResults.length,
        timestamp: new Date().toISOString()
      },
      field_analysis: analyzeFieldQuality(filteredResults),
      individual_results: filteredResults.map(r => ({
        filename: r.filename,
        species: r.species,
        strategy: r.strategy,
        completeness: calculateCompleteness(r),
        citations: analyzeCitations(r),
        errors: r.errors
      }))
    };
    
    const exportPath = path.join(__dirname, '../test-results', `analysis_${Date.now()}.json`);
    fs.writeFileSync(exportPath, JSON.stringify(detailedAnalysis, null, 2));
    console.log(`\n📄 Detailed analysis exported to ${path.basename(exportPath)}`);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  loadTestResults,
  calculateCompleteness,
  analyzeCitations,
  analyzeFieldQuality,
  generateReport
};