#!/bin/bash

# Set script to exit on error
set -e

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

printf "${YELLOW}========================================================${NC}\n"
printf "${YELLOW}  🧪 Treekipedia API Test Runner with Stewardship Fix 🧪${NC}\n"
printf "${YELLOW}========================================================${NC}\n"

# Navigate to project root
cd "$(dirname "$0")/../.."
PROJECT_ROOT=$(pwd)

printf "${BLUE}Project root: $PROJECT_ROOT${NC}\n"

# Check if axios is installed globally or install it locally
if ! npm list axios &>/dev/null; then
  printf "${BLUE}Installing axios...${NC}\n"
  npm install axios --no-save
fi

# Run the test script
printf "${YELLOW}Running API tests against production server...${NC}\n"
printf "${GREEN}Test execution started at: $(date)${NC}\n"
printf "\n"

node "$PROJECT_ROOT/scripts/tests/test-api-endpoints.js" | tee "$PROJECT_ROOT/scripts/tests/api_test_results.log"

printf "\n"
printf "${GREEN}Test execution completed at: $(date)${NC}\n"
printf "${YELLOW}Results saved to: $PROJECT_ROOT/scripts/tests/api_test_results.log${NC}\n"
printf "${YELLOW}---------------------------------------------${NC}\n"
printf "${BLUE}Look for 'stewardship_best_practices' in the IPFS metadata check${NC}\n"
printf "${BLUE}to verify the fix was successful.${NC}\n"