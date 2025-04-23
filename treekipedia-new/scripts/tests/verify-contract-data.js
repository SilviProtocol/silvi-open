const { ethers } = require('ethers');
const axios = require('axios');

// Contract details
const NFT_CONTRACT_ADDRESS = '0x3F451910B4Be90696f3622e7BF4fb2729Bd67aF3';
const RPC_URL = 'https://base-sepolia.infura.io/v3/03ccdfb9f1b1421b803e7c9e0fbee198';

// ABI for the functions we need
const ABI = [
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)"
];

async function verifyTokenData(tokenId) {
  console.log(`\n==== Verifying Token #${tokenId} ====`);
  
  try {
    // Connect to the contract
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(NFT_CONTRACT_ADDRESS, ABI, provider);
    
    // Get owner and tokenURI directly from the contract
    const owner = await contract.ownerOf(tokenId);
    const tokenURI = await contract.tokenURI(tokenId);
    
    console.log(`Owner: ${owner}`);
    console.log(`Token URI: ${tokenURI}`);
    
    // Try to fetch the metadata
    try {
      // Convert ipfs:// to https gateway URL if needed
      let metadataUrl = tokenURI;
      if (tokenURI.startsWith('ipfs://')) {
        const ipfsCid = tokenURI.replace('ipfs://', '');
        metadataUrl = `https://gateway.lighthouse.storage/ipfs/${ipfsCid}`;
        console.log(`Resolving via Lighthouse: ${metadataUrl}`);
      }
      
      const response = await axios.get(metadataUrl);
      console.log(`Metadata fetch successful: ${response.status}`);
      console.log(`Metadata content sample: ${JSON.stringify(response.data).substring(0, 200)}...`);
      
      // Now try to fetch the image
      try {
        const imageUrl = response.data.image;
        console.log(`Image URL from metadata: ${imageUrl}`);
        
        // Convert ipfs:// to https gateway URL if needed
        let resolvedImageUrl = imageUrl;
        if (imageUrl.startsWith('ipfs://')) {
          const ipfsCid = imageUrl.replace('ipfs://', '');
          resolvedImageUrl = `https://ipfs.io/ipfs/${ipfsCid}`;
          console.log(`Resolving image via ipfs.io: ${resolvedImageUrl}`);
        }
        
        const imageResponse = await axios.get(resolvedImageUrl, { 
          responseType: 'arraybuffer',
          timeout: 10000 // 10 second timeout
        });
        
        console.log(`Image fetch successful: ${imageResponse.status}`);
        console.log(`Image size: ${imageResponse.data.length} bytes`);
        console.log(`Image content type: ${imageResponse.headers['content-type']}`);
      } catch (imageError) {
        console.error(`Image fetch failed: ${imageError.message}`);
      }
    } catch (metadataError) {
      console.error(`Metadata fetch failed: ${metadataError.message}`);
    }
  } catch (error) {
    console.error(`Contract query failed: ${error.message}`);
  }
}

async function main() {
  // Test tokens 2, 3, 5 to compare working and non-working cases
  await verifyTokenData(2);  // Known working
  await verifyTokenData(3);  // First problematic
  await verifyTokenData(5);  // Latest test
}

main().catch(console.error);
