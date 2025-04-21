// Test script for the new common names utility
const { getTopCommonNames } = require('../../backend/utils/commonNames');

// Enable debug logging
process.env.DEBUG_COMMON_NAMES = 'true';

function testUtility() {
  console.log('=== Testing the new common names utility ===');
  
  // Test 1: Basic functionality with typical species
  console.log('\n--- Test 1: Standard common name format ---');
  const commonNames1 = "Frangipani; ; Cacalosuche, Cacahuaxóchitl (Náhuatl), Flor De Mayo, Plumeria";
  console.log(`Input: "${commonNames1}"`);
  const result1 = getTopCommonNames(commonNames1, 5, 200);
  console.log(`Result: "${result1}"`);
  
  // Test 2: Example from Plumeria rubra
  console.log('\n--- Test 2: Larger example from real data ---');
  const commonNames2 = "Frangipani; ; Cacalosuche, Cacahuaxóchitl (Náhuatl), Cacajoyó (Zoque), Cacalaxochitl (Náhuatl), Cacalosúchil (Mixe), Cacaloxochitl (Náhuatl), Cacaloxóchitl (Mixe), Campechana, Caxtaxanat (Totonaco), Chak Nikte' (Maya), Chak-Nicté (Maya), Chak-Nikté (Maya), Chak-Sabak-Nikté (Maya), Chiquinjoyó (Zoque), Corpus, Cundá (Tarasco), Flor Blanca, Flor De Cal, Flor De Cuervo, Flor De Mayo, Flor De Monte, Guia-Bigoce (Zapoteco), Guia-Bixi-Guii (Zapoteco), Guia-Chacha (Zapoteco)";
  const result2 = getTopCommonNames(commonNames2, 10, 500);
  console.log(`Result: "${result2}"`);
  
  // Test 3: A different common naming pattern
  console.log('\n--- Test 3: Different common name pattern ---');
  const commonNames3 = "Oak, English Oak, Pedunculate Oak; Quercus (Latin), Roble (Spanish), Chêne (French)";
  console.log(`Input: "${commonNames3}"`);
  const result3 = getTopCommonNames(commonNames3, 5, 200);
  console.log(`Result: "${result3}"`);
  
  // Test 4: Edge case - when Frangipani is not first
  console.log('\n--- Test 4: Edge case - Frangipani not first ---');
  const commonNames4 = "Flor De Mayo; Plumeria; Frangipani, Temple Tree, Pagoda Tree";
  console.log(`Input: "${commonNames4}"`);
  const result4 = getTopCommonNames(commonNames4, 5, 200);
  console.log(`Result: "${result4}"`);
  
  // Check for primary names and success
  const results = [
    {test: "Test 1", result: result1, expected: "Frangipani"},
    {test: "Test 2", result: result2, expected: "Frangipani"},
    {test: "Test 3", result: result3, expected: "Oak"},
    {test: "Test 4", result: result4, expected: "Frangipani"}
  ];
  
  console.log('\n=== Results Summary ===');
  results.forEach(({test, result, expected}) => {
    const primary = result.split(',')[0].trim();
    const success = primary === expected;
    console.log(`${test}: Primary name = "${primary}" ${success ? '✅' : '❌'} ${success ? 'CORRECT' : `WRONG - Expected "${expected}"`}`);
  });
}

// Run the test
testUtility();