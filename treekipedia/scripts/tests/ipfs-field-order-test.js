// Test script to determine if field order affects IPFS storage
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { uploadToIPFS, getFromIPFS } = require('../../backend/services/ipfs');
const fs = require('fs');

async function testFieldOrder() {
  try {
    console.log('Testing if field order affects IPFS storage');
    
    // Test 1: Stewardship fields at the BEGINNING
    console.log('\nTEST 1: Stewardship fields at the BEGINNING');
    const earlyData = {
      // Stewardship fields FIRST
      stewardship_best_practices: "Test stewardship practices with fields at the beginning",
      planting_recipes: "Test planting recipes with fields at the beginning",
      
      // Then other fields
      name: "Field Order Test - Early Fields",
      description: "Testing if field order matters in IPFS",
      test_id: "early_" + Date.now().toString(),
      
      // Add some dummy fields
      field1: "Some content for field 1",
      field2: "Some content for field 2",
      field3: "Some content for field 3",
      
      // Research metadata
      research_metadata: {
        test: "early",
        timestamp: new Date().toISOString()
      }
    };
    
    const earlyResult = await uploadAndVerify(earlyData, 'early');
    console.log('Early fields test result:', earlyResult.success ? 'SUCCESS' : 'FAILURE');
    console.log('Stewardship present:', earlyResult.stewardshipPresent);
    
    // Test 2: Stewardship fields at the END
    console.log('\nTEST 2: Stewardship fields at the END');
    const lateData = {
      // Other fields first
      name: "Field Order Test - Late Fields",
      description: "Testing if field order matters in IPFS",
      test_id: "late_" + Date.now().toString(),
      
      // Add some dummy fields
      field1: "Some content for field 1",
      field2: "Some content for field 2",
      field3: "Some content for field 3",
      
      // Research metadata
      research_metadata: {
        test: "late",
        timestamp: new Date().toISOString()
      },
      
      // Stewardship fields LAST
      stewardship_best_practices: "Test stewardship practices with fields at the end",
      planting_recipes: "Test planting recipes with fields at the end"
    };
    
    const lateResult = await uploadAndVerify(lateData, 'late');
    console.log('Late fields test result:', lateResult.success ? 'SUCCESS' : 'FAILURE');
    console.log('Stewardship present:', lateResult.stewardshipPresent);
    
    // Test 3: Many fields before stewardship
    console.log('\nTEST 3: Many fields before stewardship');
    const manyFieldsData = {
      name: "Field Order Test - Many Fields",
      description: "Testing if many fields before stewardship affects IPFS",
      test_id: "many_" + Date.now().toString()
    };
    
    // Add 25 dummy fields before stewardship
    for (let i = 0; i < 25; i++) {
      manyFieldsData[`field_${i}`] = `Content for field ${i}`;
    }
    
    // Now add stewardship fields
    manyFieldsData.stewardship_best_practices = "Test stewardship practices after many fields";
    manyFieldsData.planting_recipes = "Test planting recipes after many fields";
    
    const manyResult = await uploadAndVerify(manyFieldsData, 'many');
    console.log('Many fields test result:', manyResult.success ? 'SUCCESS' : 'FAILURE');
    console.log('Stewardship present:', manyResult.stewardshipPresent);
    
    // Save the overall results
    const results = {
      early: {
        success: earlyResult.success,
        stewardshipPresent: earlyResult.stewardshipPresent,
        fieldsLost: earlyResult.fieldsLost
      },
      late: {
        success: lateResult.success, 
        stewardshipPresent: lateResult.stewardshipPresent,
        fieldsLost: lateResult.fieldsLost
      },
      many: {
        success: manyResult.success,
        stewardshipPresent: manyResult.stewardshipPresent,
        fieldsLost: manyResult.fieldsLost
      }
    };
    
    fs.writeFileSync(
      path.join(__dirname, 'ipfs-field-order-results.json'),
      JSON.stringify(results, null, 2)
    );
    
    console.log('\nSummary:');
    console.log('Early fields test:', earlyResult.stewardshipPresent ? 'FIELDS PRESERVED' : 'FIELDS LOST');
    console.log('Late fields test:', lateResult.stewardshipPresent ? 'FIELDS PRESERVED' : 'FIELDS LOST');
    console.log('Many fields test:', manyResult.stewardshipPresent ? 'FIELDS PRESERVED' : 'FIELDS LOST');
    
    return results;
  } catch (error) {
    console.error('Error in field order test:', error);
    throw error;
  }
}

// Helper function to upload data and verify if fields are preserved
async function uploadAndVerify(data, label) {
  try {
    // Get the original keys
    const originalKeys = Object.keys(data);
    
    // Upload to IPFS
    console.log(`Uploading ${label} data...`);
    const cid = await uploadToIPFS(data);
    console.log(`Uploaded with CID: ${cid}`);
    
    // Retrieve and check
    console.log(`Retrieving ${label} data...`);
    const retrievedData = await getFromIPFS(cid);
    
    // Get retrieved keys
    const retrievedKeys = Object.keys(retrievedData);
    
    // Check what fields were lost
    const fieldsLost = originalKeys.filter(key => !retrievedKeys.includes(key));
    
    // Check if stewardship is present 
    const stewardshipPresent = retrievedKeys.includes('stewardship_best_practices');
    
    // Save the retrieved data for inspection
    fs.writeFileSync(
      path.join(__dirname, `ipfs-${label}-retrieved.json`),
      JSON.stringify(retrievedData, null, 2)
    );
    
    return {
      success: fieldsLost.length === 0,
      stewardshipPresent,
      fieldsLost,
      cid
    };
  } catch (error) {
    console.error(`Error in ${label} test:`, error);
    return {
      success: false,
      stewardshipPresent: false,
      fieldsLost: ['Error: ' + error.message],
      cid: null
    };
  }
}

// Run the test
testFieldOrder()
  .then(results => {
    console.log('All field order tests completed');
  })
  .catch(err => {
    console.error('Test failed:', err);
  });