const axios = require('axios');

async function testIpfsImage() {
  const ipfsCid = 'bafkreibkta2e54ddqjlrmxmacjvqcpj7w6o3a4oww6ea7hldjazio22c3e';
  const gatewayUrl = `https://gateway.lighthouse.storage/ipfs/${ipfsCid}`;
  
  console.log(`Testing IPFS image accessibility at: ${gatewayUrl}`);
  
  try {
    const response = await axios.get(gatewayUrl, { responseType: 'arraybuffer' });
    console.log('Image accessible\!');
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers['content-type']}`);
    console.log(`Content-Length: ${response.headers['content-length']} bytes`);
  } catch (error) {
    console.error(`Error accessing IPFS image: ${error.message}`);
  }
}

testIpfsImage().catch(console.error);
