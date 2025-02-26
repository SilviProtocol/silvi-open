// uploadToIPFS.js
require('dotenv').config();
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

/**
 * Upload research JSON data to IPFS via Lighthouse.
 * @param {Object} researchData - The research data object to be uploaded.
 * @returns {Promise<string>} - A promise that resolves with the IPFS CID.
 */
async function uploadResearchToIPFS(researchData) {
  const url = 'https://node.lighthouse.storage/api/v0/add?pin=true';
  const formData = new FormData();
  const buffer = Buffer.from(JSON.stringify(researchData));
  formData.append('file', buffer, { filename: 'research.json', contentType: 'application/json' });
  
  const headers = {
    ...formData.getHeaders(),
    'Authorization': `Bearer ${process.env.LIGHTHOUSE_API_KEY}`
  };
  
  try {
    console.log('Uploading research JSON to IPFS via Lighthouse...');
    const response = await axios.post(url, formData, { headers });
    const ipfsCid = response.data.Hash;
    console.log('Received IPFS CID for research JSON:', ipfsCid);
    return ipfsCid;
  } catch (error) {
    console.error('Error uploading research JSON to Lighthouse:', error.response ? error.response.data : error.message);
    throw error;
  }
}

/**
 * Upload attestation metadata (from a file) to IPFS via Lighthouse.
 * @param {string} metadataFilePath - The full path to the metadata file.
 * @returns {Promise<string>} - A promise that resolves with the IPFS CID.
 */
async function uploadMetadataToIPFS(metadataFilePath) {
  const url = 'https://node.lighthouse.storage/api/v0/add?pin=true';
  const formData = new FormData();
  
  // Ensure the file exists before attempting to upload
  if (!fs.existsSync(metadataFilePath)) {
    throw new Error(`File not found: ${metadataFilePath}`);
  }
  
  const fileStream = fs.createReadStream(metadataFilePath);
  formData.append('file', fileStream, { filename: 'attestation_metadata.json', contentType: 'application/json' });
  
  const headers = {
    ...formData.getHeaders(),
    'Authorization': `Bearer ${process.env.LIGHTHOUSE_API_KEY}`
  };
  
  try {
    console.log('Uploading attestation metadata to IPFS via Lighthouse...');
    const response = await axios.post(url, formData, { headers });
    const ipfsCid = response.data.Hash;
    console.log('Received IPFS CID for metadata:', ipfsCid);
    return ipfsCid;
  } catch (error) {
    console.error('Error uploading metadata to Lighthouse:', error.response ? error.response.data : error.message);
    throw error;
  }
}

module.exports = { uploadResearchToIPFS, uploadMetadataToIPFS };
