// Import required modules
require('dotenv').config();
const { ethers } = require('ethers');
const chains = require('../config/chains');

// Private key from environment variables (used for signing transactions)
const PRIVATE_KEY = process.env.PRIVATE_KEY;

/**
 * Creates an attestation on the Ethereum Attestation Service (EAS)
 * @param {string} chain - Chain to create attestation on ('base', 'celo', 'optimism', 'arbitrum')
 * @param {Object} data - Attestation data to be stored
 * @returns {Promise<string>} - UID of the created attestation
 */
async function createAttestation(chain, data) {
  try {
    // Get chain configuration
    const chainConfig = chains[chain];
    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${chain}`);
    }
    
    // Set up provider and signer
    const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    
    // Initialize EAS contract
    const easContractABI = require('../config/abis/eas.json');
    const easContract = new ethers.Contract(
      chainConfig.easContractAddress,
      easContractABI,
      signer
    );
    
    // Prepare attestation data
    const schema = chainConfig.easSchemaId; // Schema ID for tree species research
    
    // Current timestamp for the attestation
    const timestamp = Math.floor(Date.now() / 1000);
    const researchVersion = 1; // Initial version of the research
    
    // Encode data according to the new schema:
    // "string taxon_id, string ipfs_cid, address wallet_address, uint256 timestamp, uint256 research_version, string scientific_name, bytes32 refUID"
    const refUID = data.refUID || ethers.ZeroHash; // Default to zero hash if no reference provided
    
    const attestationData = ethers.AbiCoder.defaultAbiCoder().encode(
      ['string', 'string', 'address', 'uint256', 'uint256', 'string', 'bytes32'], 
      [
        data.taxonId, 
        data.ipfsCid, 
        data.researcher, 
        timestamp, 
        researchVersion, 
        data.species,
        refUID
      ]
    );
    
    // Create attestation
    console.log(`Creating attestation on ${chain} for species ${data.species}`);
    
    // We already have the refUID defined above, using either data.refUID or ethers.ZeroHash
    
    // Add detailed logging for debugging
    console.log("Schema UID:", schema);
    console.log("EAS Contract Address:", chainConfig.easContractAddress);
    console.log("Recipient:", data.researcher);
    console.log("Encoded attestation data:", attestationData);
    
    // Skip schema registry check as it's not needed for attestation
    // and may cause errors if the EAS contract doesn't support it
    console.log("Skipping schema registry check and proceeding directly to attestation...")
    
    // Create attestation with detailed error handling
    try {
      const tx = await easContract.attest({
        schema,
        data: {
          recipient: data.researcher,
          expirationTime: 0, // No expiration
          revocable: false,
          refUID: refUID, // Properly formatted bytes32 zero value
          data: attestationData,
          value: 0 // No value being sent with the transaction
        }
      });
      
      console.log("Attestation transaction sent:", tx.hash);
      // Wait for transaction to be confirmed
      const receipt = await tx.wait();
      console.log("Transaction confirmed in block:", receipt.blockNumber);
      
      // Extract attestation UID from transaction receipt
      const attestationUID = receipt.events[0].args.uid;
      console.log(`Attestation created with UID: ${attestationUID}`);
      
      return attestationUID;
    } catch (attestError) {
      console.error("Detailed attestation error:", attestError);
      if (attestError.data) console.log("Revert data:", attestError.data);
      if (attestError.transaction) console.log("Transaction data:", attestError.transaction.data?.substring(0, 66) + "...");
      throw new Error(`Attestation creation failed: ${attestError.message}`);
    }
  } catch (error) {
    console.error(`Error creating attestation on ${chain}:`, error);
    throw new Error(`Attestation creation failed: ${error.message}`);
  }
}

/**
 * Mints a Contreebution NFT on the specified chain
 * @param {string} chain - Chain to mint NFT on ('base', 'celo', 'optimism', 'arbitrum')
 * @param {string} recipient - Wallet address of the recipient
 * @param {number} globalId - The global_id from database to use as token ID
 * @param {string} tokenURI - URI for the NFT metadata (IPFS CID)
 * @returns {Promise<Object>} - Transaction receipt
 */
async function mintNFT(chain, recipient, globalId, tokenURI) {
  try {
    // Get chain configuration
    const chainConfig = chains[chain];
    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${chain}`);
    }
    
    // Set up provider and signer
    const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    
    // Initialize NFT contract
    const nftContractABI = require('../config/abis/contreebutionNFT.json');
    const nftContract = new ethers.Contract(
      chainConfig.nftContractAddress,
      nftContractABI,
      signer
    );
    
    // Validate input - globalId must be a number
    const tokenId = Number(globalId);
    if (isNaN(tokenId) || tokenId <= 0) {
      throw new Error(`Invalid global_id: ${globalId}. Must be a positive number.`);
    }
    
    // Mint NFT
    console.log(`Minting NFT on ${chain} for recipient ${recipient} with tokenId: ${tokenId}`);
    const tx = await nftContract.safeMint(recipient, tokenId, tokenURI);
    
    // Wait for transaction to be confirmed
    const receipt = await tx.wait();
    console.log(`NFT minted with tokenId: ${tokenId}, transaction hash: ${receipt.hash}`);
    
    return {
      tokenId,
      tokenURI,
      transactionHash: receipt.hash,
      chain,
      blockNumber: receipt.blockNumber,
      status: 'success'
    };
  } catch (error) {
    console.error(`Error minting NFT on ${chain}:`, error);
    
    // Return a structured error object instead of throwing
    // This allows the calling code to handle the error appropriately
    return {
      status: 'failed',
      error: error.message,
      errorCode: error.code || 'UNKNOWN_ERROR',
      errorData: error.data || null
    };
  }
}

/**
 * Retrieves all NFTs owned by a specific wallet address on a specific chain
 * @param {string} chain - Chain to query ('base', 'celo', 'optimism', 'arbitrum')
 * @param {string} walletAddress - Wallet address to query
 * @returns {Promise<Array>} - Array of NFTs owned by the wallet
 */
async function getUserNFTs(chain, walletAddress) {
  try {
    // Get chain configuration
    const chainConfig = chains[chain];
    if (!chainConfig) {
      throw new Error(`Unsupported chain: ${chain}`);
    }
    
    // Set up provider
    const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
    
    // Initialize NFT contract
    const nftContractABI = require('../config/abis/contreebutionNFT.json');
    const nftContract = new ethers.Contract(
      chainConfig.nftContractAddress,
      nftContractABI,
      provider
    );
    
    // Query balance
    const balance = await nftContract.balanceOf(walletAddress);
    
    // Return empty array if balance is 0
    if (balance.toNumber() === 0) {
      return [];
    }
    
    // Get NFTs
    const nfts = [];
    for (let i = 0; i < balance.toNumber(); i++) {
      const tokenId = await nftContract.tokenOfOwnerByIndex(walletAddress, i);
      const tokenURI = await nftContract.tokenURI(tokenId);
      
      nfts.push({
        tokenId: tokenId.toString(),
        tokenURI,
        chain
      });
    }
    
    return nfts;
  } catch (error) {
    console.error(`Error retrieving NFTs on ${chain} for wallet ${walletAddress}:`, error);
    throw new Error(`NFT retrieval failed: ${error.message}`);
  }
}

module.exports = {
  createAttestation,
  mintNFT,
  getUserNFTs
};