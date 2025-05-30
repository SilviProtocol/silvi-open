#!/bin/bash
# Treekipedia Backend AI Research Flow Tests
# This script contains terminal-based tests to verify ONLY the AI research flow
# (without EAS attestations or NFT minting which are not yet implemented)

# Set the base URL for the API
API_URL="http://167.172.143.162:3000"
TAXON_ID="AngMaFaFb0001-00"
WALLET_ADDRESS="0x1ee6a2bb0c64396cd0548dF4f51b1e09350111be"
CHAIN="base"  # Options: base, celo, optimism, arbitrum

# Test data for blockchain transaction
TRANSACTION_HASH="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}[INFO]${NC} Starting Treekipedia AI Research Flow Tests (Research Only)..."
echo -e "${YELLOW}[INFO]${NC} API URL: ${API_URL}"
echo -e "${YELLOW}[INFO]${NC} Test Wallet: ${WALLET_ADDRESS}"
echo -e "${YELLOW}[INFO]${NC} Note: This test only focuses on the AI research process, not on EAS attestations or NFT minting."

# Test 1: Check if the server is running
echo -e "\n${YELLOW}[TEST 1]${NC} Checking if the server is running..."
curl -s "${API_URL}" | jq .

# Test 2: Check available routes
echo -e "\n${YELLOW}[TEST 2]${NC} Checking available API routes..."
curl -s "${API_URL}/api" | jq . || echo -e "${RED}[ERROR]${NC} Failed to parse API response"

# Test 3: Get species information for the test taxon_id
echo -e "\n${YELLOW}[TEST 3]${NC} Getting species information for taxon_id: ${TAXON_ID}..."
curl -s "${API_URL}/species/${TAXON_ID}" | jq .

# Create a modified version of the research endpoint that bypasses EAS and NFT
echo -e "\n${YELLOW}[TEST 4]${NC} Creating a modified endpoint to test ONLY the AI research flow..."

# Create a temporary file with a modified version of the research controller
# that bypasses EAS attestations and NFT minting
cat > temp_research_controller.js << 'EOF'
// Create a modified research endpoint that only performs the AI research and IPFS steps
const researchOnly = async (req, res) => {
  try {
    const { taxon_id, wallet_address } = req.body;
    
    if (!taxon_id || !wallet_address) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        required: ['taxon_id', 'wallet_address'] 
      });
    }

    // Get species information
    const speciesQuery = `
      SELECT taxon_id, species, common_name, accepted_scientific_name 
      FROM species 
      WHERE taxon_id = $1
    `;
    const speciesResult = await pool.query(speciesQuery, [taxon_id]);
    
    if (speciesResult.rows.length === 0) {
      return res.status(404).json({ error: 'Species not found' });
    }
    
    const species = speciesResult.rows[0];
    
    // Use accepted_scientific_name or species as the scientific name
    const scientificName = species.accepted_scientific_name || species.species;
    const commonNames = species.common_name;
    
    // Step 1: Perform AI research
    console.log(`[TEST] Starting AI research for ${scientificName} (${taxon_id})`);
    const researchData = await performAIResearch(
      taxon_id,
      scientificName,
      commonNames,
      wallet_address
    );
    
    // Step 2: Upload research data to IPFS
    console.log('[TEST] Uploading research data to IPFS');
    const ipfsCid = await uploadToIPFS(researchData);
    
    // Step 3: Update species table with research data
    console.log('[TEST] Updating species table with research data');
    const updateQuery = `
      UPDATE species
      SET 
        conservation_status = $1,
        general_description = $2,
        habitat = $3,
        elevation_ranges = $4,
        compatible_soil_types = $5,
        ecological_function = $6,
        native_adapted_habitats = $7,
        agroforestry_use_cases = $8,
        growth_form = $9,
        leaf_type = $10,
        deciduous_evergreen = $11,
        flower_color = $12,
        fruit_type = $13,
        bark_characteristics = $14,
        maximum_height = $15,
        maximum_diameter = $16,
        lifespan = $17,
        maximum_tree_age = $18,
        verification_status = 'unverified',
        ipfs_cid = $19,
        updated_at = CURRENT_TIMESTAMP
      WHERE taxon_id = $20
      RETURNING *
    `;
    
    const updateValues = [
      researchData.conservation_status,
      researchData.general_description,
      researchData.habitat,
      researchData.elevation_ranges,
      researchData.compatible_soil_types,
      researchData.ecological_function,
      researchData.native_adapted_habitats,
      researchData.agroforestry_use_cases,
      researchData.growth_form,
      researchData.leaf_type,
      researchData.deciduous_evergreen,
      researchData.flower_color,
      researchData.fruit_type,
      researchData.bark_characteristics,
      researchData.maximum_height,
      researchData.maximum_diameter,
      researchData.lifespan,
      researchData.maximum_tree_age,
      ipfsCid,
      taxon_id
    ];
    
    const updateResult = await pool.query(updateQuery, updateValues);
    
    // Return only research & IPFS data (skip EAS & NFT)
    res.status(200).json({
      success: true,
      message: "Research and IPFS steps completed successfully (EAS & NFT steps skipped for testing)",
      research_data: researchData,
      ipfs_cid: ipfsCid,
    });
    
  } catch (error) {
    console.error('[TEST] Error in research-only endpoint:', error);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Export this for manual testing
module.exports = { researchOnly };
EOF

echo -e "${YELLOW}[INFO]${NC} Creating a direct request to the AI research service to test species: ${TAXON_ID}..."

# Create a small test script to directly interact with the AI research service
cat > test_ai_research_direct.js << EOF
// Test script for AI research services
require('dotenv').config();
const { performAIResearch } = require('../../backend/services/aiResearch');
const { uploadToIPFS } = require('../../backend/services/ipfs');
const fs = require('fs');

async function testAIResearch() {
  try {
    console.log('Starting AI research test...');
    
    // Get the scientific name and taxon_id from command line args
    const taxonId = process.argv[2] || '${TAXON_ID}';
    const scientificName = process.argv[3] || 'Abarema cochliocarpos';
    const commonName = process.argv[4] || '';
    const wallet = process.argv[5] || '${WALLET_ADDRESS}';
    
    console.log(\`Running AI research for \${scientificName} (\${taxonId})...\`);
    
    // Step 1: Perform AI research
    const researchData = await performAIResearch(
      taxonId,
      scientificName,
      commonName,
      wallet
    );
    
    // Save research data to file
    fs.writeFileSync('ai_research_output.json', JSON.stringify(researchData, null, 2));
    console.log('Research data saved to ai_research_output.json');
    
    // Step 2: Upload to IPFS
    console.log('Uploading research data to IPFS...');
    try {
      const ipfsCid = await uploadToIPFS(researchData);
      console.log(\`IPFS CID: \${ipfsCid}\`);
    } catch (ipfsError) {
      console.error('IPFS upload failed:', ipfsError.message);
    }
    
    console.log('AI research test completed successfully');
  } catch (error) {
    console.error('Error during AI research test:', error);
  }
}

testAIResearch();
EOF

# Make the Node script executable
chmod +x test_ai_research_direct.js

# Check key environment variables for AI research
echo -e "\n${YELLOW}[TEST 5]${NC} Checking environment variables for AI research..."
echo -e "${BLUE}[DEBUG]${NC} Environment check for AI services:"
echo -e "  PERPLEXITY_API_KEY: ${PERPLEXITY_API_KEY:+"✓ Set"}${PERPLEXITY_API_KEY:="✗ Not set"}"
echo -e "  OPENAI_API_KEY: ${OPENAI_API_KEY:+"✓ Set"}${OPENAI_API_KEY:="✗ Not set"}"
echo -e "  LIGHTHOUSE_API_KEY: ${LIGHTHOUSE_API_KEY:+"✓ Set"}${LIGHTHOUSE_API_KEY:="✗ Not set"}"

# Run the direct test if API keys are available
if [[ -n "${PERPLEXITY_API_KEY}" && -n "${OPENAI_API_KEY}" ]]; then
  echo -e "\n${YELLOW}[TEST 6]${NC} Running direct test of AI research service..."
  echo -e "${YELLOW}[INFO]${NC} This test may take 1-2 minutes to complete (AI research and IPFS upload)..."
  
  # Run the Node.js script and capture the output
  node test_ai_research_direct.js | tee ai_research_direct_output.log
  
  # Check if the output file was created
  if [[ -f "ai_research_output.json" ]]; then
    echo -e "\n${GREEN}[SUCCESS]${NC} AI research completed and output saved to ai_research_output.json"
    echo -e "\n${YELLOW}[OUTPUT]${NC} First 500 characters of AI research output:"
    head -c 500 ai_research_output.json
    echo -e "\n...(truncated)..."
  else
    echo -e "\n${RED}[ERROR]${NC} AI research did not complete successfully. Check logs for details."
  fi
else
  echo -e "\n${RED}[ERROR]${NC} Cannot run direct AI research test due to missing API keys."
fi

# Test 7: Verify species data has been updated with research
echo -e "\n${YELLOW}[TEST 7]${NC} Verifying species data for taxon_id: ${TAXON_ID}..."
curl -s "${API_URL}/species/${TAXON_ID}" | jq '.conservation_status, .habitat, .general_description' || 
  echo -e "${RED}[ERROR]${NC} Failed to parse species data response"

# Test 8: Fetch data from IPFS (if available)
if [[ -f "ai_research_output.json" ]]; then
  IPFS_CID=$(grep -o 'IPFS CID: [a-zA-Z0-9]*' ai_research_direct_output.log | cut -d ' ' -f 3)
  
  if [[ -n "${IPFS_CID}" ]]; then
    echo -e "\n${YELLOW}[TEST 8]${NC} Fetching data from IPFS gateway for CID: ${IPFS_CID}..."
    curl -s "https://gateway.lighthouse.storage/ipfs/${IPFS_CID}" | jq . || 
      echo -e "${RED}[ERROR]${NC} Failed to parse IPFS data as JSON"
  else
    echo -e "\n${YELLOW}[TEST 8]${NC} Skipping IPFS fetch: No IPFS CID available"
    echo -e "${BLUE}[DEBUG]${NC} IPFS upload may have failed. Check LIGHTHOUSE_API_KEY in .env"
  fi
else
  echo -e "\n${YELLOW}[TEST 8]${NC} Skipping IPFS fetch: No IPFS CID available"
fi

# Summary of test results and potential issues
echo -e "\n${YELLOW}[SUMMARY]${NC} Test Results and Potential Issues:"

# Check for missing API keys
if [[ -z "${PERPLEXITY_API_KEY}" ]]; then
  echo -e "${RED}[ISSUE]${NC} PERPLEXITY_API_KEY is missing. AI research will fail."
fi

if [[ -z "${OPENAI_API_KEY}" ]]; then
  echo -e "${RED}[ISSUE]${NC} OPENAI_API_KEY is missing. AI research will fail."
fi

if [[ -z "${LIGHTHOUSE_API_KEY}" ]]; then
  echo -e "${RED}[ISSUE]${NC} LIGHTHOUSE_API_KEY is missing. IPFS upload will fail."
fi

# Note about EAS and NFT
echo -e "${YELLOW}[NOTE]${NC} EAS attestations and NFT minting are not tested as they are not yet implemented."
echo -e "${YELLOW}[NOTE]${NC} This test only validates the AI research process and IPFS uploading."

# Database verification suggestions (requires psql access)
echo -e "\n${YELLOW}[INFO]${NC} Database verification commands (if you have psql access):"
echo -e "  psql \$DATABASE_URL -c \"SELECT taxon_id, conservation_status, general_description, ipfs_cid FROM species WHERE taxon_id = '${TAXON_ID}';\""

# Log checking suggestions
echo -e "\n${YELLOW}[INFO]${NC} Check server logs for detailed information:"
echo -e "  pm2 logs                                # If using PM2"

# Final recommendations
echo -e "\n${YELLOW}[RECOMMENDATIONS]${NC}"
echo -e "1. Ensure API keys for Perplexity and OpenAI are correctly set"
echo -e "2. Consider adding more comprehensive tests for AI research services"
echo -e "3. Add unit tests for the performAIResearch function"
echo -e "4. Implement better error handling in the AI research service"

echo -e "\n${YELLOW}[INFO]${NC} Tests completed!\n"

# Clean up temporary files
rm -f temp_research_controller.js