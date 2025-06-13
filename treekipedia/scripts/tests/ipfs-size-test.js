// Test script to identify IPFS size limits by sending increasingly larger data
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { uploadToIPFS, getFromIPFS } = require('../../backend/services/ipfs');
const fs = require('fs');

async function testIPFSSizeLimit() {
  try {
    console.log('Testing IPFS size limits by incrementally adding fields');
    
    // Create base data with important fields first
    const baseData = {
      name: "Size Test",
      description: "Testing IPFS size limits",
      test_id: Date.now().toString(),
      
      // Place stewardship fields EARLY in the object
      stewardship_best_practices: "Test stewardship practices - this is the field we want to ensure is included",
      planting_recipes: "Test planting recipes",
      
      // Research metadata
      research_metadata: {
        test: true,
        timestamp: new Date().toISOString()
      }
    };
    
    // Test with base data first
    console.log('Testing with base data');
    console.log('Base data size:', JSON.stringify(baseData).length, 'bytes');
    
    const baseResult = await uploadAndVerify(baseData, 'base');
    console.log('Base test result:', baseResult.success ? 'SUCCESS' : 'FAILURE');
    
    // Test with increasingly larger payloads
    const sizes = [1000, 2000, 4000, 8000, 16000, 32000, 64000];
    const results = [];
    
    for (const size of sizes) {
      console.log(`\nTesting with approximately ${size} bytes of data`);
      
      // Create test data with padding to reach target size
      const testData = { ...baseData };
      
      // Add dummy numbered fields with increasing content until we reach size
      let currentSize = JSON.stringify(testData).length;
      let fieldCount = 0;
      
      while (currentSize < size) {
        // Generate a field with random content
        const fieldName = `field_${fieldCount++}`;
        const contentSize = Math.min(500, size - currentSize);
        testData[fieldName] = generateRandomString(contentSize);
        
        currentSize = JSON.stringify(testData).length;
      }
      
      console.log(`Created test data with ${Object.keys(testData).length} fields`);
      console.log(`Actual size: ${currentSize} bytes`);
      
      // Test if stewardship fields get preserved
      const result = await uploadAndVerify(testData, `size_${size}`);
      results.push({
        targetSize: size,
        actualSize: currentSize,
        success: result.success,
        stewardshipPresent: result.stewardshipPresent,
        fieldsLost: result.fieldsLost
      });
      
      console.log(`Test result for ${size} bytes:`, result.success ? 'SUCCESS' : 'FAILURE');
      if (result.fieldsLost.length > 0) {
        console.log('Fields lost:', result.fieldsLost.join(', '));
      }
    }
    
    // Save results
    fs.writeFileSync(
      path.join(__dirname, 'ipfs-size-test-results.json'),
      JSON.stringify(results, null, 2)
    );
    
    console.log('\nTest Summary:');
    results.forEach(result => {
      console.log(`${result.targetSize} bytes: ${result.success ? 'SUCCESS' : 'FAILURE'} - Stewardship present: ${result.stewardshipPresent}`);
    });
    
    return results;
  } catch (error) {
    console.error('Error in size test:', error);
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

// Helper to generate random string of specified length
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Run the test
testIPFSSizeLimit()
  .then(results => {
    console.log('All tests completed');
  })
  .catch(err => {
    console.error('Test failed:', err);
  });