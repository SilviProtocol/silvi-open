# Treekipedia Research Contreebution NFT

A Solidity smart contract for minting and managing NFTs that represent research contributions on Treekipedia. Built on the ERC721 standard.

<img src="https://gpbr.infura-ipfs.io/ipfs/bafkreibkta2e54ddqjlrmxmacjvqcpj7w6o3a4oww6ea7hldjazio22c3e" alt="Alt text" width="500px" height="auto">

## Deployed Contracts
**CELO Mainnet:** 0x5Ed6240fCC0B2A231887024321Cc9481ba07f3c6

[see the deployed contract on celoscan...](https://celoscan.io/address/0x5ed6240fcc0b2a231887024321cc9481ba07f3c6)

**Ethereum Sepolia:** 0x1Ad2317DEBD2ac4730641A1E317B204bd2fEeFA8


## Overview

The Research Contreebution NFT contract allows for the creation, transfer, and management of unique tokens that represent research contributions on Treekipedia. Each token can store metadata via a URI, making it perfect for linking to research content stored on IPFS or other decentralized storage solutions.

## Features

- **ERC721 Compliance**: Fully compatible with the ERC721 standard for non-fungible tokens
- **Metadata Storage**: Each token can store custom metadata through URIs
- **Burning Capability**: Tokens can be permanently destroyed if needed
- **Access Control**: Only the contract owner can mint new tokens

## Contract Details

- **Name**: Research Contreebution
- **Symbol**: treekipediaRSRCH
- **Solidity Version**: ^0.8.20
- **OpenZeppelin Version**: 5.0.0

## Instructions to deploy on CELO

For Celo L1 Remix does not support Solidity compiler version 0.8.20 and above for EVM versions above Paris.

A workaround is to go into the advanced settings for the compiler in Remix and choose Paris as the EVM version.

[see more at CELO documentation](https://docs.celo.org/developer/deploy/remix)

## Functions

### `constructor(address initialOwner)`
Initializes the contract with the specified initial owner.

### `safeMint(address to, uint256 tokenId, string memory uri)`
Mints a new token and assigns it to the specified address with the given metadata URI.
- Only callable by the contract owner
- Parameters:
  - `to`: The address that will receive the minted token
  - `tokenId`: The ID to assign to the new token
  - `uri`: The metadata URI for the token

### `tokenURI(uint256 tokenId)`
Returns the metadata URI for a specific token.
- Parameters:
  - `tokenId`: The ID of the token to query

### `supportsInterface(bytes4 interfaceId)`
Determines if the contract supports a specific interface.
- Parameters:
  - `interfaceId`: The interface identifier to check

## Inherited Functions

This contract inherits from several OpenZeppelin contracts, providing additional functionality:

- From **ERC721**:
  - `balanceOf(address)`: Returns the number of tokens owned by an address
  - `ownerOf(uint256)`: Returns the owner of a specific token
  - `safeTransferFrom(address, address, uint256)`: Safely transfers a token
  - `safeTransferFrom(address, address, uint256, bytes)`: Safely transfers a token with additional data
  - `transferFrom(address, address, uint256)`: Transfers a token
  - `approve(address, uint256)`: Approves an address to transfer a specific token
  - `setApprovalForAll(address, bool)`: Approves an address to transfer all tokens
  - `getApproved(uint256)`: Gets the approved address for a token
  - `isApprovedForAll(address, address)`: Checks if an operator is approved for all tokens

- From **ERC721Burnable**:
  - `burn(uint256)`: Burns (destroys) a specific token

- From **Ownable**:
  - `owner()`: Returns the address of the current owner
  - `renounceOwnership()`: Leaves the contract without an owner
  - `transferOwnership(address)`: Transfers ownership to a new address

## Requirements

- [Node.js](https://nodejs.org/)
- [Hardhat](https://hardhat.org/) or [Truffle](https://www.trufflesuite.com/truffle)
- [OpenZeppelin Contracts v5.0.0](https://github.com/OpenZeppelin/openzeppelin-contracts)

## Deployment

1. Install dependencies:
   ```bash
   npm install @openzeppelin/contracts@5.0.0
   ```

2. Compile the contract:
   ```bash
   npx hardhat compile
   ```

3. Deploy to your chosen network:
   ```bash
   npx hardhat run scripts/deploy.js --network <your-network>
   ```

## Example Deployment Script

```javascript
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const ResearchContreebution = await ethers.getContractFactory("ResearchContreebution");
  const contract = await ResearchContreebution.deploy(deployer.address);

  await contract.waitForDeployment();
  console.log("ResearchContreebution deployed to:", await contract.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

## License

This project is licensed under the MIT License.