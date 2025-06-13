#!/bin/bash
# Treekipedia Backend AI Research Flow Tests
# This script contains terminal-based tests to verify the AI research flow

# Source .env file to get environment variables
if [ -f "/root/silvi-open/treekipedia-new/.env" ]; then
  source "/root/silvi-open/treekipedia-new/.env"
  echo "Loaded environment variables from .env"
else
  echo "Warning: .env file not found"
fi

# Set the base URL for the API
API_URL="http://localhost:3000"
TAXON_ID="AngMaFaFb0001-00"
WALLET_ADDRESS="0x4a24d4a7c36257E0bF256EA2970708817C597A2C" # Use our real address
CHAIN="celo"  # Options: base, celo, optimism, arbitrum

# Test data for blockchain transaction
TRANSACTION_HASH="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}[INFO]${NC} Starting Treekipedia AI Research Flow Tests..."
echo -e "${YELLOW}[INFO]${NC} API URL: ${API_URL}"
echo -e "${YELLOW}[INFO]${NC} Test Wallet: ${WALLET_ADDRESS}"

# Test 1: Check if the server is running
echo -e "\n${YELLOW}[TEST 1]${NC} Checking if the server is running..."
curl -s "${API_URL}" | jq .

# Test 2: Check available routes
echo -e "\n${YELLOW}[TEST 2]${NC} Checking available API routes..."
curl -s "${API_URL}/api" | jq . || echo -e "${RED}[ERROR]${NC} Failed to parse API response"

# Test 3: Get species information for the test taxon_id
echo -e "\n${YELLOW}[TEST 3]${NC} Getting species information for taxon_id: ${TAXON_ID}..."
curl -s "${API_URL}/species/${TAXON_ID}" | jq .

# Test 4: Run the AI research flow (POST to /research/fund-research)
echo -e "\n${YELLOW}[TEST 4]${NC} Running AI research flow for taxon_id: ${TAXON_ID} on ${CHAIN}..."
echo -e "${YELLOW}[INFO]${NC} This test may take 1-2 minutes to complete (AI research, IPFS upload, and blockchain transactions)..."
echo -e "${BLUE}[DEBUG]${NC} Environment check for ${CHAIN} chain:"

# Chain-specific environment variable checks
case $CHAIN in
  base)
    echo -e "  BASE_RPC_URL: ${BASE_RPC_URL:+"✓ Set"}${BASE_RPC_URL:="✗ Not set"}"
    echo -e "  BASE_NFT_CONTRACT_ADDRESS: ${BASE_NFT_CONTRACT_ADDRESS:+"✓ Set"}${BASE_NFT_CONTRACT_ADDRESS:="✗ Not set"}"
    echo -e "  BASE_EAS_CONTRACT_ADDRESS: ${BASE_EAS_CONTRACT_ADDRESS:+"✓ Set"}${BASE_EAS_CONTRACT_ADDRESS:="✗ Not set"}"
    ;;
  celo)
    echo -e "  CELO_RPC_URL: ${CELO_RPC_URL:+"✓ Set"}${CELO_RPC_URL:="✗ Not set"}"
    echo -e "  CELO_NFT_CONTRACT_ADDRESS: ${CELO_NFT_CONTRACT_ADDRESS:+"✓ Set"}${CELO_NFT_CONTRACT_ADDRESS:="✗ Not set"}"
    echo -e "  CELO_EAS_CONTRACT_ADDRESS: ${CELO_EAS_CONTRACT_ADDRESS:+"✓ Set"}${CELO_EAS_CONTRACT_ADDRESS:="✗ Not set"}"
    ;;
  optimism)
    echo -e "  OPTIMISM_RPC_URL: ${OPTIMISM_RPC_URL:+"✓ Set"}${OPTIMISM_RPC_URL:="✗ Not set"}"
    echo -e "  OPTIMISM_NFT_CONTRACT_ADDRESS: ${OPTIMISM_NFT_CONTRACT_ADDRESS:+"✓ Set"}${OPTIMISM_NFT_CONTRACT_ADDRESS:="✗ Not set"}"
    echo -e "  OPTIMISM_EAS_CONTRACT_ADDRESS: ${OPTIMISM_EAS_CONTRACT_ADDRESS:+"✓ Set"}${OPTIMISM_EAS_CONTRACT_ADDRESS:="✗ Not set"}"
    ;;
  arbitrum)
    echo -e "  ARBITRUM_RPC_URL: ${ARBITRUM_RPC_URL:+"✓ Set"}${ARBITRUM_RPC_URL:="✗ Not set"}"
    echo -e "  ARBITRUM_NFT_CONTRACT_ADDRESS: ${ARBITRUM_NFT_CONTRACT_ADDRESS:+"✓ Set"}${ARBITRUM_NFT_CONTRACT_ADDRESS:="✗ Not set"}"
    echo -e "  ARBITRUM_EAS_CONTRACT_ADDRESS: ${ARBITRUM_EAS_CONTRACT_ADDRESS:+"✓ Set"}${ARBITRUM_EAS_CONTRACT_ADDRESS:="✗ Not set"}"
    ;;
esac

echo -e "  CELO_EAS_SCHEMA_ID: ${CELO_EAS_SCHEMA_ID:+"✓ Set"}${CELO_EAS_SCHEMA_ID:="✗ Not set"}"
echo -e "  LIGHTHOUSE_API_KEY: ${LIGHTHOUSE_API_KEY:+"✓ Set"}${LIGHTHOUSE_API_KEY:="✗ Not set"}"
echo -e "  PERPLEXITY_API_KEY: ${PERPLEXITY_API_KEY:+"✓ Set"}${PERPLEXITY_API_KEY:="✗ Not set"}"
echo -e "  OPENAI_API_KEY: ${OPENAI_API_KEY:+"✓ Set"}${OPENAI_API_KEY:="✗ Not set"}"

# Make the API request with verbose output to help diagnose issues
echo -e "${YELLOW}[INFO]${NC} Sending research request to ${API_URL}/research/fund-research..."
curl -v -X POST "${API_URL}/research/fund-research" \
  -H "Content-Type: application/json" \
  -d '{
    "taxon_id": "'"${TAXON_ID}"'",
    "wallet_address": "'"${WALLET_ADDRESS}"'",
    "chain": "'"${CHAIN}"'",
    "transaction_hash": "'"${TRANSACTION_HASH}"'",
    "ipfs_cid": "QmTestCID123",
    "scientific_name": "Test Species"
  }' 2>&1 | tee curl_output.log

# Save just the response body to a separate file for JSON parsing
cat curl_output.log | grep -v "^*" | grep -v "^}" | grep -v "^{" | grep -v "^<" | grep -v "^>" | tail -n 1 > research_response.json

# Try to parse the JSON response, handle errors gracefully
if jq . research_response.json >/dev/null 2>&1; then
  echo -e "${GREEN}[SUCCESS]${NC} Received valid JSON response:"
  jq . research_response.json
  
  # Extract IPFS CID and attestation UID from the response
  IPFS_CID=$(jq -r '.ipfs_cid' research_response.json 2>/dev/null)
  ATTESTATION_UID=$(jq -r '.attestation_uid' research_response.json 2>/dev/null)
else
  echo -e "${RED}[ERROR]${NC} Did not receive valid JSON response. Raw response:"
  cat research_response.json
  
  # Set empty values for variables
  IPFS_CID=""
  ATTESTATION_UID=""
  
  # Check for specific error patterns
  if grep -q "404 Not Found" curl_output.log; then
    echo -e "${RED}[ERROR]${NC} API endpoint not found (404). Check if the research routes are properly mounted in server.js"
  elif grep -q "500 Internal Server Error" curl_output.log; then
    echo -e "${RED}[ERROR]${NC} Server error (500). Check server logs for details."
  elif grep -q "Invalid chain selection" curl_output.log; then
    echo -e "${RED}[ERROR]${NC} Invalid chain selection. Valid chains are: base, celo, optimism, arbitrum"
  fi
fi

echo -e "\n${YELLOW}[INFO]${NC} IPFS CID: ${IPFS_CID}"
echo -e "${YELLOW}[INFO]${NC} Attestation UID: ${ATTESTATION_UID}"

# Test 5: Verify the research data was saved (GET /research/:taxon_id)
echo -e "\n${YELLOW}[TEST 5]${NC} Verifying research data was saved for taxon_id: ${TAXON_ID}..."
curl -s "${API_URL}/research/${TAXON_ID}" | jq . || echo -e "${RED}[ERROR]${NC} Failed to parse research data response"

# Test 6: Check the user's updated treederboard data
echo -e "\n${YELLOW}[TEST 6]${NC} Checking user's treederboard data for wallet: ${WALLET_ADDRESS}..."
curl -s "${API_URL}/treederboard/user/${WALLET_ADDRESS}" | jq . || echo -e "${RED}[ERROR]${NC} Failed to parse treederboard user data response"

# Test 7: Fetch NFT data from IPFS (if IPFS CID is available)
if [ "${IPFS_CID}" != "null" ] && [ "${IPFS_CID}" != "" ]; then
  echo -e "\n${YELLOW}[TEST 7]${NC} Fetching NFT data from IPFS gateway..."
  curl -s "https://gateway.lighthouse.storage/ipfs/${IPFS_CID}" | jq . || 
    echo -e "${RED}[ERROR]${NC} Failed to parse IPFS data as JSON"
else
  echo -e "\n${YELLOW}[TEST 7]${NC} Skipping IPFS fetch: No IPFS CID available"
  echo -e "${BLUE}[DEBUG]${NC} IPFS upload may have failed. Check LIGHTHOUSE_API_KEY in .env"
fi

# Test 8: Check the treederboard to see if user is listed
echo -e "\n${YELLOW}[TEST 8]${NC} Checking if user appears on the treederboard..."
curl -s "${API_URL}/treederboard" | jq . || 
  echo -e "${RED}[ERROR]${NC} Failed to parse treederboard response as JSON"

# Summary of test results and potential issues
echo -e "\n${YELLOW}[SUMMARY]${NC} Test Results and Potential Issues:"

# Check for missing contract addresses based on selected chain
case $CHAIN in
  base)
    if [[ "${BASE_NFT_CONTRACT_ADDRESS}" == "0x..." || -z "${BASE_NFT_CONTRACT_ADDRESS}" ]]; then
      echo -e "${RED}[ISSUE]${NC} BASE_NFT_CONTRACT_ADDRESS is a placeholder or missing. NFT minting will fail."
    fi
    if [[ -z "${BASE_EAS_CONTRACT_ADDRESS}" ]]; then
      echo -e "${RED}[ISSUE]${NC} BASE_EAS_CONTRACT_ADDRESS is missing. Attestation creation will fail."
    fi
    ;;
  celo)
    if [[ "${CELO_NFT_CONTRACT_ADDRESS}" == "0x..." || -z "${CELO_NFT_CONTRACT_ADDRESS}" ]]; then
      echo -e "${RED}[ISSUE]${NC} CELO_NFT_CONTRACT_ADDRESS is a placeholder or missing. NFT minting will fail."
    fi
    if [[ -z "${CELO_EAS_CONTRACT_ADDRESS}" ]]; then
      echo -e "${RED}[ISSUE]${NC} CELO_EAS_CONTRACT_ADDRESS is missing. Attestation creation will fail."
    fi
    ;;
  optimism)
    if [[ "${OPTIMISM_NFT_CONTRACT_ADDRESS}" == "0x..." || -z "${OPTIMISM_NFT_CONTRACT_ADDRESS}" ]]; then
      echo -e "${RED}[ISSUE]${NC} OPTIMISM_NFT_CONTRACT_ADDRESS is a placeholder or missing. NFT minting will fail."
    fi
    if [[ -z "${OPTIMISM_EAS_CONTRACT_ADDRESS}" ]]; then
      echo -e "${RED}[ISSUE]${NC} OPTIMISM_EAS_CONTRACT_ADDRESS is missing. Attestation creation will fail."
    fi
    ;;
  arbitrum)
    if [[ "${ARBITRUM_NFT_CONTRACT_ADDRESS}" == "0x..." || -z "${ARBITRUM_NFT_CONTRACT_ADDRESS}" ]]; then
      echo -e "${RED}[ISSUE]${NC} ARBITRUM_NFT_CONTRACT_ADDRESS is a placeholder or missing. NFT minting will fail."
    fi
    if [[ -z "${ARBITRUM_EAS_CONTRACT_ADDRESS}" ]]; then
      echo -e "${RED}[ISSUE]${NC} ARBITRUM_EAS_CONTRACT_ADDRESS is missing. Attestation creation will fail."
    fi
    ;;
esac

# Check for EAS schema ID
if [[ -z "${CELO_EAS_SCHEMA_ID}" ]]; then
  echo -e "${RED}[ISSUE]${NC} CELO_EAS_SCHEMA_ID is missing. Attestation creation will fail."
fi

# AI service issues
if [[ -z "${PERPLEXITY_API_KEY}" ]]; then
  echo -e "${RED}[ISSUE]${NC} PERPLEXITY_API_KEY is missing. AI research will fail."
fi

if [[ -z "${OPENAI_API_KEY}" ]]; then
  echo -e "${RED}[ISSUE]${NC} OPENAI_API_KEY is missing. AI research will fail."
fi

# Database verification suggestions (requires psql access)
echo -e "\n${YELLOW}[INFO]${NC} Database verification commands (if you have psql access):"
echo -e "  psql \$DATABASE_URL -c \"SELECT * FROM species WHERE taxon_id = '${TAXON_ID}';\""
echo -e "  psql \$DATABASE_URL -c \"SELECT * FROM contreebution_nfts WHERE taxon_id = '${TAXON_ID}' AND wallet_address = '${WALLET_ADDRESS}';\""
echo -e "  psql \$DATABASE_URL -c \"SELECT * FROM users WHERE wallet_address = '${WALLET_ADDRESS}';\""

# Log checking suggestions
echo -e "\n${YELLOW}[INFO]${NC} Check server logs for detailed information:"
echo -e "  tail -f /var/log/treekipedia.log        # If using standard logging"
echo -e "  pm2 logs                                # If using PM2"
echo -e "  docker logs treekipedia-backend         # If using Docker"

# Final recommendations
echo -e "\n${YELLOW}[RECOMMENDATIONS]${NC}"
echo -e "1. Ensure route mounting in server.js includes research routes"
echo -e "2. Ensure NFT contract addresses are correctly set in .env and chains.js"
echo -e "3. Ensure EAS schema ID and EAS contract addresses are correct"
echo -e "4. Verify all API keys are valid"
echo -e "5. Check blockchain balances for the wallet: ${WALLET_ADDRESS}"
echo -e "6. Required fields for /fund-research: taxon_id, wallet_address, chain, transaction_hash, ipfs_cid, scientific_name"
echo -e "7. EAS schema structure: \"string taxon_id, string ipfs_cid, address wallet_address, uint256 timestamp, uint256 research_version, string scientific_name, bytes32 refUID\""

echo -e "\n${YELLOW}[INFO]${NC} Tests completed!\n"