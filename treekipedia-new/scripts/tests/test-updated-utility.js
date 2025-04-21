// Test script to verify our updated utility with real data
const { getTopCommonNames } = require('../../backend/utils/commonNames');

// Enable debug logging
process.env.DEBUG_COMMON_NAMES = 'true';

// The actual common_name string from the API
const realCommonName = "Frangipani; ; Cacalosuche, Cacahuaxóchitl (Náhuatl), Cacajoyó (Zoque), Cacalaxochitl (Náhuatl), Cacalosúchil (Mixe), Cacaloxochitl (Náhuatl), Cacaloxóchitl (Mixe), Campechana, Caxtaxanat (Totonaco), Chak Nikte' (Maya), Chak-Nicté (Maya), Chak-Nikté (Maya), Chak-Sabak-Nikté (Maya), Chiquinjoyó (Zoque), Corpus, Cundá (Tarasco), Flor Blanca, Flor De Cal, Flor De Cuervo, Flor De Mayo, Flor De Monte, Guia-Bigoce (Zapoteco), Guia-Bixi-Guii (Zapoteco), Guia-Chacha (Zapoteco)";

async function testUpdatedUtility() {
  console.log('=== Testing our updated utility with real common name data ===');
  console.log(`Common name: "${realCommonName.substring(0, 50)}..."`);
  
  console.log('\n--- Using our backend/utils/commonNames.js implementation ---');
  const result = getTopCommonNames(realCommonName, 10, 500);
  console.log(`Result: "${result}"`);
  
  // Split to see the primary name
  const primaryName = result.split(',')[0].trim();
  console.log(`Primary name would be: "${primaryName}"`);
  
  // Check if Frangipani is prioritized correctly
  if (primaryName === 'Frangipani') {
    console.log('✅ CORRECT: Frangipani appears as the first name');
  } else {
    console.log(`❌ ISSUE: "${primaryName}" appears instead of "Frangipani"`);
  }
}

// Run the test
testUpdatedUtility();