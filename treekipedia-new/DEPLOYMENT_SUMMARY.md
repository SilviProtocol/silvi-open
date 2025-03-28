# Treekipedia Contract Deployment Summary

## Contract Deployments

The `ContreebutionNFT` contract has been successfully deployed to the following networks:

### Mainnet
- **Base**: `0x4D673AD5BD926266A8d06EE26103a0D0d9Eea599`
- **Celo**: `0x85fbbE1694B6add91a815896f0b4B65b3bf61A01`
- **Optimism**: `0x4D673AD5BD926266A8d06EE26103a0D0d9Eea599`
- **Arbitrum**: `0x4D673AD5BD926266A8d06EE26103a0D0d9Eea599`

### Testnet
- **Base Sepolia**: `0x4D673AD5BD926266A8d06EE26103a0D0d9Eea599`
- **Optimism Sepolia**: `0x4D673AD5BD926266A8d06EE26103a0D0d9Eea599`
- **Arbitrum Sepolia**: `0x4D673AD5BD926266A8d06EE26103a0D0d9Eea599`

## EAS Configuration
- **Schema ID**: `0xcf573b05cd63a15003b7a67ed4ea2aa6d9963c6518d0c3efd3bfab12d8d74ac9`
- **Schema Definition**: `string taxon_id,string ipfs_cid,address wallet_address,uint256 timestamp,uint256 research_version,string scientific_name,bytes32 refUID`
- **EAS Contract (Celo)**: `0xBD5f9BFBD8A708a32450918119d68775F28b911b`

## Contract Verification
You can verify the contract on each network by running:

```bash
cd /root/silvi-open/treekipedia-new/contracts
npx hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <OWNER_ADDRESS>
```

For example:
```bash
npx hardhat verify --network celo 0x85fbbE1694B6add91a815896f0b4B65b3bf61A01 0x4a24d4a7c36257E0bF256EA2970708817C597A2C
```

## Contract Features
- Uses global_id from database as token ID for consistent sequencing
- Implements ERC721Enumerable for token enumeration functions
- Support for token URI storage
- Burn functionality for token removal
- Token minting limited to contract owner

## Integration with Backend
- The backend uses the deployed contract addresses via environment variables
- Attestations are created using the EAS schema on Celo
- Smart contract interactions use Infura RPC endpoints
- Database sequence IDs are used as NFT token IDs to maintain consistency

## Testing
You can test the contract configuration with:
```bash
cd /root/silvi-open/treekipedia-new
node test-chain-config.js
```