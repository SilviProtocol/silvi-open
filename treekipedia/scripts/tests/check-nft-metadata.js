const { ethers } = require('ethers');
const axios = require('axios');

// NFT Contract details
const NFT_CONTRACT_ADDRESS = '0x3F451910B4Be90696f3622e7BF4fb2729Bd67aF3';
const BASE_SEPOLIA_RPC_URL = 'https://base-sepolia.infura.io/v3/03ccdfb9f1b1421b803e7c9e0fbee198';
const NFT_ABI = [
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)"
];

async function checkNftMetadata(tokenId) {
  console.log(`\n\n=== Checking NFT #${tokenId} ===`);
  try {
    // Connect to the network
    const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC_URL);
    const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, NFT_ABI, provider);
    
    // Get token URI
    const tokenURI = await nftContract.tokenURI(tokenId);
    console.log(`Token URI: ${tokenURI}`);

    // Resolve IPFS URI if needed
    let metadataUrl = tokenURI;
    if (tokenURI.startsWith('ipfs://')) {
      const ipfsCid = tokenURI.replace('ipfs://', '');
      metadataUrl = `https://gateway.lighthouse.storage/ipfs/${ipfsCid}`;
      console.log(`Resolving to gateway URL: ${metadataUrl}`);
    }

    // Fetch metadata
    try {
      const response = await axios.get(metadataUrl);
      console.log('Metadata successfully retrieved:');
      console.log(JSON.stringify(response.data, null, 2).substring(0, 500) + '...');
      
      // Check for critical fields
      console.log("Fields check:");
      console.log(`- name: ${response.data.name ? 'Present' : 'Missing'}`);
      console.log(`- description: ${response.data.description ? 'Present' : 'Missing'}`);
      console.log(`- image: ${response.data.image ? 'Present' : 'Missing'}`);
      console.log(`- scientific_name: ${response.data.scientific_name ? 'Present' : 'Missing'}`);
    } catch (error) {
      console.error(`Failed to fetch metadata: ${error.message}`);
    }
  } catch (error) {
    console.error(`Error checking NFT #${tokenId}: ${error.message}`);
  }
}

async function main() {
  // Check the NFTs mentioned in our discussion
  console.log("Checking multiple NFTs to compare metadata accessibility");
  await checkNftMetadata(2); // Known working case
  await checkNftMetadata(3); // Known problematic case
  await checkNftMetadata(5); // Recent test case
}

main().catch(error => {
  console.error("Script failed:", error);
});
