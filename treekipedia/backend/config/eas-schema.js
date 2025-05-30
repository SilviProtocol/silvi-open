/**
 * Ethereum Attestation Service (EAS) Schema Reference
 * 
 * This file documents the schema structure used for tree species research attestations.
 * 
 * Schema ID: 0xcf573b05cd63a15003b7a67ed4ea2aa6d9963c6518d0c3efd3bfab12d8d74ac9
 * 
 * Schema Structure:
 * - string taxon_id:        Unique taxonomic identifier for the species
 * - string ipfs_cid:        IPFS Content Identifier pointing to the research data
 * - address wallet_address: Ethereum address of the researcher
 * - uint256 timestamp:      Unix timestamp of when the research was conducted
 * - uint256 research_version: Version of the research data (for tracking updates)
 * - string scientific_name: Scientific name of the species
 * - bytes32 refUID:         Reference to a previous attestation UID (or zero bytes for initial attestation)
 */

module.exports = {
  SCHEMA_ID: '0xcf573b05cd63a15003b7a67ed4ea2aa6d9963c6518d0c3efd3bfab12d8d74ac9',
  SCHEMA_STRUCTURE: [
    { name: 'taxon_id', type: 'string' },
    { name: 'ipfs_cid', type: 'string' },
    { name: 'wallet_address', type: 'address' },
    { name: 'timestamp', type: 'uint256' },
    { name: 'research_version', type: 'uint256' },
    { name: 'scientific_name', type: 'string' },
    { name: 'refUID', type: 'bytes32' }
  ]
};