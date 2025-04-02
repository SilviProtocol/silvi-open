#!/bin/bash

# Set script to exit on error
set -e

echo "🧪 Treekipedia API Test Runner 🧪"
echo "--------------------------------"

# Navigate to project root
cd "$(dirname "$0")/../.."
PROJECT_ROOT=$(pwd)

echo "Project root: $PROJECT_ROOT"

# Check if axios is installed globally or install it locally
if ! npm list axios &>/dev/null; then
  echo "Installing axios..."
  npm install axios --no-save
fi

# Run the test script
echo "Running API tests against production server..."
echo "Test execution started at: $(date)"
echo ""

node "$PROJECT_ROOT/scripts/tests/test-api-endpoints.js" | tee "$PROJECT_ROOT/scripts/tests/api_test_results.log"

echo ""
echo "Test execution completed at: $(date)"
echo "Results saved to: $PROJECT_ROOT/scripts/tests/api_test_results.log"