# Treekipedia Test Scripts

This directory contains test scripts for Treekipedia backend services and API endpoints.

## Available Tests

### AI Research Tests

- **tests_ai_research.sh** - Tests the complete AI research flow including blockchain operations (EAS attestations and NFT minting).
- **tests_ai_research_only.sh** - Tests only the AI research process and IPFS uploads, without blockchain operations.

## Usage

To run a test, navigate to the project root directory and execute the test script:

```bash
cd /root/silvi-open/treekipedia-new
./scripts/tests/tests_ai_research_only.sh
```

## Test Output

Test output is displayed in the terminal with color-coded status messages:
- Green: Success
- Yellow: Information
- Blue: Debug information
- Red: Error

Some tests may generate output files such as:
- `ai_research_output.json` - Contains the structured data from AI research
- `ai_research_direct_output.log` - Log of the AI research process

## Environment Variables

The tests require the following environment variables to be set:
- `PERPLEXITY_API_KEY` - API key for Perplexity
- `OPENAI_API_KEY` - API key for OpenAI
- `LIGHTHOUSE_API_KEY` - API key for Lighthouse (IPFS)