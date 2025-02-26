const { performAIResearch } = require('./aiResearchService');

// Test parameters (replace these with your test values if needed)
const taxonID = "Acacia_dealbata_test";
const scientificName = "Acacia dealbata";
const commonNames = ["Silver Wattle", "Mimosa"];
const researcherWallet = "0x1234567890abcdef1234567890abcdef12345678";

performAIResearch(taxonID, scientificName, commonNames, researcherWallet)
  .then(result => {
    console.log("Final Structured Research Data:");
    console.log(JSON.stringify(result, null, 2));
  })
  .catch(err => {
    console.error("Error during AI research test:", err);
  });
