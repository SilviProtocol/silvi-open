# AI Research Testing Playground

This directory contains tools for testing and improving the AI research process for tree species data collection. The system works with all **24 research fields** currently used in the production database.

## Overview

The testing playground allows you to experiment with different AI models, prompting strategies, and field groupings without affecting the production database. All results are saved to JSON files for analysis and comparison.

## Supported AI Models

### 1. Claude Models (Anthropic)
- **Claude 3.5 Haiku**: Fast, cost-effective, 100% field completion
- **Claude Sonnet 4**: Premium quality, detailed responses, highest accuracy
- **Usage**: `test-3group-research.js`

### 2. Grok Models (xAI)
- **Grok 3 Mini**: Extremely efficient, 88% field completion with optimization
- **Usage**: `test-grok-research.js`

### 3. Current Production (Baseline)
- **Perplexity + GPT-4o**: Current system for comparison
- **Ginkgo biloba** serves as baseline comparison species

## Setup

1. **API Keys**: Set in your `.env` file:
   ```bash
   ANTHROPIC_API_KEY=your_anthropic_key
   XAI_API_KEY=xai-your_grok_key  # Note: requires 'xai-' prefix
   ```
2. **Dependencies**: `npm install` (from project root)

## Files Structure

```
scripts/research/
├── README.md                     # This file
├── test-species.json             # Test species data
├── test-3group-research.js       # Claude testing (recommended)
├── test-grok-research.js         # Grok testing (optimized)
├── test-grok-experiments.js      # Grok optimization experiments
├── test-grok-api.js              # Grok API diagnostics
├── test-ai-research.js           # Legacy multi-strategy testing
├── prompt-templates/             # Prompt templates for manual testing
│   ├── system-prompt.md
│   ├── user-prompts.md
│   └── ginkgo-testing-prompts.md
├── test-results/                 # Generated test results (JSON files)
│   ├── 3group/                   # Claude results
│   └── grok/                     # Grok results
├── analysis/                     # Analysis and comparisons
│   └── ginkgo-baseline-vs-improved.md
└── comparison-tools/             # Analysis tools (legacy)
    └── analyze-results.js
```

## Quick Start

### Recommended: Test Claude 3-Group Strategy
```bash
cd scripts/research

# Test specific species from database
node test-3group-research.js --species AngGiGiGN21141-00

# Test custom species
node test-3group-research.js --custom "Quercus robur" "English oak"

# List available test species
node test-3group-research.js --list
```

### Test Grok (Optimized)
```bash
# Test with optimized Grok prompts
node test-grok-research.js --species AngGiGiGN21141-00

# Test custom species with Grok
node test-grok-research.js --custom "Delonix regia" "Royal Poinciana"
```

### API Diagnostics
```bash
# Test Grok API configuration
node test-grok-api.js

# Run Grok optimization experiments
node test-grok-experiments.js
```

## Model Performance Comparison

Based on Ginkgo biloba testing results:

| Model | Completion Rate | Token Usage | Duration | Cost Efficiency | Quality |
|-------|----------------|-------------|----------|----------------|---------|
| **Claude 3.5 Haiku** | 100% (24/24) | 97,501 | 27s | Good | High detail |
| **Grok 3 Mini (Optimized)** | 88% (21/24) | 26,819 | 35s | **Excellent** | Good |
| **Claude Sonnet 4** | 71% (17/24) | 286,913 | 65s | Lower | **Premium** |
| **Perplexity + GPT-4o** | 75% (18/24) | ~200k+ | ~60s | Moderate | Good |

### Recommendations by Use Case:

- **Production Quality**: Claude 3.5 Haiku (100% completion, reliable)
- **Cost-Effective Bulk Processing**: Grok 3 Mini (88% completion, 3.6x more efficient)
- **Premium Research**: Claude Sonnet 4 (highest quality, detailed citations)
- **Quick Testing**: Grok 3 Mini (fast, cheap, good enough for iteration)

## Research Strategy: 3-Group Approach

The optimal strategy divides 24 research fields into 3 specialized groups:

### Group 1: Ecological + General (8 fields)
- `habitat_ai`, `elevation_ranges_ai`, `ecological_function_ai`
- `native_adapted_habitats_ai`, `agroforestry_use_cases_ai`
- `conservation_status_ai`, `general_description_ai`, `compatible_soil_types_ai`
- **Focus**: Scientific databases, environmental studies, conservation resources

### Group 2: Morphological (10 fields)  
- `growth_form_ai`, `leaf_type_ai`, `deciduous_evergreen_ai`
- `flower_color_ai`, `fruit_type_ai`, `bark_characteristics_ai`
- `maximum_height_ai`, `maximum_diameter_ai`, `lifespan_ai`, `maximum_tree_age_ai`
- **Focus**: Botanical descriptions, field guides, taxonomic databases

### Group 3: Stewardship (6 fields)
- `stewardship_best_practices_ai`, `planting_recipes_ai`, `pruning_maintenance_ai`
- `disease_pest_management_ai`, `fire_management_ai`, `cultural_significance_ai`
- **Focus**: Gardening forums, cultivation guides, practical grower communities

## Model-Specific Configuration

### Claude Configuration
```javascript
model: 'claude-3-5-haiku-20241022'  // or claude-sonnet-4-20250514
max_tokens: 4000
temperature: 0.3
tools: [{ type: "web_search_20250305", max_uses: 10 }]
```

### Grok Configuration (Optimized)
```javascript
model: 'grok-3-mini'
max_tokens: 80000  // Critical: High token limit for reasoning
temperature: 0.3
reasoning_effort: 'high'
web_search_options: { search_context_size: 'high' }
```

## Key Optimization Discoveries

### Grok Optimization Breakthrough
Through experimentation, we discovered that **aggressive prompting instructions** dramatically improve Grok's performance:

**Before Optimization**: 63% completion (15/24 fields)
**After Optimization**: 88% completion (21/24 fields)

**Key Prompt Improvements**:
- "SEARCH AGGRESSIVELY AND EXTENSIVELY"
- "Use multiple search queries per field if needed"
- "Only use 'Data not available' as ABSOLUTE LAST RESORT"
- Specific extraction examples for numeric fields

### Token Budget Critical for Grok
Grok's reasoning tokens count against the `max_tokens` limit. Insufficient tokens result in empty responses. **Minimum 80,000 tokens recommended** for complex research queries.

## Test Species

Standard test species for consistency:

1. **Quercus robur** (English oak) - Well-documented, simple
2. **Plumeria rubra** (Red frangipani) - Moderate documentation
3. **Adenanthera pavonina** (Red sandalwood) - Limited documentation, complex
4. **Betula pendula** (Silver birch) - Common, simple
5. **Ginkgo biloba** (Ginkgo, maidenhair tree) - **BASELINE COMPARISON** 
   - `taxon_id: AngGiGiGN21141-00`
   - Has existing research data from production system
   - Use for comparing new results against current Perplexity+GPT-4o system

## Key Metrics Tracked

- **Completion Rate**: Percentage of fields filled with any data
- **Data Availability Rate**: Percentage of fields with actual species-specific data
- **Token Efficiency**: Cost per field completed
- **Field-Specific Success**: Which fields are most/least successful across models
- **Numeric Accuracy**: Precision for measurable fields (height, age, etc.)
- **Quality Assessment**: Detail level and source citation quality

## Anti-Hallucination Measures

All models implement strict measures to prevent AI hallucination:

1. **Explicit Instructions**: "Use 'Data not available' for missing information"
2. **Web Search Requirements**: Must use search capabilities and cite sources
3. **Specificity Requirements**: Avoid generic information that applies to any tree
4. **Validation Prompts**: Distinguish between verified data and estimates
5. **Conservative Extraction**: Prefer "Data not available" over uncertain information

## Analysis Tools

### Basic Analysis
```bash
# View detailed JSON results
ls test-results/3group/
ls test-results/grok/

# Compare specific runs
diff test-results/3group/Ginkgo_biloba_*.json test-results/grok/Ginkgo_biloba_*.json
```

### Advanced Analysis
```bash
# Legacy comparison tools (from older testing phases)
cd comparison-tools
node analyze-results.js --species AngGiGiGN21141-00
```

## Integration with Production

### Current Production System (`backend/services/aiResearch.js`)
- 2 Perplexity queries + 1 GPT-4o formatting call
- ~75% completion rate
- Higher token usage

### Recommended Upgrade Path
1. **Phase 1**: Replace with Claude 3.5 Haiku + 3-group strategy (100% completion)
2. **Phase 2**: Implement Grok fallback for cost optimization
3. **Phase 3**: Use Claude Sonnet 4 for premium species research

### Implementation Notes
- Same 24-field database schema
- Same 3-group parallel processing approach
- Enhanced prompting for better extraction
- Raw response preservation for manual review
- Configurable model selection per research tier

## Troubleshooting

### Common Issues

**Empty Grok Responses**:
- Check `max_tokens` >= 80,000
- Verify API key has `xai-` prefix
- Ensure model name is `grok-3-mini` (not beta versions)

**Claude Rate Limiting**:
- Implement delays between requests
- Use exponential backoff retry logic
- Consider upgrading API tier

**JSON Parsing Errors**:
- Both models include fallback parsing
- Raw responses always preserved
- Can implement additional LLM cleanup step

### Model-Specific Debugging
```bash
# Test Grok API configuration
node test-grok-api.js

# Run optimization experiments
node test-grok-experiments.js

# Test Claude with simple query
node test-3group-research.js --custom "Quercus robur" "oak"
```

## Performance Summary

The research playground has successfully optimized AI-powered botanical research with:

- **100% field completion** achieved with Claude 3.5 Haiku
- **88% field completion** achieved with cost-effective Grok 3 Mini
- **3.6x token efficiency** improvement with optimized Grok
- **Comprehensive 24-field coverage** across ecological, morphological, and stewardship domains
- **Production-ready JSON output** compatible with existing database schema

This represents a significant improvement over the current Perplexity + GPT-4o system while providing multiple model options for different cost/quality requirements.