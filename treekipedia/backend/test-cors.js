/**
 * Test script to verify CORS configuration
 * 
 * This script provides an example of how to test the CORS configuration
 * by making a simple request to the API from the browser's console.
 */

console.log('Testing CORS configuration for Treekipedia API');
console.log('Run the following code in your browser console when viewing your frontend app:');
console.log('\n');
console.log(`// Test the base endpoint
fetch('https://treekipedia-api.silvi.earth/', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  if (!response.ok) {
    throw new Error(\`HTTP error! Status: \${response.status}\`);
  }
  return response.json();
})
.then(data => {
  console.log('✅ CORS test passed! API response:', data);
})
.catch(error => {
  console.error('❌ CORS test failed:', error);
});`);

console.log('\n');
console.log(`// Test the species/suggest endpoint
fetch('https://treekipedia-api.silvi.earth/species/suggest?query=oak', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  if (!response.ok) {
    throw new Error(\`HTTP error! Status: \${response.status}\`);
  }
  return response.json();
})
.then(data => {
  console.log('✅ Species suggest test passed! API response:', data);
})
.catch(error => {
  console.error('❌ Species suggest test failed:', error);
});`);

console.log('\n');
console.log('To verify CORS is working:');
console.log('1. Start the backend server with: node server.js');
console.log('2. Start the frontend with: cd ../frontend && yarn dev');
console.log('3. Open the browser console in the frontend app');
console.log('4. Paste and run the test code above');
console.log('5. If you get successful responses, CORS is configured correctly!');