// Test script for common names optimization
const { getTopCommonNames } = require('../../backend/utils/commonNames');

// Enable debug logging
process.env.DEBUG_COMMON_NAMES = 'true';

// Test with Plumeria rubra common names from the API
async function testPlumeriaRubra() {
  console.log('=== Testing Plumeria rubra common names optimization ===');
  
  try {
    // Test the original string split functionality
    console.log('\n=== TESTING ORIGINAL NAME SPLIT FUNCTIONALITY ===');
    const testStr = "Frangipani; ; Cacalosuche, Cacahuaxóchitl (Náhuatl)";
    console.log(`Test string: "${testStr}"`);
    
    // Show how our current implementation splits this
    let nameArray = [];
    if (typeof testStr === 'string') {
      // First split by blocks of common names (usually separated by semicolons)
      const blocks = testStr.split(';').map(block => block.trim());
      console.log("Blocks after semicolon split:", blocks);
      
      // Process each block to extract valid names
      blocks.forEach(block => {
        if (!block) {
          console.log(`Found empty block: "${block}"`);
          return; // Skip empty blocks
        }
        
        // Further split by commas within each block
        const blockNames = block.split(',').map(n => n.trim()).filter(Boolean);
        console.log(`Names in block "${block}":`, blockNames);
        
        // Add all valid names from this block
        nameArray.push(...blockNames);
      });
    }
    
    console.log("Final name array:", nameArray);
    
    // Fetch the common names from the API
    const commonNamesStr = "Frangipani; ; Cacalosuche, Cacahuaxóchitl (Náhuatl), Cacajoyó (Zoque), Cacalaxochitl (Náhuatl), Cacalosúchil (Mixe), Cacaloxochitl (Náhuatl), Cacaloxóchitl (Mixe), Campechana, Caxtaxanat (Totonaco), Chak Nikte' (Maya), Chak-Nicté (Maya), Chak-Nikté (Maya), Chak-Sabak-Nikté (Maya), Chiquinjoyó (Zoque), Corpus, Cundá (Tarasco), Flor Blanca, Flor De Cal, Flor De Cuervo, Flor De Mayo, Flor De Monte, Guia-Bigoce (Zapoteco), Guia-Bixi-Guii (Zapoteco), Guia-Chacha (Zapoteco), Guiechacha (Zapoteco), Guiecha'chi' (Zapoteco), Güia-An (Zapoteco), Huevo De Toro, Huiloicxitl (Náhuatl), Kakaloxochitl (Náhuatl), Kumpaap (Maya), Lengua De Toro, Li-Tie (Chinanteco), Nicte Chom (Maya), Nicte Choom (Maya), Nicté (Maya), Nikte' Ch'om (Maya), Nikté (Maya), Nopinjoyo (Zoque), Palo Blanco, Parandechicua (Tarasco), Quie-Chacha (Zapoteco), Rosa Blanca, Rosal, Sabaknikte' (Maya), Sabanikté (Maya), Sach-Nicté (Maya), Sak Nikte' (Maya), Sak-Nichte' (Maya), Sak-Nikté (Maya), Sangre De Toro, Saugrán (Tepehuano Del Sur), Tizalxóchitl (Náhuatl), Tlapalticcacaloxochitl (Náhuatl), Tlauhquecholxochitl (Náhuatl), Uculhuitz (Huasteco); Rosa Blanca, Cacahuaxóchitl (Náhuatl), Cacajoyó (Zoque), Cacalaxochitl (Náhuatl), Cacalosúchil (Mixe), Cacaloxochitl (Náhuatl), Cacaloxóchitl (Mixe), Campechana, Caxtaxanat (Totonaco), Chak Nikte' (Maya), Chak-Nicté (Maya), Chak-Nikté (Maya), Chak-Sabak-Nikté (Maya), Chiquinjoyó (Zoque), Corpus, Cundá (Tarasco), Flor Blanca, Flor De Cal, Flor De Cuervo, Flor De Mayo, Flor De Monte, Guia-Bigoce (Zapoteco), Guia-Bixi-Guii (Zapoteco), Guia-Chacha (Zapoteco), Guiechacha (Zapoteco), Guiecha'chi' (Zapoteco), Güia-An (Zapoteco), Huevo De Toro, Huiloicxitl (Náhuatl), Kakaloxochitl (Náhuatl), Kumpaap (Maya), Lengua De Toro, Li-Tie (Chinanteco), Nicte Chom (Maya), Nicte Choom (Maya), Nicté (Maya), Nikte' Ch'om (Maya), Nikté (Maya), Nopinjoyo (Zoque), Palo Blanco, Parandechicua (Tarasco), Quie-Chacha (Zapoteco), Rosa Blanca, Rosal, Sabaknikte' (Maya), Sabanikté (Maya), Sach-Nicté (Maya), Sak Nikte' (Maya), Sak-Nichte' (Maya), Sak-Nikté (Maya), Sangre De Toro, Saugrán (Tepehuano Del Sur), Tizalxóchitl (Náhuatl), Tlapalticcacaloxochitl (Náhuatl), Tlauhquecholxochitl (Náhuatl), Uculhuitz (Huasteco); Franqipani, Plumeria, Flor de Mayo";
    
    console.log(`Original common names length: ${commonNamesStr.length} characters`);
    console.log(`First 100 characters: ${commonNamesStr.substring(0, 100)}...`);
    
    // Test with different limits to see how the optimization behaves
    const resultLow = getTopCommonNames(commonNamesStr, 5, 200);
    const resultMed = getTopCommonNames(commonNamesStr, 10, 500);
    const resultHigh = getTopCommonNames(commonNamesStr, 15, 1000);
    
    // Display the results
    console.log('\n=== Results with different limits ===');
    console.log(`\n5 names, 200 char limit: "${resultLow}"`);
    console.log(`\n10 names, 500 char limit: "${resultMed}"`);
    console.log(`\n15 names, 1000 char limit: "${resultHigh}"`);
    
    // Simulate what's shown in the UI by getting the first name (most important)
    const primaryName = resultLow.split(',')[0].trim();
    console.log(`\nThe primary name displayed in UI would be: "${primaryName}"`);
    
    // Check if Frangipani is being prioritized properly
    if (primaryName.toLowerCase() === 'frangipani') {
      console.log('\n✅ SUCCESS: Frangipani is correctly shown as the primary name');
    } else {
      console.log('\n❌ ISSUE: Frangipani is NOT the primary name as expected');
    }
  } catch (error) {
    console.error('Error in test:', error);
  }
}

// Run the test
testPlumeriaRubra();