// Test script for the getTopCommonNames utility
const { getTopCommonNames } = require('../commonNames');

// Sample data that resembles Plumeria Rubra's common names
const plumeriaCommonNames = "Frangipani; ; Cacalosuche, Cacahuaxóchitl (Náhuatl), Cacajoyó (Zoque), Cacalaxochitl (Náhuatl), Cacalosúchil (Mixe), Cacaloxochitl (Náhuatl), Cacaloxóchitl (Mixe), Campechana, Caxtaxanat (Totonaco), Chak Nikte' (Maya), Chak-Nicté (Maya), Chak-Nikté (Maya), Chak-Sabak-Nikté (Maya), Chiquinjoyó (Zoque), Corpus, Cundá (Tarasco), Flor Blanca, Flor De Cal, Flor De Cuervo, Flor De Mayo, Flor De Monte, Guia-Bigoce (Zapoteco), Guia-Bixi-Guii (Zapoteco), Guia-Chacha (Zapoteco), Guiechacha (Zapoteco), Guiecha'chi' (Zapoteco), Güia-An (Zapoteco), Huevo De Toro, Huiloicxitl (Náhuatl), Kakaloxochitl (Náhuatl), Kumpaap (Maya), Lengua De Toro, Li-Tie (Chinanteco), Nicte Chom (Maya), Nicte Choom (Maya), Nicté (Maya), Nikte' Ch'om (Maya), Nikté (Maya), Nopinjoyo (Zoque), Palo Blanco, Parandechicua (Tarasco), Quie-Chacha (Zapoteco), Rosa Blanca, Rosal, Sabaknikte' (Maya), Sabanikté (Maya), Sach-Nicté (Maya), Sak Nikte' (Maya), Sak-Nichte' (Maya), Sak-Nikté (Maya), Sangre De Toro, Saugrán (Tepehuano Del Sur), Tizalxóchitl (Náhuatl), Tlapalticcacaloxochitl (Náhuatl), Tlauhquecholxochitl (Náhuatl), Uculhuitz (Huasteco)";

// Shorter test sample with known frequencies
const sampleCommonNames = "Oak; Oak; Oak; Red Oak; White Oak; White Oak; Live Oak; Pin Oak; Oak Tree (English); Roble (Spanish); Roble (Spanish); Eiche (German)";

// Test with expected names
console.log("\n==== Testing Common Names Utility ====");

console.log("\n----- Testing with sample data -----");
const result1 = getTopCommonNames(sampleCommonNames, 5, 200);
console.log(`Original (${sampleCommonNames.length} chars): ${sampleCommonNames}`);
console.log(`Optimized (${result1.length} chars): ${result1}`);

console.log("\n----- Testing with Plumeria Rubra data -----");
console.log("First few names from original:", plumeriaCommonNames.slice(0, 100) + "...");
console.log("Original length:", plumeriaCommonNames.length, "characters");

const result2 = getTopCommonNames(plumeriaCommonNames, 5, 200);
console.log("Optimized names:", result2);
console.log("Optimized length:", result2.length, "characters");

// Log frequency analysis for Plumeria
console.log("\n----- Frequency Analysis for Plumeria Rubra -----");
// Create a simplified version of the frequency analysis from the utility
function analyzeFrequencies(commonNames) {
  if (!commonNames) return {};

  const nameArray = typeof commonNames === 'string'
    ? commonNames.split(/[;,]/).map(n => n.trim()).filter(Boolean)
    : commonNames;

  const frequencyMap = {};
  
  nameArray.forEach(name => {
    if (!name || name.trim() === '') return;
    
    const cleanedForCount = name.toLowerCase().replace(/\s*\(.*?\)\s*/g, '').trim();
    if (!cleanedForCount) return;
    
    if (!frequencyMap[cleanedForCount]) {
      frequencyMap[cleanedForCount] = 0;
    }
    frequencyMap[cleanedForCount]++;
  });

  return frequencyMap;
}

const frequencies = analyzeFrequencies(plumeriaCommonNames);
const sortedFrequencies = Object.entries(frequencies)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 15); // Show top 15

console.log("Top 15 names by frequency:");
sortedFrequencies.forEach(([name, count], index) => {
  console.log(`${index + 1}. "${name}" appears ${count} times`);
});

console.log("\n==== Test Complete ====");